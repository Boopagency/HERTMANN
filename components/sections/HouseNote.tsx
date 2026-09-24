import Link from "next/link";
import { CrystalMark } from "@/components/brand/Marks";
import { site } from "@/lib/data/site";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";

/* ============================================================================
   A casa, em poucas linhas
   ----------------------------------------------------------------------------
   A história entra só depois de cinco momentos comerciais, e sai depressa:
   uma frase, três números entre fios, um caminho para a página Sobre.
   ========================================================================== */

const FACTS = [
  { value: String(new Date().getFullYear() - site.founded), label: "anos de casa" },
  { value: "14", label: "semanas por peça" },
  { value: "9", label: "artesãos no ateliê" },
];

export function HouseNote() {
  return (
    <section
      aria-labelledby="a-casa"
      className="border-t border-[var(--color-rule-soft)] bg-[var(--color-studio)]"
    >
      <div className="shell-rail grid items-center gap-y-8 py-[var(--spacing-commerce)] md:grid-cols-12 md:gap-x-8">
        <Reveal className="md:col-span-7 lg:col-span-6">
          <CrystalMark className="h-14 w-auto text-[var(--color-ink)] opacity-70" />
          <h2 id="a-casa" className="t-h3 mt-5 max-w-[26ch]">
            Joias executadas à mão em Curitiba desde {site.founded}.
          </h2>
          <p className="t-body mt-3 max-w-[48ch]">
            Três gerações na mesma bancada do Batel. Cada peça é acompanhada por um só artesão, do
            desenho ao polimento final — e pode ser reparada, sem limite de tempo.
          </p>
          <Link href="/sobre" className="link-edit mt-4">
            <span>Conheça a Hertmann</span>
            <span aria-hidden="true" className="arrow">
              →
            </span>
          </Link>
        </Reveal>

        <dl className="grid grid-cols-3 md:col-span-5 lg:col-span-5 lg:col-start-8">
          {FACTS.map((fact) => (
            <div
              key={fact.label}
              className="flex flex-col-reverse border-l border-[var(--color-rule)] pl-4 first:border-l-0 first:pl-0 md:first:border-l md:first:pl-4"
            >
              <dt className="t-label-sm muted mt-2">{fact.label}</dt>
              <dd className="t-display text-[clamp(1.75rem,2.6vw,2.6rem)] leading-none">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
