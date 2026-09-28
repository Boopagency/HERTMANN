"use client";

import { useActionState, useEffect, useState } from "react";
import { LoaderIcon } from "lucide-react";
import { saveEditorial } from "@/lib/admin/actions/products";
import { idle } from "@/lib/admin/action-result";
import type { EditorialItem } from "@/lib/catalog/types";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { NativeSelect } from "@/components/admin/ui/select";
import { Checkbox } from "@/components/admin/ui/checkbox";
import { Label } from "@/components/admin/ui/label";
import { Separator } from "@/components/admin/ui/separator";
import { FormMessage } from "@/components/admin/FormMessage";
import { Field } from "./Field";

type Option = { value: string; label: string };

type Values = {
  slug: string;
  displayName: string;
  category: string;
  collection: string;
  line: string;
  description: string;
  material: string;
  stone: string;
  measures: string;
  reference: string;
  drawing: string;
  imageFit: string;
  imageFocus: string;
  position: string;
};

function initialValues(item: EditorialItem | null, suggestion: { slug: string; drawing: string }): Values {
  return {
    slug: item?.slug ?? suggestion.slug,
    displayName: item?.displayName ?? "",
    category: item?.category ?? "",
    collection: item?.collectionSlug ?? "",
    line: item?.line ?? "",
    description: item?.description ?? "",
    material: item?.material ?? "",
    stone: item?.stone ?? "",
    measures: item?.measures ?? "",
    reference: item?.reference ?? "",
    drawing: item?.drawing ?? suggestion.drawing,
    imageFit: item?.imageFit ?? "full",
    imageFocus: item?.imageFocus ?? "",
    position: String(item?.position ?? 0),
  };
}

