"use client";

import { useState } from "react";
import Link from "next/link";
import { Overlay } from "@/components/layout/Overlay";
import { PieceFigure } from "@/components/product/PieceFigure";
import { Button, ButtonLink } from "@/components/ui/Button";
import { IconMinus, IconPlus } from "@/components/brand/Icons";
import { useStore, type BagEntry } from "@/components/commerce/StoreProvider";
import { categoryName } from "@/lib/data/catalogue";
import { priceFromMinorUnits } from "@/lib/format";
import { checkoutReturnUrls, createCheckout } from "@/lib/hostinger/client";

/* ============================================================================
   Sacola — uma lista, um total, um botão. Nada de contagens regressivas,
   selos de urgência ou promessas de desconto.

   O pagamento é conduzido pela Hostinger: o botão troca a sacola local por
   uma sessão de checkout e entrega-lhe o navegador.
   ========================================================================== */

export function BagDrawer() {
  const {
    bag,
    bagOpen,
    setBagOpen,
    bagCount,
    bagTotal,
    bagDecimalDigits,
    bagCurrencyCode,
    checkoutItems,
    setQuantity,
    removeFromBag,
  } = useStore();

  const [checkout, setCheckout] = useState<"idle" | "loading" | "error">("idle");

  const money = (amount: number) =>
    priceFromMinorUnits(amount, bagDecimalDigits, bagCurrencyCode);

  /** O tecto da linha é o stock real, quando a Hostinger o controla. */
  const maxFor = (line: BagEntry) =>
    line.snapshot?.manageInventory && typeof line.snapshot.inventoryQuantity === "number"
      ? Math.max(1, Math.min(9, line.snapshot.inventoryQuantity))
      : 9;

  async function finish() {
    if (checkout === "loading" || checkoutItems.length === 0) return;
    setCheckout("loading");
    try {
      const session = await createCheckout(checkoutItems, checkoutReturnUrls());
      window.location.assign(session.url);
    } catch {
      setCheckout("error");
    }
  }

  return (
    <Overlay
      open={bagOpen}
      onClose={() => setBagOpen(false)}
      from="right"
      label="Sacola"
      panelClassName="right-0 top-0 h-[100dvh] w-full max-w-[30rem] bg-[var(--color-paper)] flex flex-col"
    >
      <header className="px-[clamp(1.25rem,3vw,2.25rem)] pt-[clamp(1.5rem,3vw,2.25rem)]">
        <p className="t-label">Sacola</p>
        <p className="t-label-sm muted mt-1">
          {bagCount === 0
            ? "Ainda vazia"
            : `${bagCount} ${bagCount === 1 ? "peça" : "peças"}`}
        </p>
        <hr className="rule mt-6" />
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
              <li key={`${line.variantId}-${line.option ?? ""}`} className="flex gap-5 py-6">
                <Link
                  href={`/produto/${line.slug}`}
                  onClick={() => setBagOpen(false)}
                  className="w-[5.5rem] shrink-0"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <PieceFigure piece={line.piece} sizes="88px" still showReference={false} />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/produto/${line.slug}`}
                      onClick={() => setBagOpen(false)}
                      className="t-h4 link-nav"
                    >
                      {line.piece.name}
                    </Link>
                    <span className="t-num shrink-0">
                      {line.snapshot ? money(line.snapshot.effectiveAmount * line.quantity) : "—"}
                    </span>
                  </div>

                  <p className="t-label-sm muted mt-1">
                    {categoryName(line.piece.category)}
                    {line.option && ` · ${line.option}`}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-4 pt-4">
                    <div className="flex items-center gap-1 border border-[var(--color-rule)]">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.variantId, line.quantity - 1, line.option)}
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
                        onClick={() => setQuantity(line.variantId, line.quantity + 1, line.option)}
                        className="grid h-8 w-8 place-items-center transition-opacity duration-300 hover:opacity-55 disabled:opacity-25"
                        disabled={line.quantity >= maxFor(line)}
                        aria-label={`Aumentar quantidade de ${line.piece.name}`}
                      >
                        <IconPlus size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromBag(line.variantId, line.option)}
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
            <span className="t-h4">{bagTotal === null ? "—" : money(bagTotal)}</span>
          </div>
          <p className="t-label-sm muted mt-2">
            Envio assegurado e embalagem HERTMANN incluídos.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={finish}
            loading={checkout === "loading"}
            disabled={checkoutItems.length === 0}
          >
            Finalizar compra
          </Button>

          {checkout === "error" && (
            <p className="t-label-sm muted mt-3 text-center" role="status">
              Não foi possível abrir o checkout. Tente de novo dentro de momentos.
            </p>
          )}
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
