"use client";

import { ActionForm } from "@/components/admin/ActionForm";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { LoaderIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { addVariant, deleteVariant, saveVariants } from "@/lib/admin/actions/products";
import { idle } from "@/lib/admin/action-result";
import type { AdminVariant } from "@/lib/admin/commerce/types";
import { moneyInput, parseMoney } from "@/lib/admin/money";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Switch } from "@/components/admin/ui/switch";
import { Label } from "@/components/admin/ui/label";
import { Badge } from "@/components/admin/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/admin/ui/dialog";
import { FormMessage } from "@/components/admin/FormMessage";
import { Field } from "./Field";

type Row = {
  id: string;
  label: string;
  sku: string | null;
  title: string;
  price: string;
  salePrice: string;
  manageInventory: boolean;
  inventoryQuantity: string;
};

function toRow(v: AdminVariant): Row {
  const options = v.options.map((o) => `${o.name}: ${o.value}`).join(" · ");
  return {
    id: v.id,
    label: options || v.title || "Variante única",
    sku: v.sku,
    title: v.title ?? "",
    price: moneyInput(v.price),
    salePrice: v.salePrice !== null ? moneyInput(v.salePrice) : "",
    manageInventory: v.manageInventory,
    inventoryQuantity: v.inventoryQuantity !== null ? String(v.inventoryQuantity) : "0",
  };
}

/** Linha → o que a Server Action espera (centavos), ou a primeira mensagem de erro. */
function serialize(rows: Row[]): { ok: true; json: string } | { ok: false; message: string } {
  const out = [];
  for (const [i, row] of rows.entries()) {
    const price = parseMoney(row.price);
    if (price === null || price <= 0) return { ok: false, message: `Linha ${i + 1}: preço inválido.` };
    const sale = row.salePrice.trim() ? parseMoney(row.salePrice) : null;
    if (row.salePrice.trim() && sale === null) return { ok: false, message: `Linha ${i + 1}: preço promocional inválido.` };
    if (sale !== null && sale >= price) return { ok: false, message: `Linha ${i + 1}: o preço promocional tem de ser menor que o preço.` };
    const qty = Number(row.inventoryQuantity || 0);
    if (row.manageInventory && (!Number.isInteger(qty) || qty < 0)) return { ok: false, message: `Linha ${i + 1}: estoque inválido.` };
    out.push({
      id: row.id,
      title: row.title.trim() || null,
      price,
      salePrice: sale,
      manageInventory: row.manageInventory,
      inventoryQuantity: row.manageInventory ? qty : null,
    });
  }
  return { ok: true, json: JSON.stringify(out) };
}

