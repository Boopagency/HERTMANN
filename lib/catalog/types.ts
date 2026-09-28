import type { DrawingVariant } from "@/components/brand/Marks";
import type { CategorySlug } from "@/lib/data/catalogue";

/* ============================================================================
   Ficha editorial de um produto
   ----------------------------------------------------------------------------
   O que o site precisa para mostrar uma peça e que não pertence à loja:
   endereço, textos, coleção, desenho, ordem, destaque. Vive no Supabase.

   Nada comercial entra aqui — preço, promoção, estoque, SKU, variantes,
   título comercial, imagens e o estado de publicação são da Hostinger. A
   ficha liga-se ao produto só pelo `hostingerProductId`.
   ========================================================================== */

export type ImageFit = "full" | "cutout";

export type EditorialItem = {
  id: string;
  hostingerProductId: string;
  slug: string;
  /** Nome curto do site ("Perene"). Vazio = título do produto na loja. */
  displayName: string | null;
  category: CategorySlug;
  collectionSlug: string | null;
  line: string;
  description: string;
  material: string;
  stone: string | null;
  measures: string;
  /** Referência do modelo (ex.: HM–AR–014). Não é o SKU, que é da loja. */
  reference: string | null;
  drawing: DrawingVariant;
  imageFit: ImageFit;
  imageFocus: string | null;
  madeToOrder: boolean;
  featured: boolean;
  position: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EditorialInput = Omit<
  EditorialItem,
  "id" | "archivedAt" | "createdAt" | "updatedAt"
>;

export type SiteSettings = {
  /** As 12 peças de protótipo de lib/data/catalogue.ts continuam visíveis. */
  showPrototypes: boolean;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = { showPrototypes: true };

export const drawingVariants: { value: DrawingVariant; label: string }[] = [
  { value: "band", label: "Aro liso" },
  { value: "solitaire", label: "Solitário" },
  { value: "pendant", label: "Pendente" },
  { value: "pendantGem", label: "Pendente com pedra" },
  { value: "choker", label: "Gargantilha" },
  { value: "hoop", label: "Argola" },
  { value: "drop", label: "Brinco pendente" },
  { value: "stud", label: "Brinco de pressão" },
  { value: "links", label: "Elos" },
  { value: "bangle", label: "Bracelete" },
];

/** Desenho por omissão de cada categoria, até a equipa escolher outro. */
export const defaultDrawing: Record<CategorySlug, DrawingVariant> = {
  aneis: "band",
  colares: "pendant",
  brincos: "stud",
  pulseiras: "links",
};

/** Endereço de uma peça: minúsculas, números e hífens. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Tag de revalidação de tudo o que o site compõe a partir do catálogo. */
export const SITE_CATALOGUE_TAG = "site-catalogue";
