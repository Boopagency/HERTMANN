"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Overlay } from "@/components/layout/Overlay";
import { IconChevron } from "@/components/brand/Icons";
import { EASE } from "@/components/motion/Reveal";
import { categories, type CategorySlug, type Piece } from "@/lib/data/catalogue";
import {
  activeCount,
  applySelection,
  facets,
  sorts,
  writeSelection,
  type FacetKey,
  type Selection,
  type SortKey,
} from "@/lib/filters";
import { cn } from "@/lib/utils";

/* ============================================================================
   Barra de filtros
   ----------------------------------------------------------------------------
   Um fio em cima, um fio em baixo, e entre eles filtros pequenos em linha;
   a ordenação à direita. Fica presa sob o cabeçalho enquanto se percorre a
   grelha. Cada filtro abre um painel por baixo da barra — texto e
   quadrados de 1 px, nada de cápsulas. No telemóvel, "Filtrar" abre uma
   folha inferior.
   ========================================================================== */

type Props = {
  selection: Selection;
  onChange?: (next: Selection) => void;
  /** Peças da página antes de filtrar — para as contagens por opção. */
  base: Piece[];
  count: number;
  /** Categoria activa; `null` esconde o filtro de categoria. */
  category?: CategorySlug | "todas" | null;
  hide?: FacetKey[];
};

