import { FadeImage } from "@/components/ui/FadeImage";
import Link from "next/link";
import { AutoVideo } from "@/components/sections/AutoVideo";
import { Reveal } from "@/components/motion/Reveal";
import type { Chapter, Media } from "@/lib/data/editorial";
import { cn } from "@/lib/utils";

/* ============================================================================
   Par editorial 50/50
   ----------------------------------------------------------------------------
   Dois capítulos lado a lado, em sangria total e sem intervalo — cada um
   um quadrado de meia largura (limitado à altura útil do ecrã). O texto é
   pequeno e vive num canto: um título, um link. A mudança de bloco faz-se
   pela fotografia, não por espaço vazio.

   No telemóvel, três composições:
     stack — empilhados em sangria, 4:5
     split — lado a lado, dois retratos pequenos
   ========================================================================== */

export function EditorialPair({
  chapters,
  mobile = "stack",
  className,
  headingLevel = "h2",
  priority,
}: {
  chapters: [Chapter, Chapter];
  mobile?: "stack" | "split";
  className?: string;
  headingLevel?: "h2" | "h3";
  /** No primeiro ecrã: as imagens carregam já, sem fade. */
  priority?: boolean;
}) {
  return (
    <section className={cn("grid md:grid-cols-2", mobile === "split" && "grid-cols-2", className)}>
      {chapters.map((chapter, i) => (
        <ChapterPanel
          key={chapter.title}
          chapter={chapter}
          compact={mobile === "split"}
          sizes={mobile === "split" ? "50vw" : "(max-width: 768px) 100vw, 50vw"}
          headingLevel={headingLevel}
          index={i}
          priority={priority}
        />
      ))}
    </section>
  );
}

export function ChapterPanel({
  chapter,
  compact = false,
  sizes,
  headingLevel: Heading = "h2",
  className,
  index = 0,
  priority,
}: {
  chapter: Chapter;
  compact?: boolean;
  sizes: string;
  headingLevel?: "h2" | "h3";
  className?: string;
  index?: number;
  priority?: boolean;
}) {
  const place = chapter.place ?? "top";
  const light = (chapter.tone ?? "light") === "light";
  const cutout = chapter.media.kind === "cutout";

  return (
    <Link
      href={chapter.link.href}
      className={cn(
        "group relative block overflow-hidden",
        cutout ? "bg-[var(--color-studio)]" : "bg-[var(--color-ink)]",
        compact ? "aspect-[3/4]" : "aspect-[4/5]",
        "md:aspect-auto md:h-[min(50vw,calc(100svh-var(--header-h)))]",
        className,
      )}
      data-index={index}
    >
      <PanelMedia media={chapter.media} sizes={sizes} priority={priority} />

      {/* Véu de leitura — só no canto do texto, só sobre fotografia */}
      {!cutout && light && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              place === "top"
                ? "linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0) 38%)"
                : "linear-gradient(to top, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 42%)",
          }}
        />
      )}

      <div
        className={cn(
          "absolute left-[var(--spacing-gutter)] right-[var(--spacing-gutter)]",
          place === "top" ? "top-[clamp(1rem,3vw,2.75rem)]" : "bottom-[clamp(1.25rem,4.4vw,4rem)]",
          light ? "text-[var(--color-paper)]" : "text-[var(--color-ink)]",
        )}
      >
        {/* O texto assenta quando o capítulo entra no ecrã — 12 px, o
            segundo painel um instante depois do primeiro. */}
        <Reveal y={12} delay={index * 0.06}>
          <Heading className={cn("t-edit", compact && "max-md:text-[1.05rem]")}>
            {chapter.title}
          </Heading>
          {/* Nos painéis compactos do telemóvel, só a seta — o título basta. */}
          <span className={cn("link-edit mt-2", compact && "max-md:mt-1")}>
            <span className={cn(compact && "max-md:sr-only")}>{chapter.link.label}</span>
            <span aria-hidden="true" className="arrow">
              →
            </span>
          </span>
        </Reveal>
      </div>
    </Link>
  );
}

export function PanelMedia({
  media,
  sizes,
  priority,
}: {
  media: Media;
  sizes: string;
  priority?: boolean;
}) {
  if (media.kind === "video") {
    return (
      <>
        <FadeImage
          src={media.poster}
          alt={media.alt}
          fill
          sizes={sizes}
          className="object-cover"
          style={{ objectPosition: media.focus ?? "50% 50%" }}
        />
        <AutoVideo
          src={media.src}
          className="zoom"
          style={{ objectPosition: media.focus ?? "50% 50%" }}
        />
      </>
    );
  }

  if (media.kind === "cutout") {
    return (
      <FadeImage
        src={media.src}
        alt={media.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="zoom object-contain p-[16%] md:p-[17%]"
      />
    );
  }

  return (
    <FadeImage
      src={media.src}
      alt={media.alt}
      fill
      sizes={sizes}
      priority={priority}
      className="zoom object-cover"
      style={{ objectPosition: media.focus ?? "50% 50%" }}
    />
  );
}
