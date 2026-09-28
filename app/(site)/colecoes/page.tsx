import type { Metadata } from "next";
import { EditorialPair } from "@/components/sections/EditorialPair";
import { ProductRail } from "@/components/product/ProductRail";
import { collections, pieces, type Collection } from "@/lib/data/catalogue";
import { collectionMedia, type Chapter } from "@/lib/data/editorial";

export const metadata: Metadata = {
  title: "Coleções",
  description:
    "Arquétipo, Vertente, Noturno e Solstício — as quatro coleções da HERTMANN, entre peças permanentes e alta joalheria sob encomenda.",
  alternates: { canonical: "/colecoes" },
};

const chapter = (collection: Collection): Chapter => ({
  media: collectionMedia[collection.slug][0],
  title: collection.name,
  link: { label: `${collection.year} · ${collection.line}`, href: `/colecoes/${collection.slug}` },
  place: "bottom",
  tone: "light",
});

export default function CollectionsPage() {
  const [a, b, c, d] = collections.map(chapter);

  return (
    <>
      <div className="shell-plp flex flex-wrap items-end justify-between gap-x-10 gap-y-3 pb-[clamp(1.25rem,2.2vw,2rem)] pt-[calc(var(--header-h)+clamp(1.75rem,3.3vw,3rem))]">
        <div>
          <p className="t-label-sm muted">A casa</p>
          <h1 className="t-h1 mt-2">Coleções</h1>
        </div>
        <p className="t-voice soft max-w-[46ch] md:text-right">
          A casa não trabalha por estações. Cada coleção é uma família de peças com uma construção
          comum — e todas continuam em produção.
        </p>
      </div>

      <EditorialPair chapters={[a, b]} mobile="stack" priority />
      <EditorialPair chapters={[c, d]} mobile="stack" />

      <ProductRail id="todas-as-pecas" title="Todas as peças" pieces={pieces} />
    </>
  );
}
