import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/* ============================================================================
   Abertura de página interna — o mesmo gesto das páginas de catálogo:
   rótulo, título de tamanho médio, e a linha de voz à direita. Pouca
   altura: o conteúdo começa logo a seguir.
   ========================================================================== */

export function PageHeader({
  label,
  title,
  lead,
  aside,
  className,
}: {
  label: string;
  title: string[];
  lead?: string;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "shell-plp grid items-end gap-x-10 gap-y-4 pb-[clamp(1.5rem,3vw,2.5rem)] md:grid-cols-12",
        className,
      )}
      style={{ paddingTop: "calc(var(--header-h) + clamp(1.75rem, 3.3vw, 3rem))" }}
    >
      <Reveal className="md:col-span-7">
        <p className="t-label-sm muted">{label}</p>
        <h1 className="t-h1 mt-2">
          {title.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
      </Reveal>

      {(lead || aside) && (
        <Reveal delay={0.15} className="md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9">
          {lead && <p className="t-body max-w-[46ch]">{lead}</p>}
          {aside}
        </Reveal>
      )}
    </header>
  );
}
