import type {
  Address,
  AdminImage,
  AdminOrder,
  AdminProduct,
  AdminVariant,
  FulfillmentStatus,
  OrderState,
  PaymentStatus,
  ProductStatus,
  VariantInput,
} from "../types";

/* ============================================================================
   Hostinger (API de gestão) → modelo do Admin
   ----------------------------------------------------------------------------
   NÃO VERIFICADO contra respostas reais: não havia token neste ambiente.
   Os nomes seguem o schema de pedidos (hostinger/api-mcp-server) e a
   Storefront, que já foi validada. Cada leitura aceita as variantes
   plausíveis de nome e nunca inventa um valor: o que não vier fica nulo.
   Confirmar na primeira leitura real no Preview e ajustar só aqui.
   ========================================================================== */

type Json = Record<string, unknown>;

const obj = (v: unknown): Json => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (...values: unknown[]): string | null => {
  for (const v of values) if (typeof v === "string" && v.trim()) return v.trim();
  return null;
};
const num = (...values: unknown[]): number | null => {
  for (const v of values) if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
};

/** Listas podem vir como array ou dentro de `data`. */
export function unwrapList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const data = obj(payload).data;
  if (Array.isArray(data)) return data;
  return arr(obj(data).data);
}

export function unwrapOne(payload: unknown): Json {
  const data = obj(payload).data;
  return data && typeof data === "object" && !Array.isArray(data) ? (data as Json) : obj(payload);
}

/** Há mais páginas? Aceita `meta.last_page`/`current_page` ou `next_page_url`. */
export function hasNextPage(payload: unknown): boolean {
  const root = obj(payload);
  const meta = obj(root.meta ?? obj(root.data).meta);
  const current = num(meta.current_page, root.current_page);
  const last = num(meta.last_page, root.last_page);
  if (current !== null && last !== null) return current < last;
  return Boolean(str(root.next_page_url, obj(root.links).next));
}

function status(value: unknown): ProductStatus {
  return value === "published" ? "published" : value === "archived" ? "archived" : "draft";
}

export function variantFromApi(raw: unknown, productId: string, fallbackCurrency = "BRL"): AdminVariant {
  const v = obj(raw);
  const price = obj(arr(v.prices)[0]);
  const currency = obj(price.currency);
  const amount = num(price.amount) ?? 0;
  const sale = num(price.sale_amount);
  return {
    id: String(v.id ?? ""),
    productId: str(v.product_id) ?? productId,
    title: str(v.title),
    sku: str(v.sku),
    options: arr(v.options).flatMap((o) => {
      const option = obj(o);
      const name = str(option.name, obj(option.option).title, obj(option.option).name);
      const value = str(option.value);
      return value ? [{ name: name ?? "Opção", value }] : [];
    }),
    price: amount,
    salePrice: sale !== null && sale < amount ? sale : null,
    currency: (str(currency.code, price.currency_code, price.currency) ?? fallbackCurrency).toUpperCase(),
    decimalDigits: num(currency.decimal_digits) ?? 2,
    manageInventory: v.manage_inventory === true,
    inventoryQuantity: num(v.inventory_quantity),
  };
}

function imagesFromApi(p: Json): AdminImage[] {
  const media = [...arr(p.media), ...arr(p.images)].map((m, index) => {
    const image = obj(m);
    const url = str(image.url, image.src, image.path);
    return url ? { id: str(image.id) ?? `img-${index}`, url, alt: str(image.alt) } : null;
  });
  const list = media.filter((m): m is AdminImage => m !== null);
  const thumbnail = str(p.thumbnail);
  if (thumbnail && !list.some((m) => m.url === thumbnail)) list.unshift({ id: "thumbnail", url: thumbnail, alt: null });
  return list;
}

export function productFromApi(raw: unknown): AdminProduct {
  const p = obj(raw);
  const id = String(p.id ?? "");
  return {
    id,
    title: str(p.name, p.title) ?? "(sem nome)",
    description: str(p.description),
    status: status(p.status),
    images: imagesFromApi(p),
    variants: arr(p.variants).map((v) => variantFromApi(v, id)),
    createdAt: str(p.created_at),
    updatedAt: str(p.updated_at),
  };
}

/** Preço completo da variante: a API substitui a lista inteira. */
export function pricesBody(input: Pick<VariantInput, "price" | "salePrice">) {
  return [
    {
      amount: input.price,
      ...(input.salePrice !== null && input.salePrice < input.price ? { sale_amount: input.salePrice } : {}),
    },
  ];
}

