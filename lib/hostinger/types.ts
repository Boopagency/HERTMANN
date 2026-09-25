/* ============================================================================
   Contratos da Storefront API V2 da Hostinger
   ----------------------------------------------------------------------------
   Tipos tolerantes de propósito: o formato exato das respostas públicas ainda
   não foi verificado contra o schema oficial (https://api-ecommerce.hostinger.
   com/v2/docs.json — inacessível no ambiente de desenvolvimento). Os campos
   seguem as instruções oficiais de Custom Storefront e a API de gestão.
   ========================================================================== */

export type HostingerCurrency = {
  code: string;
  symbol?: string;
  decimal_digits?: number;
  template?: string;
};

export type HostingerPrice = {
  /** Unidade mínima da moeda — `12900` são R$ 129,00. */
  amount: number;
  sale_amount?: number | null;
  currency_code?: string;
  currency?: HostingerCurrency;
};

export type HostingerVariantOption = {
  name?: string | null;
  value?: string;
};

export type HostingerVariant = {
  id: string;
  product_id?: string | null;
  title?: string | null;
  sku?: string | null;
  options?: HostingerVariantOption[];
  prices?: HostingerPrice[];
  inventory_quantity?: number | null;
  manage_inventory?: boolean;
};

export type HostingerProduct = {
  id: string;
  title: string;
  description?: string | null;
  status?: string;
  thumbnail?: string | null;
  type?: string;
  variant_count?: number;
  variants?: HostingerVariant[];
};

/** Leitura normalizada de uma variante: o que a loja precisa para vender. */
export type VariantSnapshot = {
  variantId: string;
  productId: string | null;
  title: string | null;
  sku: string | null;
  amount: number;
  saleAmount: number | null;
  effectiveAmount: number;
  currencyCode: string;
  decimalDigits: number;
  manageInventory: boolean;
  inventoryQuantity: number | null;
  available: boolean;
};

/** Todas as variantes de um produto, lidas numa só consulta. */
export type ProductSnapshot = {
  productId: string;
  variants: Record<string, VariantSnapshot>;
};

export type CheckoutItem = {
  variant_id: string;
  quantity: number;
};

export type CheckoutRequest = {
  items: CheckoutItem[];
  success_url: string;
  cancel_url: string;
  locale?: string;
};

export type CheckoutSession = {
  url: string;
  cart_token?: string;
};
