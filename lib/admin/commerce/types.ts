/* ============================================================================
   Modelo comercial do Admin — independente do motor de e-commerce
   ----------------------------------------------------------------------------
   As telas do painel só conhecem estes tipos. Cada motor (hoje a Hostinger,
   ou o simulado) traduz a sua API para eles no seu adaptador. Trocar de
   motor é escrever outro CommerceAdminProvider; as telas não mudam.

   Dinheiro sempre em unidades mínimas da moeda (centavos): 39990 = R$ 399,90.
   ========================================================================== */

export type ProductStatus = "draft" | "published" | "archived";

export type VariantOption = { name: string; value: string };

export type AdminVariant = {
  id: string;
  productId: string;
  title: string | null;
  sku: string | null;
  options: VariantOption[];
  /** Preço cheio, em centavos. */
  price: number;
  /** Preço promocional, em centavos — só quando menor que o preço cheio. */
  salePrice: number | null;
  currency: string;
  decimalDigits: number;
  manageInventory: boolean;
  inventoryQuantity: number | null;
};

export type AdminImage = { id: string; url: string; alt: string | null };

export type AdminProduct = {
  id: string;
  title: string;
  description: string | null;
  status: ProductStatus;
  images: AdminImage[];
  variants: AdminVariant[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type VariantInput = {
  title: string | null;
  sku: string | null;
  options: VariantOption[];
  price: number;
  salePrice: number | null;
  manageInventory: boolean;
  inventoryQuantity: number | null;
};

export type VariantUpdate = VariantInput & { id: string };

export type ProductInput = {
  title: string;
  description: string | null;
  variant: VariantInput;
};

export type ImageUpload = { name: string; type: string; bytes: Uint8Array };

/* --------------------------------------------------------------------------
   Pedidos (só leitura no MVP)
   -------------------------------------------------------------------------- */

export type PaymentStatus = "pending" | "paid" | "refunded" | "failed" | "unknown";
export type FulfillmentStatus = "unfulfilled" | "partial" | "fulfilled" | "unknown";
export type OrderState = "open" | "completed" | "cancelled" | "unknown";

export type Address = {
  name: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
};

export type OrderItem = {
  title: string;
  variantTitle: string | null;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  productId: string | null;
  variantId: string | null;
};

export type Fulfillment = {
  createdAt: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
};

export type AdminOrder = {
  id: string;
  number: string | null;
  createdAt: string | null;
  state: OrderState;
  payment: PaymentStatus;
  fulfillment: FulfillmentStatus;
  customer: { name: string | null; email: string | null; phone: string | null };
  shippingAddress: Address | null;
  items: OrderItem[];
  currency: string;
  decimalDigits: number;
  subtotal: number | null;
  shipping: number | null;
  discount: number | null;
  total: number;
  shippingMethod: string | null;
  paymentMethod: string | null;
  fulfillments: Fulfillment[];
  note: string | null;
};

/* --------------------------------------------------------------------------
   O contrato de um motor
   -------------------------------------------------------------------------- */

export type ProviderCapabilities = {
  /** Remover uma imagem já anexada ao produto. */
  removeImage: boolean;
};

export interface CommerceAdminProvider {
  readonly id: "hostinger" | "simulado";
  /** Nome mostrado na interface quando útil ("Hostinger", "Loja simulada"). */
  readonly label: string;
  readonly capabilities: ProviderCapabilities;

  listProducts(): Promise<AdminProduct[]>;
  getProduct(productId: string): Promise<AdminProduct | null>;
  /** Cria sempre como rascunho. Publicar é um passo separado. */
  createProduct(input: ProductInput): Promise<AdminProduct>;
  updateProduct(productId: string, patch: { title: string; description: string | null }): Promise<void>;
  setProductStatus(productId: string, status: ProductStatus): Promise<void>;

  createVariant(productId: string, input: VariantInput): Promise<void>;
  /** Grava o preço completo de cada variante (cheio e promocional), nunca parcial. */
  updateVariants(productId: string, updates: VariantUpdate[]): Promise<void>;
  deleteVariant(productId: string, variantId: string): Promise<void>;

  addImage(productId: string, upload: ImageUpload): Promise<void>;
  removeImage?(productId: string, imageId: string): Promise<void>;

  listOrders(): Promise<AdminOrder[]>;
  getOrder(orderId: string): Promise<AdminOrder | null>;
}

/** Erro de um motor, com mensagem para a equipa e detalhe só para o registo. */
export class CommerceError extends Error {
  readonly status: number;
  readonly detail: string | null;

  constructor(message: string, status = 0, detail: string | null = null) {
    super(message);
    this.name = "CommerceError";
    this.status = status;
    this.detail = detail;
  }
}
