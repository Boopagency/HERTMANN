import type {
  CheckoutItem,
  CheckoutRequest,
  CheckoutSession,
  HostingerProduct,
  HostingerVariant,
  ProductSnapshot,
  VariantSnapshot,
} from "./types";
import { siteUrl } from "@/lib/site-url";

/* ============================================================================
   Cliente da Storefront API V2 da Hostinger
   ----------------------------------------------------------------------------
   Superfície pública, sem autenticação e com CORS aberto: serve o servidor
   (página de produto, SEO) e o navegador (sacola, checkout). Nenhum token
   entra aqui — o canal de venda é um identificador público, não um segredo.

   Os caminhos seguem as instruções oficiais de Custom Storefront e estão
   reunidos em `endpoints`: se a API divergir, corrige-se num só sítio.
   ========================================================================== */

const DEFAULT_BASE_URL = "https://api-ecommerce.hostinger.com/v2";

/** Máximo aceite pelas listagens da Storefront API (acima disto, 400). */
const LIST_LIMIT = 100;

/**
 * Idioma pedido ao checkout hospedado. O único exemplo oficial usa "en"; os
 * valores aceites não estão confirmados — ver `createCheckout`.
 */
const CHECKOUT_LOCALE = "pt-BR";

export const salesChannelId =
  process.env.NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID ?? "";

export const storefrontBaseUrl = (
  process.env.NEXT_PUBLIC_HOSTINGER_STOREFRONT_API_URL || DEFAULT_BASE_URL
).replace(/\/+$/, "");

export const isStoreConfigured = salesChannelId.length > 0;

const endpoints = {
  products: () => `/channels/${salesChannelId}/products`,
  product: (productId: string) =>
    `/channels/${salesChannelId}/products/${productId}`,
  variants: () => `/channels/${salesChannelId}/variants`,
  checkout: () => `/channels/${salesChannelId}/checkout`,
};

export class HostingerApiError extends Error {
  readonly status: number;
  /** Início do corpo da resposta de erro, para diagnóstico. */
  readonly detail: string | null;

  constructor(message: string, status: number, detail: string | null = null) {
    super(message);
    this.name = "HostingerApiError";
    this.status = status;
    this.detail = detail;
  }
}

type RequestOptions = {
  /** Segundos de cache no servidor (ISR). Ignorado no navegador. */
  revalidate?: number;
  signal?: AbortSignal;
};

type NextRequestInit = RequestInit & {
  next?: { revalidate: number };
};

function assertConfigured() {
  if (!isStoreConfigured) {
    throw new HostingerApiError(
      "NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID não está definido.",
      0,
    );
  }
}

async function request<T>(
  path: string,
  {
    method = "GET",
    body,
    params,
    revalidate,
    signal,
  }: RequestOptions & {
    method?: "GET" | "POST";
    body?: unknown;
    params?: URLSearchParams;
  } = {},
): Promise<T> {
  assertConfigured();

  const query = params && [...params].length > 0 ? `?${params}` : "";
  const init: NextRequestInit = {
    method,
    headers: { Accept: "application/json" },
    signal,
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = {
      ...init.headers,
      "Content-Type": "application/json",
    };
  }

  if (typeof revalidate === "number") {
    init.next = { revalidate };
  } else if (method === "GET") {
    init.cache = "no-store";
  }

  const response = await fetch(`${storefrontBaseUrl}${path}${query}`, init);

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new HostingerApiError(
      `Hostinger respondeu ${response.status} a ${method} ${path}`,
      response.status,
      detail ? detail.slice(0, 500) : null,
    );
  }

  return (await response.json()) as T;
}

/** As listagens podem vir como lista simples ou embrulhadas em `data`. */
function unwrap<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as T[];
  }

  return [];
}

/* --------------------------------------------------------------------------
   Catálogo
   -------------------------------------------------------------------------- */

export async function listProducts(
  options: RequestOptions & { limit?: number } = {},
): Promise<HostingerProduct[]> {
  const { limit = LIST_LIMIT, ...rest } = options;
  const params = new URLSearchParams({
    limit: String(Math.min(limit, LIST_LIMIT)),
  });

  const payload = await request<unknown>(endpoints.products(), {
    params,
    ...rest,
  });

  return unwrap<HostingerProduct>(payload);
}

/** O detalhe resolve por ID. Passar um slug devolve 404. */
export async function getProduct(
  productId: string,
  options: RequestOptions = {},
): Promise<HostingerProduct | null> {
  const payload = await request<unknown>(
    endpoints.product(productId),
    options,
  );

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: HostingerProduct }).data ?? null;
  }

  return (payload as HostingerProduct) ?? null;
}

