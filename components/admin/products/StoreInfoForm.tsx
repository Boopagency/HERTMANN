"use client";

import { ActionForm } from "@/components/admin/ActionForm";
import { useActionState, useEffect, useState } from "react";
import { LoaderIcon } from "lucide-react";
import { saveStoreInfo } from "@/lib/admin/actions/products";
import { idle } from "@/lib/admin/action-result";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { FormMessage } from "@/components/admin/FormMessage";
import { Field } from "./Field";

export function StoreInfoForm({
  productId,
  title,
  description,
  canEdit,
}: {
  productId: string;
  title: string;
  description: string | null;
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState(saveStoreInfo.bind(null, productId), idle);
  const [values, setValues] = useState({ title, description: description ?? "" });
  useEffect(() => setValues({ title, description: description ?? "" }), [title, description]);
  const errors = state.fieldErrors ?? {};

  return (
    <ActionForm action={action} className="grid gap-4">
      <fieldset disabled={!canEdit || pending} className="grid gap-4">
        <Field id="st-title" label="Nome na loja e no checkout" error={errors.title}>
          <Input id="st-title" name="title" value={values.title} onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))} required maxLength={120} />
        </Field>
        <Field id="st-description" label="Descrição na loja" hint="Opcional. O texto do site é o da ficha acima." error={errors.description}>
          <Textarea id="st-description" name="description" value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} rows={3} maxLength={4000} />
        </Field>
      </fieldset>
      {canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FormMessage state={state} />
          <Button type="submit" variant="outline" disabled={pending} className="ml-auto">
            {pending && <LoaderIcon className="animate-spin" />}
            Salvar informações da loja
          </Button>
        </div>
      )}
    </ActionForm>
  );
}
