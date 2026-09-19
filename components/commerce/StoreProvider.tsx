"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { pieceBySlug, type Piece } from "@/lib/data/catalogue";
import { getVariantSnapshots, isStoreConfigured } from "@/lib/hostinger/client";
import type { CheckoutItem, VariantSnapshot } from "@/lib/hostinger/types";

/* ============================================================================
   Estado de loja — sacola e favoritos.
   Persistido no dispositivo de quem visita; nunca sai do navegador.

   A identidade comercial de uma linha é o `variantId` da Hostinger. O `slug`
   viaja junto apenas para resolver o que se mostra: nome, prancha, ligação.
   Preço e stock nunca são guardados — são lidos do catálogo ao vivo.
   ========================================================================== */

export type BagLine = {
  variantId: string;
  slug: string;
  option?: string;
  quantity: number;
};

export type BagEntry = BagLine & {
  piece: Piece;
  /** Leitura ao vivo. `null` enquanto carrega ou se a API não respondeu. */
  snapshot: VariantSnapshot | null;
};

type State = {
  bag: BagLine[];
  favourites: string[];
};

type Action =
  | { type: "hydrate"; state: State }
  | { type: "add"; line: BagLine }
  | { type: "remove"; variantId: string; option?: string }
  | { type: "quantity"; variantId: string; option?: string; quantity: number }
  | { type: "favourite"; slug: string }
  | { type: "clear" };

const KEY = "hertmann:store:v2";
const LEGACY_KEY = "hertmann:store:v1";

const empty: State = { bag: [], favourites: [] };

const same = (line: BagLine, variantId: string, option?: string) =>
  line.variantId === variantId && (line.option ?? "") === (option ?? "");

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "add": {
      const existing = state.bag.find((l) =>
        same(l, action.line.variantId, action.line.option),
      );
      if (existing) {
        return {
          ...state,
          bag: state.bag.map((l) =>
            same(l, action.line.variantId, action.line.option)
              ? { ...l, quantity: Math.min(9, l.quantity + action.line.quantity) }
              : l,
          ),
        };
      }
      return { ...state, bag: [...state.bag, action.line] };
    }

    case "remove":
      return {
        ...state,
        bag: state.bag.filter((l) => !same(l, action.variantId, action.option)),
      };

    case "quantity":
      return {
        ...state,
        bag: state.bag
          .map((l) =>
            same(l, action.variantId, action.option)
              ? { ...l, quantity: Math.max(0, Math.min(9, action.quantity)) }
              : l,
          )
          .filter((l) => l.quantity > 0),
      };

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
   Persistência — leitura tolerante e migração do esquema antigo
   -------------------------------------------------------------------------- */

function readLine(raw: unknown): BagLine[] {
  if (!raw || typeof raw !== "object") return [];
  const { variantId, slug, option, quantity } = raw as Record<string, unknown>;
  if (typeof variantId !== "string" || typeof slug !== "string") return [];
  if (!pieceBySlug(slug)) return [];
  return [
    {
      variantId,
      slug,
      option: typeof option === "string" ? option : undefined,
      quantity: typeof quantity === "number" ? Math.max(1, Math.min(9, quantity)) : 1,
    },
  ];
}

/**
 * O esquema antigo identificava a linha pelo slug. Só sobrevive a linha cuja
 * peça já tem variante na Hostinger — o resto deixou de ser vendável e é
 * descartado em silêncio. Os favoritos, esses, continuam a ser do slug.
 */
function migrateLegacyLine(raw: unknown): BagLine[] {
  if (!raw || typeof raw !== "object") return [];
  const { slug, option, quantity } = raw as Record<string, unknown>;
  if (typeof slug !== "string") return [];

  const piece = pieceBySlug(slug);
  if (!piece?.hostingerVariantId) return [];

  return [
    {
      variantId: piece.hostingerVariantId,
      slug: piece.slug,
      option: typeof option === "string" ? option : undefined,
      quantity: typeof quantity === "number" ? Math.max(1, Math.min(9, quantity)) : 1,
    },
  ];
}