export function EditorialForm({
  productId,
  item,
  suggestion,
  slugLocked,
  canEdit,
  categories,
  collections,
  drawings,
  storeTitle,
}: {
  productId: string;
  item: EditorialItem | null;
  suggestion: { slug: string; drawing: string };
  slugLocked: boolean;
  canEdit: boolean;
  categories: Option[];
  collections: Option[];
  drawings: Option[];
  storeTitle: string;
}) {
  const [state, action, pending] = useActionState(saveEditorial.bind(null, productId), idle);
  const [values, setValues] = useState(() => initialValues(item, suggestion));
  const [madeToOrder, setMadeToOrder] = useState(item?.madeToOrder ?? false);
  const [featured, setFeatured] = useState(item?.featured ?? false);
  const errors = state.fieldErrors ?? {};
  useEffect(() => setValues(initialValues(item, suggestion)), [item, suggestion]);

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));
  const invalid = (key: string) => (errors[key] ? { "aria-invalid": true, "aria-describedby": `ed-${key}-erro` } : {});

  return (
    <form action={action} className="grid gap-5">
      <fieldset disabled={!canEdit || pending} className="grid gap-4 sm:grid-cols-2">
        <Field id="ed-displayName" label="Nome no site" hint={`Nome curto, como nas vitrines. Vazio = “${storeTitle}”.`} error={errors.displayName}>
          <Input id="ed-displayName" name="displayName" value={values.displayName} onChange={set("displayName")} maxLength={80} />
        </Field>
        <Field
          id="ed-slug"
          label="Endereço"
          hint={slugLocked ? "Travado enquanto o produto está publicado." : `/produto/${values.slug || "…"}`}
          error={errors.slug}
        >
          <Input id="ed-slug" name="slug" value={values.slug} onChange={set("slug")} readOnly={slugLocked} required maxLength={80} {...invalid("slug")} />
        </Field>
        <Field id="ed-category" label="Categoria" error={errors.category}>
          <NativeSelect id="ed-category" name="category" value={values.category} onChange={set("category")} required {...invalid("category")}>
            <option value="" disabled>
              Escolher…
            </option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="ed-collection" label="Coleção" error={errors.collection}>
          <NativeSelect id="ed-collection" name="collection" value={values.collection} onChange={set("collection")}>
            <option value="">Sem coleção</option>
            {collections.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="ed-line" label="Linha curta" hint="Uma linha, nunca um parágrafo." error={errors.line} className="sm:col-span-2">
          <Input id="ed-line" name="line" value={values.line} onChange={set("line")} maxLength={140} {...invalid("line")} />
        </Field>
        <Field id="ed-description" label="Descrição" error={errors.description} className="sm:col-span-2">
          <Textarea id="ed-description" name="description" value={values.description} onChange={set("description")} maxLength={2000} rows={4} {...invalid("description")} />
        </Field>
        <Field id="ed-material" label="Material" hint="Ex.: Ouro amarelo 18k" error={errors.material}>
          <Input id="ed-material" name="material" value={values.material} onChange={set("material")} maxLength={140} />
        </Field>
        <Field id="ed-stone" label="Pedra" hint="Opcional." error={errors.stone}>
          <Input id="ed-stone" name="stone" value={values.stone} onChange={set("stone")} maxLength={140} />
        </Field>
        <Field id="ed-measures" label="Medidas" hint="Ex.: Largura 4,2 mm · Espessura 1,8 mm" error={errors.measures}>
          <Input id="ed-measures" name="measures" value={values.measures} onChange={set("measures")} maxLength={140} />
        </Field>
        <Field id="ed-reference" label="Referência do modelo" hint="Opcional (ex.: HM–AR–014)." error={errors.reference}>
          <Input id="ed-reference" name="reference" value={values.reference} onChange={set("reference")} maxLength={40} />
        </Field>
      </fieldset>

      <Separator />

      <fieldset disabled={!canEdit || pending} className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-3 text-sm font-medium">Apresentação</legend>
        <Field id="ed-drawing" label="Desenho de ateliê" hint="Aparece na página da peça e substitui a foto quando não há imagem." error={errors.drawing}>
          <NativeSelect id="ed-drawing" name="drawing" value={values.drawing} onChange={set("drawing")}>
            {drawings.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="ed-imageFit" label="Enquadramento da foto" error={errors.imageFit}>
          <NativeSelect id="ed-imageFit" name="imageFit" value={values.imageFit} onChange={set("imageFit")}>
            <option value="full">Foto em sangria (preenche o quadro)</option>
            <option value="cutout">Recorte / packshot (joia centrada)</option>
          </NativeSelect>
        </Field>
        <Field id="ed-imageFocus" label="Ponto focal" hint="Opcional, ex.: 50% 40%." error={errors.imageFocus}>
          <Input id="ed-imageFocus" name="imageFocus" value={values.imageFocus} onChange={set("imageFocus")} placeholder="50% 50%" {...invalid("imageFocus")} />
        </Field>
        <Field id="ed-position" label="Ordem" hint="Menor aparece primeiro." error={errors.position}>
          <Input id="ed-position" name="position" type="number" step={1} value={values.position} onChange={set("position")} className="tabular" />
        </Field>
        <div className="flex items-center gap-2 self-end pb-2">
          <Checkbox id="ed-featured" checked={featured} onCheckedChange={(v) => setFeatured(v === true)} />
          <input type="hidden" name="featured" value={featured ? "true" : "false"} />
          <Label htmlFor="ed-featured" className="font-normal">
            Destaque na página inicial
          </Label>
        </div>
        <div className="flex items-center gap-2 self-end pb-2">
          <Checkbox id="ed-madeToOrder" checked={madeToOrder} onCheckedChange={(v) => setMadeToOrder(v === true)} />
          <input type="hidden" name="madeToOrder" value={madeToOrder ? "true" : "false"} />
          <Label htmlFor="ed-madeToOrder" className="font-normal">
            Sob encomenda
          </Label>
        </div>
      </fieldset>

      {canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FormMessage state={state} />
          <Button type="submit" disabled={pending} className="ml-auto">
            {pending && <LoaderIcon className="animate-spin" />}
            {item ? "Gravar ficha do site" : "Criar ficha do site"}
          </Button>
        </div>
      )}
    </form>
  );
}
