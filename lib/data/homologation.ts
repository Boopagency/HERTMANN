import { pieceBySlug, type Piece } from "@/lib/data/catalogue";
import { isStoreConfigured } from "@/lib/hostinger/client";

/* ============================================================================
   Homologação técnica da integração com a Hostinger
   ----------------------------------------------------------------------------
   Uma peça fora do catálogo, ligada ao produto de teste da loja, para validar
   no Preview a leitura da Storefront API, a sacola e o checkout (Test
   Payment) sem tocar no catálogo visual: não aparece em vitrines, busca,
   menu nem sitemap, e a página não é indexada.

   Só existe com a loja configurada e NEXT_PUBLIC_HOSTINGER_HOMOLOGATION=true
   — e nunca em produção, nem que a variável lá esteja.

   O produto de teste não é uma peça HERTMANN: existe apenas para homologar.
   ========================================================================== */

export const homologationEnabled =
  isStoreConfigured &&
  process.env.NEXT_PUBLIC_HOSTINGER_HOMOLOGATION === "true" &&
  process.env.NEXT_PUBLIC_VERCEL_ENV !== "production";

const homologationPiece: Piece = {
  slug: "homologacao-hostinger",
  name: "Homologação",
  category: "aneis",
  collection: "",
  // Não usado: numa peça ligada, o preço vem sempre da Hostinger.
  price: 0,
  line: "Produto de teste da Hostinger — não é uma peça HERTMANN",
  description:
    "Página técnica da integração: preço, promoção e estoque lidos da Hostinger, sacola, checkout e retorno. Existe apenas em Preview e em desenvolvimento.",
  material: "Produto de teste",
  measures: "—",
  reference: "Homologação",
  drawing: "solitaire",
  image: null,
  commerce: {
    // "Anel Solitário de Prata com Zircônias" — produto de teste da loja Hertmann.
    productId: "prod_01M2XN4RWHN3YSHPJJMMRBF6SD",
    variants: { default: "variant_01M2XN4RY2MTVB57FTFBQ3BNM7" },
  },
};

export function isHomologationPiece(piece: Piece): boolean {
  return piece.slug === homologationPiece.slug;
}

/** Peça do catálogo ou, quando a homologação está ligada, a peça técnica. */
export function findPiece(slug: string): Piece | undefined {
  return (
    pieceBySlug(slug) ??
    (homologationEnabled && slug === homologationPiece.slug ? homologationPiece : undefined)
  );
}
