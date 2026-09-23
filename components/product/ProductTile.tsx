"use client";

import Link from "next/link";
import { useStore } from "@/components/commerce/StoreProvider";
import { IconHeart } from "@/components/brand/Icons";
import { MetalDot, PieceImg, PieceSketch, tileImages } from "@/components/product/ProductMedia";
import type { Piece } from "@/lib/data/catalogue";
import { price } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ============================================================================
   Tile de peça — vitrines e grelha
   ----------------------------------------------------------------------------
   Quadrado, sem moldura, sem sombra, sem botão. Por baixo: a amostra do
   metal e o nome, ao centro; o preço, mais pequeno. O hover troca a
   fotografia (packshot → peça usada) ou, quando só há uma, aproxima-a
   3,5 %. O favorito aparece no canto e não pede atenção.
   ========================================================================== */

export function ProductTile({
  piece,
  sizes = "(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 16vw",
  priority,
  className,
}: {
  piece: Piece;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const { toggleFavourite, isFavourite, ready } = useStore();
  const favourite = ready && isFavourite(piece.slug);
  const { primary, secondary } = tileImages(piece);

  return (
    <article className={cn("group relative", className)}>
      <Link
        href={`/produto/${piece.slug}`}
        className="block"
        aria-label={`${piece.name} — ${piece.line}, ${price(piece.price)}`}
      >
        <div className="plate relative aspect-square w-full">
          {primary ? (
            <PieceImg
              image={primary}
              sizes={sizes}
              priority={priority}
              className={cn(
                "transition-transform duration-[1200ms] [transition-timing-function:var(--ease-editorial)]",
                !secondary && "group-hover:scale-[1.035]",
              )}
            />
          ) : (
            <PieceSketch piece={piece} />
          )}

          {secondary && (
            <PieceImg
              image={secondary}
              sizes={sizes}
              className="opacity-0 transition-opacity duration-700 [transition-timing-function:var(--ease-editorial)] group-hover:opacity-100"
            />
          )}
        </div>

        <div className="mt-3 flex flex-col items-center px-1 text-center">
          <h3 className="t-name flex items-center justify-center gap-[0.55em]">
            <MetalDot piece={piece} />
            <span>{piece.name}</span>
          </h3>
          <p className="t-price mt-1">{price(piece.price)}</p>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => toggleFavourite(piece.slug)}
        aria-pressed={favourite}
        aria-label={
          favourite ? `Remover ${piece.name} dos favoritos` : `Guardar ${piece.name} nos favoritos`
        }
        className={cn(
          "tap absolute right-1.5 top-1.5 z-10 grid h-9 w-9 place-items-center",
          "transition-opacity duration-500 [transition-timing-function:var(--ease-editorial)]",
          primary && !primary.cutout ? "text-[var(--color-paper)]" : "text-[var(--color-ink)]",
          favourite
            ? "opacity-100"
            : "opacity-0 focus-visible:opacity-100 group-hover:opacity-80 hover:!opacity-100",
        )}
      >
        <IconHeart size={16} filled={favourite} />
      </button>
    </article>
  );
}
