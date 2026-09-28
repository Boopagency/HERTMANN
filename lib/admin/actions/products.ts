"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requirePermission, type AdminMember } from "@/lib/admin/auth/member";
import type { Permission } from "@/lib/admin/auth/permissions";
import { CommerceError, resolveCommerceProvider, type CommerceAdminProvider } from "@/lib/admin/commerce";
import { EditorialError, editorialRepository, recordAudit } from "@/lib/admin/editorial";
import { canPublish, publishReadiness } from "@/lib/admin/readiness";
import {
  createProductSchema,
  editorialSchema,
  fieldErrors,
  storeInfoSchema,
  variantFormSchema,
  variantRowsSchema,
} from "@/lib/admin/schemas";
import type { ActionResult } from "@/lib/admin/action-result";
import { defaultDrawing, SITE_CATALOGUE_TAG, type EditorialInput } from "@/lib/catalog/types";
import { pieces as prototypes, type CategorySlug } from "@/lib/data/catalogue";
import type { DrawingVariant } from "@/components/brand/Marks";

/* ============================================================================
   Operações de produto do painel
   ----------------------------------------------------------------------------
   Cada ação, por esta ordem:
   1. verifica sessão e papel no servidor (requirePermission);
   2. valida os dados (zod);
   3. escreve num só sistema sempre que possível — comercial na loja,
      editorial no Supabase;
   4. regista a auditoria;
   5. revalida o painel e, quando o site é afetado, o catálogo do site.

   Criar produto é a única operação que escreve nos dois sistemas: primeiro
   a loja (produto em rascunho), depois a ficha. Se a ficha falhar, o
   produto fica em rascunho — invisível no site e fora da venda — e a tela
   pede para completar a ficha.
   ========================================================================== */

const PRODUCT_ID = /^[A-Za-z0-9_-]{1,100}$/;

function fail(message: string, errors?: Record<string, string>): ActionResult {
  return { ok: false, message, ...(errors ? { fieldErrors: errors } : {}) };
}

function explain(error: unknown): string {
  if (error instanceof AuthorizationError || error instanceof CommerceError || error instanceof EditorialError) {
    return error.message;
  }
  console.error("[admin:acao]", error);
  return "Algo correu mal. Tente de novo; se persistir, avise a equipa técnica.";
}

async function context(permission: Permission, productId?: string) {
  const member = await requirePermission(permission);
  if (productId !== undefined && !PRODUCT_ID.test(productId)) throw new CommerceError("Produto inválido.", 400);
  const resolution = resolveCommerceProvider();
  if (!resolution.ok) throw new CommerceError(resolution.reason);
  return { member, provider: resolution.provider, editorial: editorialRepository() };
}

function refresh(productId?: string, site = false) {
  revalidatePath("/admin", "layout");
  if (productId) revalidatePath(`/admin/produtos/${productId}`);
  if (site) revalidateTag(SITE_CATALOGUE_TAG);
}

const prototypeSlugs = new Set(prototypes.map((p) => p.slug));

async function slugTaken(slug: string, ownId: string | null, editorial: ReturnType<typeof editorialRepository>) {
  if (prototypeSlugs.has(slug)) return true;
  const existing = await editorial.bySlug(slug);
  return Boolean(existing && existing.id !== ownId);
}

async function audited<T>(
  member: AdminMember,
  entry: { action: string; target: string | null; system: "hostinger" | "supabase"; detail?: Record<string, unknown> },
  task: () => Promise<T>,
): Promise<T> {
  try {
    const result = await task();
    await recordAudit(member, { ...entry, outcome: "ok" });
    return result;
  } catch (error) {
    await recordAudit(member, {
      ...entry,
      outcome: "error",
      detail: { ...entry.detail, erro: error instanceof Error ? error.message : String(error) },
    });
    throw error;
  }
}

/* --------------------------------------------------------------------------
   Criar
   -------------------------------------------------------------------------- */

