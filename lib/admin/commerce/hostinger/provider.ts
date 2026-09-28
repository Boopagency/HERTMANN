import "server-only";
import {
  CommerceError,
  type AdminOrder,
  type AdminProduct,
  type CommerceAdminProvider,
  type ImageUpload,
  type ProductInput,
  type ProductStatus,
  type VariantInput,
  type VariantUpdate,
} from "../types";
import { hostingerRequest, type HostingerAdminConfig } from "./http";
import {
  hasNextPage,
  orderFromApi,
  pricesBody,
  productFromApi,
  unwrapList,
  unwrapOne,
  variantFromApi,
} from "./mappers";

/* ============================================================================
   HostingerAdapter — o CommerceAdminProvider sobre a API de gestão
   ----------------------------------------------------------------------------
   Limitações da API (schema de 2026-09-28), refletidas em `capabilities`:
   - não há endpoint para remover ou reordenar imagens;
   - o SKU só se define ao criar uma variante (a edição em lote não o aceita);
   - criar produto físico devolve-o JÁ PUBLICADO, com uma variante sem SKU —
     o adaptador passa-o a rascunho de imediato (ver createProduct).
   ========================================================================== */

const MAX_PAGES = 20;

export class HostingerAdapter implements CommerceAdminProvider {
  readonly id = "hostinger" as const;
  readonly label = "Hostinger";
  readonly capabilities = { removeImage: false, editSku: false };

  constructor(private readonly config: HostingerAdminConfig) {}

