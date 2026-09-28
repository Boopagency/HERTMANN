import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/components/admin/ui/cn";

/** Cabeçalho de página: trilha, título, descrição e ações à direita. */
export function PageHeader({
  title,
  description,
  crumbs,
  actions,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  crumbs?: { href: string; label: string }[];
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("border-b bg-background px-4 pt-5 pb-5 sm:px-8", className)}>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Trilha" className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {crumbs.map((c) => (
            <span key={c.href} className="flex items-center gap-1">
              <Link href={c.href} className="hover:text-foreground">
                {c.label}
              </Link>
              <ChevronRightIcon className="size-3" aria-hidden="true" />
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

/** Corpo de página com a largura e o respiro de uma ferramenta de trabalho. */
export function PageBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 py-6 sm:px-8", className)}>{children}</div>;
}
