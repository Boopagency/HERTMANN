"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconHeart } from "@/components/brand/Icons";
import { useStore } from "@/components/commerce/StoreProvider";
import { MetalDot } from "@/components/product/ProductMedia";
import { Ticker } from "@/components/motion/Ticker";
import { categoryName, collectionName, type Piece } from "@/lib/data/catalogue";
import { price } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ============================================================================
   Painel da peça — categoria, nome, preço, e o mínimo para decidir.
   ========================================================================== */

export function ProductDetail({ piece }: { piece: Piece }) {
  const { addToBag, setBagOpen, toggleFavourite, isFavourite, ready } = useStore();
  const [option, setOption] = useState(piece.options?.values[0]);
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState<"idle" | "done">("idle");
  const doneTimer = useRef<number | undefined>(undefined);

  const favourite = ready && isFavourite(piece.slug);

  // A sacola é local: não há pedido a esperar, por isso nada de loading
  // simulado — a peça entra e a sacola abre no mesmo gesto.
  function add() {
    addToBag(piece.slug, option, quantity);
    setState("done");
    setBagOpen(true);
    window.clearTimeout(doneTimer.current);
    doneTimer.current = window.setTimeout(() => setState("idle"), 2200);
  }

  useEffect(() => () => window.clearTimeout(doneTimer.current), []);

  return (
    <div>
      <p className="t-label-sm muted">
        {categoryName(piece.category)} · Coleção {collectionName(piece.collection)}
      </p>

      <h1 className="t-h2 mt-3">{piece.name}</h1>
      <p className="t-voice soft mt-1.5">{piece.line}</p>

      <p className="mt-4 font-[family-name:var(--font-sans)] text-[0.9375rem] tabular-nums tracking-[0.04em]">
        {price(piece.price)}
      </p>
      <p className="t-label-sm muted mt-2 flex items-center gap-2">
        <MetalDot piece={piece} />
        {piece.material}
        {piece.madeToOrder ? " · Sob encomenda" : " · Pronta-entrega"}
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

      {/* — Quantidade — */}
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
            onClick={() => setQuantity((q) => Math.min(9, q + 1))}
            disabled={quantity >= 9}
            className="grid h-11 w-11 place-items-center transition-opacity duration-(--dur-fast) hover:opacity-55 disabled:opacity-25"
            aria-label="Aumentar quantidade"
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>

      {/* — Acções — */}
      <div className="mt-7 flex items-stretch gap-3">
        {/* O rótulo troca no lugar — "Adicionado" entra por baixo do
            anterior; a largura do botão não muda. */}
        <Button onClick={add} className="flex-1">
          <Ticker value={state === "done" ? "Adicionado" : "Adicionar à sacola"} distance={4} />
        </Button>

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
