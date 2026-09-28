import type { Metadata } from "next";
import Link from "next/link";
import { ProductRail } from "@/components/product/ProductRail";
import { featuredPieces } from "@/lib/data/catalogue";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <section
        className="shell-plp grid items-end gap-y-4 pb-[clamp(1.5rem,3vw,2.5rem)] md:grid-cols-12 md:gap-x-10"
        style={{ paddingTop: "calc(var(--header-h) + clamp(2.5rem, 6vw, 5rem))" }}
      >
        <div className="md:col-span-7">
          <p className="t-num opacity-50">404</p>
          <h1 className="t-h1 mt-2">Esta página não existe.</h1>
        </div>
        <div className="md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9">
          <p className="t-body max-w-[40ch]">
            O endereço mudou, ou a peça que procurava saiu de exposição. O catálogo continua aqui.
          </p>
          <div className="mt-4 flex flex-wrap gap-6">
            <Link href="/joias" className="link-edit">
              <span>Ver as joias</span>
              <span aria-hidden="true" className="arrow">
                →
              </span>
            </Link>
            <Link href="/" className="link-edit">
              <span>Página inicial</span>
            </Link>
          </div>
        </div>
      </section>

      <ProductRail
        id="talvez"
        title="Talvez procure"
        pieces={featuredPieces()}
        className="border-t border-[var(--color-rule-soft)]"
      />
    </>
  );
}
