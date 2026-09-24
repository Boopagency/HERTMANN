"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CatalogueGrid } from "@/components/product/CatalogueGrid";
import { FilterBar } from "@/components/product/FilterBar";
import {
  activeCount,
  applySelection,
  facets,
  presetTitle,
  readSelection,
  writeSelection,
  type FacetKey,
  type Selection,
} from "@/lib/filters";
import type { CategorySlug, Piece } from "@/lib/data/catalogue";
import type { Chapter } from "@/lib/data/editorial";
import { DUR, EASE, EASE_EXIT } from "@/components/motion/tokens";

/* ============================================================================
   Vista de catálogo — barra de filtros + grelha
   ----------------------------------------------------------------------------
   O estado vive na URL. A página é estática: o HTML servido traz a grelha
   completa (bom para quem procura e para quem indexa) e, ao hidratar, a
   selecção da URL é aplicada.
   ========================================================================== */

type Props = {
  pieces: Piece[];
  /** Título da página quando não há abertura com imagem (ex.: "Todas as joias"). */
  title?: string;
  label?: string;
  line?: string;
  insert?: Chapter;
  category?: CategorySlug | "todas" | null;
  hide?: FacetKey[];
};

const EMPTY: Selection = { values: {}, novidades: false, ordem: "destaques" };

/**
 * Troca de resultados — quando a selecção muda, a nova grelha entra num
 * fade curto no mesmo lugar. Só opacidade: a grelha não se desloca nem
 * salta. A primeira pintura (HTML estático) nunca é animada.
 */
function Results({ id, children }: { id: string; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);

  return (
    <motion.div
      key={id}
      initial={first.current || reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DUR.normal, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Catalogue(props: Props) {
  return (
    <Suspense fallback={<CatalogueLayout {...props} selection={EMPTY} />}>
      <CatalogueWithParams {...props} />
    </Suspense>
  );
}

function CatalogueWithParams(props: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selection = useMemo(() => readSelection(params), [params]);

  return (
    <CatalogueLayout
      {...props}
      selection={selection}
      onChange={(next) => router.replace(`${pathname}${writeSelection(next)}`, { scroll: false })}
    />
  );
}

function CatalogueLayout({
  pieces,
  title,
  label,
  line,
  insert,
  category = null,
  hide,
  selection,
  onChange,
}: Props & { selection: Selection; onChange?: (next: Selection) => void }) {
  const reduced = useReducedMotion();
  const list = useMemo(() => applySelection(pieces, selection), [pieces, selection]);
  const active = activeCount(selection);
  const heading = title ? (presetTitle(selection) ?? title) : null;

  const chips = [
    ...(selection.novidades ? [{ key: "novidades", label: "Novidades" }] : []),
    ...facets.flatMap((facet) =>
      (selection.values[facet.key] ?? []).map((value) => ({
        key: `${facet.key}:${value}`,
        label: facet.options.find((o) => o.value === value)?.label ?? value,
      })),
    ),
  ];

  function remove(key: string) {
    if (key === "novidades") return onChange?.({ ...selection, novidades: false });
    const [facet, value] = key.split(":") as [FacetKey, string];
    onChange?.({
      ...selection,
      values: {
        ...selection.values,
        [facet]: (selection.values[facet] ?? []).filter((v) => v !== value),
      },
    });
  }

  return (
    <>
      {heading && (
        <div className="shell-plp flex flex-wrap items-end justify-between gap-x-10 gap-y-3 pb-[clamp(1.25rem,2.2vw,2rem)] pt-[calc(var(--header-h)+clamp(1.75rem,3.3vw,3rem))]">
          <div>
            {label && <p className="t-label-sm muted">{label}</p>}
            <h1 className="t-h1 mt-2">{heading}</h1>
          </div>
          {line && <p className="t-voice soft max-w-[46ch] md:text-right">{line}</p>}
        </div>
      )}

      <FilterBar
        selection={selection}
        onChange={onChange}
        base={pieces}
        count={list.length}
        category={category}
        hide={hide}
      />

      <div className="shell-plp pb-[var(--spacing-commerce)] pt-[clamp(1rem,2.2vw,2rem)]">
        {/* Os filtros activos abrem espaço em altura — a grelha desce
            suavemente em vez de saltar. */}
        <AnimatePresence initial={false}>
          {chips.length > 0 && (
            <motion.div
              key="chips"
              className="overflow-hidden"
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{
                height: "auto",
                opacity: 1,
                transition: { duration: reduced ? 0 : DUR.normal, ease: EASE },
              }}
              exit={{
                height: 0,
                opacity: 0,
                transition: { duration: reduced ? 0 : 0.26, ease: EASE_EXIT },
              }}
            >
              <div className="pb-[clamp(1rem,2vw,1.75rem)]">
                <ul className="flex flex-wrap items-center gap-2">
                  {chips.map((chip) => (
                    <li key={chip.key}>
                      <button
                        type="button"
                        onClick={() => remove(chip.key)}
                        className="t-label-sm flex h-8 items-center gap-2 border border-[var(--color-rule)] px-3 transition-colors duration-(--dur-fast) hover:border-[var(--color-ink)]"
                        aria-label={`Remover filtro ${chip.label}`}
                      >
                        {chip.label}
                        <span aria-hidden="true" className="text-[0.75rem] leading-none">
                          ×
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Results id={writeSelection(selection)}>
          {list.length > 0 ? (
            <CatalogueGrid
              pieces={list}
              insert={active === 0 && selection.ordem === "destaques" ? insert : undefined}
            />
          ) : (
            <div className="border-b border-[var(--color-rule)] py-16 text-center">
              <p className="t-h3">Nenhuma peça corresponde a esta selecção.</p>
              <p className="t-body mt-3">
                Retire um filtro, ou{" "}
                <Link href="/contato" className="link-underline text-[var(--color-ink)]">
                  fale com a casa
                </Link>{" "}
                — muitas peças são feitas sob encomenda.
              </p>
              <button
                type="button"
                onClick={() => onChange?.(EMPTY)}
                className="t-label-sm mt-6 h-11 border border-[var(--color-ink)] px-6 transition-colors duration-(--dur-normal) hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </Results>
      </div>
    </>
  );
}
