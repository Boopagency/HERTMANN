import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Disclosure } from "@/components/product/Disclosure";
import { Reveal } from "@/components/motion/Reveal";
import { SectionLabel } from "@/components/ui/Label";
import {
  categoryBySlug,
  collectionName,
  pieceBySlug,
  pieces,
  relatedPieces,
  type Piece,
} from "@/lib/data/catalogue";
import { site } from "@/lib/data/site";
import { getVariantSnapshot, isStoreConfigured } from "@/lib/hostinger/client";
import type { VariantSnapshot } from "@/lib/hostinger/types";

type Params = { params: Promise<{ slug: string }> };

/** O catálogo comercial lê-se em runtime: preço e stock mudam sem novo build. */
export const revalidate = 60;

export function generateStaticParams() {
  return pieces.map((p) => ({ slug: p.slug }));
}

/** Sem loja configurada ou sem rede, a página serve o conteúdo editorial. */
async function readCommerce(piece: Piece): Promise<VariantSnapshot | null> {
  if (!isStoreConfigured || !piece.hostingerProductId || !piece.hostingerVariantId) {
    return null;
  }

  try {
    return await getVariantSnapshot(piece.hostingerProductId, piece.hostingerVariantId, {
      revalidate,
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const piece = pieceBySlug(decodeURIComponent(slug));
  if (!piece) return {};
  return {
    title: `${piece.name} — ${piece.line}`,
    description: piece.description,
    alternates: { canonical: `/produto/${piece.slug}` },
    openGraph: {
      title: `${piece.name} — HERTMANN`,
      description: piece.description,
      type: "website",
      images: piece.image ? [{ url: piece.image.src, alt: piece.image.alt }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const piece = pieceBySlug(decodeURIComponent(slug));
  if (!piece) notFound();

  const category = categoryBySlug(piece.category)!;
  const related = relatedPieces(piece, 3);
  const commerce = await readCommerce(piece);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${piece.name} — ${piece.line}`,
    description: piece.description,
    sku: piece.reference,
    brand: { "@type": "Brand", name: site.name },
    material: piece.material,
    category: category.name,
    image: piece.image ? [`${site.url}${piece.image.src}`] : undefined,
    offers: {
      "@type": "Offer",
      price: commerce
        ? (commerce.effectiveAmount / 10 ** commerce.decimalDigits).toFixed(commerce.decimalDigits)
        : piece.price,
      priceCurrency: commerce?.currencyCode ?? "BRL",
      availability:
        commerce && !commerce.available
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url: `${site.url}/produto/${piece.slug}`,
      seller: { "@type": "Organization", name: site.name },
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Joias", item: `${site.url}/joias` },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `${site.url}/joias/${category.slug}`,
      },
      { "@type": "ListItem", position: 3, name: piece.name },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <div
        className="shell"
        style={{ paddingTop: "calc(var(--header-h) + clamp(2rem, 5vw, 4rem))" }}
      >
        {/* — Rasto — */}
        <nav aria-label="Trilho de navegação">
          <ol className="t-label-sm muted flex flex-wrap items-center gap-2">
            <li>
              <Link href="/joias" className="link-nav">
                Joias
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/joias/${category.slug}`} className="link-nav">
                {category.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[var(--color-ink)]">
              {piece.name}
            </li>
          </ol>
        </nav>

        {/* — Peça — */}
        <div className="grid12 mt-[clamp(2rem,4vw,3.5rem)] gap-y-[clamp(2.5rem,5vw,4rem)]">
          <div className="col-span-6 md:col-span-7">
            <ProductGallery piece={piece} />
          </div>

          <div className="col-span-6 md:col-span-4 md:col-start-9">
            <div className="md:sticky md:top-[calc(var(--header-h)+2.5rem)]">
              <ProductDetail piece={piece} commerce={commerce} />
            </div>
          </div>
        </div>

        {/* — Informação secundária — */}
        <div className="grid12 mt-[clamp(4rem,9vw,8rem)]">
          <div className="col-span-6 md:col-span-7">
            <Reveal>
              <SectionLabel>Detalhes</SectionLabel>
            </Reveal>

            <Reveal delay={0.08} className="mt-8">
              <div className="border-t border-[var(--color-rule)]">
                <Disclosure title="A peça" defaultOpen>
                  <p>{piece.description}</p>
                  <p className="mt-4">
                    Coleção {collectionName(piece.collection)}. Referência{" "}
                    {piece.reference}, registada no arquivo da casa.
                  </p>
                </Disclosure>

                <Disclosure title="Materiais">
                  <p>
                    {piece.material}
                    {piece.stone ? `. ${piece.stone}.` : "."}
                  </p>
                  <p className="mt-4">
                    O ouro é fundido no ateliê a partir de liga própria. As pedras
                    são compradas em bruto e talhadas sob encomenda — nunca
                    adquiridas já montadas.
                  </p>
                </Disclosure>

                <Disclosure title="Cuidados">
                  <p>
                    Guarde a peça na bolsa de veludo que a acompanha, separada de
                    outras joias. Retire-a antes de nadar, de dormir e de qualquer
                    contacto com produtos de limpeza ou perfume.
                  </p>
                  <p className="mt-4">
                    A limpeza e o polimento anuais são gratuitos, na boutique ou
                    por correio assegurado.
                  </p>
                </Disclosure>

                <Disclosure title="Entrega">
                  <p>
                    Peças em stock são expedidas em até três dias úteis, por
                    transporte assegurado, em todo o Brasil. Peças sob encomenda
                    levam, em média, catorze semanas.
                  </p>
                  <p className="mt-4">
                    A entrega inclui o estojo lacado, a bolsa de veludo e o
                    certificado do artesão que executou a peça.
                  </p>
                </Disclosure>

                <Disclosure title="Trocas e reparações">
                  <p>
                    Trocas e devoluções são aceites em trinta dias, desde que a
                    peça não tenha sido usada nem gravada.
                  </p>
                  <p className="mt-4">
                    Reparações, redimensionamentos e refacções de qualquer peça
                    HERTMANN não têm limite de tempo. Escreva-nos para{" "}
                    <a
                      href={`mailto:${site.contact.email}`}
                      className="link-underline text-[var(--color-ink)]"
                    >
                      {site.contact.email}
                    </a>
                    .
                  </p>
                </Disclosure>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.16} className="col-span-6 md:col-span-3 md:col-start-10">
            <p className="t-h4">Atendimento privado</p>
            <p className="t-body mt-4">
              Pode marcar uma visita à boutique para ver a peça, experimentar
              medidas e falar com quem a executa.
            </p>
            <Link href="/contato" className="t-label-sm link-nav mt-6 inline-block">
              Marcar visita
            </Link>
          </Reveal>
        </div>

        {/* — Relacionadas — */}
        <section className="section" aria-labelledby="relacionadas">
          <Reveal>
            <SectionLabel>Também da casa</SectionLabel>
            <h2 id="relacionadas" className="t-h2 mt-[clamp(1.25rem,2.5vw,2rem)]">
              Pode também gostar
            </h2>
          </Reveal>
          <ProductGrid pieces={related} columns={3} className="mt-[clamp(2.5rem,5vw,4rem)]" />
        </section>
      </div>
    </>
  );
}