/**
 * Variantes filtradas por produto — a lista sem filtro é eventualmente
 * consistente logo após edições no catálogo (instruções oficiais).
 */
export async function listVariants(
  productIds: string[],
  options: RequestOptions = {},
): Promise<HostingerVariant[]> {
  const params = new URLSearchParams({ limit: String(LIST_LIMIT) });

  for (const id of productIds) {
    params.append("product_ids[]", id);
  }

  const payload = await request<unknown>(endpoints.variants(), {
    params,
    ...options,
  });

  return unwrap<HostingerVariant>(payload);
}

export function variantSnapshot(
  variant: HostingerVariant,
  productId: string | null = null,
): VariantSnapshot | null {
  const price = variant.prices?.[0];

  if (!price || typeof price.amount !== "number") {
    return null;
  }

  const sale =
    typeof price.sale_amount === "number" &&
    price.sale_amount < price.amount
      ? price.sale_amount
      : null;

  const manageInventory = variant.manage_inventory ?? false;
  const inventoryQuantity =
    typeof variant.inventory_quantity === "number"
      ? variant.inventory_quantity
      : null;

  return {
    variantId: variant.id,
    productId: productId ?? variant.product_id ?? null,
    title: variant.title ?? null,
    sku: variant.sku ?? null,
    amount: price.amount,
    saleAmount: sale,
    effectiveAmount: sale ?? price.amount,
    currencyCode: (
      price.currency?.code ??
      price.currency_code ??
      "brl"
    ).toUpperCase(),
    decimalDigits: price.currency?.decimal_digits ?? 2,
    manageInventory,
    inventoryQuantity,
    available:
      !manageInventory || (inventoryQuantity ?? 0) > 0,
  };
}

/** Todas as variantes de um produto, normalizadas, por `variantId`. */
export async function getProductSnapshot(
  productId: string,
  options: RequestOptions = {},
): Promise<ProductSnapshot> {
  const variants = await listVariants([productId], options);
  const snapshots: ProductSnapshot["variants"] = {};

  for (const variant of variants) {
    // Pediu-se um só produto; se a API disser que a variante é de outro, sai.
    if (variant.product_id && variant.product_id !== productId) continue;
    const snapshot = variantSnapshot(variant, productId);
    if (snapshot) snapshots[snapshot.variantId] = snapshot;
  }

  return { productId, variants: snapshots };
}

export async function getVariantSnapshot(
  productId: string,
  variantId: string,
  options: RequestOptions = {},
): Promise<VariantSnapshot | null> {
  const { variants } = await getProductSnapshot(productId, options);
  return variants[variantId] ?? null;
}

/* --------------------------------------------------------------------------
   Checkout
   -------------------------------------------------------------------------- */

async function postCheckout(body: CheckoutRequest): Promise<CheckoutSession> {
  const payload = await request<unknown>(endpoints.checkout(), {
    method: "POST",
    body,
  });

  const session =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data: CheckoutSession }).data
      : (payload as CheckoutSession);

  if (!session?.url) {
    throw new HostingerApiError(
      "A Hostinger não devolveu URL de checkout.",
      502,
    );
  }

  return session;
}

export async function createCheckout(
  items: CheckoutItem[],
  urls: {
    successUrl: string;
    cancelUrl: string;
    locale?: string;
  },
): Promise<CheckoutSession> {
  const locale = urls.locale ?? CHECKOUT_LOCALE;
  const body: CheckoutRequest = {
    items,
    success_url: urls.successUrl,
    cancel_url: urls.cancelUrl,
    locale,
  };

  try {
    return await postCheckout(body);
  } catch (error) {
    // O `locale` aceite ainda não foi confirmado no schema oficial. Se a API
    // recusar o pedido por validação, tenta-se uma vez sem ele: o checkout
    // abre no idioma padrão da loja em vez de não abrir.
    const rejected =
      error instanceof HostingerApiError &&
      (error.status === 400 || error.status === 422);
    if (!locale || !rejected) throw error;

    return postCheckout({
      items: body.items,
      success_url: body.success_url,
      cancel_url: body.cancel_url,
    });
  }
}

/**
 * URLs de retorno a partir da origem em que o site está a correr — local,
 * Preview ou produção — sem configuração. `ref` identifica o checkout que
 * este navegador criou (ver components/commerce/checkout.ts).
 */
export function checkoutReturnUrls(ref?: string): {
  successUrl: string;
  cancelUrl: string;
} {
  const origin =
    typeof window !== "undefined" ? window.location.origin : siteUrl;
  const query = ref ? `?ref=${encodeURIComponent(ref)}` : "";

  return {
    successUrl: `${origin}/checkout/sucesso${query}`,
    cancelUrl: `${origin}/checkout/cancelado`,
  };
}
