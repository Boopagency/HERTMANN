import type {
  CheckoutItem,
  CheckoutRequest,
  CheckoutSession,
  HostingerProduct,
  HostingerVariant,
  VariantSnapshot,
} from "./types";

const DEFAULT_BASE_URL = "https://api-ecommerce.hostinger.com/v2";

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

  constructor(message: string, status: number) {
    super(message);
    this.name = "HostingerApiError";
    this.status = status;
  }
}

type RequestOptions = {
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
    throw new HostingerApiError(
      `Hostinger respondeu ${response.status} a ${method} ${path}`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

function unwrap<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as T[];
  }

  return [];
}

export async function listProducts(
  options: RequestOptions & { limit?: number } = {},
): Promise<HostingerProduct[]> {
  const { limit = 100, ...rest } = options;
  const params = new URLSearchParams({
    limit: String(Math.min(limit, 100)),
  });

  const payload = await request<unknown>(endpoints.products(), {
    params,
    ...rest,
  });

  return unwrap<HostingerProduct>(payload);
}

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

export async function listVariants(
  productIds: string[],
  options: RequestOptions = {},
): Promise<HostingerVariant[]> {
  const params = new URLSearchParams();

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
    productId,
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

export async function getVariantSnapshot(
  productId: string,
  variantId: string,
  options: RequestOptions = {},
): Promise<VariantSnapshot | null> {
  const variants = await listVariants([productId], options);
  const variant = variants.find((item) => item.id === variantId);

  return variant ? variantSnapshot(variant, productId) : null;
}

export async function createCheckout(
  items: CheckoutItem[],
  urls: {
    successUrl: string;
    cancelUrl: string;
    locale?: string;
  },
): Promise<CheckoutSession> {
  const body: CheckoutRequest = {
    items,
    success_url: urls.successUrl,
    cancel_url: urls.cancelUrl,
    locale: urls.locale ?? "pt-BR",
  };

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

export function checkoutReturnUrls(): {
  successUrl: string;
  cancelUrl: string;
} {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (
          process.env.NEXT_PUBLIC_SITE_URL ?? ""
        ).replace(/\/+$/, "");

  return {
    successUrl: `${origin}/checkout/sucesso`,
    cancelUrl: `${origin}/checkout/cancelado`,
  };
}
