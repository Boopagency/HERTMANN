"use client";

import { useLiveProducts, productView } from "@/components/commerce/useLiveProducts";
import { isSellable } from "@/lib/commerce";
import type { Piece } from "@/lib/data/catalogue";
import { price, priceFromMinorUnits } from "@/lib/format";

/* ============================================================================
   Preço de uma peça nas vitrines — tiles, busca, menu
   ----------------------------------------------------------------------------
   Uma só regra para toda a loja, para que uma página nunca mostre o preço da
   Hostinger enquanto outra mostra o do catálogo para a mesma peça:

   - peça ligada à Hostinger → o preço ao vivo (o menor entre as variantes,
     com "A partir de" quando diferem); "—" enquanto não chega ou se falhar;
   - peça editorial → o preço do catálogo, exactamente como sempre.
   ========================================================================== */

export function usePiecePrice(piece: Piece): string {
  const sellable = isSellable(piece);
  const productId = piece.commerce?.productId;
  const live = useLiveProducts(sellable && productId ? [productId] : []);

  if (!sellable) return price(piece.price);

  const { variants } = productView(live[piece.commerce.productId]);
  const snapshots = Object.values(piece.commerce.variants)
    .map((variantId) => variants[variantId])
    .filter((snapshot) => snapshot !== undefined);

  if (snapshots.length === 0) return "—";

  const lowest = snapshots.reduce((a, b) => (b.effectiveAmount < a.effectiveAmount ? b : a));
  const label = priceFromMinorUnits(
    lowest.effectiveAmount,
    lowest.decimalDigits,
    lowest.currencyCode,
  );

  return snapshots.some((s) => s.effectiveAmount !== lowest.effectiveAmount)
    ? `A partir de ${label}`
    : label;
}

export function PiecePrice({ piece }: { piece: Piece }) {
  return <>{usePiecePrice(piece)}</>;
}
