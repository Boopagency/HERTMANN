"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Overlay } from "@/components/layout/Overlay";
import { ProductThumb } from "@/components/product/ProductThumb";
import { Button, ButtonLink } from "@/components/ui/Button";
import { IconMinus, IconPlus } from "@/components/brand/Icons";
import { useStore, type BagEntry } from "@/components/commerce/StoreProvider";
import {
  productView,
  readLiveProduct,
  requestProducts,
  useLiveProducts,
} from "@/components/commerce/useLiveProducts";
import { openHostedCheckout } from "@/components/commerce/checkout";
import { categoryName } from "@/lib/data/catalogue";
import { priceFromMinorUnits } from "@/lib/format";
import type { VariantSnapshot } from "@/lib/hostinger/types";
import { Ticker } from "@/components/motion/Ticker";
import { DUR, EASE, EASE_EXIT } from "@/components/motion/tokens";

/* ============================================================================
   Sacola — uma lista, um total, um botão. Nada de contagens regressivas,
   selos de urgência ou promessas de desconto.

   Movimento: o painel é o mesmo do menu (Overlay). Quantidades, subtotais
   e o total trocam no lugar (Ticker); uma linha removida recolhe em altura
   e opacidade, sem empurrar as outras de golpe.

   Preço e estoque vêm ao vivo da Hostinger e são relidos à força antes do
   checkout. O pagamento é conduzido pela Hostinger: o botão troca a sacola
   por uma sessão de checkout e entrega-lhe o navegador. Linhas de peças
   ainda não vendáveis online ficam visíveis, sob consulta, fora do total.
   ========================================================================== */

type Live = ReturnType<typeof productView>;

/** O estado comercial de uma linha, a partir da leitura ao vivo. */
function lineStatus(line: BagEntry, view: Live | undefined) {
  if (!line.sellable || !line.variantId || !view) {
    return { kind: "consult" as const, snapshot: undefined, max: 9 };
  }

  const snapshot: VariantSnapshot | undefined = view.variants[line.variantId];
  if (!snapshot) {
    return {
      kind: view.status === "ready" ? ("unavailable" as const) : view.status,
      snapshot: undefined,
      max: 9,
    };
  }

  const max =
    snapshot.manageInventory && snapshot.inventoryQuantity !== null
      ? Math.max(0, Math.min(9, snapshot.inventoryQuantity))
      : 9;

  if (!snapshot.available) return { kind: "soldout" as const, snapshot, max };
  if (line.quantity > max) return { kind: "over" as const, snapshot, max };
  return { kind: "ok" as const, snapshot, max };
}

