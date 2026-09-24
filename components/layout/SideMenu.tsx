"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Overlay } from "@/components/layout/Overlay";
import { ProductThumb } from "@/components/product/ProductThumb";
import { IconSearch } from "@/components/brand/Icons";
import { Wordmark } from "@/components/brand/Logo";
import { CrystalMark } from "@/components/brand/Marks";
import { DUR, EASE, EASE_EXIT, STAGGER } from "@/components/motion/tokens";
import { categories, categoryName, collections, piecesByCategory } from "@/lib/data/catalogue";
import { searchPieces } from "@/lib/search";
import { price } from "@/lib/format";
import { site } from "@/lib/data/site";
import { cn } from "@/lib/utils";

/* ============================================================================
   Menu lateral
   ----------------------------------------------------------------------------
   Um painel em azul-marinho — a cor da casa — que entra pela esquerda; a
   página continua visível por trás de um véu leve. A assinatura no topo,
   a busca, e depois a lista comercial: cada destino separado por um fio e
   a levantar-se um a um, como uma frase que se compõe (8 px, 30 ms entre
   cada, a começar quando o painel já vai a meio). Os destinos com "+"
   abrem-se no lugar, em altura e opacidade. Ao fechar, a lista sai com o
   painel — sem cascata inversa, para que fechar seja imediato.
   ========================================================================== */

type Child = { label: string; href: string; aside?: string; lead?: boolean };
type Item = { label: string; href?: string; children?: Child[] };

const byCategory = (slug: (typeof categories)[number]["slug"], all: string): Child[] => [
  { label: all, href: `/joias/${slug}`, lead: true },
  ...piecesByCategory(slug).map((p) => ({
    label: p.name,
    href: `/produto/${p.slug}`,
    aside: price(p.price),
  })),
];

