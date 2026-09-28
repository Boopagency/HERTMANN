"use client";

import { createContext, useContext, useMemo } from "react";
import { pieces as prototypes, type Piece } from "@/lib/data/catalogue";
import { findPiece } from "@/lib/data/homologation";

/* ============================================================================
   Catálogo do site no navegador — busca, menu e sacola
   ----------------------------------------------------------------------------
   O servidor compõe o catálogo (lib/catalog/site.ts) e passa para aqui só o
   que não está no código: as peças vindas do Admin e se as de protótipo
   continuam visíveis. Sem Admin configurado, `extra` é vazio e nada muda.
   ========================================================================== */

type CatalogueContext = {
  pieces: Piece[];
  find: (slug: string) => Piece | undefined;
};

function build(extra: Piece[], showPrototypes: boolean): CatalogueContext {
  const pieces = [...extra, ...(showPrototypes ? prototypes : [])];
  return {
    pieces,
    find: (slug) =>
      pieces.find((p) => p.slug === slug) ?? findPiece(slug, { prototypes: false }),
  };
}

const Ctx = createContext<CatalogueContext>(build([], true));

export function CatalogueProvider({
  extra,
  showPrototypes,
  children,
}: {
  extra: Piece[];
  showPrototypes: boolean;
  children: React.ReactNode;
}) {
  const value = useMemo(() => build(extra, showPrototypes), [extra, showPrototypes]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalogue(): CatalogueContext {
  return useContext(Ctx);
}
