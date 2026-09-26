import type { Piece, PieceCommerce } from "@/lib/data/catalogue";
import { isStoreConfigured } from "@/lib/hostinger/client";

/* ============================================================================
   Peça editorial × produto comercial
   ----------------------------------------------------------------------------
   Uma peça só é vendável online quando está ligada a um produto da Hostinger
   (campo `commerce`) e a loja está configurada. As restantes continuam a ser
   apresentadas como hoje e remetem para o atendimento — a migração faz-se
   peça a peça, sem quebrar o catálogo visual.
   ========================================================================== */

/** Chave da variante de uma peça sem opções. */
export const DEFAULT_OPTION = "default";

export type SellablePiece = Piece & { commerce: PieceCommerce };

export function isSellable(piece: Piece): piece is SellablePiece {
  return isStoreConfigured && Boolean(piece.commerce);
}

/**
 * A variante da Hostinger para a opção escolhida. Uma peça com opções exige
 * a opção; uma peça sem opções usa a variante `default`.
 */
export function variantIdFor(piece: Piece, option?: string): string | undefined {
  const variants = piece.commerce?.variants;
  if (!variants) return undefined;
  if (piece.options) return option ? variants[option] : undefined;
  return variants[DEFAULT_OPTION];
}
