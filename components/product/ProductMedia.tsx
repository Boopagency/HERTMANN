import Image from "next/image";
import { PieceDrawing } from "@/components/brand/Marks";
import { metalName, pieceMetal, type Piece, type PieceImage } from "@/lib/data/catalogue";
import { cn } from "@/lib/utils";

/* ============================================================================
   Imagem de peça
   ----------------------------------------------------------------------------
   A regra de toda a loja: se a peça tem packshot, é ele que aparece — a
   joia centrada sobre a névoa de estúdio, com respiro — e a fotografia da
   peça usada revela-se no hover. Enquanto o packshot não existe, a melhor
   fotografia disponível ocupa o tile em sangria, enquadrada pela joia
   (`focus`). Nunca uma fotografia pequena dentro de uma caixa cinzenta.
   ========================================================================== */

export function tileImages(piece: Piece): {
  primary: PieceImage | null;
  secondary: PieceImage | null;
} {
  if (piece.packshot) return { primary: piece.packshot, secondary: piece.image ?? null };
  return { primary: piece.image, secondary: piece.imageAlt ?? null };
}

export function PieceImg({
  image,
  sizes,
  priority,
  className,
  inset = "13%",
}: {
  image: PieceImage;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Respiro à volta de uma joia recortada. */
  inset?: string;
}) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn(image.cutout ? "object-contain" : "object-cover", className)}
      style={image.cutout ? { padding: inset } : { objectPosition: image.focus ?? "50% 50%" }}
    />
  );
}

/** Sem fotografia nenhuma: o desenho de ateliê que deu origem à peça. */
export function PieceSketch({ piece, className }: { piece: Piece; className?: string }) {
  return (
    <div className={cn("absolute inset-0 grid place-items-center", className)}>
      <PieceDrawing
        variant={piece.drawing}
        still
        className="h-[62%] w-auto text-[var(--color-ink)] opacity-70"
      />
    </div>
  );
}

/** Amostra de metal — a cor do ouro, num ponto de 7 px. */
export function MetalDot({ piece, className }: { piece: Piece; className?: string }) {
  const metal = pieceMetal(piece);
  return (
    <span
      className={cn("inline-block h-[7px] w-[7px] shrink-0 rounded-full", className)}
      style={{
        background:
          metal === "amarelo"
            ? "radial-gradient(circle at 35% 30%, #f3e6bd 0%, #d9bb74 55%, #b8964f 100%)"
            : "radial-gradient(circle at 35% 30%, #ffffff 0%, #d8dadb 55%, #aeb2b5 100%)",
        boxShadow: "inset 0 0 0 0.5px rgba(5, 29, 65, 0.22)",
      }}
      title={metalName[metal]}
      role="img"
      aria-label={metalName[metal]}
    />
  );
}
