import { categoryName, collectionName, pieces, type Piece } from "@/lib/data/catalogue";

/* ============================================================================
   Busca no catálogo — partilhada pelo menu lateral e pela camada de busca.
   Ignora acentos e maiúsculas; procura no nome, linha, material, pedra,
   categoria, coleção e referência.
   ========================================================================== */

export const strip = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function searchPieces(query: string, limit = 6): Piece[] {
  const term = strip(query);
  if (term.length < 2) return [];
  return pieces
    .filter((p) =>
      [
        p.name,
        p.line,
        p.material,
        p.stone ?? "",
        categoryName(p.category),
        collectionName(p.collection),
        p.reference,
      ]
        .map(strip)
        .some((field) => field.includes(term)),
    )
    .slice(0, limit);
}
