import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { CrystalMark } from "@/components/brand/Marks";
import { site } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Compra interrompida",
  robots: { index: false, follow: false },
};

export default function CheckoutCancelledPage() {
  return (
    <section
      className="shell flex min-h-[70svh] flex-col items-center justify-center text-center"
      style={{ paddingTop: "var(--header-h)" }}
    >
      <CrystalMark className="h-[clamp(3rem,5vw,4.5rem)] w-auto opacity-50" />
      <p className="t-label mt-10">Compra interrompida</p>
      <h1 className="t-h1 mt-5">A sacola ficou como estava.</h1>
      <p className="t-lead mt-6 max-w-[40ch]">
        Nada foi cobrado. As peças que tinha escolhido continuam guardadas, e pode
        retomar quando quiser.
      </p>
      <p className="t-label-sm muted mt-6 max-w-[44ch]">
        Se preferir concluir com acompanhamento, fale connosco pelo{" "}
        <a
          href={site.contact.whatsappUrl}
          className="link-underline text-[var(--color-ink)]"
          rel="noreferrer noopener"
          target="_blank"
        >
          atendimento privado
        </a>
        .
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <ButtonLink href="/joias" variant="solid" arrow>
          Voltar às joias
        </ButtonLink>
        <ButtonLink href="/contato" variant="line">
          Falar connosco
        </ButtonLink>
      </div>
    </section>
  );
}