function readFavourites(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === "string") : [];
}

function readPersistedState(): State {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        bag: Array.isArray(parsed.bag) ? parsed.bag.flatMap(readLine) : [],
        favourites: readFavourites(parsed.favourites),
      };
    }

    /* Leitura pura: a chave antiga só é apagada depois de a nova ficar escrita,
       senão uma segunda montagem (StrictMode) leria já um estado vazio. */
    const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Record<string, unknown>;
      return {
        bag: Array.isArray(legacy.bag) ? legacy.bag.flatMap(migrateLegacyLine) : [],
        favourites: readFavourites(legacy.favourites),
      };
    }
  } catch {
    /* armazenamento indisponível — a loja funciona à mesma nesta sessão */
  }

  return empty;
}

/* --------------------------------------------------------------------------
   Contexto
   -------------------------------------------------------------------------- */

type StoreContext = {
  /** Linhas resolvidas com a peça e com a leitura ao vivo de preço e stock. */
  bag: BagEntry[];
  bagCount: number;
  /** Total em centavos. `null` enquanto os preços ao vivo não chegarem. */
  bagTotal: number | null;
  bagDecimalDigits: number;
  bagCurrencyCode: string;
  /** Itens prontos para o checkout da Hostinger. */
  checkoutItems: CheckoutItem[];
  favourites: string[];
  favouriteCount: number;
  ready: boolean;
  addToBag: (line: { variantId: string; slug: string; option?: string; quantity?: number }) => void;
  removeFromBag: (variantId: string, option?: string) => void;
  setQuantity: (variantId: string, quantity: number, option?: string) => void;
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
  const [snapshots, setSnapshots] = useState<Record<string, VariantSnapshot>>({});

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

  /* O preço da sacola nunca vem do que foi guardado — relê-se do catálogo. */
  const lineCount = state.bag.length;
  useEffect(() => {
    if (!ready || lineCount === 0 || !isStoreConfigured) return;

    const controller = new AbortController();
    getVariantSnapshots({ signal: controller.signal })
      .then(setSnapshots)
      .catch(() => {
        /* sacola continua utilizável; o total fica por apurar */
      });

    return () => controller.abort();
  }, [ready, lineCount]);

  const bag = useMemo<BagEntry[]>(
    () =>
      state.bag.flatMap((line) => {
        const piece = pieceBySlug(line.slug);
        if (!piece) return [];
        return [{ ...line, piece, snapshot: snapshots[line.variantId] ?? null }];
      }),
    [state.bag, snapshots],
  );

  const bagTotal = useMemo(() => {
    let total = 0;
    for (const line of bag) {
      if (!line.snapshot) return null;
      total += line.snapshot.effectiveAmount * line.quantity;
    }
    return total;
  }, [bag]);

  const reference = bag.find((line) => line.snapshot)?.snapshot ?? null;

  const value = useMemo<StoreContext>(
    () => ({
      bag,
      bagCount: bag.reduce((n, l) => n + l.quantity, 0),
      bagTotal,
      bagDecimalDigits: reference?.decimalDigits ?? 2,
      bagCurrencyCode: reference?.currencyCode ?? "BRL",
      checkoutItems: bag.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
      favourites: state.favourites,
      favouriteCount: state.favourites.length,
      ready,
      addToBag: ({ variantId, slug, option, quantity = 1 }) =>
        dispatch({ type: "add", line: { variantId, slug, option, quantity } }),
      removeFromBag: (variantId, option) => dispatch({ type: "remove", variantId, option }),
      setQuantity: (variantId, quantity, option) =>
        dispatch({ type: "quantity", variantId, option, quantity }),
      clearBag: () => dispatch({ type: "clear" }),
      toggleFavourite: (slug) => dispatch({ type: "favourite", slug }),
      isFavourite: (slug) => state.favourites.includes(slug),
      bagOpen,
      setBagOpen,
    }),
    [bag, bagTotal, reference, state.favourites, ready, bagOpen],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore precisa de estar dentro de <StoreProvider>");
  return ctx;
}
