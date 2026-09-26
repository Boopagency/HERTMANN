import type { Metadata } from "next";
import Link from "next/link";
import { ProductRail } from "@/components/product/ProductRail";
import { featuredPieces } from "@/lib/data/catalogue";
import { CheckoutReturn } from "./CheckoutReturn";

export const metadata: Metadata = {
  title: "Pedido recebido",
  robots: { index: false, follow: false },
};

/* ============================================================================
   Regresso de um checkout concluído na Hostinger (`success_url`).
   A mesma composição da página 404: rótulo, título, uma frase, dois
   caminhos — e a vitrine por baixo.
   ========================================================================== */

export default function CheckoutSuccessPage() {
  return (
    <>
      <CheckoutReturn />

      <section
        className="shell-plp grid items-end gap-y-4 pb-[clamp(1.5rem,3vw,2.5rem)] md:grid-cols-12 md:gap-x-10"
        style={{ paddingTop: "calc(var(--header-h) + clamp(2.5rem, 6vw, 5rem))" }}
      >
        <div className="md:col-span-7">
          <p className="t-label-sm muted">Pedido</p>
          <h1 className="t-h1 mt-2">Obrigado.</h1>
        </div>
        <div className="md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9">
          <p className="t-body max-w-[40ch]">
            Recebemos o seu pedido. Se tiver alguma questão sobre ele, fale connosco —
            respondemos em até um dia útil.
          </p>
          <div className="mt-4 flex flex-wrap gap-6">
            <Link href="/joias" className="link-edit">
              <span>Continuar a ver as joias</span>
              <span aria-hidden="true" className="arrow">
                →
              </span>
            </Link>
            <Link href="/contato" className="link-edit">
              <span>Falar connosco</span>
            </Link>
          </div>
        </div>
      </section>

      <ProductRail
        id="depois-do-pedido"
        title="Também da casa"
        pieces={featuredPieces()}
        className="border-t border-[var(--color-rule-soft)]"
        priority
      />
    </>
  );
}
