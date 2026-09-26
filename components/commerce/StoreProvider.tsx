"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import type { Piece } from "@/lib/data/catalogue";
import { findPiece } from "@/lib/data/homologation";
import { isSellable, variantIdFor } from "@/lib/commerce";
import type { CheckoutItem } from "@/lib/hostinger/types";

/* ============================================================================
   Estado de loja — sacola e favoritos.
   Persistido no dispositivo de quem visita.

   A identidade comercial de uma linha é o `variantId` da Hostinger; o `slug`
   viaja junto para resolver o que se mostra — nome, fotografia, ligação.
   Preço e estoque nunca são guardados: lêem-se ao vivo (useLiveProducts).

   Uma linha sem `variantId` é de uma peça ainda não vendável online, ou de
   uma sacola anterior à integração. Fica na sacola, visível, sob consulta, e
   não entra no checkout. Nenhuma linha é apagada em silêncio.
   ========================================================================== */

export type BagLine = {
  variantId?: string;
  slug: string;
  option?: string;
  quantity: number;
};

export type BagEntry = BagLine & {
  key: string;
  piece: Piece;
  /** Ligada a uma variante da Hostinger — entra no checkout. */
  sellable: boolean;
  productId?: string;
};

type State = {
  bag: BagLine[];
  favourites: string[];
};

type Action =
  | { type: "hydrate"; state: State }
  | { type: "add"; line: BagLine }
  | { type: "remove"; key: string }
  | { type: "quantity"; key: string; quantity: number }
  | { type: "checked-out"; items: CheckoutItem[] }
  | { type: "favourite"; slug: string }
  | { type: "clear" };

const KEY = "hertmann:store:v2";
const LEGACY_KEY = "hertmann:store:v1";
const MAX_QUANTITY = 9;

const empty: State = { bag: [], favourites: [] };

/** Identidade da linha: a variante, ou peça e opção quando ainda não há variante. */
export function lineKey(line: Pick<BagLine, "variantId" | "slug" | "option">): string {
  return line.variantId ? `v:${line.variantId}` : `s:${line.slug}:${line.option ?? ""}`;
}

const clamp = (quantity: number) => Math.max(0, Math.min(MAX_QUANTITY, quantity));

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "add": {
      const key = lineKey(action.line);
      if (state.bag.some((l) => lineKey(l) === key)) {
        return {
          ...state,
          bag: state.bag.map((l) =>
            lineKey(l) === key ? { ...l, quantity: clamp(l.quantity + action.line.quantity) } : l,
          ),
        };
      }
      return { ...state, bag: [...state.bag, { ...action.line, quantity: clamp(action.line.quantity) }] };
    }

    case "remove":
      return { ...state, bag: state.bag.filter((l) => lineKey(l) !== action.key) };

    case "quantity":
      return {
        ...state,
        bag: state.bag
          .map((l) => (lineKey(l) === action.key ? { ...l, quantity: clamp(action.quantity) } : l))
          .filter((l) => l.quantity > 0),
      };

    case "checked-out": {
      // Sai da sacola só o que foi a checkout, e na quantidade que foi.
      const sent = new Map<string, number>();
      for (const item of action.items) {
        sent.set(item.variant_id, (sent.get(item.variant_id) ?? 0) + item.quantity);
      }
      return {
        ...state,
        bag: state.bag
          .map((l) =>
            l.variantId && sent.has(l.variantId)
              ? { ...l, quantity: l.quantity - sent.get(l.variantId)! }
              : l,
          )
          .filter((l) => l.quantity > 0),
      };
    }

    case "favourite":
      return {
        ...state,
        favourites: state.favourites.includes(action.slug)
          ? state.favourites.filter((s) => s !== action.slug)
          : [...state.favourites, action.slug],
      };

    case "clear":
      /* Devolver o mesmo estado quando já está vazia evita render em ciclo. */
      return state.bag.length === 0 ? state : { ...state, bag: [] };

    default:
      return state;
  }
}

/* --------------------------------------------------------------------------
   Persistência — leitura tolerante e migração do esquema v1
   -------------------------------------------------------------------------- */

function readQuantity(raw: unknown): number {
  return typeof raw === "number" && Number.isFinite(raw)
    ? Math.max(1, Math.min(MAX_QUANTITY, Math.round(raw)))
    : 1;
}

/**
 * Uma linha guardada — v2, ou v1 (`{ slug, option, quantity }`). Nenhuma é
 * descartada por não ser vendável: sem variante, fica sob consulta. Se a peça
 * entretanto ficou ligada à Hostinger, a linha ganha a variante e passa a
 * comprável.
 */
