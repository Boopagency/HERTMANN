import {
  collectionBySlug,
  collections,
  isNewPiece,
  pieceMetal,
  pieceStone,
  type Piece,
} from "@/lib/data/catalogue";

/* ============================================================================
   Filtros e ordenação do catálogo
   ----------------------------------------------------------------------------
   O estado vive na URL, para que cada selecção seja partilhável e para que
   os atalhos do menu ("Novidades", "Disponíveis", "Presentes") sejam
   simplesmente endereços:

     /joias?novidades=1
     /joias?entrega=pronta
     /joias?preco=ate-10000
     /joias/aneis?material=branco&ordem=preco-asc
   ========================================================================== */

export type FacetKey = "colecao" | "material" | "pedra" | "preco" | "entrega";

export type Facet = {
  key: FacetKey;
  label: string;
  options: { value: string; label: string }[];
  test: (piece: Piece, value: string) => boolean;
};

const PRICE: Record<string, (price: number) => boolean> = {
  "ate-10000": (p) => p <= 10000,
  "10000-20000": (p) => p > 10000 && p <= 20000,
  "acima-20000": (p) => p > 20000,
};

export const facets: Facet[] = [
  {
    key: "colecao",
    label: "Coleção",
    options: collections.map((c) => ({ value: c.slug, label: c.name })),
    test: (piece, value) => piece.collection === value,
  },
  {
    key: "material",
    label: "Material",
    options: [
      { value: "amarelo", label: "Ouro amarelo" },
      { value: "branco", label: "Ouro branco" },
    ],
    test: (piece, value) => pieceMetal(piece) === value,
  },
  {
    key: "pedra",
    label: "Pedra",
    options: [
      { value: "diamante", label: "Diamante" },
      { value: "safira", label: "Safira" },
      { value: "sem-pedra", label: "Ouro puro" },
    ],
    test: (piece, value) => pieceStone(piece) === value,
  },
  {
    key: "preco",
    label: "Preço",
    options: [
      { value: "ate-10000", label: "Até R$ 10 mil" },
      { value: "10000-20000", label: "R$ 10 – 20 mil" },
      { value: "acima-20000", label: "Acima de R$ 20 mil" },
    ],
    test: (piece, value) => PRICE[value]?.(piece.price) ?? true,
  },
  {
    key: "entrega",
    label: "Entrega",
    options: [
      { value: "pronta", label: "Pronta-entrega" },
      { value: "encomenda", label: "Sob encomenda" },
    ],
    test: (piece, value) => (value === "encomenda" ? !!piece.madeToOrder : !piece.madeToOrder),
  },
];

export type SortKey = "destaques" | "novidades" | "preco-asc" | "preco-desc";

export const sorts: { value: SortKey; label: string }[] = [
  { value: "destaques", label: "Destaques" },
  { value: "novidades", label: "Novidades" },
  { value: "preco-asc", label: "Preço, crescente" },
  { value: "preco-desc", label: "Preço, decrescente" },
];

export type Selection = {
  values: Partial<Record<FacetKey, string[]>>;
  novidades: boolean;
  ordem: SortKey;
};

type ParamsLike = { get(name: string): string | null };

export function readSelection(params: ParamsLike | null): Selection {
  const values: Selection["values"] = {};
  for (const facet of facets) {
    const raw = params?.get(facet.key);
    if (!raw) continue;
    const valid = raw.split(",").filter((v) => facet.options.some((o) => o.value === v));
    if (valid.length) values[facet.key] = valid;
  }
  const ordem = params?.get("ordem") as SortKey | null;
  return {
    values,
    novidades: params?.get("novidades") === "1",
    ordem: ordem && sorts.some((s) => s.value === ordem) ? ordem : "destaques",
  };
}

export function writeSelection(selection: Selection): string {
  const params = new URLSearchParams();
  if (selection.novidades) params.set("novidades", "1");
  for (const facet of facets) {
    const v = selection.values[facet.key];
    if (v?.length) params.set(facet.key, v.join(","));
  }
  if (selection.ordem !== "destaques") params.set("ordem", selection.ordem);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function activeCount(selection: Selection): number {
  return (
    Object.values(selection.values).reduce((n, v) => n + (v?.length ?? 0), 0) +
    (selection.novidades ? 1 : 0)
  );
}

export function applySelection(list: Piece[], selection: Selection): Piece[] {
  const filtered = list.filter((piece) => {
    if (selection.novidades && !isNewPiece(piece)) return false;
    return facets.every((facet) => {
      const chosen = selection.values[facet.key];
      if (!chosen?.length) return true;
      return chosen.some((value) => facet.test(piece, value));
    });
  });

  const order = new Map(list.map((p, i) => [p.slug, i]));
  const year = (p: Piece) => Number(collectionBySlug(p.collection)?.year ?? 0);

  return [...filtered].sort((a, b) => {
    switch (selection.ordem) {
      case "preco-asc":
        return a.price - b.price;
      case "preco-desc":
        return b.price - a.price;
      case "novidades":
        return year(b) - year(a) || order.get(a.slug)! - order.get(b.slug)!;
      default:
        return (
          Number(!!b.featured) - Number(!!a.featured) || order.get(a.slug)! - order.get(b.slug)!
        );
    }
  });
}

/**
 * Título da página quando se chega por um atalho do menu — "Novidades",
 * "Disponíveis", "Presentes". Qualquer outra combinação mantém o título base.
 */
export function presetTitle(selection: Selection): string | null {
  const keys = Object.keys(selection.values) as FacetKey[];
  if (selection.novidades && keys.length === 0) return "Novidades";
  if (!selection.novidades && keys.length === 1) {
    const [key] = keys;
    const values = selection.values[key]!;
    if (key === "entrega" && values.length === 1 && values[0] === "pronta") return "Disponíveis";
    if (key === "preco" && values.length === 1 && values[0] === "ate-10000") return "Presentes";
  }
  return null;
}
