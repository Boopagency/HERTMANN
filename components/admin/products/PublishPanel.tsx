"use client";

import { useTransition } from "react";
import { ArchiveIcon, ArchiveRestoreIcon, CheckIcon, CircleIcon, EyeOffIcon, LoaderIcon, RocketIcon } from "lucide-react";
import { toast } from "sonner";
import { archiveProduct, publishProduct, unpublishProduct } from "@/lib/admin/actions/products";
import type { ActionResult } from "@/lib/admin/action-result";
import type { ProductStatus } from "@/lib/admin/commerce/types";
import type { ReadinessItem } from "@/lib/admin/readiness";
import { Button } from "@/components/admin/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/admin/ui/alert-dialog";
import { cn } from "@/components/admin/ui/cn";

export function PublishPanel({
  productId,
  status,
  readiness,
  canPublish,
  canArchive,
}: {
  productId: string;
  status: ProductStatus;
  readiness: ReadinessItem[];
  canPublish: boolean;
  canArchive: boolean;
}) {
  const [pending, start] = useTransition();
  const ready = readiness.every((r) => r.ok || !r.required);

  const run = (task: () => Promise<ActionResult>) =>
    start(async () => {
      const result = await task();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });

  return (
    <div className="grid gap-4">
      {status !== "archived" && (
        <ul className="grid gap-2 text-sm">
          {readiness.map((item) => (
            <li key={item.key} className="flex items-start gap-2">
              {item.ok ? (
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" aria-label="Feito" />
              ) : (
                <CircleIcon className={cn("mt-0.5 size-4 shrink-0", item.required ? "text-warning" : "text-muted-foreground/60")} aria-label="Por fazer" />
              )}
              <span className={cn(!item.ok && "text-muted-foreground")}>
                {item.label}
                {!item.ok && !item.required && <span className="text-xs"> (recomendado)</span>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {canPublish && status === "draft" && (
        <Button disabled={!ready || pending} onClick={() => run(() => publishProduct(productId))}>
          {pending ? <LoaderIcon className="animate-spin" /> : <RocketIcon />}
          Publicar no site e na loja
        </Button>
      )}
      {canPublish && status === "published" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={pending}>
              {pending ? <LoaderIcon className="animate-spin" /> : <EyeOffIcon />}
              Despublicar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Despublicar este produto?</AlertDialogTitle>
              <AlertDialogDescription>
                A peça sai do site e deixa de poder ser comprada. A ficha, os preços e o estoque ficam guardados — pode
                publicá-la de novo quando quiser.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => run(() => unpublishProduct(productId))}>Despublicar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {canArchive && status !== "archived" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={pending} className="w-fit text-muted-foreground">
              <ArchiveIcon />
              Arquivar produto
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Arquivar este produto?</AlertDialogTitle>
              <AlertDialogDescription>
                Sai do site e da venda e deixa de aparecer na lista principal. Nada é apagado: pode restaurá-lo depois.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => run(() => archiveProduct(productId, true))}>Arquivar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {canArchive && status === "archived" && (
        <Button variant="outline" disabled={pending} onClick={() => run(() => archiveProduct(productId, false))}>
          <ArchiveRestoreIcon />
          Restaurar como rascunho
        </Button>
      )}
    </div>
  );
}
