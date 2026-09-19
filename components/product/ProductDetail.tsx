"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { IconHeart } from "@/components/brand/Icons";
import { useStore } from "@/components/commerce/StoreProvider";
import { categoryName, collectionName, type Piece } from "@/lib/data/catalogue";
import type { VariantSnapshot } from "@/lib/hostinger/types";
import { price, priceFromMinorUnits } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ============================================================================
   Painel da peça — categoria, nome, preço, e o mínimo para decidir.

   Quando a peça está ligada à Hostinger, o preço e o stock vêm de lá. As
   restantes peças mantêm o preço do catálogo e remetem para atendimento.
   ========================================================================== */

export function ProductDetail({
  piece,
  commerce,
}: {
  piece: Piece;
  commerce?: VariantSnapshot | null;
}) {
  const { addToBag, setBagOpen, toggleFavourite, isFavourite, ready } = useStore();
  const [option, setOption] = useState(piece.options?.values[0]);
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const favourite = ready && isFavourite(piece.slug);

  const variantId = piece.hostingerVariantId;
  /** Só se recusa a venda quando há leitura ao vivo a dizê-lo. */
  const soldOut = Boolean(commerce && !commerce.available);
  const maxQuantity =
    commerce?.manageInventory && typeof commerce.inventoryQuantity === "number"
      ? Math.max(1, Math.min(9, commerce.inventoryQuantity))
      : 9;

  async function add() {
    if (!variantId || state === "loading" || soldOut) return;
    setState("loading");
    await new Promise((resolve) => setTimeout(resolve, 550));
    addToBag({ variantId, slug: piece.slug, option, quantity });
    setState("done");
    setBagOpen(true);
    window.setTimeout(() => setState("idle"), 2200);
  }

  return (
    <div>
      <p className="t-label-sm muted">
        {categoryName(piece.category)} · Coleção {collectionName(piece.collection)}
      </p>

      <h1 className="t-h1 mt-4">{piece.name}</h1>
      <p className="t-label-sm muted mt-4">{piece.line}</p>

      {commerce ? (
        <p className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="t-h4">
            {priceFromMinorUnits(
              commerce.effectiveAmount,
              commerce.decimalDigits,
              commerce.currencyCode,
            )}
          </span>
          {commerce.saleAmount !== null && (
            <span className="t-label-sm muted line-through">
              {priceFromMinorUnits(commerce.amount, commerce.decimalDigits, commerce.currencyCode)}
            </span>
          )}
        </p>
      ) : (
        <p className="t-h4 mt-8">{price(piece.price)}</p>
      )}

      {soldOut && <p className="t-label-sm muted mt-3">Esgotado de momento.</p>}

      <hr className="rule mt-8" />

      <p className="t-body mt-8">{piece.description}</p>

      <dl className="mt-8 space-y-3">
        <div className="flex gap-6">
          <dt className="t-label-sm muted w-[5.5rem] shrink-0">Material</dt>
          <dd className="t-label-sm min-w-0 flex-1">{piece.material}</dd>
        </div>
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
        <fieldset className="mt-10">
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
                  "transition-[background-color,color,border-color] duration-500",
                  "[transition-timing-function:var(--ease-editorial)]",
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
      <div className="mt-10">
        <p className="t-label-sm muted">Quantidade</p>
        <div className="mt-4 inline-flex items-center border border-[var(--color-rule)]">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="grid h-11 w-11 place-items-center transition-opacity duration-300 hover:opacity-55 disabled:opacity-25"
            aria-label="Reduzir quantidade"
          >
            <span aria-hidden="true">−</span>
          </button>
          <span className="t-num w-8 text-center" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            disabled={quantity >= maxQuantity}
            className="grid h-11 w-11 place-items-center transition-opacity duration-300 hover:opacity-55 disabled:opacity-25"
            aria-label="Aumentar quantidade"
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>

      {/* — Acções — */}
      <div className="mt-10 flex items-stretch gap-3">
        {variantId ? (
          <Button
            onClick={add}
            loading={state === "loading"}
            disabled={soldOut}
            className="flex-1"
          >
            {soldOut ? "Esgotado" : state === "done" ? "Adicionado" : "Adicionar à sacola"}
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
          className="grid h-[3.4rem] w-[3.4rem] shrink-0 place-items-center border border-[var(--color-rule)] transition-colors duration-500 [transition-timing-function:var(--ease-editorial)] hover:border-[var(--color-ink)]"
        >
          <IconHeart size={18} filled={favourite} />
        </button>
      </div>

      <p className="t-label-sm muted mt-5">
        Entrega assegurada em todo o Brasil · Prazo de execução de 14 semanas para
        peças sob encomenda
      </p>
    </div>
  );
}
