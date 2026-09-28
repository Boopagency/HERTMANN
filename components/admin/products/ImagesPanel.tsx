"use client";

import { ActionForm } from "@/components/admin/ActionForm";
import { useActionState, useEffect, useRef } from "react";
import { LoaderIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/admin/actions/products";
import { idle } from "@/lib/admin/action-result";
import type { AdminImage } from "@/lib/admin/commerce/types";
import { Button } from "@/components/admin/ui/button";
import { FormMessage } from "@/components/admin/FormMessage";
import { Thumb } from "./Thumb";

export function ImagesPanel({
  productId,
  images,
  canEdit,
  canRemove,
}: {
  productId: string;
  images: AdminImage[];
  canEdit: boolean;
  canRemove: boolean;
}) {
  const [state, action, pending] = useActionState(uploadImage.bind(null, productId), idle);
  const input = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message);
      form.current?.reset();
    }
  }, [state]);

  return (
    <div className="grid gap-3">
      {images.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {images.map((image, i) => (
            <li key={image.id} className="relative">
              <Thumb src={image.url} alt={image.alt ?? ""} className="aspect-square size-auto w-full rounded-lg" />
              {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">Principal</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Sem imagens. No site, a peça aparece com o desenho de ateliê.</p>
      )}
      {canEdit && (
        <ActionForm ref={form} action={action} className="grid gap-2">
          <input
            ref={input}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            id={`upload-${productId}`}
            onChange={(e) => {
              if (e.currentTarget.files?.length) e.currentTarget.form?.requestSubmit();
            }}
          />
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => input.current?.click()} className="w-fit">
            {pending ? <LoaderIcon className="animate-spin" /> : <UploadIcon />}
            {pending ? "Enviando…" : "Enviar imagem"}
          </Button>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP ou GIF, até 4 MB. A primeira imagem é a principal.
            {!canRemove && " Remover ou reordenar imagens ainda não é possível pela API da loja."}
          </p>
          {!state.ok && <FormMessage state={state} />}
        </ActionForm>
      )}
    </div>
  );
}