function readLine(raw: unknown): BagLine[] {
  if (!raw || typeof raw !== "object") return [];
  const { variantId, slug, option, quantity } = raw as Record<string, unknown>;
  if (typeof slug !== "string" || slug.length === 0) return [];

  const line: BagLine = {
    slug,
    option: typeof option === "string" ? option : undefined,
    quantity: readQuantity(quantity),
  };

  if (typeof variantId === "string" && variantId.length > 0) {
    line.variantId = variantId;
  } else {
    const piece = findPiece(slug);
    const linked = piece && isSellable(piece) ? variantIdFor(piece, line.option) : undefined;
    if (linked) line.variantId = linked;
  }

  return [line];
}

/** Duas linhas que passam a ter a mesma identidade juntam-se numa só. */
function mergeLines(lines: BagLine[]): BagLine[] {
  const byKey = new Map<string, BagLine>();
  for (const line of lines) {
    const key = lineKey(line);
    const existing = byKey.get(key);
    byKey.set(key, existing ? { ...existing, quantity: clamp(existing.quantity + line.quantity) } : line);
  }
  return [...byKey.values()];
}

function readFavourites(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === "string") : [];
}

function parseState(raw: string | null): State | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const { bag, favourites } = parsed as Record<string, unknown>;
    return {
      bag: mergeLines(Array.isArray(bag) ? bag.flatMap(readLine) : []),
      favourites: readFavourites(favourites),
    };
  } catch {
    return null;
  }
}

/**
 * Leitura pura: nada é apagado aqui. A chave v1 só sai no efeito de
 * persistência, depois de a v2 ficar escrita — se saísse já, a segunda
 * montagem do StrictMode leria um estado vazio e a sacola migrada perdia-se.
 */
function readPersistedState(): State {
  try {
    return (
      parseState(window.localStorage.getItem(KEY)) ??
      parseState(window.localStorage.getItem(LEGACY_KEY)) ??
      empty
    );
  } catch {
    /* armazenamento indisponível — a loja funciona à mesma nesta sessão */
    return empty;
  }
}

/* --------------------------------------------------------------------------
   Contexto
   -------------------------------------------------------------------------- */

type StoreContext = {
  /** Linhas resolvidas com a peça correspondente. */
  bag: BagEntry[];
  bagCount: number;
  favourites: string[];
  favouriteCount: number;
  ready: boolean;
  addToBag: (line: { slug: string; option?: string; variantId: string; quantity?: number }) => void;
  removeFromBag: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  /** Retira da sacola o que seguiu para um checkout concluído. */
  removeCheckedOut: (items: CheckoutItem[]) => void;
  clearBag: () => void;
  toggleFavourite: (slug: string) => void;
  isFavourite: (slug: string) => boolean;
  bagOpen: boolean;
  setBagOpen: (open: boolean) => void;
};

const Ctx = createContext<StoreContext | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, empty);
  const [ready, setReady] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);

  useEffect(() => {
    dispatch({ type: "hydrate", state: readPersistedState() });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      window.localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* sem persistência: seguimos em memória */
    }
  }, [state, ready]);

  const bag = useMemo<BagEntry[]>(
    () =>
      state.bag.flatMap((line) => {
        // Uma peça que já não existe fica guardada, mas não se mostra.
        const piece = findPiece(line.slug);
        if (!piece) return [];

        const sellable =
          Boolean(line.variantId) &&
          isSellable(piece) &&
          Object.values(piece.commerce.variants).includes(line.variantId!);

        return [
          {
            ...line,
            key: lineKey(line),
            piece,
            sellable,
            productId: sellable ? piece.commerce?.productId : undefined,
          },
        ];
      }),
    [state.bag],
  );

  const value = useMemo<StoreContext>(() => {
    return {
      bag,
      bagCount: bag.reduce((n, l) => n + l.quantity, 0),
      favourites: state.favourites,
      favouriteCount: state.favourites.length,
      ready,
      addToBag: ({ slug, option, variantId, quantity = 1 }) =>
        dispatch({ type: "add", line: { slug, option, variantId, quantity } }),
      removeFromBag: (key) => dispatch({ type: "remove", key }),
      setQuantity: (key, quantity) => dispatch({ type: "quantity", key, quantity }),
      removeCheckedOut: (items) => dispatch({ type: "checked-out", items }),
      clearBag: () => dispatch({ type: "clear" }),
      toggleFavourite: (slug) => dispatch({ type: "favourite", slug }),
      isFavourite: (slug) => state.favourites.includes(slug),
      bagOpen,
      setBagOpen,
    };
  }, [bag, state.favourites, ready, bagOpen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore precisa de estar dentro de <StoreProvider>");
  return ctx;
}
