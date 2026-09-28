import "server-only";
import { listProducts, listVariants, isStoreConfigured } from "@/lib/hostinger/client";
import type { HostingerProduct, HostingerVariant } from "@/lib/hostinger/types";
import { simulationEnabled } from "@/lib/simulation";
import { simulatedStorefront } from "@/lib/simulated/storefront";

/* ============================================================================
   Leitura comercial para o site — a mesma Storefront pública de sempre
   ----------------------------------------------------------------------------
   Só devolve produtos publicados no canal de venda: é isso que decide se
   uma peça do Admin aparece no site. Nenhum token entra aqui.
   ========================================================================== */

/** A Storefront devolve até 100 variantes por pedido; 5 produtos por vez dá folga. */
const PRODUCTS_PER_VARIANT_REQUEST = 5;

export type PublishedProduct = { product: HostingerProduct; variants: HostingerVariant[] };

export async function readPublishedProducts(
  productIds: string[],
  revalidate: number,
): Promise<Map<string, PublishedProduct>> {
  const wanted = new Set(productIds);
  const result = new Map<string, PublishedProduct>();
  if (wanted.size === 0) return result;

  if (simulationEnabled) {
    for (const entry of simulatedStorefront().products) {
      if (wanted.has(entry.product.id)) result.set(entry.product.id, entry);
    }
    return result;
  }

  if (!isStoreConfigured) return result;

  const products = (await listProducts({ revalidate })).filter((p) => wanted.has(p.id));
  const ids = products.map((p) => p.id);

  const variants: HostingerVariant[] = [];
  for (let i = 0; i < ids.length; i += PRODUCTS_PER_VARIANT_REQUEST) {
    variants.push(...(await listVariants(ids.slice(i, i + PRODUCTS_PER_VARIANT_REQUEST), { revalidate })));
  }

  for (const product of products) {
    result.set(product.id, {
      product,
      variants: variants.filter((v) => v.product_id === product.id),
    });
  }
  return result;
}
