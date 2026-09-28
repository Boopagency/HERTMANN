import "server-only";
import { nextSimulatedId, simulatedState } from "@/lib/simulated/store";
import {
  CommerceError,
  type AdminOrder,
  type AdminProduct,
  type AdminVariant,
  type CommerceAdminProvider,
  type ImageUpload,
  type ProductInput,
  type ProductStatus,
  type VariantInput,
  type VariantUpdate,
} from "./types";

/* ============================================================================
   Loja simulada — o mesmo contrato, em memória (modo simulado, só local)
   ----------------------------------------------------------------------------
   Imita também as limitações da Hostinger (SKU só na criação, imagens sem
   remoção), para que o que funciona aqui funcione lá.
   ========================================================================== */

const clone = <T,>(value: T): T => structuredClone(value);

function variant(productId: string, input: VariantInput): AdminVariant {
  return {
    id: nextSimulatedId("sim_var"),
    productId,
    title: input.title,
    sku: input.sku,
    options: input.options,
    price: input.price,
    salePrice: input.salePrice !== null && input.salePrice < input.price ? input.salePrice : null,
    currency: "BRL",
    decimalDigits: 2,
    manageInventory: input.manageInventory,
    inventoryQuantity: input.manageInventory ? (input.inventoryQuantity ?? 0) : null,
  };
}

export class SimulatedProvider implements CommerceAdminProvider {
  readonly id = "simulado" as const;
  readonly label = "Loja simulada";
  readonly capabilities = { removeImage: false, editSku: false };

  private find(productId: string): AdminProduct {
    const product = simulatedState().products.find((p) => p.id === productId);
    if (!product) throw new CommerceError("A loja não encontrou este item. Ele pode ter sido removido.", 404);
    return product;
  }

  private touch(product: AdminProduct) {
    product.updatedAt = new Date().toISOString();
  }

  async listProducts() {
    return clone([...simulatedState().products].reverse());
  }

  async getProduct(productId: string) {
    const product = simulatedState().products.find((p) => p.id === productId);
    return product ? clone(product) : null;
  }

  async createProduct(input: ProductInput) {
    const id = nextSimulatedId("sim_prod");
    const now = new Date().toISOString();
    const product: AdminProduct = {
      id,
      title: input.title,
      description: input.description,
      status: "draft",
      images: [],
      variants: [variant(id, input.variant)],
      createdAt: now,
      updatedAt: now,
    };
    simulatedState().products.push(product);
    return clone(product);
  }

  async updateProduct(productId: string, patch: { title: string; description: string | null }) {
    const product = this.find(productId);
    product.title = patch.title;
    product.description = patch.description;
    this.touch(product);
  }

  async setProductStatus(productId: string, status: ProductStatus) {
    const product = this.find(productId);
    product.status = status;
    this.touch(product);
  }

  async createVariant(productId: string, input: VariantInput) {
    const product = this.find(productId);
    product.variants.push(variant(productId, input));
    this.touch(product);
  }

  async updateVariants(productId: string, updates: VariantUpdate[]) {
    const product = this.find(productId);
    for (const update of updates) {
      const current = product.variants.find((v) => v.id === update.id);
      if (!current) throw new CommerceError("Uma das variantes não existe mais. Recarregue a página.", 404);
      Object.assign(current, {
        title: update.title,
        price: update.price,
        salePrice: update.salePrice !== null && update.salePrice < update.price ? update.salePrice : null,
        manageInventory: update.manageInventory,
        inventoryQuantity: update.manageInventory ? (update.inventoryQuantity ?? 0) : null,
      });
    }
    this.touch(product);
  }

  async deleteVariant(productId: string, variantId: string) {
    const product = this.find(productId);
    product.variants = product.variants.filter((v) => v.id !== variantId);
    this.touch(product);
  }

  async addImage(productId: string, upload: ImageUpload) {
    const product = this.find(productId);
    const id = nextSimulatedId("sim_img");
    simulatedState().images.set(id, { type: upload.type, bytes: upload.bytes });
    product.images.push({ id, url: `/api/simulacao/imagens/${id}`, alt: null });
    this.touch(product);
  }

  async listOrders(): Promise<AdminOrder[]> {
    return clone(simulatedState().orders);
  }

  async getOrder(orderId: string) {
    const order = simulatedState().orders.find((o) => o.id === orderId);
    return order ? clone(order) : null;
  }
}
