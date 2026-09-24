"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAnimate, useReducedMotion } from "motion/react";
import { Lockup } from "@/components/brand/Logo";
import { IconBag, IconMenu, IconSearch } from "@/components/brand/Icons";
import { SideMenu } from "@/components/layout/SideMenu";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { BagDrawer } from "@/components/commerce/BagDrawer";
import { useStore } from "@/components/commerce/StoreProvider";
import { useScrolled } from "@/components/layout/useScrolled";
import { Ticker } from "@/components/motion/Ticker";
import { DUR, EASE } from "@/components/motion/tokens";
import { home } from "@/lib/data/editorial";
import { site } from "@/lib/data/site";
import { cn } from "@/lib/utils";

/* ============================================================================
   Cabeçalho
   ----------------------------------------------------------------------------
   Menu à esquerda, a marca ao centro, os acessos à direita, e um fio de
   1 px alinhado com as margens. Sobre o hero da home é transparente; ao
   rolar — e em todas as outras páginas — torna-se vidro fosco: branco a
   74 %, desfoque de 18 px, o fio passa a atravessar a largura inteira.
   Sem sombras, sem cantos, sem cartões. A passagem é gradual (560 ms).
   Quando entra uma peça na sacola, o ícone respira uma vez e o número
   troca no lugar — sem saltos.
   ========================================================================== */

/** Um único esmaecer do ícone da sacola quando a contagem sobe. */
function useBagPulse(count: number, ready: boolean) {
  const reduced = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const previous = useRef<number | null>(null);

  useEffect(() => {
    if (!ready) return;
    const before = previous.current;
    previous.current = count;
    if (before === null || count <= before || reduced || !scope.current) return;
    animate(scope.current, { opacity: [1, 0.35, 1] }, { duration: DUR.slow, ease: EASE });
  }, [count, ready, reduced, animate, scope]);

  return scope;
}

const ACCESS = [
  { label: "Visite a boutique", href: "/contato" },
  { label: "Atendimento por vídeo", href: "/contato" },
  { label: "WhatsApp", href: site.contact.whatsappUrl, external: true },
];

export function Header() {
  const scrolled = useScrolled(8);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { bagCount, setBagOpen, ready } = useStore();
  const bagIcon = useBagPulse(bagCount, ready);

  const overlay = pathname === "/";
  const atTop = overlay && !scrolled;

  return (
    <>
      <header
        className="site-header"
        data-glass={!atTop}
        data-tone={atTop ? home.hero.headerTone : "dark"}
        data-tone-portrait={atTop ? home.hero.headerTonePortrait : "dark"}
        data-tone-right={atTop ? home.hero.headerToneRight : undefined}
      >
        <div className="relative flex h-full items-center px-[var(--spacing-gutter)]">
          {/* — Menu — */}
          <div className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="tap relative -ml-2.5 grid h-11 w-11 place-items-center"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              aria-controls="menu-lateral"
            >
              <IconMenu size={22} />
            </button>
          </div>

          {/* — Marca — */}
          <Link href="/" className="tap relative shrink-0" aria-label="HERTMANN — página inicial">
            <Lockup className="text-[0.85rem] lg:text-[1.02rem]" />
          </Link>

          {/* — Acessos — */}
          <div className="header-right -mr-2.5 flex flex-1 items-center justify-end">
            <Link
              href="/contato"
              className="t-label-sm link-nav mr-3 hidden lg:inline-block"
              data-active={pathname === "/contato"}
            >
              Atendimento
            </Link>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="tap relative grid h-11 w-11 place-items-center"
              aria-label="Procurar"
            >
              <IconSearch size={18} />
            </button>
            <button
              type="button"
              onClick={() => setBagOpen(true)}
              className="tap relative grid h-11 w-11 place-items-center"
              aria-label={
                ready && bagCount > 0
                  ? `Sacola, ${bagCount} ${bagCount === 1 ? "peça" : "peças"}`
                  : "Sacola, vazia"
              }
            >
              <span ref={bagIcon} className="grid place-items-center">
                <IconBag size={18} />
              </span>
              {ready && bagCount > 0 && (
                <Ticker
                  value={bagCount}
                  className="t-num absolute right-[0.55rem] top-[0.55rem] text-[0.5625rem] leading-none"
                />
              )}
            </button>
          </div>

          <span aria-hidden="true" className="header-rule" />
        </div>

        {/* — Acessos de serviço, sob o fio — só no topo da home */}
        {overlay && (
          <nav
            aria-label="Serviços"
            className={cn(
              "header-right absolute right-[var(--spacing-gutter)] top-full mt-3 hidden gap-2 lg:flex",
              "transition-[opacity,transform] duration-(--dur-normal)",
              atTop ? "opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
            )}
          >
            {ACCESS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                {...(item.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                tabIndex={atTop ? undefined : -1}
                className={cn(
                  "t-label-sm flex h-7 items-center border px-3 text-[0.5625rem]",
                  "transition-[background-color,color] duration-(--dur-normal)",
                  "border-[color-mix(in_srgb,currentColor_55%,transparent)]",
                  "hover:border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]",
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <BagDrawer />
    </>
  );
}
