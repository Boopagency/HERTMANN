import { PieceImg, PieceSketch, tileImages } from "@/components/product/ProductMedia";
import type { Piece } from "@/lib/data/catalogue";
import { cn } from "@/lib/utils";

/** Miniatura quadrada — busca, menu e sacola. A mesma regra do tile. */
export function ProductThumb({
  piece,
  className,
  sizes = "96px",
}: {
  piece: Piece;
  className?: string;
  sizes?: string;
}) {
  const { primary } = tileImages(piece);
  return (
    <span className={cn("plate relative block aspect-square", className)}>
      {primary ? (
        <PieceImg image={primary} sizes={sizes} inset="10%" />
      ) : (
        <PieceSketch piece={piece} />
      )}
    </span>
  );
}
