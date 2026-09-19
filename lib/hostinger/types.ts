/* ============================================================================
   Storefront API pública da Hostinger (v2)
   ----------------------------------------------------------------------------
   Contratos de leitura e de checkout. Esta superfície é pública e sem
   autenticação — nenhum token da Hostinger entra no frontend.

   Os valores monetários chegam sempre em centavos: `29990` é R$299,90.
   O preço vive na variante, nunca no produto.
   ========================================================================== */

export type HostingerCurrency = {
  code: string;
  symbol?: string;
  decimal_digits?: number;
  template?: string;
};

export type HostingerPrice = {
  amount: number;
  sale_amount?: number | null;
  currency_code?: string;
  currency?: HostingerCurrency;
};

export type HostingerVariantOption = {
  name?: string;
  value?: string;
};

export type HostingerVariant = {
  id: string;
  title?: string;
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

/**
 * Leitura normalizada de uma variante — o que a loja precisa para vender.
 * Todos os montantes em centavos.
 */
export type VariantSnapshot = {
  variantId: string;
  productId: string | null;
  /** Preço cheio. */
  amount: number;
  /** Preço promocional, quando existe e é inferior ao cheio. */
  saleAmount: number | null;
  /** O que é efectivamente cobrado. */
  effectiveAmount: number;
  currencyCode: string;
  decimalDigits: number;
  manageInventory: boolean;
  inventoryQuantity: number | null;
  /** Há stock para vender agora. */
  available: boolean;
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
