"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { IconClose } from "@/components/brand/Icons";
import { useScrollLock } from "@/components/layout/useScrolled";
import { EASE, EASE_VEIL } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/* ============================================================================
   Camada modal — véu, foco preso, Escape fecha, rolagem bloqueada.
   Serve o menu lateral, a busca, a sacola e os filtros no móvel.
   ========================================================================== */

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

  const panelMotion = {
    right: { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } },
    left: { initial: { x: "-100%" }, animate: { x: 0 }, exit: { x: "-100%" } },
    top: { initial: { y: "-100%" }, animate: { y: 0 }, exit: { y: "-100%" } },
    bottom: { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } },
  }[from];

  return (
    <AnimatePresence>
      {open && (
        <div className={cn("fixed inset-0 z-[90]", className)} role="dialog" aria-modal="true" aria-label={label}>
          <motion.button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-[var(--color-ink)]/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.5, ease: EASE }}
          />

          <motion.div
            ref={panel}
            data-lenis-prevent
            className={cn("absolute", panelClassName)}
            initial={reduced ? false : panelMotion.initial}
            animate={panelMotion.animate}
            exit={reduced ? undefined : panelMotion.exit}
            transition={{ duration: reduced ? 0 : 0.62, ease: EASE_VEIL }}
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
