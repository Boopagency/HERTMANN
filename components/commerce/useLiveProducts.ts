"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getProductSnapshot, isStoreConfigured } from "@/lib/hostinger/client";
import type { ProductSnapshot, VariantSnapshot } from "@/lib/hostinger/types";

/* ============================================================================
   Catálogo comercial ao vivo, no navegador
   ----------------------------------------------------------------------------
   Preço, promoção e estoque lidos da Storefront API e partilhados por todas
   as superfícies — página de produto, vitrines, busca, menu, sacola — numa
   cache de página: cada produto é pedido uma vez, relido passado um minuto,
   e relido à força antes do checkout. Nada disto é guardado no dispositivo.
   ========================================================================== */

export type LiveStatus = "loading" | "ready" | "error";

export type LiveProduct = {
  status: LiveStatus;
  variants: Record<string, VariantSnapshot>;
  /** Momento da última leitura bem-sucedida (ms); 0 se ainda não houve. */
  at: number;
};

type State = Record<string, LiveProduct>;

const FRESH_MS = 60_000;
const EMPTY: State = {};

let state: State = EMPTY;
const listeners = new Set<() => void>();
const inflight = new Map<string, Promise<void>>();

function update(productId: string, next: LiveProduct) {
  state = { ...state, [productId]: next };
  listeners.forEach((listener) => listener());
}

function load(productId: string): Promise<void> {
  const running = inflight.get(productId);
  if (running) return running;

  const previous = state[productId];
  update(productId, {
    status: "loading",
    variants: previous?.variants ?? {},
    at: previous?.at ?? 0,
  });

  const task = getProductSnapshot(productId)
    .then((snapshot) =>
      update(productId, { status: "ready", variants: snapshot.variants, at: Date.now() }),
    )
    .catch(() =>
      update(productId, {
        status: "error",
        variants: previous?.variants ?? {},
        at: previous?.at ?? 0,
      }),
    )
    .finally(() => inflight.delete(productId));

  inflight.set(productId, task);
  return task;
}

/**
 * Pede os produtos em falta ou desactualizados. Com `force`, relê todos —
 * esperando primeiro por uma leitura em curso, que pode ser anterior à
 * mudança que motivou o pedido. Nunca rejeita: o resultado fica no estado.
 */
export function requestProducts(
  productIds: string[],
  { force = false }: { force?: boolean } = {},
): Promise<void> {
  if (!isStoreConfigured) return Promise.resolve();

  const now = Date.now();
  const tasks = [...new Set(productIds)].map((id) => {
    const running = inflight.get(id);
    if (force) return running ? running.then(() => load(id)) : load(id);
    if (running) return running;

    const entry = state[id];
    const fresh = entry?.status === "ready" && now - entry.at < FRESH_MS;
    return fresh ? Promise.resolve() : load(id);
  });

  return Promise.all(tasks).then(() => undefined);
}

/** Leitura síncrona do estado actual — para validar depois de um `await`. */
export function readLiveProduct(productId: string): LiveProduct | undefined {
  return state[productId];
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Estado ao vivo; pede os produtos indicados ao montar e quando mudam. */
export function useLiveProducts(productIds: string[]): State {
  const key = [...new Set(productIds)].sort().join(",");
  const snapshot = useSyncExternalStore(subscribe, () => state, () => EMPTY);

  useEffect(() => {
    if (key) void requestProducts(key.split(","));
  }, [key]);

  return snapshot;
}

/**
 * O que mostrar de um produto: a leitura do navegador quando chega; até lá,
 * a do servidor (ISR), se existir.
 */
export function productView(
  entry: LiveProduct | undefined,
  initial?: ProductSnapshot | null,
): { status: LiveStatus; variants: Record<string, VariantSnapshot> } {
  if (entry?.status === "ready") return entry;
  if (initial) return { status: "ready", variants: initial.variants };
  return { status: entry?.status ?? "loading", variants: entry?.variants ?? {} };
}
