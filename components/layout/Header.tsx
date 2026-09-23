"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Lockup } from "@/components/brand/Logo";
import { IconBag, IconMenu, IconSearch } from "@/components/brand/Icons";
import { SideMenu } from "@/components/layout/SideMenu";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { BagDrawer } from "@/components/commerce/BagDrawer";
import { useStore } from "@/components/commerce/StoreProvider";
import { useScrolled } from "@/components/layout/useScrolled";
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
   Sem sombras, sem cantos, sem cartões.
   ========================================================================== */

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

  const overlay = pathname === "/";
  const atTop = overlay && !scrolled;

  return (
    <>
      <header
        className="site-header"
        data-glass={!atTop}
        data-tone={atTop ? home.hero.headerTone : "dark"}
        data-tone-portrait={atTop ? home.hero.headerTonePortrait : "dark"}
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
          <div className="-mr-2.5 flex flex-1 items-center justify-end">
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
              <IconBag size={18} />
              {ready && bagCount > 0 && (
                <span className="t-num absolute right-[0.55rem] top-[0.55rem] text-[0.5625rem] leading-none">
                  {bagCount}
                </span>
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
              "absolute right-[var(--spacing-gutter)] top-full mt-3 hidden gap-2 lg:flex",
              "transition-[opacity,transform] duration-500 [transition-timing-function:var(--ease-editorial)]",
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
                  "transition-[background-color,color] duration-500 [transition-timing-function:var(--ease-editorial)]",
                  home.hero.headerTone === "light"
                    ? "border-white/60 hover:bg-white hover:text-[var(--color-ink)]"
                    : "border-[var(--color-ink)]/35 hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]",
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
