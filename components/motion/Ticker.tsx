"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DUR, EASE, EASE_EXIT } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

/* ============================================================================
   Valor que muda no lugar — quantidades, o contador da sacola, o rótulo de
   um botão. O valor antigo sai 3 px para cima enquanto o novo entra de
   baixo, os dois em fade. A caixa não muda de tamanho: quem a usa fixa a
   largura, para que nada à volta se mexa.
   ========================================================================== */

export function Ticker({
  value,
  className,
  distance = 3,
}: {
  value: string | number;
  className?: string;
  /** Deslocamento vertical, em pixels. */
  distance?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <span className={cn("inline-grid overflow-hidden", className)}>
      <AnimatePresence initial={false}>
        <motion.span
          key={value}
          className="col-start-1 row-start-1"
          initial={reduced ? false : { opacity: 0, y: distance }}
          animate={{ opacity: 1, y: 0, transition: { duration: DUR.fast, ease: EASE } }}
          exit={
            reduced
              ? { opacity: 0, transition: { duration: 0 } }
              : { opacity: 0, y: -distance, transition: { duration: 0.14, ease: EASE_EXIT } }
          }
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