export async function createProduct(_: ActionResult, form: FormData): Promise<ActionResult> {
  let productId: string;
  let editorialFailed = false;

  try {
    const { member, provider, editorial } = await context("produtos.editar");
    const parsed = createProductSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return fail("Confira os campos assinalados.", fieldErrors(parsed.error));
    const input = parsed.data;

    if (await slugTaken(input.slug, null, editorial)) {
      return fail("Confira os campos assinalados.", { slug: "Este endereço já está em uso. Escolha outro." });
    }

    const product = await audited(member, { action: "produto.criar", target: input.title, system: "hostinger" }, () =>
      provider.createProduct({
        title: input.title,
        description: null,
        variant: {
          title: null,
          sku: input.sku,
          options: input.optionName && input.optionValue ? [{ name: input.optionName, value: input.optionValue }] : [],
          price: input.price,
          salePrice: input.salePrice,
          manageInventory: input.manageInventory,
          inventoryQuantity: input.inventoryQuantity,
        },
      }),
    );
    productId = product.id;

    const ficha: EditorialInput = {
      hostingerProductId: product.id,
      slug: input.slug,
      displayName: null,
      category: input.category as CategorySlug,
      collectionSlug: input.collection,
      line: input.line,
      description: "",
      material: "",
      stone: null,
      measures: "",
      reference: null,
      drawing: defaultDrawing[input.category as CategorySlug],
      imageFit: "full",
      imageFocus: null,
      madeToOrder: false,
      featured: false,
      position: 0,
    };
    try {
      await audited(member, { action: "ficha.criar", target: product.id, system: "supabase" }, () => editorial.create(ficha));
    } catch {
      editorialFailed = true;
    }
  } catch (error) {
    return fail(explain(error));
  }

  refresh(productId);
  redirect(`/admin/produtos/${productId}?${editorialFailed ? "ficha=falhou" : "criado=1"}`);
}

/* --------------------------------------------------------------------------
   Loja: nome e descrição comercial
   -------------------------------------------------------------------------- */

export async function saveStoreInfo(productId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const { member, provider } = await context("produtos.editar", productId);
    const parsed = storeInfoSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return fail("Confira os campos assinalados.", fieldErrors(parsed.error));
    await audited(member, { action: "produto.editar", target: productId, system: "hostinger" }, () =>
      provider.updateProduct(productId, parsed.data),
    );
    refresh(productId, true);
    return { ok: true, message: "Informações da loja gravadas." };
  } catch (error) {
    return fail(explain(error));
  }
}

/* --------------------------------------------------------------------------
   Variantes, preço e estoque
   -------------------------------------------------------------------------- */

export async function saveVariants(productId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const { member, provider } = await context("produtos.editar", productId);
    let raw: unknown;
    try {
      raw = JSON.parse(String(form.get("variants") ?? "[]"));
    } catch {
      return fail("Não foi possível ler as variantes. Recarregue a página.");
    }
    const parsed = variantRowsSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const row = typeof issue?.path[0] === "number" ? ` (linha ${issue.path[0] + 1})` : "";
      return fail(`${issue?.message ?? "Valores inválidos."}${row}`);
    }

    // Só variantes deste produto — nunca um id vindo de outro.
    const current = await provider.getProduct(productId);
    if (!current) return fail("O produto já não existe na loja.");
    const known = new Set(current.variants.map((v) => v.id));
    if (parsed.data.some((v) => !known.has(v.id))) return fail("Uma das variantes mudou entretanto. Recarregue a página.");

    await audited(
      member,
      { action: "variantes.editar", target: productId, system: "hostinger", detail: { variantes: parsed.data.length } },
      () =>
        provider.updateVariants(
          productId,
          parsed.data.map((v) => ({ ...v, sku: null, options: [] })),
        ),
    );
    refresh(productId, true);
    return { ok: true, message: "Preços e estoque gravados." };
  } catch (error) {
    return fail(explain(error));
  }
}

