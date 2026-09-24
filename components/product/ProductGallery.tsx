import { FadeImage } from "@/components/ui/FadeImage";
import { PieceDrawing } from "@/components/brand/Marks";
import { PieceImg } from "@/components/product/ProductMedia";
import type { Piece } from "@/lib/data/catalogue";
import { cn } from "@/lib/utils";

/* ============================================================================
   Galeria da peça — a peça primeiro, em grande; depois o desenho de ateliê
   que lhe deu origem e o modo como chega a casa. Quando existir packshot,
   ele abre a galeria e a fotografia da peça usada vem a seguir.

   No telemóvel, as vistas deslizam na horizontal — o painel de compra fica
   logo abaixo da primeira imagem.
   ========================================================================== */

const slide = "plate relative w-[84vw] shrink-0 snap-start aspect-[4/5] md:w-auto md:shrink";

export function ProductGallery({ piece }: { piece: Piece }) {
  const views = [piece.packshot, piece.image, piece.imageAlt].filter(
    (v): v is NonNullable<typeof v> => Boolean(v),
  );
  const [first, ...rest] = views;

  return (
    <div
      className={cn(
        "no-scrollbar -mx-[var(--spacing-gutter)] flex snap-x snap-mandatory gap-2 overflow-x-auto px-[var(--spacing-gutter)] scroll-px-[var(--spacing-gutter)]",
        "md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0",
      )}
      aria-label={`Imagens de ${piece.name}`}
    >
      {/* I — a peça */}
      <figure className={cn(slide, "md:col-span-2")}>
        {first ? (
          <PieceImg image={first} priority sizes="(max-width: 768px) 84vw, 58vw" inset="12%" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <PieceDrawing
              variant={piece.drawing}
              className="h-[64%] w-auto text-[var(--color-ink)] opacity-70"
            />
          </div>
        )}
        <figcaption className="t-num absolute bottom-3 left-3 text-[var(--color-paper)] opacity-70 mix-blend-difference">
          {piece.reference}
        </figcaption>
      </figure>

      {rest.map((view) => (
        <figure key={view.src} className={cn(slide, "md:col-span-2")}>
          <PieceImg image={view} sizes="(max-width: 768px) 84vw, 58vw" inset="12%" />
        </figure>
      ))}

      {/* II — o desenho */}
      <figure className={cn(slide, "plate-studio-paper md:aspect-square")}>
        <div className="absolute inset-0 grid place-items-center">
          <PieceDrawing
            variant={piece.drawing}
            className="h-[62%] w-auto text-[var(--color-ink)] opacity-60"
          />
        </div>
        <figcaption className="t-label-sm muted absolute bottom-3 left-3">
          Desenho de ateliê
        </figcaption>
      </figure>

      {/* III — como chega */}
      <figure className={cn(slide, "plate-studio md:aspect-square")}>
        <FadeImage
          src="/images/piece-bag.png"
          alt="Sacola e cartão HERTMANN, tal como a peça é entregue"
          fill
          sizes="(max-width: 768px) 84vw, 29vw"
          className="object-contain p-[12%]"
        />
        <figcaption className="t-label-sm muted absolute bottom-3 left-3">Como chega</figcaption>
      </figure>
    </div>
  );
}
