"use client";

import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { IconHeart } from "@/components/brand/Icons";
import { useStore } from "@/components/commerce/StoreProvider";
import {
  productView,
  requestProducts,
  useLiveProducts,
} from "@/components/commerce/useLiveProducts";
import { MetalDot } from "@/components/product/ProductMedia";
import { Ticker } from "@/components/motion/Ticker";
import { isSellable, variantIdFor } from "@/lib/commerce";
import { categoryName, collectionName, type Piece } from "@/lib/data/catalogue";
import type { ProductSnapshot } from "@/lib/hostinger/types";
import { price, priceFromMinorUnits } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ============================================================================
   Painel da peça — categoria, nome, preço, e o mínimo para decidir.

   Peça ligada à Hostinger: preço, promoção e estoque vêm de lá (a leitura do
   servidor serve até chegar a do navegador) e a opção escolhida resolve a
   variante que entra na sacola. Peça editorial: o preço do catálogo, e o
   caminho é o atendimento — "Consultar disponibilidade".
   ========================================================================== */

type Offer = "editorial" | "loading" | "error" | "unavailable" | "soldout" | "available";

export function ProductDetail({
  piece,
  initial = null,
}: {
  piece: Piece;
  /** Leitura do servidor (ISR) para uma peça ligada à Hostinger. */
  initial?: ProductSnapshot | null;
}) {
  const { addToBag, setBagOpen, toggleFavourite, isFavourite, ready } = useStore();
  const [option, setOption] = useState(piece.options?.values[0]);
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState<"idle" | "done">("idle");
  const doneTimer = useRef<number | undefined>(undefined);

  const favourite = ready && isFavourite(piece.slug);
  const collection = collectionName(piece.collection);

  const sellable = isSellable(piece);
  const productId = piece.commerce?.productId;
  const live = useLiveProducts(sellable && productId ? [productId] : []);
  const view = sellable && productId ? productView(live[productId], initial) : null;
  const variantId = sellable ? variantIdFor(piece, option) : undefined;
  const snapshot = variantId ? view?.variants[variantId] : undefined;

  const offer: Offer = !view
    ? "editorial"
    : snapshot
      ? snapshot.available
        ? "available"
        : "soldout"
      : view.status === "loading"
        ? "loading"
        : view.status === "error"
          ? "error"
          : "unavailable";

  /** O tecto é o estoque real, quando a Hostinger o controla. */
  const maxQuantity =
    snapshot?.manageInventory && snapshot.inventoryQuantity !== null
      ? Math.max(1, Math.min(9, snapshot.inventoryQuantity))
      : 9;

  useEffect(() => {
    setQuantity((q) => Math.min(q, maxQuantity));
  }, [maxQuantity]);

  // A sacola é local: não há pedido a esperar, por isso nada de loading
  // simulado — a peça entra e a sacola abre no mesmo gesto.
  function add() {
    if (!variantId || offer !== "available") return;
    addToBag({ slug: piece.slug, option, variantId, quantity });
    setState("done");
    setBagOpen(true);
    window.clearTimeout(doneTimer.current);
    doneTimer.current = window.setTimeout(() => setState("idle"), 2200);
  }

  useEffect(() => () => window.clearTimeout(doneTimer.current), []);

  const money = (amount: number) =>
    snapshot ? priceFromMinorUnits(amount, snapshot.decimalDigits, snapshot.currencyCode) : "—";

  const availability = piece.madeToOrder
    ? " · Sob encomenda"
    : offer === "soldout"
      ? " · Esgotado"
      : offer === "unavailable"
        ? " · Indisponível"
        : " · Pronta-entrega";

  return (
    <div>
      <p className="t-label-sm muted">
        {categoryName(piece.category)}
        {collection && ` · Coleção ${collection}`}
      </p>

      <h1 className="t-h2 mt-3">{piece.name}</h1>
      <p className="t-voice soft mt-1.5">{piece.line}</p>

      <p
        className="mt-4 font-[family-name:var(--font-sans)] text-[0.9375rem] tabular-nums tracking-[0.04em]"
        aria-busy={offer === "loading" || undefined}
      >
        {offer === "editorial" ? (
          price(piece.price)
        ) : snapshot ? (
          <>
            {snapshot.saleAmount !== null && <span className="sr-only">Preço promocional: </span>}
            {money(snapshot.effectiveAmount)}
            {snapshot.saleAmount !== null && (
              <s className="ml-3 opacity-50">
                <span className="sr-only">Preço anterior: </span>
                {money(snapshot.amount)}
              </s>
            )}
          </>
        ) : offer === "error" ? (
          "Preço indisponível de momento"
        ) : (
          "—"
        )}
      </p>
      {offer === "error" && productId && (
        <button
          type="button"
          onClick={() => void requestProducts([productId], { force: true })}
          className="t-label-sm link-nav mt-2"
        >
          Tentar novamente
        </button>
      )}
      <p className="t-label-sm muted mt-2 flex items-center gap-2">
        <MetalDot piece={piece} />
        {piece.material}
        {availability}
      </p>

      <hr className="rule mt-6" />

      <p className="t-body mt-6">{piece.description}</p>

      <dl className="mt-6 space-y-2.5">
        {piece.stone && (
          <div className="flex gap-6">
            <dt className="t-label-sm muted w-[5.5rem] shrink-0">Pedra</dt>
            <dd className="t-label-sm min-w-0 flex-1">{piece.stone}</dd>
          </div>
        )}
        <div className="flex gap-6">
          <dt className="t-label-sm muted w-[5.5rem] shrink-0">Medidas</dt>
          <dd className="t-label-sm min-w-0 flex-1">{piece.measures}</dd>
        </div>
        <div className="flex gap-6">
          <dt className="t-label-sm muted w-[5.5rem] shrink-0">Referência</dt>
          <dd className="t-label-sm min-w-0 flex-1">{piece.reference}</dd>
        </div>
      </dl>

      {/* — Opções — */}
      {piece.options && (
        <fieldset className="mt-7">
          <legend className="t-label-sm muted">{piece.options.label}</legend>
          <div className="mt-4 flex flex-wrap gap-2">
            {piece.options.values.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setOption(value)}
                aria-pressed={option === value}
                className={cn(
                  "t-label-sm h-11 min-w-11 border px-4",
                  "transition-[background-color,color,border-color] duration-(--dur-normal)",
                  option === value
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                    : "border-[var(--color-rule)] hover:border-[var(--color-ink)]",
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* — Quantidade — só quando a peça se compra online */}
      {sellable && (
        <div className="mt-7">
          <p className="t-label-sm muted">Quantidade</p>
          <div className="mt-4 inline-flex items-center border border-[var(--color-rule)]">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="grid h-11 w-11 place-items-center transition-opacity duration-(--dur-fast) hover:opacity-55 disabled:opacity-25"
              aria-label="Reduzir quantidade"
            >
              <span aria-hidden="true">−</span>
            </button>
            <span className="t-num grid w-8 place-items-center" aria-live="polite">
              <Ticker value={quantity} />
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
              className="grid h-11 w-11 place-items-center transition-opacity duration-(--dur-fast) hover:opacity-55 disabled:opacity-25"
              aria-label="Aumentar quantidade"
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
        </div>
      )}

      {/* — Acções — */}
      <div className="mt-7 flex items-stretch gap-3">
        {sellable ? (
          /* O rótulo troca no lugar — "Adicionado" entra por baixo do
             anterior; a largura do botão não muda. */
          <Button
            onClick={add}
            className="flex-1"
            disabled={offer !== "available"}
            loading={offer === "loading"}
          >
            <Ticker
              value={
                offer === "soldout"
                  ? "Esgotado"
                  : offer === "unavailable" || offer === "error"
                    ? "Indisponível"
                    : state === "done"
                      ? "Adicionado"
                      : "Adicionar à sacola"
              }
              distance={4}
            />
          </Button>
        ) : (
          <ButtonLink href="/contato" className="flex-1">
            Consultar disponibilidade
          </ButtonLink>
        )}

        <button
          type="button"
          onClick={() => toggleFavourite(piece.slug)}
          aria-pressed={favourite}
          aria-label={
            favourite ? `Remover ${piece.name} dos favoritos` : `Guardar ${piece.name} nos favoritos`
          }
          className="grid h-[3.4rem] w-[3.4rem] shrink-0 place-items-center border border-[var(--color-rule)] transition-colors duration-(--dur-normal) hover:border-[var(--color-ink)]"
        >
          <IconHeart size={18} filled={favourite} />
        </button>
      </div>

      <p className="t-label-sm muted mt-4">
        Entrega assegurada em todo o Brasil · Prazo de execução de 14 semanas para
        peças sob encomenda
      </p>
    </div>
  );
}
