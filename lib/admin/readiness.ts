import type { AdminProduct } from "@/lib/admin/commerce/types";
import type { EditorialItem } from "@/lib/catalog/types";

/* ============================================================================
   Pronto para publicar? — a mesma regra na interface e no servidor
   ========================================================================== */

export type ReadinessItem = { key: string; label: string; ok: boolean; required: boolean };

export function publishReadiness(product: AdminProduct, editorial: EditorialItem | null): ReadinessItem[] {
  const priced = product.variants.some((v) => v.price > 0);
  return [
    { key: "ficha", label: "Ficha do site criada (endereço e categoria)", ok: Boolean(editorial && !editorial.archivedAt), required: true },
    { key: "preco", label: "Pelo menos uma variante com preço", ok: priced, required: true },
    { key: "linha", label: "Linha curta preenchida", ok: Boolean(editorial?.line.trim()), required: false },
    { key: "descricao", label: "Descrição do site preenchida", ok: Boolean(editorial?.description.trim()), required: false },
    { key: "imagem", label: "Pelo menos uma imagem (sem ela, o site mostra o desenho de ateliê)", ok: product.images.length > 0, required: false },
  ];
}

export function canPublish(items: ReadinessItem[]): boolean {
  return items.every((i) => i.ok || !i.required);
}

export type SitePresence =
  | { state: "live"; slug: string }
  | { state: "draft" }
  | { state: "archived" }
  | { state: "missing-editorial"; published: boolean };

/** Como o produto aparece (ou não) no site — as duas fontes têm de confirmar. */
export function sitePresence(product: AdminProduct, editorial: EditorialItem | null): SitePresence {
  if (product.status === "archived" || editorial?.archivedAt) return { state: "archived" };
  if (!editorial) return { state: "missing-editorial", published: product.status === "published" };
  if (product.status === "published") return { state: "live", slug: editorial.slug };
  return { state: "draft" };
}

export function totalStock(product: AdminProduct): number | null {
  const tracked = product.variants.filter((v) => v.manageInventory);
  if (tracked.length === 0) return null;
  return tracked.reduce((n, v) => n + (v.inventoryQuantity ?? 0), 0);
}

export function priceRange(product: AdminProduct): { min: number; max: number } | null {
  const amounts = product.variants.map((v) => v.salePrice ?? v.price).filter((n) => n > 0);
  if (amounts.length === 0) return null;
  return { min: Math.min(...amounts), max: Math.max(...amounts) };
}

/** Estoque baixo: controlado e com 2 unidades ou menos. */
export const LOW_STOCK = 2;
