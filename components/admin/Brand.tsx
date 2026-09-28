import { cn } from "@/components/admin/ui/cn";

/**
 * Assinatura do painel: o monograma HM (máscara, herda a cor) e o nome em
 * Cormorant SC — o único lugar do painel com a tipografia da marca.
 */
export function AdminBrand({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5 text-brand", className)}>
      <span
        aria-hidden="true"
        className="block size-7 shrink-0 bg-current"
        style={{
          WebkitMaskImage: "url(/brand/monogram-white.png)",
          maskImage: "url(/brand/monogram-white.png)",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-brand text-[1.05rem] tracking-[0.14em]">Hertmann</span>
          <span className="mt-1 text-[0.65rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">Admin</span>
        </span>
      )}
    </span>
  );
}
