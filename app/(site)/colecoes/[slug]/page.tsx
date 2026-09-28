import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionHero } from "@/components/product/CollectionHero";
import { Catalogue } from "@/components/product/CatalogueView";
import { collectionBySlug, collectionPieces, collections } from "@/lib/data/catalogue";
import { collectionMedia } from "@/lib/data/editorial";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const collection = collectionBySlug(slug);
  if (!collection) return {};
  return {
    title: `Coleção ${collection.name}`,
    description: collection.description,
    alternates: { canonical: `/colecoes/${collection.slug}` },
  };
}

export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  const collection = collectionBySlug(slug);
  if (!collection) notFound();

  return (
    <>
      <CollectionHero
        label={`Coleção · ${collection.year}`}
        title={collection.name}
        line={collection.line}
        media={collectionMedia[collection.slug]}
      />

      <Catalogue pieces={collectionPieces(collection)} hide={["colecao"]} />

      {/* A coleção em poucas linhas — depois das peças, nunca antes */}
      <section
        aria-label={`Sobre a coleção ${collection.name}`}
        className="border-t border-[var(--color-rule-soft)] bg-[var(--color-studio)]"
      >
        <div className="shell-plp grid gap-y-5 py-[var(--spacing-commerce)] md:grid-cols-12 md:gap-x-8">
          <p className="t-label-sm muted md:col-span-3">{collection.note}</p>
          <p className="t-lead text-[var(--color-ink)] md:col-span-6">{collection.description}</p>
          <div className="md:col-span-3 md:text-right">
            <Link href="/contato" className="link-edit">
              <span>Falar com a casa</span>
              <span aria-hidden="true" className="arrow">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
