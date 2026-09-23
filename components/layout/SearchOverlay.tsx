"use client";

import Link from "next/link";
import { useState } from "react";
import { Overlay } from "@/components/layout/Overlay";
import { ProductThumb } from "@/components/product/ProductThumb";
import { MetalDot } from "@/components/product/ProductMedia";
import { categories, collections } from "@/lib/data/catalogue";
import { searchPieces } from "@/lib/search";
import { price } from "@/lib/format";

/* ============================================================================
   Busca — uma linha, um fio, e o catálogo que responde enquanto se escreve.
   ========================================================================== */

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const results = searchPieces(query, 6);
  const searching = query.trim().length >= 2;

  return (
    <Overlay
      open={open}
      onClose={onClose}
      from="top"
      label="Procurar no catálogo"
      panelClassName="inset-x-0 top-0 w-full bg-[var(--color-paper)] max-h-[100dvh] overflow-y-auto"
    >
      <div className="shell pb-[clamp(1.75rem,3.5vw,3rem)] pt-[clamp(1rem,2vw,1.5rem)]">
        <label className="block pr-12">
          <span className="t-label-sm muted">Procurar</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Peça, coleção, material ou referência"
            autoComplete="off"
            className="mt-2 w-full appearance-none border-0 border-b border-[var(--color-rule)] bg-transparent pb-3 font-[family-name:var(--font-text)] text-[clamp(1.35rem,2.4vw,2.1rem)] italic leading-tight outline-none transition-colors duration-500 placeholder:text-[var(--color-ink-30)] focus:border-[var(--color-ink)] [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            style={{ transitionTimingFunction: "var(--ease-editorial)" }}
          />
        </label>

        <div className="mt-6" aria-live="polite">
          {!searching ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="t-label-sm muted">Categorias</p>
                <ul className="mt-3 space-y-1.5">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/joias/${c.slug}`} onClick={onClose} className="t-name link-nav">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="t-label-sm muted">Coleções</p>
                <ul className="mt-3 space-y-1.5">
                  {collections.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/colecoes/${c.slug}`}
                        onClick={onClose}
                        className="t-name link-nav"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="t-body">
              Nada encontrado para <span className="text-[var(--color-ink)]">“{query}”</span>.
              Escreva-nos e procuramos por si —{" "}
              <Link
                href="/contato"
                onClick={onClose}
                className="link-underline text-[var(--color-ink)]"
              >
                contato
              </Link>
              .
            </p>
          ) : (
            <>
              <p className="t-label-sm muted">
                {results.length} {results.length === 1 ? "peça" : "peças"}
              </p>
              <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
                {results.map((piece) => (
                  <li key={piece.slug}>
                    <Link href={`/produto/${piece.slug}`} onClick={onClose} className="group block">
                      <ProductThumb piece={piece} sizes="(max-width: 640px) 45vw, 16vw" />
                      <p className="t-name mt-2.5 flex items-center justify-center gap-[0.55em] text-center">
                        <MetalDot piece={piece} />
                        {piece.name}
                      </p>
                      <p className="t-price mt-0.5 text-center">{price(piece.price)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </Overlay>
  );
}
