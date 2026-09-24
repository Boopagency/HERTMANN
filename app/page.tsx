import type { Metadata } from "next";
import { HomeHero } from "@/components/sections/HomeHero";
import { EditorialPair } from "@/components/sections/EditorialPair";
import { HouseNote } from "@/components/sections/HouseNote";
import { ProductRail } from "@/components/product/ProductRail";
import { pieceBySlug, type Piece } from "@/lib/data/catalogue";
import { home } from "@/lib/data/editorial";

export const metadata: Metadata = {
  title: "HERTMANN — Alta joalheria desde 1948",
  description:
    "Joias executadas à mão em ateliê próprio, em Curitiba. Ouro 18k, pedras seleccionadas uma a uma, peças desenhadas para atravessar gerações.",
  alternates: { canonical: "/" },
};

const resolve = (slugs: string[]): Piece[] =>
  slugs.map((slug) => pieceBySlug(slug)).filter((p): p is Piece => Boolean(p));

/* ============================================================================
   Home — produto, editorial, produto, editorial, produto, serviço.
   Uma experiência contínua: cada bloco encosta no seguinte; a mudança faz-se
   pela fotografia, pelo fundo e pela grelha, nunca por espaço vazio.
   ========================================================================== */

export default function HomePage() {
  return (
    <>
      {/* 01 — Campanha */}
      <HomeHero />

      {/* 02 — Produto, imediatamente */}
      <ProductRail
        id="selecao"
        title={home.selection.title}
        pieces={resolve(home.selection.pieces)}
        priority
      />

      {/* 03 — Editorial 50/50 */}
      <EditorialPair chapters={home.pairOne} mobile="stack" />

      {/* 04 — Editorial + produto em escala */}
      <EditorialPair chapters={home.pairTwo} mobile="stack" />

      {/* 05 — Produto */}
      <ProductRail
        id="desejadas"
        title={home.desired.title}
        pieces={resolve(home.desired.pieces)}
      />

      {/* 06 — Editorial 50/50: categoria + serviço */}
      <EditorialPair chapters={home.pairThree} mobile="split" />

      {/* 07 — A casa, condensada */}
      <HouseNote />
    </>
  );
}
