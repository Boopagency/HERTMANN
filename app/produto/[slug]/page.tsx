import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductRail } from "@/components/product/ProductRail";
import { Disclosure } from "@/components/product/Disclosure";
import { Reveal } from "@/components/motion/Reveal";
import {
  categoryBySlug,
  collectionName,
  pieces,
  relatedPieces,
  type Piece,
} from "@/lib/data/catalogue";
import { findPiece, isHomologationPiece } from "@/lib/data/homologation";
import { site } from "@/lib/data/site";
import { isSellable } from "@/lib/commerce";
import { minorUnitsToDecimal } from "@/lib/format";
import { getProductSnapshot } from "@/lib/hostinger/client";
import type { ProductSnapshot } from "@/lib/hostinger/types";
import { siteUrl } from "@/lib/site-url";

type Params = { params: Promise<{ slug: string }> };

/**
 * Preço e estoque lêem-se em runtime: a página refaz-se no máximo a cada
 * minuto, sem novo build. As peças editoriais não fazem pedido nenhum.
 */
export const revalidate = 60;

export function generateStaticParams() {
  return pieces.map((p) => ({ slug: p.slug }));
}

/** Sem loja configurada, sem ligação ou sem rede, a página serve o editorial. */
async function readCommerce(piece: Piece): Promise<ProductSnapshot | null> {
  if (!isSellable(piece)) return null;
  try {
    return await getProductSnapshot(piece.commerce.productId, { revalidate });
  } catch {
    return null;
  }
}

/**
 * A oferta do JSON-LD só existe com dados reais da Hostinger. Uma peça
 * editorial não declara preço a motores de busca — o do catálogo não é um
 * preço comercial.
 */
function offerSchema(piece: Piece, commerce: ProductSnapshot | null) {
  if (!commerce || !piece.commerce) return undefined;

  const variants = Object.values(piece.commerce.variants)
    .map((id) => commerce.variants[id])
    .filter((variant) => variant !== undefined);
  if (variants.length === 0) return undefined;

  const amounts = variants.map((v) => v.effectiveAmount);
  const low = variants[amounts.indexOf(Math.min(...amounts))];
  const high = variants[amounts.indexOf(Math.max(...amounts))];
  const availability = variants.some((v) => v.available)
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const common = {
    priceCurrency: low.currencyCode,
    availability,
    url: `${siteUrl}/produto/${piece.slug}`,
    seller: { "@type": "Organization", name: site.name },
  };

  return low.effectiveAmount === high.effectiveAmount
    ? {
        "@type": "Offer",
        price: minorUnitsToDecimal(low.effectiveAmount, low.decimalDigits),
        ...common,
      }
    : {
        "@type": "AggregateOffer",
        lowPrice: minorUnitsToDecimal(low.effectiveAmount, low.decimalDigits),
        highPrice: minorUnitsToDecimal(high.effectiveAmount, high.decimalDigits),
        offerCount: variants.length,
        ...common,
      };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const piece = findPiece(decodeURIComponent(slug));
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
    ...(isHomologationPiece(piece) ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const piece = findPiece(decodeURIComponent(slug));
  if (!piece) notFound();

  const category = categoryBySlug(piece.category)!;
  const related = relatedPieces(piece, 8);
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
    image: piece.image ? [`${siteUrl}${piece.image.src}`] : undefined,
    offers: offerSchema(piece, commerce),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Joias", item: `${siteUrl}/joias` },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `${siteUrl}/joias/${category.slug}`,
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
        className="shell-plp"
        style={{ paddingTop: "calc(var(--header-h) + clamp(1rem, 2vw, 1.5rem))" }}
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
        <div className="mt-[clamp(0.75rem,1.6vw,1.25rem)] grid gap-y-8 md:grid-cols-12 md:gap-x-[clamp(1rem,2vw,2rem)]">
          <div className="min-w-0 md:col-span-7">
            <ProductGallery piece={piece} />
          </div>

          <div className="md:col-span-5 lg:col-span-4 lg:col-start-9">
            <div className="md:sticky md:top-[calc(var(--header-h)+1.5rem)]">
              <ProductDetail piece={piece} initial={commerce} />
            </div>
          </div>
        </div>

        {/* — Informação secundária — */}
        <div className="mt-[var(--spacing-commerce)] grid gap-y-8 md:grid-cols-12 md:gap-x-[clamp(1rem,2vw,2rem)]">
          <div className="md:col-span-7">
            <Reveal>
              <p className="t-label-sm muted">Detalhes</p>
            </Reveal>

            <Reveal delay={0.08} className="mt-4">
              <div className="border-t border-[var(--color-rule)]">
                <Disclosure title="A peça" defaultOpen>
                  <p>{piece.description}</p>
                  {collectionName(piece.collection) && (
                    <p className="mt-4">
                      Coleção {collectionName(piece.collection)}. Referência{" "}
                      {piece.reference}, registada no arquivo da casa.
                    </p>
                  )}
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

          <Reveal delay={0.16} className="md:col-span-4 md:col-start-9 lg:col-span-3 lg:col-start-10">
            <p className="t-h4">Atendimento privado</p>
            <p className="t-body mt-3">
              Pode marcar uma visita à boutique para ver a peça, experimentar
              medidas e falar com quem a executa.
            </p>
            <Link href="/contato" className="link-edit mt-4">
              <span>Marcar visita</span>
              <span aria-hidden="true" className="arrow">
                →
              </span>
            </Link>
          </Reveal>
        </div>

      </div>

      {/* — Relacionadas — */}
      <ProductRail
        id="relacionadas"
        title="Também da casa"
        pieces={related}
        className="mt-[var(--spacing-commerce)] border-t border-[var(--color-rule-soft)]"
      />
    </>
  );
}
