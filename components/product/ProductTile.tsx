"use client";

import Link, { useLinkStatus } from "next/link";
import { useStore } from "@/components/commerce/StoreProvider";
import { usePiecePrice } from "@/components/commerce/PiecePrice";
import { IconHeart } from "@/components/brand/Icons";
import { MetalDot, PieceImg, PieceSketch, tileImages } from "@/components/product/ProductMedia";
import type { Piece } from "@/lib/data/catalogue";
import { cn } from "@/lib/utils";

/* ============================================================================
   Tile de peça — vitrines e grelha
   ----------------------------------------------------------------------------
   Quadrado, sem moldura, sem sombra, sem botão. Por baixo: a amostra do
   metal e o nome, ao centro; o preço, mais pequeno. O hover aproxima a
   fotografia 2 % e, quando há segunda imagem, funde-a por cima
   (packshot → peça usada) em 560 ms. O cartão nunca se levanta: sem
   sombra, sem moldura. Ao clicar, a imagem esmaece de imediato — resposta
   ao toque que não atrasa a navegação. O favorito aparece no canto e não
   pede atenção.
   ========================================================================== */

/** Enquanto a rota da peça carrega, a imagem fica ligeiramente velada. */
function PendingVeil() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 bg-[var(--color-paper)] transition-opacity duration-(--dur-fast)",
        pending ? "opacity-30" : "opacity-0",
      )}
    />
  );
}

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
  const priceLabel = usePiecePrice(piece);

  return (
    <article className={cn("group relative", className)}>
      <Link
        href={`/produto/${piece.slug}`}
        className="block"
        aria-label={`${piece.name} — ${piece.line}, ${priceLabel}`}
      >
        <div className="plate relative aspect-square w-full transition-opacity duration-(--dur-fast) group-active:opacity-80">
          {/* Uma só camada escala — as duas imagens aproximam-se juntas. */}
          <div className="absolute inset-0 transition-transform duration-(--dur-slow) group-hover:scale-[1.02]">
            {primary ? (
              <PieceImg image={primary} sizes={sizes} priority={priority} />
            ) : (
              <PieceSketch piece={piece} />
            )}

            {secondary && (
              <PieceImg
                image={secondary}
                sizes={sizes}
                className="opacity-0 transition-opacity duration-(--dur-slow) group-hover:opacity-100"
              />
            )}
          </div>
          <PendingVeil />
        </div>

        <div className="mt-3 flex flex-col items-center px-1 text-center">
          <h3 className="t-name flex items-center justify-center gap-[0.55em]">
            <MetalDot piece={piece} />
            <span>{piece.name}</span>
          </h3>
          <p className="t-price mt-1">{priceLabel}</p>
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
          "transition-opacity duration-(--dur-normal)",
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
