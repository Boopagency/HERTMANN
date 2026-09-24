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

export type VariantSnapshot = {
  variantId: string;
  productId: string | null;
  amount: number;
  saleAmount: number | null;
  effectiveAmount: number;
  currencyCode: string;
  decimalDigits: number;
  manageInventory: boolean;
  inventoryQuantity: number | null;
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
