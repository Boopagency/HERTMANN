"use client";

import { ActionForm } from "@/components/admin/ActionForm";
import { useActionState, useState } from "react";
import { LoaderIcon } from "lucide-react";
import { createProduct } from "@/lib/admin/actions/products";
import { idle } from "@/lib/admin/action-result";
import { slugify } from "@/lib/catalog/types";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { NativeSelect } from "@/components/admin/ui/select";
import { Switch } from "@/components/admin/ui/switch";
import { Label } from "@/components/admin/ui/label";
import { FormMessage } from "@/components/admin/FormMessage";
import { Field } from "./Field";

type Option = { value: string; label: string };

export function CreateProductForm({ categories, collections }: { categories: Option[]; collections: Option[] }) {
  const [state, action, pending] = useActionState(createProduct, idle);
  const [values, setValues] = useState({
    title: "",
    slug: "",
    category: "",
    collection: "",
    line: "",
    price: "",
    salePrice: "",
    sku: "",
    optionName: "",
    optionValue: "",
    inventoryQuantity: "1",
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [manageInventory, setManageInventory] = useState(true);
  const errors = state.fieldErrors ?? {};

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setValues((v) => ({
      ...v,
      [key]: value,
      ...(key === "title" && !slugEdited ? { slug: slugify(value) } : {}),
    }));
  };

  const invalid = (key: string) => (errors[key] ? { "aria-invalid": true, "aria-describedby": `${key}-erro` } : {});

  return (
    <ActionForm action={action} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>A peça</CardTitle>
            <CardDescription>O nome é o da loja e do checkout. O resto da ficha do site completa-se depois.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field id="title" label="Nome do produto" error={errors.title} className="sm:col-span-2">
              <Input id="title" name="title" value={values.title} onChange={set("title")} required maxLength={120} {...invalid("title")} />
            </Field>
            <Field id="category" label="Categoria" error={errors.category}>
              <NativeSelect id="category" name="category" value={values.category} onChange={set("category")} required {...invalid("category")}>
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
            <Field id="collection" label="Coleção" hint="Opcional." error={errors.collection}>
              <NativeSelect id="collection" name="collection" value={values.collection} onChange={set("collection")}>
                <option value="">Sem coleção</option>
                {collections.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field
              id="slug"
              label="Endereço no site"
              hint={<>/produto/<strong className="font-medium text-foreground">{values.slug || "…"}</strong> — minúsculas, números e hífens.</>}
              error={errors.slug}
              className="sm:col-span-2"
            >
              <Input
                id="slug"
                name="slug"
                value={values.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  set("slug")(e);
                }}
                required
                maxLength={80}
                {...invalid("slug")}
              />
            </Field>
            <Field id="line" label="Linha curta" hint="Uma linha que descreve a peça (ex.: Aliança de perfil abaulado)." error={errors.line} className="sm:col-span-2">
              <Input id="line" name="line" value={values.line} onChange={set("line")} maxLength={140} {...invalid("line")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preço e estoque</CardTitle>
            <CardDescription>
              Da primeira variante. Se a peça tem tamanhos, indique aqui o primeiro (ex.: Aro · 16) e adicione os outros na
              página do produto.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field id="price" label="Preço (R$)" error={errors.price}>
              <Input id="price" name="price" inputMode="decimal" placeholder="1.290,00" value={values.price} onChange={set("price")} required className="tabular" {...invalid("price")} />
            </Field>
            <Field id="salePrice" label="Preço promocional (R$)" hint="Opcional. Menor que o preço." error={errors.salePrice}>
              <Input id="salePrice" name="salePrice" inputMode="decimal" value={values.salePrice} onChange={set("salePrice")} className="tabular" {...invalid("salePrice")} />
            </Field>
            <Field id="optionName" label="Opção" hint="Opcional (ex.: Aro, Comprimento)." error={errors.optionName}>
              <Input id="optionName" name="optionName" value={values.optionName} onChange={set("optionName")} maxLength={40} />
            </Field>
            <Field id="optionValue" label="Valor da opção" hint="Ex.: 16, 42 cm." error={errors.optionValue}>
              <Input id="optionValue" name="optionValue" value={values.optionValue} onChange={set("optionValue")} maxLength={60} {...invalid("optionValue")} />
            </Field>
            <Field id="sku" label="SKU" hint="Opcional. Só pode ser definido agora — a loja não permite alterá-lo depois." error={errors.sku} className="sm:col-span-2">
              <Input id="sku" name="sku" value={values.sku} onChange={set("sku")} maxLength={60} />
            </Field>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch id="manageInventory" checked={manageInventory} onCheckedChange={setManageInventory} />
              <input type="hidden" name="manageInventory" value={manageInventory ? "true" : "false"} />
              <Label htmlFor="manageInventory" className="font-normal">
                Controlar estoque
              </Label>
            </div>
            {manageInventory && (
              <Field id="inventoryQuantity" label="Quantidade em estoque" error={errors.inventoryQuantity}>
                <Input id="inventoryQuantity" name="inventoryQuantity" type="number" min={0} step={1} value={values.inventoryQuantity} onChange={set("inventoryQuantity")} className="tabular" {...invalid("inventoryQuantity")} />
              </Field>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-4 lg:sticky lg:top-6">
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Criar como rascunho</CardTitle>
            <CardDescription>
              O produto nasce fora do site e fora da venda. Depois de completar a ficha e as imagens, publique-o na página do
              produto.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <FormMessage state={state} />
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <LoaderIcon className="animate-spin" />}
              Criar produto
            </Button>
          </CardContent>
        </Card>
      </div>
    </ActionForm>
  );
}
