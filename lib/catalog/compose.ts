import type { Piece, PieceImage } from "@/lib/data/catalogue";
import type { HostingerProduct, HostingerVariant } from "@/lib/hostinger/types";
import { variantSnapshot } from "@/lib/hostinger/client";
import { DEFAULT_OPTION } from "@/lib/commerce";
import type { EditorialItem } from "./types";

/* ============================================================================
   Composição de uma peça: ficha editorial (Supabase) + produto (Hostinger)
   ----------------------------------------------------------------------------
   Função pura — recebe o que as duas fontes disseram e devolve a `Piece`
   que os componentes do site já sabem mostrar. Nada é copiado de uma fonte
   para a outra: as opções (aro, comprimento) saem das variantes da loja, o
   preço também, e as imagens são as do produto.
   ========================================================================== */

/** URLs das imagens de um produto, pela ordem da loja, sem repetições. */
export function productImageUrls(product: HostingerProduct): string[] {
  const urls = [
    ...(product.images ?? []),
    ...(product.media ?? []),
  ].map((image) => image?.url ?? image?.src ?? null);
  if (product.thumbnail) urls.unshift(product.thumbnail);

  return [...new Set(urls.filter((url): url is string => typeof url === "string" && /^https?:\/\/|^\//.test(url)))];
}

function optionLabel(variants: HostingerVariant[]): string {
  const name = variants.flatMap((v) => v.options ?? []).find((o) => o?.name)?.name;
  return name?.trim() || "Opção";
}

function optionValue(variant: HostingerVariant): string {
  const values = (variant.options ?? [])
    .map((o) => o?.value?.trim())
    .filter((v): v is string => Boolean(v));
  return values.length > 0 ? values.join(" · ") : (variant.title?.trim() || variant.id);
}

/**
 * A peça, ou `null` quando o produto não tem nenhuma variante com preço —
 * sem preço não há o que vender nem o que mostrar.
 */
export function composePiece(
  item: EditorialItem,
  product: HostingerProduct,
  variants: HostingerVariant[],
): Piece | null {
  const priced = variants
    .map((variant) => ({ variant, snapshot: variantSnapshot(variant, product.id) }))
    .filter((v) => v.snapshot !== null);
  if (priced.length === 0) return null;

  const commerceVariants: Record<string, string> = {};
  let options: Piece["options"];

  if (priced.length === 1) {
    commerceVariants[DEFAULT_OPTION] = priced[0].variant.id;
  } else {
    const values: string[] = [];
    for (const { variant } of priced) {
      const value = optionValue(variant);
      if (value in commerceVariants) continue;
      commerceVariants[value] = variant.id;
      values.push(value);
    }
    options = { label: optionLabel(priced.map((p) => p.variant)), values };
  }

  const lowest = priced.reduce((min, p) =>
    p.snapshot!.effectiveAmount < min.snapshot!.effectiveAmount ? p : min,
  ).snapshot!;

  const name = item.displayName?.trim() || product.title;
  const [first, second] = productImageUrls(product);
  const image = (src: string | undefined, alt: string): PieceImage | null =>
    src
      ? {
          src,
          cutout: item.imageFit === "cutout",
          alt,
          ...(item.imageFocus ? { focus: item.imageFocus } : {}),
        }
      : null;

  return {
    slug: item.slug,
    name,
    category: item.category,
    collection: item.collectionSlug ?? "",
    // Só para filtros e ordenação, em reais inteiros. O preço mostrado vem
    // sempre ao vivo da loja (PiecePrice, página de produto, sacola).
    price: Math.round(lowest.effectiveAmount / 10 ** lowest.decimalDigits),
    line: item.line,
    description: item.description,
    material: item.material,
    ...(item.stone ? { stone: item.stone } : {}),
    measures: item.measures,
    reference: item.reference ?? "",
    drawing: item.drawing,
    image: image(first, name),
    imageAlt: image(second, `${name}, segunda vista`),
    madeToOrder: item.madeToOrder,
    ...(options ? { options } : {}),
    featured: item.featured,
    commerce: { productId: product.id, variants: commerceVariants },
  };
}