/* --------------------------------------------------------------------------
   Pedidos
   -------------------------------------------------------------------------- */

function payment(value: unknown): PaymentStatus {
  switch (value) {
    case "captured":
      return "paid";
    case "refunded":
    case "partially_refunded":
      return "refunded";
    case "canceled":
      return "failed";
    case "not_paid":
    case "awaiting":
    case "requires_action":
      return "pending";
    default:
      return "unknown";
  }
}

function fulfillment(value: unknown): FulfillmentStatus {
  switch (value) {
    case "fulfilled":
    case "shipped":
      return "fulfilled";
    case "partially_fulfilled":
    case "partially_shipped":
      return "partial";
    case "not_fulfilled":
      return "unfulfilled";
    default:
      return "unknown";
  }
}

function state(value: unknown): OrderState {
  if (value === "canceled") return "cancelled";
  if (value === "completed" || value === "archived") return "completed";
  if (value === "pending" || value === "requires_action") return "open";
  return "unknown";
}

function address(raw: unknown): Address | null {
  const a = obj(raw);
  if (Object.keys(a).length === 0) return null;
  const name = [str(a.first_name), str(a.last_name)].filter(Boolean).join(" ") || str(a.name);
  return {
    name,
    line1: str(a.address_1, a.address1, a.line1),
    line2: str(a.address_2, a.address2, a.line2),
    city: str(a.city),
    state: str(a.province, a.state),
    postalCode: str(a.postal_code, a.zip),
    country: str(a.country_code, a.country)?.toUpperCase() ?? null,
    phone: str(a.phone),
  };
}

export function orderFromApi(raw: unknown): AdminOrder {
  const o = obj(raw);
  const totals = obj(o.totals);
  const customer = obj(o.customer);
  const shipping = address(o.shipping_address);
  const currencyCode = (str(o.currency_code, obj(o.currency).code, o.currency) ?? "BRL").toUpperCase();
  const customerName =
    [str(customer.first_name), str(customer.last_name)].filter(Boolean).join(" ") ||
    str(customer.name) ||
    shipping?.name ||
    null;

  return {
    id: String(o.id ?? ""),
    number: str(o.display_id, o.number) ?? (typeof o.display_id === "number" ? String(o.display_id) : null),
    createdAt: str(o.created_at),
    state: state(o.status),
    payment: payment(o.payment_status),
    fulfillment: fulfillment(o.fulfillment_status),
    customer: { name: customerName, email: str(o.email, customer.email), phone: str(customer.phone, shipping?.phone) },
    shippingAddress: shipping,
    items: arr(o.items).map((i) => {
      const item = obj(i);
      const quantity = num(item.quantity) ?? 1;
      const unit = num(item.unit_price, item.price) ?? 0;
      return {
        title: str(item.title, item.product_title, item.name) ?? "(item)",
        variantTitle: str(item.variant_title, obj(item.variant).title),
        sku: str(item.sku, item.variant_sku, obj(item.variant).sku),
        quantity,
        unitPrice: unit,
        total: num(item.total, item.subtotal) ?? unit * quantity,
        productId: str(item.product_id),
        variantId: str(item.variant_id),
      };
    }),
    currency: currencyCode,
    decimalDigits: num(obj(o.currency).decimal_digits) ?? 2,
    subtotal: num(totals.subtotal, o.subtotal, o.item_total),
    shipping: num(totals.shipping, totals.shipping_total, o.shipping_total),
    discount: num(totals.discount, totals.discount_total, o.discount_total),
    total: num(totals.total, o.total) ?? 0,
    shippingMethod: str(obj(arr(o.shipping_methods)[0]).name, o.shipping_method),
    paymentMethod: str(obj(arr(o.payments)[0]).provider_title, obj(arr(o.payments)[0]).provider_id, o.payment_method),
    fulfillments: arr(o.fulfillments).map((f) => {
      const ff = obj(f);
      const label = obj(arr(ff.labels)[0]);
      return {
        createdAt: str(ff.created_at, ff.shipped_at),
        carrier: str(ff.carrier, ff.provider_id),
        trackingNumber: str(ff.tracking_number, label.tracking_number),
        trackingUrl: str(ff.tracking_url, label.tracking_url),
      };
    }),
    note: str(o.note, o.customer_note),
  };
}
