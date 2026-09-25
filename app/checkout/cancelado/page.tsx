import type { Metadata } from "next";
import Link from "next/link";
import { ProductRail } from "@/components/product/ProductRail";
import { featuredPieces } from "@/lib/data/catalogue";
import { ReopenBag } from "./ReopenBag";

export const metadata: Metadata = {
  title: "Compra não concluída",
  robots: { index: false, follow: false },
};

/* ============================================================================
   Regresso de um checkout interrompido (`cancel_url`). A sacola não é
   tocada: continua exactamente como estava, pronta a retomar.
   ========================================================================== */

export default function CheckoutCancelledPage() {
  return (
    <>
      <section
        className="shell-plp grid items-end gap-y-4 pb-[clamp(1.5rem,3vw,2.5rem)] md:grid-cols-12 md:gap-x-10"
        style={{ paddingTop: "calc(var(--header-h) + clamp(2.5rem, 6vw, 5rem))" }}
      >
        <div className="md:col-span-7">
          <p className="t-label-sm muted">Pagamento</p>
          <h1 className="t-h1 mt-2">A compra não foi concluída.</h1>
        </div>
        <div className="md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9">
          <p className="t-body max-w-[40ch]">
            A sua sacola continua guardada, tal como a deixou. Pode retomar o pagamento
            quando quiser.
          </p>
          <div className="mt-4 flex flex-wrap gap-6">
            <ReopenBag />
            <Link href="/joias" className="link-edit">
              <span>Continuar a ver as joias</span>
            </Link>
          </div>
        </div>
      </section>

      <ProductRail
        id="depois-do-pagamento"
        title="Também da casa"
        pieces={featuredPieces()}
        className="border-t border-[var(--color-rule-soft)]"
        priority
      />
    </>
  );
}