export function FilterBar({ selection, onChange, base, count, category = null, hide = [] }: Props) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const visible = facets.filter((f) => !hide.includes(f.key));
  const active = activeCount(selection);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (bar.current && !bar.current.contains(event.target as Node)) setOpen(null);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const change = (next: Selection) => onChange?.(next);

  function toggle(key: FacetKey, value: string) {
    const current = selection.values[key] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    change({ ...selection, values: { ...selection.values, [key]: next } });
  }

  function clear() {
    change({ values: {}, novidades: false, ordem: selection.ordem });
  }

  /** Quantas peças ficariam se esta opção fosse a única do seu grupo. */
  function optionCount(key: FacetKey, value: string) {
    return applySelection(base, { ...selection, values: { ...selection.values, [key]: [value] } })
      .length;
  }

  const query = writeSelection(selection);
  const categoryItems = [
    { slug: "todas", name: "Todas as joias", href: `/joias${query}` },
    ...categories.map((c) => ({ slug: c.slug, name: c.name, href: `/joias/${c.slug}${query}` })),
  ];
  const currentCategory = categoryItems.find((c) => c.slug === category);

  const sortControl = (
    <label className="relative flex items-center gap-2">
      <span className="t-label-sm muted hidden sm:inline">Ordenar</span>
      <span className="sr-only sm:hidden">Ordenar</span>
      <select
        value={selection.ordem}
        onChange={(event) => change({ ...selection, ordem: event.target.value as SortKey })}
        className="t-label-sm cursor-pointer appearance-none bg-transparent pr-4 outline-none"
      >
        {sorts.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <IconChevron
        size={10}
        className="pointer-events-none absolute right-0 rotate-90"
        strokeWidth={1.4}
      />
    </label>
  );

  return (
    <>
      <div
        ref={bar}
        className="sticky top-[var(--header-h)] z-40 border-y border-[var(--color-rule)] bg-[rgba(255,255,255,0.86)] backdrop-blur-[18px]"
      >
        <div className="shell-plp flex h-12 items-center justify-between gap-6">
          {/* — Desktop: filtros em linha — */}
          <div className="hidden items-center gap-[clamp(1.25rem,2.2vw,2.25rem)] lg:flex">
            {category !== null && (
              <Trigger
                label="Categoria"
                value={
                  currentCategory && currentCategory.slug !== "todas"
                    ? currentCategory.name
                    : undefined
                }
                open={open === "categoria"}
                onClick={() => setOpen(open === "categoria" ? null : "categoria")}
              />
            )}
            {visible.map((facet) => (
              <Trigger
                key={facet.key}
                label={facet.label}
                count={selection.values[facet.key]?.length}
                open={open === facet.key}
                onClick={() => setOpen(open === facet.key ? null : facet.key)}
              />
            ))}
            {active > 0 && (
              <button type="button" onClick={clear} className="t-label-sm muted link-nav">
                Limpar
              </button>
            )}
          </div>

          {/* — Telemóvel: um botão — */}
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="t-label-sm flex items-center gap-2 lg:hidden"
            aria-haspopup="dialog"
          >
            <span className="relative h-2.5 w-2.5">
              <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
              <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
            </span>
            Filtrar{active > 0 && ` (${active})`}
          </button>

          <div className="flex items-center gap-[clamp(1rem,2.2vw,2.25rem)]">
            <p className="t-label-sm muted" aria-live="polite">
              {count} {count === 1 ? "peça" : "peças"}
            </p>
            {sortControl}
          </div>
        </div>

        {/* — Painel do filtro aberto — */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key={open}
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduced ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.45, ease: EASE }}
              className="absolute inset-x-0 top-full hidden overflow-hidden border-b border-[var(--color-rule)] bg-[rgba(255,255,255,0.96)] backdrop-blur-[18px] lg:block"
            >
              <div className="shell-plp flex flex-wrap gap-x-9 gap-y-3 py-5">
                {open === "categoria"
                  ? categoryItems.map((item) => (
                      <Link
                        key={item.slug}
                        href={item.href}
                        className="t-label-sm link-nav"
                        data-active={item.slug === category}
                        onClick={() => setOpen(null)}
                      >
                        {item.name}
                      </Link>
                    ))
                  : facets
                      .find((f) => f.key === open)
                      ?.options.map((option) => {
                        const key = open as FacetKey;
                        const checked = selection.values[key]?.includes(option.value) ?? false;
                        const n = optionCount(key, option.value);
                        return (
                          <Check
                            key={option.value}
                            label={option.label}
                            checked={checked}
                            count={n}
                            disabled={!checked && n === 0}
                            onClick={() => toggle(key, option.value)}
                          />
                        );
                      })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* — Folha de filtros no telemóvel — fora da barra: o desfoque da
          barra criaria um bloco de contenção para a camada fixa. */}
      <Overlay
        open={sheet}
        onClose={() => setSheet(false)}
        from="bottom"
        label="Filtrar peças"
        panelClassName="inset-x-0 bottom-0 max-h-[86dvh] overflow-y-auto bg-[var(--color-paper)]"
      >
        <div className="px-[var(--spacing-gutter)] pb-4 pt-5">
          <p className="t-label">Filtrar</p>

          {category !== null && (
            <div className="mt-4 border-t border-[var(--color-rule)] py-4">
              <p className="t-label-sm muted">Categoria</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categoryItems.map((item) => (
                  <Link
                    key={item.slug}
                    href={item.href}
                    onClick={() => setSheet(false)}
                    className={cn(
                      "t-label-sm flex h-10 items-center border px-3.5",
                      item.slug === category
                        ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                        : "border-[var(--color-rule)]",
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {visible.map((facet) => (
            <fieldset key={facet.key} className="border-t border-[var(--color-rule)] py-4">
              <legend className="t-label-sm muted float-left w-full">{facet.label}</legend>
              <div className="clear-both flex flex-wrap gap-2 pt-3">
                {facet.options.map((option) => {
                  const checked = selection.values[facet.key]?.includes(option.value) ?? false;
                  const n = optionCount(facet.key, option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={checked}
                      disabled={!checked && n === 0}
                      onClick={() => toggle(facet.key, option.value)}
                      className={cn(
                        "t-label-sm flex h-10 items-center border px-3.5 transition-colors duration-300 disabled:opacity-30",
                        checked
                          ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                          : "border-[var(--color-rule)]",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="sticky bottom-0 -mx-[var(--spacing-gutter)] flex gap-3 border-t border-[var(--color-rule)] bg-[var(--color-paper)] px-[var(--spacing-gutter)] pb-2 pt-4">
            <button
              type="button"
              onClick={clear}
              className="t-label-sm h-12 flex-1 border border-[var(--color-rule)]"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => setSheet(false)}
              className="t-label-sm h-12 flex-[2] bg-[var(--color-ink)] text-[var(--color-paper)]"
            >
              Ver {count} {count === 1 ? "peça" : "peças"}
            </button>
          </div>
        </div>
      </Overlay>
    </>
  );
}

function Trigger({
  label,
  value,
  count,
  open,
  onClick,
}: {
  label: string;
  value?: string;
  count?: number;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className="t-label-sm group flex items-center gap-1.5"
    >
      <span className="link-nav" data-active={open}>
        {label}
        {value && <span className="muted">: {value}</span>}
        {count ? <span className="muted"> ({count})</span> : null}
      </span>
      <IconChevron
        size={10}
        strokeWidth={1.4}
        className={cn(
          "transition-transform duration-500 [transition-timing-function:var(--ease-editorial)]",
          open ? "-rotate-90" : "rotate-90",
        )}
      />
    </button>
  );
}

function Check({
  label,
  checked,
  count,
  disabled,
  onClick,
}: {
  label: string;
  checked: boolean;
  count: number;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className="t-label-sm flex items-center gap-2.5 disabled:opacity-30"
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-[11px] w-[11px] border transition-colors duration-300",
          checked
            ? "border-[var(--color-ink)] bg-[var(--color-ink)]"
            : "border-[var(--color-ink)]/40",
        )}
      />
      {label}
      <span className="muted">{count}</span>
    </button>
  );
}
