import { ImageIcon } from "lucide-react";
import { cn } from "@/components/admin/ui/cn";

/** Miniatura do produto; sem imagem, um marcador discreto. */
export function Thumb({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- miniaturas do CDN da loja, sem otimização
        <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : (
        <ImageIcon className="size-4 text-muted-foreground" aria-hidden="true" />
      )}
    </span>
  );
}
