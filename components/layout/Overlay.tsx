"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { IconClose } from "@/components/brand/Icons";
import { useScrollLock } from "@/components/layout/useScrolled";
import { DUR, EASE, EASE_EXIT } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

/* ============================================================================
   Camada modal — véu, foco preso, Escape fecha, rolagem bloqueada.
   Serve o menu lateral, a busca, a sacola e os filtros no móvel.

   Movimento: o véu acende em 260 ms e o painel desliza em 440 ms, os dois
   na curva da casa. Fechar é mais rápido (véu 200 ms, painel 300 ms) e
   igual por qualquer caminho — X, véu, Escape ou um link lá dentro —
   porque todos passam por `onClose` e a saída vive no AnimatePresence.
   ========================================================================== */

const VEIL = {
  in: { duration: 0.26, ease: EASE },
  out: { duration: DUR.fast, ease: EASE_EXIT },
};

const PANEL = {
  in: { duration: 0.44, ease: EASE },
  out: { duration: 0.3, ease: EASE_EXIT },
};

const INSTANT = { duration: 0 };

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Overlay({
  open,
  onClose,
  children,
  from = "right",
  label,
  className,
  panelClassName,
  closeClassName,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  from?: "right" | "left" | "top" | "bottom";
  label: string;
  className?: string;
  panelClassName?: string;
  /** Posição do botão de fechar; por omissão, canto superior direito. */
  closeClassName?: string;
}) {
  const reduced = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const restore = useRef<HTMLElement | null>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    restore.current = document.activeElement as HTMLElement | null;

    const node = panel.current;
    const first = node?.querySelector<HTMLElement>(FOCUSABLE);
    window.setTimeout(() => first?.focus(), 60);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !node) return;

      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      restore.current?.focus?.();
    };
  }, [open, onClose]);

  const offscreen = {
    right: { x: "100%" },
    left: { x: "-100%" },
    top: { y: "-100%" },
    bottom: { y: "100%" },
  }[from];
  const onscreen = from === "left" || from === "right" ? { x: 0 } : { y: 0 };

  return (
    <AnimatePresence>
      {open && (
        <div className={cn("fixed inset-0 z-[90]", className)} role="dialog" aria-modal="true" aria-label={label}>
          <motion.button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-[var(--color-ink)]/20"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1, transition: reduced ? INSTANT : VEIL.in }}
            exit={{ opacity: 0, transition: reduced ? INSTANT : VEIL.out }}
          />

          <motion.div
            ref={panel}
            data-lenis-prevent
            className={cn("absolute", panelClassName)}
            initial={reduced ? false : offscreen}
            animate={{ ...onscreen, transition: reduced ? INSTANT : PANEL.in }}
            exit={{ ...offscreen, transition: reduced ? INSTANT : PANEL.out }}
          >
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "tap absolute z-10 grid h-11 w-11 place-items-center",
                closeClassName ?? "right-[clamp(0.5rem,2vw,1.75rem)] top-[clamp(0.5rem,1.4vw,1.25rem)]",
              )}
              aria-label="Fechar"
            >
              <IconClose size={18} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
