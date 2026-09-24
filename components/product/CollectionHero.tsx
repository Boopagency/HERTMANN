import { PanelMedia } from "@/components/sections/EditorialPair";
import type { Media } from "@/lib/data/editorial";
import { cn } from "@/lib/utils";

/* ============================================================================
   Abertura de categoria e de coleção
   ----------------------------------------------------------------------------
   Um par de imagens em sangria, curto (a grelha tem de aparecer depressa),
   com o título sobre a primeira. Começa por baixo do cabeçalho de vidro,
   que a desfoca ao passar. No telemóvel fica só a primeira imagem.
   ========================================================================== */

export function CollectionHero({
  label,
  title,
  line,
  media,
}: {
  label: string;
  title: string;
  line?: string;
  media: [Media, Media];
}) {
  const [first, second] = media;

  return (
    <header className="relative grid md:grid-cols-2">
      <div className="relative h-[calc(var(--header-h)+74vw)] overflow-hidden bg-[var(--color-ink)] md:h-[calc(var(--header-h)+clamp(19rem,32vw,36rem))]">
        <PanelMedia media={first} sizes="(max-width: 768px) 100vw, 50vw" priority />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 50%)" }}
        />
        <div className="absolute inset-x-[var(--spacing-gutter)] bottom-[clamp(1.25rem,3vw,2.75rem)] text-[var(--color-paper)]">
          <p className="t-label-sm opacity-80">{label}</p>
          <h1 className="t-h1 mt-2">{title}</h1>
          {line && <p className="t-voice mt-2 max-w-[44ch] opacity-90">{line}</p>}
        </div>
      </div>

      <div
        className={cn(
          "relative hidden overflow-hidden md:block md:h-[calc(var(--header-h)+clamp(19rem,32vw,36rem))]",
          second.kind === "cutout" ? "bg-[var(--color-studio)]" : "bg-[var(--color-ink)]",
        )}
      >
        <PanelMedia media={second} sizes="50vw" priority />
      </div>
    </header>
  );
}
