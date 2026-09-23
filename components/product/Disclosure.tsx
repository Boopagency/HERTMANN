"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE } from "@/components/motion/Reveal";

/* ============================================================================
   Informação secundária — abre-se com um fio que roda em cruz. Sem
   chevrons, sem molduras, sem sombras.
   ========================================================================== */

export function Disclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduced = useReducedMotion();

  return (
    <div className="border-b border-[var(--color-rule)]">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-6 py-4 text-left"
        >
          <span className="t-label">{title}</span>
          <span aria-hidden="true" className="relative h-3 w-3 shrink-0">
            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
            <span
              className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current transition-transform duration-[550ms] [transition-timing-function:var(--ease-editorial)]"
              style={{ transform: open ? "translateX(-50%) scaleY(0)" : "translateX(-50%) scaleY(1)" }}
            />
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.6, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="t-body max-w-[52ch] pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
