"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { archiveOrphan } from "@/lib/admin/actions/products";
import { Button } from "@/components/admin/ui/button";

export function OrphanRow({ item, canArchive }: { item: { id: string; slug: string; productId: string }; canArchive: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-0">
      <div className="min-w-0 text-sm">
        <p className="font-medium">/produto/{item.slug}</p>
        <p className="truncate text-xs text-muted-foreground">Produto da loja: {item.productId}</p>
      </div>
      {canArchive && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await archiveOrphan(item.id);
              if (result.ok) toast.success(result.message);
              else toast.error(result.message);
            })
          }
        >
          Arquivar ficha
        </Button>
      )}
    </div>
  );
}