  private request<T = unknown>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    options?: { query?: URLSearchParams; body?: unknown },
  ) {
    return hostingerRequest<T>(this.config, method, path, options);
  }

  private async listVariants(productId: string) {
    const payload = await this.request("GET", `/products/${productId}/variants`);
    return unwrapList(payload).map((v) => variantFromApi(v, productId));
  }

  async listProducts(): Promise<AdminProduct[]> {
    const products: AdminProduct[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const query = new URLSearchParams();
      query.append("include[]", "variants");
      query.append("include[]", "media");
      query.append("page", String(page));
      const payload = await this.request("GET", "/products", { query });
      products.push(...unwrapList(payload).map(productFromApi));
      if (!hasNextPage(payload)) break;
    }
    return products;
  }

  async getProduct(productId: string): Promise<AdminProduct | null> {
    const query = new URLSearchParams();
    query.append("product_ids[]", productId);
    query.append("include[]", "variants");
    query.append("include[]", "media");
    const payload = await this.request("GET", "/products", { query });
    const raw = unwrapList(payload).find((p) => (p as { id?: unknown })?.id === productId);
    if (!raw) return null;

    const product = productFromApi(raw);
    // Se a listagem não embutir as variantes, lêem-se à parte.
    if (product.variants.length === 0) product.variants = await this.listVariants(productId);
    return product;
  }

  async createProduct(input: ProductInput): Promise<AdminProduct> {
    const created = unwrapOne(
      await this.request("POST", "/products/physical", {
        body: {
          name: input.title,
          price: input.variant.price,
          ...(input.description ? { description: input.description } : {}),
        },
      }),
    );
    const productId = String(created.id ?? "");
    if (!productId) throw new CommerceError("A loja não devolveu o produto criado.", 502);

    // A API cria o produto publicado. Passa a rascunho já — uma segunda
    // tentativa se a primeira falhar; se falhar outra vez, o erro diz-o.
    try {
      await this.setProductStatus(productId, "draft");
    } catch {
      try {
        await this.setProductStatus(productId, "draft");
      } catch (error) {
        throw new CommerceError(
          `O produto foi criado na loja (${productId}), mas ficou publicado: a loja recusou passá-lo a rascunho. Abra-o no painel e despublique-o.`,
          error instanceof CommerceError ? error.status : 0,
          error instanceof CommerceError ? error.detail : null,
        );
      }
    }

    const [initial] = await this.listVariants(productId);
    const v = input.variant;

    if (v.sku || v.options.length > 0) {
      // SKU e opções só entram ao criar uma variante: cria-se a completa e
      // retira-se a variante automática, que acabou de nascer sem eles.
      await this.createVariant(productId, v);
      if (initial) await this.deleteVariant(productId, initial.id);
    } else if (initial) {
      await this.updateVariants(productId, [{ ...v, id: initial.id }]);
    }

    const product = await this.getProduct(productId);
    if (!product) throw new CommerceError("O produto foi criado, mas a loja ainda não o devolve. Recarregue a lista.", 502);
    return product;
  }

  async updateProduct(productId: string, patch: { title: string; description: string | null }) {
    await this.request("PATCH", `/products/${productId}`, {
      body: { name: patch.title, description: patch.description ?? "" },
    });
  }

  async setProductStatus(productId: string, status: ProductStatus) {
    await this.request("PATCH", `/products/${productId}`, { body: { status } });
  }

  async createVariant(productId: string, input: VariantInput) {
    await this.request("POST", `/products/${productId}/variants`, {
      body: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.sku ? { sku: input.sku } : {}),
        options: input.options,
        prices: pricesBody(input),
        manage_inventory: input.manageInventory,
        inventory_quantity: input.manageInventory ? (input.inventoryQuantity ?? 0) : 0,
      },
    });
  }

  async updateVariants(productId: string, updates: VariantUpdate[]) {
    if (updates.length === 0) return;
    if (updates.length > 100) throw new CommerceError("No máximo 100 variantes por gravação.", 400);
    await this.request("PATCH", `/products/${productId}/variants/batch`, {
      body: {
        variants: updates.map((u) => ({
          variant_id: u.id,
          ...(u.title ? { title: u.title } : {}),
          manage_inventory: u.manageInventory,
          ...(u.manageInventory ? { inventory_quantity: u.inventoryQuantity ?? 0 } : {}),
          prices: pricesBody(u),
        })),
      },
    });
  }

  async deleteVariant(productId: string, variantId: string) {
    await this.request("DELETE", `/products/${productId}/variants/${variantId}`);
  }

  /**
   * Envio em dois passos, como pede a API: URL assinada → envio do arquivo →
   * anexar pelo `object_name`. O token nunca vai para a URL assinada.
   * NÃO VERIFICADO: o formato da resposta de upload-url (url, fields,
   * object_name) segue a descrição do schema, não uma resposta real.
   */
  async addImage(productId: string, upload: ImageUpload) {
    const signed = unwrapOne(await this.request("POST", `/products/${productId}/images/upload-url`));
    const uploadUrl = [signed.upload_url, signed.url].find((u): u is string => typeof u === "string");
    const objectName = typeof signed.object_name === "string" ? signed.object_name : null;
    if (!uploadUrl || !uploadUrl.startsWith("https://") || !objectName) {
      throw new CommerceError("A loja não devolveu um endereço de envio válido para a imagem.", 502, JSON.stringify(signed).slice(0, 300));
    }

    const form = new FormData();
    const fields = signed.fields && typeof signed.fields === "object" ? (signed.fields as Record<string, unknown>) : {};
    for (const [key, value] of Object.entries(fields)) form.append(key, String(value));
    form.append("file", new Blob([upload.bytes as BlobPart], { type: upload.type }), upload.name);

    const sent = await fetch(uploadUrl, { method: "POST", body: form, cache: "no-store", signal: AbortSignal.timeout(60_000) });
    if (!sent.ok) {
      const detail = (await sent.text().catch(() => "")).slice(0, 300);
      console.error("[admin:hostinger] envio de imagem", sent.status, detail);
      throw new CommerceError("O envio da imagem para a loja falhou. Tente de novo.", sent.status, detail);
    }

    await this.request("POST", `/products/${productId}/images`, { body: { object_name: objectName } });
  }

  async listOrders(): Promise<AdminOrder[]> {
    const orders: AdminOrder[] = [];
    for (let page = 1; page <= 5; page++) {
      const payload = await this.request("GET", "/orders", { query: new URLSearchParams({ page: String(page) }) });
      orders.push(...unwrapList(payload).map(orderFromApi));
      if (!hasNextPage(payload)) break;
    }
    return orders;
  }

  async getOrder(orderId: string): Promise<AdminOrder | null> {
    try {
      return orderFromApi(unwrapOne(await this.request("GET", `/orders/${orderId}`)));
    } catch (error) {
      if (error instanceof CommerceError && error.status === 404) return null;
      throw error;
    }
  }
}