export async function addVariant(productId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const { member, provider } = await context("produtos.editar", productId);
    const parsed = variantFormSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return fail("Confira os campos assinalados.", fieldErrors(parsed.error));
    const v = parsed.data;
    await audited(member, { action: "variante.criar", target: productId, system: "hostinger" }, () =>
      provider.createVariant(productId, {
        title: v.title,
        sku: v.sku,
        options: v.optionName && v.optionValue ? [{ name: v.optionName, value: v.optionValue }] : [],
        price: v.price,
        salePrice: v.salePrice,
        manageInventory: v.manageInventory,
        inventoryQuantity: v.inventoryQuantity,
      }),
    );
    refresh(productId, true);
    return { ok: true, message: "Variante adicionada." };
  } catch (error) {
    return fail(explain(error));
  }
}

export async function deleteVariant(productId: string, variantId: string): Promise<ActionResult> {
  try {
    const { member, provider } = await context("variantes.excluir", productId);
    const product = await provider.getProduct(productId);
    if (!product?.variants.some((v) => v.id === variantId)) return fail("Esta variante já não existe.");
    if (product.variants.length <= 1) return fail("Um produto precisa de pelo menos uma variante.");
    await audited(member, { action: "variante.excluir", target: `${productId}/${variantId}`, system: "hostinger" }, () =>
      provider.deleteVariant(productId, variantId),
    );
    refresh(productId, true);
    return { ok: true, message: "Variante excluída." };
  } catch (error) {
    return fail(explain(error));
  }
}

/* --------------------------------------------------------------------------
   Imagens
   -------------------------------------------------------------------------- */

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Confere a assinatura do arquivo — o tipo declarado pelo navegador não basta. */
function sniff(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}

export async function uploadImage(productId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const { member, provider } = await context("produtos.editar", productId);
    const file = form.get("image");
    if (!(file instanceof File) || file.size === 0) return fail("Escolha uma imagem.");
    if (file.size > MAX_IMAGE_BYTES) return fail("A imagem tem mais de 4 MB. Reduza-a e tente de novo.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniff(bytes);
    if (!type || !IMAGE_TYPES.has(type)) return fail("Use JPEG, PNG, WebP ou GIF.");

    await audited(member, { action: "imagem.enviar", target: productId, system: "hostinger", detail: { bytes: file.size } }, () =>
      provider.addImage(productId, { name: file.name.replace(/[^\w.-]+/g, "_").slice(0, 80) || "imagem", type, bytes }),
    );
    refresh(productId, true);
    return { ok: true, message: "Imagem enviada." };
  } catch (error) {
    return fail(explain(error));
  }
}

/* --------------------------------------------------------------------------
   Ficha do site (Supabase)
   -------------------------------------------------------------------------- */

export async function saveEditorial(productId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const { member, provider, editorial } = await context("produtos.editar", productId);
    const parsed = editorialSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return fail("Confira os campos assinalados.", fieldErrors(parsed.error));
    const v = parsed.data;

    const product = await provider.getProduct(productId);
    if (!product) return fail("O produto já não existe na loja.");
    const current = await editorial.byProductId(productId);

    if (await slugTaken(v.slug, current?.id ?? null, editorial)) {
      return fail("Confira os campos assinalados.", { slug: "Este endereço já está em uso. Escolha outro." });
    }
    if (current && current.slug !== v.slug && product.status === "published") {
      return fail("Confira os campos assinalados.", {
        slug: "O endereço não muda com o produto publicado — as ligações antigas deixariam de funcionar. Despublique primeiro.",
      });
    }

    const data: Omit<EditorialInput, "hostingerProductId"> = {
      slug: v.slug,
      displayName: v.displayName,
      category: v.category as CategorySlug,
      collectionSlug: v.collection,
      line: v.line,
      description: v.description,
      material: v.material,
      stone: v.stone,
      measures: v.measures,
      reference: v.reference,
      drawing: v.drawing as DrawingVariant,
      imageFit: v.imageFit,
      imageFocus: v.imageFocus,
      madeToOrder: v.madeToOrder,
      featured: v.featured,
      position: v.position,
    };

    await audited(member, { action: current ? "ficha.editar" : "ficha.criar", target: productId, system: "supabase" }, () =>
      current ? editorial.update(current.id, data) : editorial.create({ ...data, hostingerProductId: productId }),
    );
    refresh(productId, true);
    return { ok: true, message: "Ficha do site gravada." };
  } catch (error) {
    return fail(explain(error));
  }
}