const MENU: Item[] = [
  { label: "Novidades", href: "/joias?novidades=1" },
  { label: "Disponíveis", href: "/joias?entrega=pronta" },
  { label: "Anéis", children: byCategory("aneis", "Ver todos os anéis") },
  { label: "Brincos", children: byCategory("brincos", "Ver todos os brincos") },
  { label: "Colares", children: byCategory("colares", "Ver todos os colares") },
  { label: "Pulseiras", children: byCategory("pulseiras", "Ver todas as pulseiras") },
  {
    label: "Coleções",
    children: [
      { label: "Todas as coleções", href: "/colecoes", lead: true },
      ...collections.map((c) => ({ label: c.name, href: `/colecoes/${c.slug}`, aside: c.year })),
    ],
  },
  { label: "Presentes", href: "/joias?preco=ate-10000" },
  {
    label: "A casa",
    children: [
      { label: "Sobre a HERTMANN", href: "/sobre" },
      { label: "O ateliê", href: "/atelie" },
      { label: "A boutique", href: "/contato" },
    ],
  },
  { label: "Atendimento", href: "/contato" },
];

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const results = searchPieces(query, 8);
  const searching = query.trim().length >= 2;

  function close() {
    onClose();
    setQuery("");
    setExpanded(null);
  }

  return (
    <Overlay
      open={open}
      onClose={close}
      from="left"
      label="Menu"
      panelClassName="on-ink left-0 top-0 h-[100dvh] w-[min(88vw,32rem)] overflow-y-auto lg:w-[max(26rem,33vw)] lg:max-w-[38rem]"
      closeClassName="left-[calc(var(--spacing-gutter)-0.625rem)] top-[calc((var(--header-h)-2.75rem)/2)]"
    >
      <div id="menu-lateral" className="flex min-h-full flex-col px-[var(--spacing-gutter)]">
        {/* — Linha do cabeçalho: o botão de fechar ocupa o lugar do menu — */}
        <div className="flex h-[var(--header-h)] shrink-0 items-center justify-end border-b border-[var(--color-rule-invert)]">
          <Link href="/" onClick={close} aria-label="HERTMANN — página inicial">
            <Wordmark className="text-[1.05rem]" />
          </Link>
        </div>

        {/* — Busca — */}
        <label className="flex shrink-0 items-center gap-3 border-b border-[var(--color-rule-invert)]">
          <IconSearch size={15} className="shrink-0 opacity-70" />
          <span className="sr-only">Procurar no catálogo</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Procurar peças, coleções, materiais"
            autoComplete="off"
            className="h-14 w-full appearance-none bg-transparent font-[family-name:var(--font-text)] text-[1.0625rem] italic outline-none placeholder:text-[rgba(255,255,255,0.6)] [&::-webkit-search-cancel-button]:appearance-none"
          />
        </label>

        <motion.div
          key={searching ? "busca" : "menu"}
          aria-live="polite"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : DUR.fast, ease: EASE }}
        >
          {searching ? (
            results.length === 0 ? (
              <p className="t-body py-6">
                Nada encontrado para “{query}”.{" "}
                <Link
                  href="/contato"
                  onClick={close}
                  className="link-underline text-[var(--color-paper)]"
                >
                  Fale com a casa
                </Link>
                .
              </p>
            ) : (
              <ul>
                {results.map((piece) => (
                  <li key={piece.slug} className="border-b border-[var(--color-rule-invert)]">
                    <Link
                      href={`/produto/${piece.slug}`}
                      onClick={close}
                      className="group flex items-center gap-4 py-3"
                    >
                      <ProductThumb piece={piece} className="w-14 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="t-name block">{piece.name}</span>
                        <span className="t-label-sm muted mt-1 block">
                          {categoryName(piece.category)} · {piece.line}
                        </span>
                      </span>
                      <span className="t-price shrink-0">{price(piece.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <nav aria-label="Navegação principal">
              <ul>
                {MENU.map((item, index) => {
                  const isOpen = expanded === item.label;
                  const row =
                    "flex w-full items-center justify-between py-[0.95rem] text-left font-[family-name:var(--font-display)] text-[1.1875rem] leading-none tracking-[0.05em]";
                  return (
                    <motion.li
                      key={item.label}
                      className="border-b border-[var(--color-rule-invert)]"
                      initial={reduced ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: DUR.normal, ease: EASE, delay: 0.14 + index * STAGGER }}
                    >
                      {item.children ? (
                        <>
                          <button
                            type="button"
                            className={row}
                            aria-expanded={isOpen}
                            onClick={() => setExpanded(isOpen ? null : item.label)}
                          >
                            <span>{item.label}</span>
                            <span aria-hidden="true" className="relative h-2.5 w-2.5 shrink-0">
                              <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                              <span
                                className="absolute left-1/2 top-0 h-full w-px bg-current transition-transform duration-(--dur-normal) ease-(--ease-editorial)"
                                style={{
                                  transform: `translateX(-50%) scaleY(${isOpen ? 0 : 1})`,
                                }}
                              />
                            </span>
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
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
                                className="overflow-hidden"
                              >
                                <ul className="pb-4">
                                  {item.children.map((child) => (
                                    <li key={child.href + child.label}>
                                      <Link
                                        href={child.href}
                                        onClick={close}
                                        className="group flex items-baseline justify-between gap-4 py-[0.4rem] pl-0.5"
                                      >
                                        <span
                                          className={cn(
                                            "font-[family-name:var(--font-text)] text-[1.0625rem] leading-snug",
                                            child.lead && "italic",
                                          )}
                                        >
                                          <span className="link-nav">{child.label}</span>
                                        </span>
                                        {child.aside && (
                                          <span className="t-price shrink-0">{child.aside}</span>
                                        )}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link href={item.href!} onClick={close} className={row}>
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
            </nav>
          )}
        </motion.div>

        {/* — Serviço e o cristal da casa — */}
        <div className="mt-auto pb-8 pt-10">
          <hr className="rule rule-invert" />
          <div className="mt-5 flex items-end justify-between gap-6">
            <div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                <li>
                  <a
                    href={site.contact.whatsappUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="t-label-sm link-nav"
                  >
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href={`mailto:${site.contact.email}`} className="t-label-sm link-nav">
                    E-mail
                  </a>
                </li>
                {site.social.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="t-label-sm link-nav"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="t-label-sm muted mt-4">{site.contact.address}</p>
            </div>
            <CrystalMark className="h-14 w-auto shrink-0 opacity-30" />
          </div>
        </div>
      </div>
    </Overlay>
  );
}
