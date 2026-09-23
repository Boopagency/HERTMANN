import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { home } from "@/lib/data/editorial";
import { cn } from "@/lib/utils";

/* ============================================================================
   Hero
   ----------------------------------------------------------------------------
   Uma fotografia a dominar o ecrã (90 % da altura útil), o cabeçalho por
   cima, e quase nada escrito: a casa, a coleção, uma linha, um caminho.
   O hero é impacto — o manifesto vive na página Sobre.
   ========================================================================== */

export function HomeHero() {
  const { media, eyebrow, title, line, link, tone } = home.hero;
  const light = tone === "light";

  return (
    <section
      className="relative h-[calc(88svh-var(--bar-h))] min-h-[30rem] w-full overflow-hidden bg-[var(--color-mist)] md:h-[calc(92svh-var(--bar-h))] md:min-h-[34rem]"
      aria-labelledby="hero-titulo"
    >
      {media.kind === "image" && (
        <Image
          src={media.src}
          alt={media.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: media.focus ?? "50% 50%" }}
        />
      )}

      {/* Em ecrãs de pé, o cabeçalho claro precisa de um sopro de sombra no topo */}
      {home.hero.headerTonePortrait === "light" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 hidden h-[32%] portrait:block"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0) 100%)",
          }}
        />
      )}

      {/* Véu de leitura, só na base, só onde está o texto */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: light
            ? "linear-gradient(to top, rgba(0,0,0,0.46) 0%, rgba(0,0,0,0.12) 34%, rgba(0,0,0,0) 55%)"
            : "none",
        }}
      />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 px-[var(--spacing-gutter)] pb-[clamp(1.75rem,4.4vw,4rem)]",
          light ? "text-[var(--color-paper)]" : "text-[var(--color-ink)]",
        )}
      >
        <Reveal y={12} duration={1.1} delay={0.15}>
          <h1 className="t-label-sm opacity-80">
            {eyebrow}
            <span className="sr-only"> — alta joalheria em Curitiba desde 1948</span>
          </h1>
          <h2 id="hero-titulo" className="t-hero mt-3">
            {title}
          </h2>
          <p className="t-voice mt-2 max-w-[40ch]">{line}</p>
          <Link href={link.href} className="link-edit mt-4">
            <span>{link.label}</span>
            <span aria-hidden="true" className="arrow">
              →
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
