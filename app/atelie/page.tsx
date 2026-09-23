import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { PieceDrawing } from "@/components/brand/Marks";

export const metadata: Metadata = {
  title: "Ateliê",
  description:
    "Do desenho a lápis ao polimento final: as sete etapas de execução de uma peça HERTMANN, no ateliê de Curitiba.",
  alternates: { canonical: "/atelie" },
};

const STEPS = [
  {
    index: "01",
    title: "Desenho",
    body: "A peça nasce a lápis, em escala real. Nenhum projecto avança sem que o desenho esteja resolvido no papel.",
  },
  {
    index: "02",
    title: "Modelo",
    body: "O desenho passa a cera ou a modelo tridimensional, apenas para confirmar proporções e tolerâncias.",
  },
  {
    index: "03",
    title: "Fundição",
    body: "O ouro é fundido na casa, a partir de liga própria. A composição é registada em cada lote.",
  },
  {
    index: "04",
    title: "Construção",
    body: "Aros, elos e galerias são soldados à mão. É a etapa mais longa e a que decide o comportamento da peça.",
  },
  {
    index: "05",
    title: "Cravação",
    body: "As pedras entram uma a uma. As garras são limadas até desaparecerem à vista, sem perderem força.",
  },
  {
    index: "06",
    title: "Acabamento",
    body: "Sete passagens de polimento, ou escovagem, conforme a superfície pedida pelo desenho.",
  },
  {
    index: "07",
    title: "Registo",
    body: "A peça é fotografada, numerada e arquivada. O nome do artesão que a executou vai no certificado.",
  },
];

export default function AtelierPage() {
  return (
    <>
      <PageHeader
        label="Ateliê"
        title={["Catorze semanas,", "uma peça."]}
        lead="Não há atalhos que se notem. Há atalhos que se notam — e é por isso que não os tomamos."
      />

      {/* — O que sai da bancada, em sangria — */}
      <figure className="plate plate-studio relative aspect-[4/3] w-full md:aspect-auto md:h-[min(40vw,calc(100svh-var(--header-h)))]">
        <Image
          src="/images/set-packaging.png"
          alt="Conjunto HERTMANN: estojo lacado, bolsa de veludo, sacola, cartão e peças em ouro"
          fill
          priority
          sizes="100vw"
          className="object-contain p-[5%]"
        />
      </figure>

      {/* — Etapas — */}
      <section className="shell-plp py-[var(--spacing-commerce)]" aria-labelledby="processo">
        <div className="grid gap-y-6 md:grid-cols-12 md:gap-x-8">
          <Reveal className="md:col-span-4">
            <p className="t-label-sm muted">Processo</p>
            <h2 id="processo" className="t-h2 mt-2">
              Sete etapas.
            </h2>
            <p className="t-body mt-3 max-w-[36ch]">
              Um só artesão acompanha a peça do princípio ao fim. Não há linha de montagem: há uma
              bancada, e quem a ocupa responde por tudo o que dela sai.
            </p>
          </Reveal>

          <RevealGroup className="flex flex-col md:col-span-8" stagger={0.06} y={14}>
            {STEPS.map((step) => (
              <article
                key={step.index}
                className="grid grid-cols-[3rem_1fr] gap-x-6 border-t border-[var(--color-rule)] py-4 last:border-b md:grid-cols-[3.5rem_11rem_1fr]"
              >
                <p className="t-num pt-1 opacity-50">{step.index}</p>
                <h3 className="t-h4">{step.title}</h3>
                <p className="t-body col-start-2 mt-1.5 md:col-start-3 md:mt-0">{step.body}</p>
              </article>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* — O traço — o momento azul-marinho da página — */}
      <section className="on-ink" aria-labelledby="desenho">
        <div className="grid md:grid-cols-2">
          <div className="flex flex-col justify-center px-[var(--spacing-gutter)] py-[var(--spacing-commerce)] md:px-[clamp(2rem,6vw,6rem)]">
            <Reveal>
              <p className="t-label-sm muted">O traço</p>
              <h2 id="desenho" className="t-h2 mt-2 max-w-[14ch]">
                Antes da joia, há uma linha.
              </h2>
              <p className="t-body mt-4 max-w-[40ch]">
                Os desenhos técnicos da casa acompanham cada peça durante toda a execução, e ficam
                arquivados com ela. São eles que permitem refazer, décadas depois, uma peça que já
                não existe.
              </p>
              <Link href="/joias" className="link-edit mt-5">
                <span>Ver o catálogo</span>
                <span aria-hidden="true" className="arrow">
                  →
                </span>
              </Link>
            </Reveal>
          </div>

          <div className="grid grid-cols-2">
            {(["solitaire", "pendantGem", "hoop", "links"] as const).map((variant) => (
              <div
                key={variant}
                className="grid aspect-square place-items-center border-l border-t border-[var(--color-rule-invert)]"
              >
                <PieceDrawing
                  variant={variant}
                  className="h-[58%] w-auto text-[var(--color-paper)] opacity-70"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* — Visita — */}
      <section
        className="shell-plp grid items-end gap-y-5 py-[var(--spacing-commerce)] md:grid-cols-12 md:gap-x-8"
        aria-labelledby="visita-atelie"
      >
        <Reveal className="md:col-span-7">
          <h2 id="visita-atelie" className="t-h2">
            O ateliê recebe visitas.
          </h2>
          <p className="t-body mt-3 max-w-[46ch]">
            Marque uma hora e suba. Verá a bancada onde a sua peça vai ser feita, e conhecerá quem a
            vai fazer.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="md:col-span-4 md:col-start-9 md:text-right">
          <Link href="/contato" className="link-edit">
            <span>Marcar visita</span>
            <span aria-hidden="true" className="arrow">
              →
            </span>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
