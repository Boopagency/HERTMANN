"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconChevron, IconChevronLeft } from "@/components/brand/Icons";
import { ProductTile } from "@/components/product/ProductTile";
import type { Piece } from "@/lib/data/catalogue";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";

/* ============================================================================
   Vitrine — uma faixa horizontal de peças
   ----------------------------------------------------------------------------
   Título pequeno ao centro; cinco tiles quadrados no desktop (quatro a
   partir de 1024 px, 3¼ no tablet, 2¼ no telemóvel, para que se perceba
   que a faixa continua). As setas vivem na margem, finas, e só aparecem
   quando há para onde ir. Sem pontos, sem barras, sem contadores.
   ========================================================================== */

export function ProductRail({
  title,
  pieces,
  id,
  className,
  priority = false,
}: {
  title: string;
  pieces: Piece[];
  id: string;
  className?: string;
  priority?: boolean;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 });
  }, []);

  useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  function page(direction: 1 | -1) {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const style = getComputedStyle(el);
    const gap = parseFloat(style.columnGap) || 0;
    const pad = parseFloat(style.paddingLeft) || 0;
    const step = first.offsetWidth + gap;
    const visible = Math.max(1, Math.floor((el.clientWidth - 2 * pad + gap + 1) / step));
    el.scrollBy({ left: direction * step * visible, behavior: "smooth" });
  }

  const arrow =
    "absolute z-10 hidden w-[var(--rail-pad)] -translate-y-1/2 place-items-center lg:grid " +
    "h-16 transition-opacity duration-(--dur-normal)";

  return (
    <section
      aria-labelledby={id}
      className={cn("rail pb-[var(--spacing-commerce)] pt-[var(--spacing-title)]", className)}
    >
      <Reveal y={10}>
        <h2 id={id} className="t-rail px-[var(--spacing-gutter)] text-center">
          {title}
        </h2>
      </Reveal>

      <div className="relative mt-[clamp(1.25rem,2.2vw,2.5rem)]">
        <button
          type="button"
          onClick={() => page(-1)}
          className={cn(arrow, "left-0", edges.start && "pointer-events-none opacity-0")}
          style={{ top: "calc(var(--rail-tile) / 2)" }}
          aria-label={`${title}: peças anteriores`}
          tabIndex={edges.start ? -1 : undefined}
        >
          <IconChevronLeft size={20} />
        </button>

        <ul ref={track} className="rail-track">
          {pieces.map((piece, i) => (
            <li key={piece.slug}>
              <ProductTile
                piece={piece}
                priority={priority && i < 3}
                sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, (max-width: 1280px) 22vw, 16vw"
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => page(1)}
          className={cn(arrow, "right-0", edges.end && "pointer-events-none opacity-0")}
          style={{ top: "calc(var(--rail-tile) / 2)" }}
          aria-label={`${title}: mais peças`}
          tabIndex={edges.end ? -1 : undefined}
        >
          <IconChevron size={20} />
        </button>
      </div>
    </section>
  );
}
