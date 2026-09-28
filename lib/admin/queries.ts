import "server-only";
import { cache } from "react";
import { resolveCommerceProvider, type AdminOrder, type AdminProduct } from "@/lib/admin/commerce";
import { editorialRepository } from "@/lib/admin/editorial";
import type { EditorialItem, SiteSettings } from "@/lib/catalog/types";

/* ============================================================================
   Leituras das páginas do painel. Tudo ao vivo: comercial da loja,
   editorial do Supabase. Uma falha de uma fonte não esconde a outra — cada
   uma volta com o seu próprio erro, para a tela dizer o que faltou.
   ========================================================================== */

export type Loaded<T> = { ok: true; data: T } | { ok: false; error: string };

async function load<T>(task: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await task() };
  } catch (error) {
    console.error("[admin:leitura]", error);
    return { ok: false, error: error instanceof Error ? error.message : "Falha de leitura." };
  }
}

export const commerce = cache(() => resolveCommerceProvider());

export type ProductRow = { product: AdminProduct; editorial: EditorialItem | null };

export type CatalogueView = {
  rows: ProductRow[];
  /** Fichas cujo produto já não existe na loja. */
  orphans: EditorialItem[];
  products: Loaded<AdminProduct[]>;
  editorial: Loaded<EditorialItem[]>;
};

export const loadCatalogue = cache(async (): Promise<CatalogueView> => {
  const resolution = commerce();
  const [products, editorial] = await Promise.all([
    resolution.ok ? load(() => resolution.provider.listProducts()) : Promise.resolve({ ok: false as const, error: resolution.reason }),
    load(() => editorialRepository().list()),
  ]);

  const items = editorial.ok ? editorial.data : [];
  const byProduct = new Map(items.map((i) => [i.hostingerProductId, i]));
  const rows = products.ok ? products.data.map((product) => ({ product, editorial: byProduct.get(product.id) ?? null })) : [];
  const known = new Set(products.ok ? products.data.map((p) => p.id) : []);
  const orphans = products.ok ? items.filter((i) => !known.has(i.hostingerProductId) && !i.archivedAt) : [];

  return { rows, orphans, products, editorial };
});

export type ProductView = {
  product: AdminProduct | null;
  editorial: Loaded<EditorialItem | null>;
  error: string | null;
};

export const loadProduct = cache(async (productId: string): Promise<ProductView> => {
  const resolution = commerce();
  if (!resolution.ok) return { product: null, editorial: { ok: true, data: null }, error: resolution.reason };

  const [product, editorial] = await Promise.all([
    load(() => resolution.provider.getProduct(productId)),
    load(() => editorialRepository().byProductId(productId)),
  ]);
  if (!product.ok) return { product: null, editorial, error: product.error };
  return { product: product.data, editorial, error: null };
});

export const loadOrders = cache(async (): Promise<Loaded<AdminOrder[]>> => {
  const resolution = commerce();
  if (!resolution.ok) return { ok: false, error: resolution.reason };
  return load(() => resolution.provider.listOrders());
});

export const loadOrder = cache(async (orderId: string): Promise<Loaded<AdminOrder | null>> => {
  const resolution = commerce();
  if (!resolution.ok) return { ok: false, error: resolution.reason };
  return load(() => resolution.provider.getOrder(orderId));
});

export const loadSiteSettings = cache(async (): Promise<Loaded<SiteSettings>> =>
  load(() => editorialRepository().settings()),
);
