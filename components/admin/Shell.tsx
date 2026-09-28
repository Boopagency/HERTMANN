"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ExternalLinkIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  PackageIcon,
  ReceiptTextIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { signOut } from "@/lib/admin/auth/actions";
import type { AdminRole } from "@/lib/admin/auth/permissions";
import { roleLabel } from "@/lib/admin/auth/permissions";
import { AdminBrand } from "@/components/admin/Brand";
import { Button } from "@/components/admin/ui/button";
import { cn } from "@/components/admin/ui/cn";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/admin/ui/sheet";

type NavItem = { href: string; label: string; icon: typeof PackageIcon; exact?: boolean };

const baseNav: NavItem[] = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboardIcon, exact: true },
  { href: "/admin/produtos", label: "Produtos", icon: PackageIcon },
  { href: "/admin/pedidos", label: "Pedidos", icon: ReceiptTextIcon },
];

const adminNav: NavItem[] = [{ href: "/admin/site", label: "Site", icon: SlidersHorizontalIcon }];

type Member = { name: string | null; email: string; role: AdminRole };

function Nav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Painel" className="grid gap-0.5">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring",
              active && "bg-sidebar-active text-sidebar-active-foreground hover:bg-sidebar-active hover:text-sidebar-active-foreground",
            )}
          >
            {active && <span aria-hidden="true" className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-brand" />}
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ member, items, onNavigate }: { member: Member; items: NavItem[]; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-5 pb-6">
        <Link href="/admin" onClick={onNavigate} className="inline-flex rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring">
          <AdminBrand />
        </Link>
      </div>
      <div className="flex-1 px-3">
        <Nav items={items} onNavigate={onNavigate} />
      </div>
      <div className="grid gap-3 border-t p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
          Ver o site
        </a>
        <div className="flex items-center justify-between gap-2 px-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{member.name ?? member.email}</p>
            <p className="truncate text-xs text-muted-foreground">{roleLabel[member.role]}</p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="icon-sm" aria-label="Sair" title="Sair">
              <LogOutIcon />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({
  member,
  banner,
  children,
}: {
  member: Member;
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const items = member.role === "admin" ? [...baseNav, ...adminNav] : baseNav;

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r bg-sidebar lg:block">
        <SidebarBody member={member} items={items} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {banner}
        <div className="flex items-center gap-3 border-b px-4 py-2.5 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Abrir menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar p-0">
              <SheetTitle className="sr-only">Menu do painel</SheetTitle>
              <SidebarBody member={member} items={items} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <AdminBrand />
        </div>
        <main id="conteudo" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
