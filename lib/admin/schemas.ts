import { z } from "zod";
import { categories, collections } from "@/lib/data/catalogue";
import { drawingVariants, SLUG_PATTERN } from "@/lib/catalog/types";
import { parseMoney } from "./money";

/* ============================================================================
   Validação no servidor de tudo o que chega dos formulários do painel
   ----------------------------------------------------------------------------
   A interface ajuda, mas só isto conta. Mensagens em português, para a
   equipe perceber o que corrigir.
   ========================================================================== */

const text = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres.`);
const optionalText = (max: number) =>
  text(max)
    .optional()
    .transform((v) => (v ? v : null));

const money = (label: string) =>
  z.string().transform((value, ctx) => {
    const minor = parseMoney(value);
    if (minor === null) {
      ctx.addIssue({ code: "custom", message: `${label}: use um valor como 1.234,56.` });
      return z.NEVER;
    }
    return minor;
  });

const optionalMoney = (label: string) =>
  z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (!value || !value.trim()) return null;
      const minor = parseMoney(value);
      if (minor === null) {
        ctx.addIssue({ code: "custom", message: `${label}: use um valor como 1.234,56.` });
        return z.NEVER;
      }
      return minor;
    });

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

const quantity = z
  .string()
  .optional()
  .transform((value, ctx) => {
    if (!value || !value.trim()) return null;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 100000) {
      ctx.addIssue({ code: "custom", message: "Estoque: um número inteiro, 0 ou mais." });
      return z.NEVER;
    }
    return n;
  });

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "O endereço precisa de pelo menos 2 caracteres.")
  .max(80)
  .regex(SLUG_PATTERN, "Use só letras minúsculas sem acento, números e hífens (ex.: anel-aurora).");

const categorySchema = z.enum(categories.map((c) => c.slug) as [string, ...string[]], {
  message: "Escolha uma categoria.",
});

const collectionSchema = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || collections.some((c) => c.slug === v), "Coleção desconhecida.");

/** Preço promocional só faz sentido abaixo do preço cheio. */
function checkSale<T extends { price: number; salePrice: number | null }>(value: T, ctx: z.RefinementCtx) {
  if (value.price <= 0) ctx.addIssue({ code: "custom", path: ["price"], message: "O preço precisa de ser maior que zero." });
  if (value.salePrice !== null && value.salePrice >= value.price) {
    ctx.addIssue({ code: "custom", path: ["salePrice"], message: "O preço promocional tem de ser menor que o preço." });
  }
}

const variantFields = {
  sku: optionalText(60),
  optionName: optionalText(40),
  optionValue: optionalText(60),
  price: money("Preço"),
  salePrice: optionalMoney("Preço promocional"),
  manageInventory: checkbox,
  inventoryQuantity: quantity,
};

function checkOption(v: { optionName: string | null; optionValue: string | null }, ctx: z.RefinementCtx) {
  if (Boolean(v.optionName) !== Boolean(v.optionValue)) {
    ctx.addIssue({ code: "custom", path: ["optionValue"], message: "Indique o nome da opção e o valor (ex.: Aro · 16)." });
  }
}

export const variantFormSchema = z
  .object({ title: optionalText(80), ...variantFields })
  .superRefine(checkSale)
  .superRefine(checkOption);

/** Criar produto: o produto e sua primeira variante, num só formulário. */
export const createProductSchema = z
  .object({
    title: text(120).min(2, "Dê um nome ao produto."),
    slug: slugSchema,
    category: categorySchema,
    collection: collectionSchema,
    line: text(140),
    ...variantFields,
  })
  .superRefine(checkSale)
  .superRefine(checkOption);

export const storeInfoSchema = z.object({
  title: text(120).min(2, "Dê um nome ao produto."),
  description: optionalText(4000),
});

export const variantRowSchema = z
  .object({
    id: z.string().min(1).max(100),
    title: z.string().trim().max(80).nullable(),
    price: z.number().int().nonnegative(),
    salePrice: z.number().int().nonnegative().nullable(),
    manageInventory: z.boolean(),
    inventoryQuantity: z.number().int().min(0).max(100000).nullable(),
  })
  .superRefine(checkSale);

export const variantRowsSchema = z.array(variantRowSchema).min(1).max(100);

export const editorialSchema = z.object({
  slug: slugSchema,
  displayName: optionalText(80),
  category: categorySchema,
  collection: collectionSchema,
  line: text(140),
  description: text(2000),
  material: text(140),
  stone: optionalText(140),
  measures: text(140),
  reference: optionalText(40),
  drawing: z.enum(drawingVariants.map((d) => d.value) as [string, ...string[]], { message: "Escolha um desenho." }),
  imageFit: z.enum(["full", "cutout"]),
  imageFocus: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^\d{1,3}% \d{1,3}%$/.test(v), "Ponto focal no formato 50% 40%."),
  madeToOrder: checkbox,
  featured: checkbox,
  position: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? Number(v) : 0))
    .refine((v) => Number.isInteger(v) && v >= -1000 && v <= 1000, "Ordem: um número inteiro."),
});

/** Primeira mensagem de cada campo, para mostrar junto do campo. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    out[key] ??= issue.message;
  }
  return out;
}
