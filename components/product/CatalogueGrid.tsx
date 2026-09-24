"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ProductTile } from "@/components/product/ProductTile";
import { PanelMedia } from "@/components/sections/EditorialPair";
import type { Piece } from "@/lib/data/catalogue";
import type { Chapter } from "@/lib/data/editorial";
import { DUR, EASE } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

/* ============================================================================
   Grelha de catálogo
   ----------------------------------------------------------------------------
   Três peças por linha no desktop, duas no telemóvel. O respiro vive dentro
   do tile; entre linhas, só o necessário para a legenda. A meio da grelha
   pode entrar um capítulo editorial em toda a largura — a campanha no meio
   da compra, como numa boutique — sem desequilibrar as linhas.

   Ao filtrar ou ordenar, os tiles que ficam persistem (chave = peça) e
   deslizam para o novo lugar; só os que entram aparecem num fade. A grelha
   nunca desaparece de uma vez. Os que saem saem logo, sem ocupar espaço.
   ========================================================================== */

function useEntering() {
  const reduced = useReducedMotion();
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  return {
    // Tiles montados depois da primeira pintura entram em fade.
    initial: mounted.current && !reduced ? { opacity: 0 } : false,
    animate: { opacity: 1 },
    layout: reduced ? undefined : ("position" as const),
    transition: { duration: DUR.normal, ease: EASE },
  };
}

export function CatalogueGrid({
  pieces,
  insert,
  insertAfter = 5,
  className,
}: {
  pieces: Piece[];
  insert?: Chapter;
  /** Índice da peça depois da qual entra o capítulo (só se houver peças depois). */
  insertAfter?: number;
  className?: string;
}) {
  const showInsert = Boolean(insert) && pieces.length > insertAfter + 1;
  const entering = useEntering();

  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-[clamp(0.5rem,1.4vw,1.5rem)] gap-y-[clamp(1.75rem,3.3vw,3rem)] md:grid-cols-3",
        className,
      )}
    >
      {pieces.map((piece, i) => (
        <Fragment key={piece.slug}>
          <motion.li {...entering}>
            <ProductTile
              piece={piece}
              priority={i < 3}
              sizes="(max-width: 768px) 48vw, (max-width: 1760px) 32vw, 560px"
            />
          </motion.li>
          {showInsert && insert && i === insertAfter && (
            <InsertBand chapter={insert} entering={entering} />
          )}
        </Fragment>
      ))}
    </ul>
  );
}

function InsertBand({
  chapter,
  entering,
}: {
  chapter: Chapter;
  entering: ReturnType<typeof useEntering>;
}) {
  return (
    <motion.li className="col-span-2 md:col-span-3" {...entering}>
      <Link href={chapter.link.href} className="group grid overflow-hidden md:grid-cols-3">
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-ink)] md:col-span-2 md:aspect-[16/9]">
          <PanelMedia media={chapter.media} sizes="(max-width: 1024px) 100vw, 62vw" />
        </div>
        <div className="flex flex-col justify-end bg-[var(--color-studio)] px-[var(--spacing-gutter)] py-6 md:px-[clamp(1.25rem,3vw,3rem)] md:py-[clamp(1.25rem,3vw,3rem)]">
          {chapter.label && <p className="t-label-sm muted">{chapter.label}</p>}
          <h3 className="t-h2 mt-2">{chapter.title}</h3>
          {chapter.line && <p className="t-voice soft mt-2 max-w-[30ch]">{chapter.line}</p>}
          <span className="link-edit mt-4">
            <span>{chapter.link.label}</span>
            <span aria-hidden="true" className="arrow">
              →
            </span>
          </span>
        </div>
      </Link>
    </motion.li>
  );
}
