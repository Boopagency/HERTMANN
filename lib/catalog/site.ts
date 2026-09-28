import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { pieces as prototypes, type Piece } from "@/lib/data/catalogue";
import { findPiece } from "@/lib/data/homologation";
import { composePiece } from "./compose";
import { editorialConfigured, readSiteEditorial } from "./editorial-source";
import { readPublishedProducts } from "./storefront-source";
import { SITE_CATALOGUE_TAG } from "./types";

/* ============================================================================
   Catálogo do site público
   ----------------------------------------------------------------------------
   Junta as três fontes numa lista de `Piece`, o formato que os componentes
   do site já conhecem:

   1. as peças de protótipo de lib/data/catalogue.ts — enquanto a
      configuração do site as mostrar;
   2. as fichas editoriais do Supabase cujo produto a Hostinger devolve
      como publicado — só aparece o que as duas fontes confirmam.

   Sem Supabase configurado, devolve o catálogo de protótipo sem nenhum
   pedido: o site fica exactamente como antes, e as páginas continuam
   estáticas.

   Com Supabase, a composição fica em cache com a tag "site-catalogue": o
   Admin revalida-a ao publicar, despublicar ou editar uma ficha; e, como
   rede de segurança para mudanças feitas fora do Admin (hPanel), ela
   refaz-se sozinha a cada 5 minutos.
   ========================================================================== */

export const CATALOGUE_REVALIDATE_SECONDS = 300;

export type SiteCatalogue = {
  /** Tudo o que o site mostra, pela ordem de apresentação. */
  pieces: Piece[];
  /** Só as peças vindas do Admin (Supabase + Hostinger). */
  extra: Piece[];
  showPrototypes: boolean;
};

const STATIC_CATALOGUE: SiteCatalogue = {
  pieces: prototypes,
  extra: [],
  showPrototypes: true,
};

async function compose(): Promise<{ extra: Piece[]; showPrototypes: boolean }> {
  const { items, settings } = await readSiteEditorial();
  if (items.length === 0) return { extra: [], showPrototypes: settings.showPrototypes };

  // Uma falha da Storefront sobe: nunca se compõe um catálogo sem as peças
  // por não se ter conseguido ler a loja (ver editorial-source.ts).
  const published = await readPublishedProducts(
    items.map((item) => item.hostingerProductId),
    CATALOGUE_REVALIDATE_SECONDS,
  );

  const taken = new Set(prototypes.map((p) => p.slug));
  const extra: Piece[] = [];
  for (const item of items) {
    if (taken.has(item.slug)) continue; // o Admin já o impede; aqui só por defesa
    const entry = published.get(item.hostingerProductId);
    if (!entry) continue; // rascunho, arquivado ou inexistente na loja
    const piece = composePiece(item, entry.product, entry.variants);
    if (!piece) continue;
    taken.add(piece.slug);
    extra.push(piece);
  }

  return { extra, showPrototypes: settings.showPrototypes };
}

const cachedCompose = unstable_cache(compose, ["site-catalogue"], {
  tags: [SITE_CATALOGUE_TAG],
  revalidate: CATALOGUE_REVALIDATE_SECONDS,
});

/** Uma leitura por pedido, partilhada por layout, página e metadados. */
export const getSiteCatalogue = cache(async (): Promise<SiteCatalogue> => {
  if (!editorialConfigured) return STATIC_CATALOGUE;

  const { extra, showPrototypes } = await cachedCompose();
  return {
    pieces: [...extra, ...(showPrototypes ? prototypes : [])],
    extra,
    showPrototypes,
  };
});

/** Peça pelo endereço — do catálogo do site ou, em homologação, a peça técnica. */
export async function findSitePiece(slug: string): Promise<Piece | undefined> {
  const { pieces } = await getSiteCatalogue();
  return pieces.find((p) => p.slug === slug) ?? findPiece(slug, { prototypes: false });
}
