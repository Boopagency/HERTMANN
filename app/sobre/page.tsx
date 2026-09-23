import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { site } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Três gerações de joalheria em Curitiba. A história da HERTMANN, desde a bancada de Otto Hertmann em 1948 até ao ateliê de hoje.",
  alternates: { canonical: "/sobre" },
};

const CHAPTERS = [
  {
    year: "1948",
    title: "Uma bancada",
    body: "Otto Hertmann chega a Curitiba com uma mala, uma bancada desmontada e três ferramentas. Abre a oficina no piso de cima de um edifício no Batel, e passa os primeiros anos a reparar as joias que a cidade já tinha.",
  },
  {
    year: "1971",
    title: "A primeira coleção",
    body: "A segunda geração assume o ateliê e desenha a primeira colecção da casa. As peças de Arquétipo nascem nesse ano — e continuam, sem alterações, em produção.",
  },
  {
    year: "1998",
    title: "A boutique",
    body: "A casa abre a boutique no piso térreo, sob o ateliê. Passa a ser possível ver quem executa a peça antes de a comprar. É uma decisão que nunca foi revista.",
  },
  {
    year: "Hoje",
    title: "Nove artesãos",
    body: "O ateliê emprega nove artesãos e continua a ocupar o mesmo piso. Cada peça é acompanhada por um só deles, do desenho ao polimento final, e o registo fica arquivado indefinidamente.",
  },
];

const PRINCIPLES = [
  {
    index: "I",
    title: "Matéria",
    body: "Ouro 18k fundido na casa, a partir de liga própria. Pedras compradas em bruto e talhadas sob encomenda, nunca adquiridas já montadas.",
  },
  {
    index: "II",
    title: "Desenho",
    body: "Todas as peças nascem à mão, em papel. Só depois passam ao modelo tridimensional — e apenas para verificar o que o lápis já decidiu.",
  },
  {
    index: "III",
    title: "Execução",
    body: "Um artesão acompanha a peça do princípio ao fim. O nome de quem a executou vai no certificado, e a casa guarda o registo indefinidamente.",
  },
  {
    index: "IV",
    title: "Permanência",
    body: "Reparamos, redimensionamos e refazemos qualquer peça HERTMANN, sem limite de tempo. É a única garantia que sabemos dar.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        label="Sobre a casa"
        title={["Três gerações,", "uma morada."]}
        lead="A HERTMANN nunca mudou de rua. O que mudou foram as mãos — e mesmo essas passaram o ofício umas às outras, na mesma bancada."
      />

      {/* — A casa vista de dentro, em sangria — */}
      <figure className="plate relative aspect-[4/3] w-full md:aspect-auto md:h-[min(46vw,calc(100svh-var(--header-h)))]">
        <Image
          src="/images/boutique-wide.jpg"
          alt="Interior da boutique HERTMANN, com vitrinas em latão e painel em azul-marinho"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </figure>

      {/* — Cronologia — */}
      <section className="shell-plp py-[var(--spacing-commerce)]" aria-labelledby="historia">
        <div className="grid gap-y-6 md:grid-cols-12 md:gap-x-8">
          <Reveal className="md:col-span-4">
            <p className="t-label-sm muted">História</p>
            <h2 id="historia" className="t-h2 mt-2 max-w-[14ch]">
              Setenta e sete anos na mesma bancada.
            </h2>
          </Reveal>

          <RevealGroup className="flex flex-col md:col-span-8" stagger={0.08} y={16}>
            {CHAPTERS.map((chapter) => (
              <article
                key={chapter.year}
                className="grid grid-cols-[4.5rem_1fr] gap-x-6 border-t border-[var(--color-rule)] py-5 last:border-b md:grid-cols-[5rem_12rem_1fr]"
              >
                <p className="t-num pt-1 opacity-50">{chapter.year}</p>
                <h3 className="t-h4">{chapter.title}</h3>
                <p className="t-body col-start-2 mt-2 md:col-start-3 md:mt-0">{chapter.body}</p>
              </article>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* — Método — */}
      <section
        aria-labelledby="metodo"
        className="border-y border-[var(--color-rule-soft)] bg-[var(--color-studio)]"
      >
        <div className="shell-plp py-[var(--spacing-commerce)]">
          <p className="t-label-sm muted">Método</p>
          <h2 id="metodo" className="t-h2 mt-2">
            O que fazemos não é segredo. É método.
          </h2>
          <RevealGroup
            className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4"
            stagger={0.08}
            y={16}
          >
            {PRINCIPLES.map((principle) => (
              <article key={principle.index} className="border-t border-[var(--color-rule)] pt-4">
                <p className="t-num opacity-50">{principle.index}</p>
                <h3 className="t-h4 mt-3">{principle.title}</h3>
                <p className="t-body mt-2 max-w-[34ch]">{principle.body}</p>
              </article>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* — O que nos define: imagem e texto, 50/50 — */}
      <section className="grid md:grid-cols-2" aria-labelledby="hoje">
        <figure className="plate relative aspect-[4/5] md:aspect-auto md:h-[min(50vw,calc(100svh-var(--header-h)))]">
          <Image
            src="/images/campaign-hero.jpg"
            alt="Campanha HERTMANN: peças em ouro 18k usadas em conjunto"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            style={{ objectPosition: "50% 30%" }}
          />
        </figure>
        <div className="flex flex-col justify-center px-[var(--spacing-gutter)] py-[var(--spacing-commerce)] md:px-[clamp(2rem,6vw,6rem)]">
          <Reveal>
            <p className="t-label-sm muted">O que nos define</p>
            <h2 id="hoje" className="t-h2 mt-2 max-w-[16ch]">
              Uma joia não deve pedir uma ocasião.
            </h2>
            <p className="t-body mt-4 max-w-[42ch]">
              Trabalhamos para que as peças sejam usadas todos os dias, e não guardadas para os dias
              importantes. Por isso o peso importa tanto quanto o desenho, e o fecho tanto quanto a
              pedra.
            </p>
            <Link href="/atelie" className="link-edit mt-5">
              <span>Ver o ateliê</span>
              <span aria-hidden="true" className="arrow">
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* — Visita — */}
      <section className="border-t border-[var(--color-rule-soft)]" aria-labelledby="visita">
        <div className="shell-plp grid items-end gap-y-6 py-[var(--spacing-commerce)] md:grid-cols-12 md:gap-x-8">
          <Reveal className="md:col-span-6">
            <h2 id="visita" className="t-h2">
              Venha ver.
            </h2>
            <p className="t-body mt-3 max-w-[40ch]">
              A boutique está aberta {site.contact.hours.toLowerCase()}. O ateliê recebe visitas
              mediante marcação.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="md:col-span-5 md:col-start-8">
            <p className="t-label-sm muted">Morada</p>
            <p className="t-label mt-2">{site.contact.address}</p>
            <Link href="/contato" className="link-edit mt-4">
              <span>Marcar visita</span>
              <span aria-hidden="true" className="arrow">
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
