"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconArrow } from "@/components/brand/Icons";

/* ============================================================================
   Botões e chamadas — sem cantos redondos, sem sombras, sem gradientes.
   Um rectângulo, um fio, um deslocamento de seta. Todos os estados
   declarados: repouso, hover, activo, foco, desactivado, a carregar.
   ========================================================================== */

type Variant = "solid" | "outline" | "line";
type Size = "sm" | "md";

const base =
  "relative inline-flex items-center justify-center gap-3 t-label select-none " +
  "transition-[background-color,color,border-color,opacity] duration-(--dur-normal) " +
  "disabled:pointer-events-none disabled:opacity-35 aria-disabled:pointer-events-none aria-disabled:opacity-35";

const sizes: Record<Size, string> = {
  sm: "h-11 px-6",
  md: "h-[3.4rem] px-9",
};

const variants: Record<Variant, string> = {
  solid:
    "bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-obsidian)] active:bg-[var(--color-obsidian)]",
  outline:
    "border border-[var(--color-rule)] text-[var(--color-ink)] hover:border-[var(--color-ink)] " +
    "hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]",
  line: "h-auto px-0 group/cta",
};

function Body({
  children,
  variant,
  loading,
  arrow,
}: {
  children: React.ReactNode;
  variant: Variant;
  loading?: boolean;
  arrow?: boolean;
}) {
  return (
    <>
      <span className={cn(loading && "opacity-0")}>
        {variant === "line" ? (
          <span className="relative inline-block pb-[6px]">
            {children}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-0 bottom-0 h-px origin-left bg-current",
                "transition-transform duration-(--dur-normal)",
                "scale-x-100 group-hover/cta:scale-x-0 group-focus-visible/cta:scale-x-0",
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-0 bottom-0 h-px origin-right scale-x-0 bg-current",
                "transition-transform delay-[120ms] duration-(--dur-normal)",
                "group-hover/cta:origin-left group-hover/cta:scale-x-100",
                "group-focus-visible/cta:origin-left group-focus-visible/cta:scale-x-100",
              )}
            />
          </span>
        ) : (
          children
        )}
      </span>

      {arrow && (
        <IconArrow
          size={16}
          className={cn(
            "shrink-0 transition-transform duration-(--dur-normal)",
            "group-hover/cta:translate-x-[3px] group-hover:translate-x-[3px]",
            loading && "opacity-0",
          )}
        />
      )}

      {loading && (
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center"
        >
          <span className="flex gap-[5px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-[3px] w-[3px] bg-current"
                style={{
                  animation: "hm-pulse 1.15s var(--ease-veil) infinite",
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </span>
        </span>
      )}
    </>
  );
}

type CommonProps = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  arrow?: boolean;
  loading?: boolean;
};

export function Button({
  children,
  variant = "solid",
  size = "md",
  className,
  arrow,
  loading,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, variant !== "line" && sizes[size], variants[variant], "group", className)}
      aria-busy={loading || undefined}
      {...rest}
    >
      <Body variant={variant} loading={loading} arrow={arrow}>
        {children}
      </Body>
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "solid",
  size = "md",
  className,
  arrow,
  external,
  ...rest
}: CommonProps & { href: string; external?: boolean } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const classes = cn(
    base,
    variant !== "line" && sizes[size],
    variants[variant],
    "group",
    className,
  );

  if (external) {
    return (
      <a href={href} className={classes} rel="noreferrer noopener" target="_blank" {...rest}>
        <Body variant={variant} arrow={arrow}>
          {children}
        </Body>
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      <Body variant={variant} arrow={arrow}>
        {children}
      </Body>
    </Link>
  );
}
