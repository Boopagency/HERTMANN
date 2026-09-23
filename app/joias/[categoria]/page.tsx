import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionHero } from "@/components/product/CollectionHero";
import { Catalogue } from "@/components/product/CatalogueView";
import {
  categories,
  categoryBySlug,
  piecesByCategory,
  type CategorySlug,
} from "@/lib/data/catalogue";
import { categoryMedia } from "@/lib/data/editorial";

type Params = { params: Promise<{ categoria: string }> };

export function generateStaticParams() {
  return categories.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { categoria } = await params;
  const category = categoryBySlug(categoria);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/joias/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { categoria } = await params;
  const category = categoryBySlug(categoria);
  if (!category) notFound();

  const slug = category.slug as CategorySlug;

  return (
    <>
      <CollectionHero
        label="Joias"
        title={category.name}
        line={category.line}
        media={categoryMedia[slug]}
      />
      <Catalogue pieces={piecesByCategory(slug)} category={slug} />
    </>
  );
}