/* --------------------------------------------------------------------------
   Publicar, despublicar, arquivar
   -------------------------------------------------------------------------- */

async function setStatus(
  productId: string,
  status: "published" | "draft",
  provider: CommerceAdminProvider,
  member: AdminMember,
) {
  await audited(member, { action: status === "published" ? "produto.publicar" : "produto.despublicar", target: productId, system: "hostinger" }, () =>
    provider.setProductStatus(productId, status),
  );
}

export async function publishProduct(productId: string): Promise<ActionResult> {
  try {
    const { member, provider, editorial } = await context("produtos.publicar", productId);
    const [product, item] = await Promise.all([provider.getProduct(productId), editorial.byProductId(productId)]);
    if (!product) return fail("O produto já não existe na loja.");
    if (product.status === "archived") return fail("Restaure o produto antes de o publicar.");
    const readiness = publishReadiness(product, item);
    if (!canPublish(readiness)) {
      const missing = readiness.filter((r) => r.required && !r.ok).map((r) => r.label.toLowerCase());
      return fail(`Ainda falta: ${missing.join("; ")}.`);
    }
    await setStatus(productId, "published", provider, member);
    refresh(productId, true);
    return { ok: true, message: "Publicado. A peça aparece no site em instantes." };
  } catch (error) {
    return fail(explain(error));
  }
}

export async function unpublishProduct(productId: string): Promise<ActionResult> {
  try {
    const { member, provider } = await context("produtos.publicar", productId);
    await setStatus(productId, "draft", provider, member);
    refresh(productId, true);
    return { ok: true, message: "Despublicado. A peça saiu do site e da venda." };
  } catch (error) {
    return fail(explain(error));
  }
}

export async function archiveProduct(productId: string, archived: boolean): Promise<ActionResult> {
  try {
    const { member, provider, editorial } = await context("produtos.arquivar", productId);
    await audited(member, { action: archived ? "produto.arquivar" : "produto.restaurar", target: productId, system: "hostinger" }, () =>
      provider.setProductStatus(productId, archived ? "archived" : "draft"),
    );
    const item = await editorial.byProductId(productId);
    if (item && Boolean(item.archivedAt) !== archived) {
      await audited(member, { action: archived ? "ficha.arquivar" : "ficha.restaurar", target: productId, system: "supabase" }, () =>
        editorial.setArchived(item.id, archived),
      );
    }
    refresh(productId, true);
    return { ok: true, message: archived ? "Arquivado. Saiu do site e da venda." : "Restaurado como rascunho." };
  } catch (error) {
    return fail(explain(error));
  }
}

/** Ficha órfã (produto removido da loja fora do painel): só arquivar. */
export async function archiveOrphan(editorialId: string): Promise<ActionResult> {
  try {
    const member = await requirePermission("produtos.arquivar");
    const editorial = editorialRepository();
    await audited(member, { action: "ficha.arquivar", target: editorialId, system: "supabase" }, () =>
      editorial.setArchived(editorialId, true),
    );
    refresh(undefined, true);
    return { ok: true, message: "Ficha arquivada." };
  } catch (error) {
    return fail(explain(error));
  }
}

/* --------------------------------------------------------------------------
   Configuração do site
   -------------------------------------------------------------------------- */

export async function saveSiteSettings(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const member = await requirePermission("site.configurar");
    const showPrototypes = form.get("showPrototypes") === "on";
    await audited(member, { action: "site.configurar", target: "site_settings", system: "supabase", detail: { showPrototypes } }, () =>
      editorialRepository().updateSettings({ showPrototypes }),
    );
    refresh(undefined, true);
    return { ok: true, message: "Configuração do site gravada." };
  } catch (error) {
    return fail(explain(error));
  }
}