export function VariantsEditor({
  productId,
  variants,
  canEdit,
  canDelete,
}: {
  productId: string;
  variants: AdminVariant[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const initial = useMemo(() => variants.map(toRow), [variants]);
  const [rows, setRows] = useState(initial);
  const [state, action, pending] = useActionState(saveVariants.bind(null, productId), idle);
  const [clientError, setClientError] = useState<string | null>(null);
  useEffect(() => setRows(initial), [initial]);

  const dirty = JSON.stringify(rows) !== JSON.stringify(initial);
  const payload = serialize(rows);
  const update = (id: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="grid gap-4">
      <ActionForm
        action={action}
        onSubmit={(e) => {
          if (!payload.ok) {
            e.preventDefault();
            setClientError(payload.message);
          } else setClientError(null);
        }}
      >
        <input type="hidden" name="variants" value={payload.ok ? payload.json : "[]"} />
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-3">Variante</TableHead>
                <TableHead className="w-36">Preço (R$)</TableHead>
                <TableHead className="w-36">Promocional (R$)</TableHead>
                <TableHead className="w-40">Estoque</TableHead>
                {canDelete && <TableHead className="w-10 pr-3" aria-label="Ações" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-transparent">
                  <TableCell className="pl-3">
                    <p className="font-medium">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{row.sku ? `SKU ${row.sku}` : "sem SKU"}</p>
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`Preço de ${row.label}`}
                      inputMode="decimal"
                      value={row.price}
                      disabled={!canEdit}
                      onChange={(e) => update(row.id, { price: e.target.value })}
                      className="tabular h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`Preço promocional de ${row.label}`}
                      inputMode="decimal"
                      placeholder="—"
                      value={row.salePrice}
                      disabled={!canEdit}
                      onChange={(e) => update(row.id, { salePrice: e.target.value })}
                      className="tabular h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        aria-label={`Controlar estoque de ${row.label}`}
                        checked={row.manageInventory}
                        disabled={!canEdit}
                        onCheckedChange={(checked) => update(row.id, { manageInventory: checked })}
                      />
                      {row.manageInventory ? (
                        <Input
                          aria-label={`Estoque de ${row.label}`}
                          type="number"
                          min={0}
                          step={1}
                          value={row.inventoryQuantity}
                          disabled={!canEdit}
                          onChange={(e) => update(row.id, { inventoryQuantity: e.target.value })}
                          className="tabular h-8 w-20"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">sem controle</span>
                      )}
                    </div>
                  </TableCell>
                  {canDelete && (
                    <TableCell className="pr-3">
                      <DeleteVariant productId={productId} variantId={row.id} label={row.label} disabled={rows.length <= 1} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {canEdit && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <FormMessage state={clientError ? { ok: false, message: clientError } : dirty ? { ok: false, message: null } : state} />
            <div className="ml-auto flex items-center gap-2">
              {dirty && (
                <Button type="button" variant="ghost" onClick={() => setRows(initial)}>
                  Desfazer
                </Button>
              )}
              <Button type="submit" disabled={!dirty || pending}>
                {pending && <LoaderIcon className="animate-spin" />}
                Salvar preços e estoque
              </Button>
            </div>
          </div>
        )}
      </ActionForm>
      {canEdit && <AddVariant productId={productId} />}
    </div>
  );
}

function DeleteVariant({ productId, variantId, label, disabled }: { productId: string; variantId: string; label: string; disabled: boolean }) {
  const [pending, start] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${label}`} disabled={disabled || pending} title={disabled ? "Um produto precisa de pelo menos uma variante" : "Excluir variante"}>
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir a variante “{label}”?</AlertDialogTitle>
          <AlertDialogDescription>
            A variante sai da loja de imediato e deixa de poder ser comprada. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              start(async () => {
                const result = await deleteVariant(productId, variantId);
                if (result.ok) toast.success(result.message);
                else toast.error(result.message);
              })
            }
          >
            Excluir variante
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AddVariant({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addVariant.bind(null, productId), idle);
  const [manage, setManage] = useState(true);
  const errors = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      toast.success(state.message);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-fit">
          <PlusIcon />
          Adicionar variante
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova variante</DialogTitle>
          <DialogDescription>Um tamanho ou versão da peça, com preço e estoque próprios.</DialogDescription>
        </DialogHeader>
        <ActionForm action={action} className="grid gap-4 sm:grid-cols-2">
          <Field id="nv-optionName" label="Opção" hint="Ex.: Aro" error={errors.optionName}>
            <Input id="nv-optionName" name="optionName" maxLength={40} />
          </Field>
          <Field id="nv-optionValue" label="Valor" hint="Ex.: 16" error={errors.optionValue}>
            <Input id="nv-optionValue" name="optionValue" maxLength={60} />
          </Field>
          <Field id="nv-price" label="Preço (R$)" error={errors.price}>
            <Input id="nv-price" name="price" inputMode="decimal" required className="tabular" />
          </Field>
          <Field id="nv-salePrice" label="Promocional (R$)" hint="Opcional." error={errors.salePrice}>
            <Input id="nv-salePrice" name="salePrice" inputMode="decimal" className="tabular" />
          </Field>
          <Field id="nv-sku" label="SKU" hint="Opcional; não muda depois." error={errors.sku} className="sm:col-span-2">
            <Input id="nv-sku" name="sku" maxLength={60} />
          </Field>
          <div className="flex items-center gap-3">
            <Switch id="nv-manage" checked={manage} onCheckedChange={setManage} />
            <input type="hidden" name="manageInventory" value={manage ? "true" : "false"} />
            <Label htmlFor="nv-manage" className="font-normal">
              Controlar estoque
            </Label>
          </div>
          {manage && (
            <Field id="nv-qty" label="Quantidade" error={errors.inventoryQuantity}>
              <Input id="nv-qty" name="inventoryQuantity" type="number" min={0} step={1} defaultValue="1" className="tabular" />
            </Field>
          )}
          <div className="grid gap-3 sm:col-span-2">
            {!state.ok && <FormMessage state={state} />}
            <Button type="submit" disabled={pending} className="justify-self-end">
              {pending && <LoaderIcon className="animate-spin" />}
              Adicionar
            </Button>
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

export function VariantSummaryBadge({ count }: { count: number }) {
  return <Badge variant="muted">{count === 1 ? "1 variante" : `${count} variantes`}</Badge>;
}
