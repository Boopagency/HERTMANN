import Link from "next/link";
import { Monogram } from "@/components/brand/Logo";
import { IconInstagram, IconWhatsApp } from "@/components/brand/Icons";
import { Newsletter } from "@/components/sections/Newsletter";
import { categories, collections } from "@/lib/data/catalogue";
import { nav, site } from "@/lib/data/site";

/* ============================================================================
   Rodapé — claro e denso. Colunas de links comerciais e de serviço, a
   newsletter à direita, um fio de 1 px, e por baixo as redes, os legais
   e a morada. Pouca altura, nenhuma assinatura gigante.
   ========================================================================== */

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Loja",
    links: [
      { label: "Novidades", href: "/joias?novidades=1" },
      { label: "Pronta-entrega", href: "/joias?entrega=pronta" },
      ...categories.map((c) => ({ label: c.name, href: `/joias/${c.slug}` })),
      { label: "Presentes", href: "/joias?preco=ate-10000" },
    ],
  },
  {
    title: "Coleções",
    links: [
      ...collections.map((c) => ({ label: c.name, href: `/colecoes/${c.slug}` })),
      { label: "Todas as coleções", href: "/colecoes" },
    ],
  },
  {
    title: "A casa",
    links: [
      { label: "Sobre a HERTMANN", href: "/sobre" },
      { label: "O ateliê", href: "/atelie" },
      { label: "A boutique", href: "/contato" },
    ],
  },
  {
    title: "Atendimento",
    links: [
      { label: "Contato", href: "/contato" },
      { label: "WhatsApp", href: site.contact.whatsappUrl, external: true },
      { label: "Marcar visita", href: "/contato" },
      { label: "E-mail", href: `mailto:${site.contact.email}` },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-rule)] bg-[var(--color-paper)]">
      <div className="shell-rail pb-[clamp(1.25rem,2vw,2rem)] pt-[clamp(2.5rem,3.7vw,3.75rem)]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4 lg:grid-cols-12 lg:gap-x-8">
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="lg:col-span-2">
              <p className="t-label-sm muted">{column.title}</p>
              <ul className="mt-4 space-y-[0.55rem]">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external || link.href.startsWith("mailto:") ? (
                      <a
                        href={link.href}
                        {...(link.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                        className="link-nav text-[0.8125rem] leading-snug"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="link-nav text-[0.8125rem] leading-snug">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <Newsletter className="col-span-2 sm:col-span-4 lg:col-span-4 lg:col-start-9" />
        </div>

        <hr className="rule mt-[clamp(2.25rem,4vw,3.5rem)]" />

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <Link href="/" aria-label="HERTMANN — página inicial">
              <Monogram className="w-7" />
            </Link>
            <span aria-hidden="true" className="h-4 w-px bg-[var(--color-rule)]" />
            {site.social.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={s.label}
                className="opacity-70 transition-opacity duration-300 hover:opacity-100"
              >
                <IconInstagram size={16} />
              </a>
            ))}
            <a
              href={site.contact.whatsappUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="WhatsApp"
              className="opacity-70 transition-opacity duration-300 hover:opacity-100"
            >
              <IconWhatsApp size={16} />
            </a>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-8">
            <ul className="flex gap-5">
              {nav.legal.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="t-label-sm muted link-nav">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="t-label-sm muted">{site.contact.address}</p>
            <p className="t-label-sm muted">
              © {new Date().getFullYear()} {site.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