export function BagDrawer() {
  const { bag, bagOpen, setBagOpen, bagCount, setQuantity, removeFromBag } = useStore();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "loading">("idle");
  const [notice, setNotice] = useState<string | null>(null);

  const productIds = useMemo(
    () => [...new Set(bag.flatMap((line) => (line.productId ? [line.productId] : [])))],
    [bag],
  );

  // Preço e estoque só se lêem com a sacola aberta.
  const live = useLiveProducts(bagOpen ? productIds : []);

  const lines = bag.map((line) => ({
    line,
    ...lineStatus(line, line.productId ? productView(live[line.productId]) : undefined),
  }));

  const sellable = lines.filter((l) => l.kind !== "consult");
  const consult = lines.length - sellable.length;
  const priced = sellable.every((l) => l.snapshot);
  const reference = sellable.find((l) => l.snapshot)?.snapshot;
  const total = sellable.reduce(
    (sum, l) => sum + (l.snapshot ? l.snapshot.effectiveAmount * l.line.quantity : 0),
    0,
  );
  const blocked = sellable.some((l) => l.kind !== "ok");
  const readFailed = phase === "idle" && sellable.some((l) => l.kind === "error");

  const money = (amount: number, snapshot?: VariantSnapshot) =>
    snapshot ? priceFromMinorUnits(amount, snapshot.decimalDigits, snapshot.currencyCode) : "—";

  // Ao voltar da Hostinger pelo botão "Voltar", a página pode vir da cache
  // do navegador com o botão ainda a carregar.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setPhase("idle");
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  useEffect(() => {
    if (!bagOpen) setNotice(null);
  }, [bagOpen]);

  async function finish() {
    if (phase === "loading" || sellable.length === 0) return;
    setPhase("loading");
    setNotice(null);

    // Preço e estoque relidos agora — nunca o que estava no ecrã.
    const ids = [...new Set(sellable.flatMap((l) => (l.line.productId ? [l.line.productId] : [])))];
    await requestProducts(ids, { force: true });

    const fresh = sellable.map((l) => ({
      line: l.line,
      ...lineStatus(l.line, productView(readLiveProduct(l.line.productId!))),
    }));

    if (fresh.some((l) => l.kind === "error" || l.kind === "loading")) {
      setPhase("idle");
      setNotice("Não foi possível confirmar preços e disponibilidade. Tente de novo dentro de momentos.");
      return;
    }
    if (fresh.some((l) => l.kind !== "ok")) {
      setPhase("idle");
      setNotice("Uma das peças deixou de estar disponível nesta quantidade. Ajuste a sacola para continuar.");
      return;
    }

    try {
      await openHostedCheckout(
        fresh.map((l) => ({ variant_id: l.line.variantId!, quantity: l.line.quantity })),
      );
      // O navegador segue para a Hostinger; o botão continua a carregar até lá.
    } catch {
      setPhase("idle");
      setNotice("Não foi possível abrir o pagamento. Tente de novo dentro de momentos.");
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
          <ul>
            <AnimatePresence initial={false}>
              {lines.map(({ line, kind, snapshot, max }, index) => (
                <motion.li
                  key={line.key}
                  className={index > 0 ? "overflow-hidden border-t border-[var(--color-rule-soft)]" : "overflow-hidden"}
                  initial={reduced ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1, transition: { duration: reduced ? 0 : DUR.normal, ease: EASE } }}
                  exit={{ height: 0, opacity: 0, transition: { duration: reduced ? 0 : 0.26, ease: EASE_EXIT } }}
                >
                  <div className="flex gap-4 py-5">
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
                        {kind === "consult" ? (
                          <span className="t-label-sm muted shrink-0">Sob consulta</span>
                        ) : (
                          <Ticker
                            className="t-num shrink-0"
                            value={snapshot ? money(snapshot.effectiveAmount * line.quantity, snapshot) : "—"}
                          />
                        )}
                      </div>

                      <p className="t-label-sm muted mt-1">
                        {categoryName(line.piece.category)}
                        {line.option && ` · ${line.option}`}
                        {kind === "soldout" && " · Esgotado"}
                        {kind === "unavailable" && " · Indisponível"}
                        {kind === "over" && ` · Disponível: ${max}`}
                      </p>

                      <div className="mt-auto flex items-center justify-between gap-4 pt-4">
                        <div className="flex items-center gap-1 border border-[var(--color-rule)]">
                          <button
                            type="button"
                            onClick={() => setQuantity(line.key, line.quantity - 1)}
                            className="grid h-8 w-8 place-items-center transition-opacity duration-(--dur-fast) hover:opacity-55"
                            aria-label={`Reduzir quantidade de ${line.piece.name}`}
                          >
                            <IconMinus size={14} />
                          </button>
                          <span className="t-num grid w-5 place-items-center" aria-live="polite">
                            <Ticker value={line.quantity} />
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(line.key, line.quantity + 1)}
                            className="grid h-8 w-8 place-items-center transition-opacity duration-(--dur-fast) hover:opacity-55 disabled:opacity-25"
                            disabled={line.quantity >= max}
                            aria-label={`Aumentar quantidade de ${line.piece.name}`}
                          >
                            <IconPlus size={14} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromBag(line.key)}
                          className="t-label-sm muted link-nav"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {bag.length > 0 && (
        <footer className="border-t border-[var(--color-rule)] px-[clamp(1.25rem,3vw,2.25rem)] py-6">
          <div className="flex items-baseline justify-between">
            <span className="t-label">Total</span>
            <Ticker
              className="t-h4"
              value={sellable.length > 0 && priced ? money(total, reference) : "—"}
            />
          </div>
          <p className="t-label-sm muted mt-2">
            Envio assegurado e embalagem HERTMANN incluídos.
          </p>
          {consult > 0 && (
            <p className="t-label-sm muted mt-2">
              Peças sob consulta não entram no total nem no pagamento online.
            </p>
          )}
          <Button
            className="mt-6 w-full"
            onClick={finish}
            loading={phase === "loading"}
            disabled={sellable.length === 0 || (blocked && phase !== "loading")}
          >
            Finalizar compra
          </Button>
          {notice ? (
            <p className="t-label-sm muted mt-3 text-center" role="alert">
              {notice}
            </p>
          ) : (
            readFailed && (
              <p className="t-label-sm muted mt-3 text-center" role="alert">
                Não foi possível confirmar preços e disponibilidade.{" "}
                <button
                  type="button"
                  onClick={() => void requestProducts(productIds, { force: true })}
                  className="link-underline text-[var(--color-ink)]"
                >
                  Tentar novamente
                </button>
              </p>
            )
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
