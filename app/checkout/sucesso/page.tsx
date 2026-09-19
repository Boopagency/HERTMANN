import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { CrystalMark } from "@/components/brand/Marks";
import { site } from "@/lib/data/site";
import { BagReset } from "./BagReset";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <section
      className="shell flex min-h-[70svh] flex-col items-center justify-center text-center"
      style={{ paddingTop: "var(--header-h)" }}
    >
      <BagReset />

      <CrystalMark className="h-[clamp(3rem,5vw,4.5rem)] w-auto opacity-50" />
      <p className="t-label mt-10">Pedido recebido</p>
      <h1 className="t-h1 mt-5">Obrigado.</h1>
      <p className="t-lead mt-6 max-w-[40ch]">
        O pedido ficou registado e a confirmação segue por e-mail. A partir daqui,
        a peça passa às mãos do ateliê.
      </p>
      <p className="t-label-sm muted mt-6 max-w-[44ch]">
        Para qualquer questão sobre o pedido, escreva para{" "}
        <a href={`mailto:${site.contact.email}`} className="link-underline text-[var(--color-ink)]">
          {site.contact.email}
        </a>
        .
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <ButtonLink href="/joias" variant="solid" arrow>
          Continuar a ver
        </ButtonLink>
        <ButtonLink href="/" variant="line">
          Página inicial
        </ButtonLink>
      </div>
    </section>
  );
}
