"use client";

import Link from "next/link";
import { Overlay } from "@/components/layout/Overlay";
import { ProductThumb } from "@/components/product/ProductThumb";
import { Button, ButtonLink } from "@/components/ui/Button";
import { IconMinus, IconPlus } from "@/components/brand/Icons";
import { useStore } from "@/components/commerce/StoreProvider";
import { categoryName } from "@/lib/data/catalogue";
import { price } from "@/lib/format";

/* ============================================================================
   Sacola — uma lista, um total, um botão. Nada de contagens regressivas,
   selos de urgência ou promessas de desconto.
   ========================================================================== */

export function BagDrawer() {
  const { bag, bagOpen, setBagOpen, bagCount, bagTotal, setQuantity, removeFromBag } = useStore();

  return (
    <Overlay
      open={bagOpen}
      onClose={() => setBagOpen(false)}
      from="right"
      label="Sacola"
      panelClassName="right-0 top-0 h-[100dvh] w-full max-w-[30rem] bg-[var(--color-paper)] flex flex-col"
    >
      <header className="flex h-[var(--header-h)] shrink-0 items-center border-b border-[var(--color-rule)] px-[clamp(1.25rem,3vw,2.25rem)]">
        <p className="t-label">Sacola</p>
        <p className="t-label-sm muted ml-3">
          {bagCount === 0
            ? "Ainda vazia"
            : `${bagCount} ${bagCount === 1 ? "peça" : "peças"}`}
        </p>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-[clamp(1.25rem,3vw,2.25rem)]">
        {bag.length === 0 ? (
          <div className="flex h-full flex-col justify-center py-16">
            <p className="t-h3">A sua sacola aguarda.</p>
            <p className="t-body mt-4 max-w-[26ch]">
              As peças que guardar ficam aqui, entre visitas.
            </p>
            <ButtonLink
              href="/joias"
              variant="line"
              arrow
              className="mt-8 self-start"
              onClick={() => setBagOpen(false)}
            >
              Ver as joias
            </ButtonLink>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-rule-soft)]">
            {bag.map((line) => (
              <li key={`${line.slug}-${line.option ?? ""}`} className="flex gap-4 py-5">
                <Link
                  href={`/produto/${line.slug}`}
                  onClick={() => setBagOpen(false)}
                  className="w-[5.5rem] shrink-0"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <ProductThumb piece={line.piece} sizes="88px" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/produto/${line.slug}`}
                      onClick={() => setBagOpen(false)}
                      className="t-name link-nav"
                    >
                      {line.piece.name}
                    </Link>
                    <span className="t-num shrink-0">{price(line.piece.price * line.quantity)}</span>
                  </div>

                  <p className="t-label-sm muted mt-1">
                    {categoryName(line.piece.category)}
                    {line.option && ` · ${line.option}`}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-4 pt-4">
                    <div className="flex items-center gap-1 border border-[var(--color-rule)]">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.slug, line.quantity - 1, line.option)}
                        className="grid h-8 w-8 place-items-center transition-opacity duration-300 hover:opacity-55"
                        aria-label={`Reduzir quantidade de ${line.piece.name}`}
                      >
                        <IconMinus size={14} />
                      </button>
                      <span className="t-num w-5 text-center" aria-live="polite">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.slug, line.quantity + 1, line.option)}
                        className="grid h-8 w-8 place-items-center transition-opacity duration-300 hover:opacity-55 disabled:opacity-25"
                        disabled={line.quantity >= 9}
                        aria-label={`Aumentar quantidade de ${line.piece.name}`}
                      >
                        <IconPlus size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromBag(line.slug, line.option)}
                      className="t-label-sm muted link-nav"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {bag.length > 0 && (
        <footer className="border-t border-[var(--color-rule)] px-[clamp(1.25rem,3vw,2.25rem)] py-6">
          <div className="flex items-baseline justify-between">
            <span className="t-label">Total</span>
            <span className="t-h4">{price(bagTotal)}</span>
          </div>
          <p className="t-label-sm muted mt-2">
            Envio assegurado e embalagem HERTMANN incluídos.
          </p>
          <Button className="mt-6 w-full" onClick={() => setBagOpen(false)}>
            Finalizar compra
          </Button>
          <p className="t-label-sm muted mt-4 text-center">
            Prefere falar connosco?{" "}
            <Link
              href="/contato"
              onClick={() => setBagOpen(false)}
              className="link-underline text-[var(--color-ink)]"
            >
              Atendimento privado
            </Link>
          </p>
        </footer>
      )}
    </Overlay>
  );
}
