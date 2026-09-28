import type { DrawingVariant } from "@/components/brand/Marks";
import type { CategorySlug } from "@/lib/data/catalogue";
import type {
  EditorialInput,
  EditorialItem,
  ImageFit,
  SiteSettings,
} from "@/lib/catalog/types";

/* ============================================================================
   Linhas do banco ↔ domínio. Os nomes das colunas seguem
   supabase/migrations; qualquer mudança de esquema corrige-se aqui.
   ========================================================================== */

export type CatalogItemRow = {
  id: string;
  hostinger_product_id: string;
  slug: string;
  display_name: string | null;
  category: string;
  collection_slug: string | null;
  line: string;
  description: string;
  material: string;
  stone: string | null;
  measures: string;
  reference: string | null;
  drawing: string;
  image_fit: string;
  image_focus: string | null;
  made_to_order: boolean;
  featured: boolean;
  position: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export const CATALOG_ITEM_COLUMNS =
  "id, hostinger_product_id, slug, display_name, category, collection_slug, line, description, material, stone, measures, reference, drawing, image_fit, image_focus, made_to_order, featured, position, archived_at, created_at, updated_at";

export function itemFromRow(row: CatalogItemRow): EditorialItem {
  return {
    id: row.id,
    hostingerProductId: row.hostinger_product_id,
    slug: row.slug,
    displayName: row.display_name,
    category: row.category as CategorySlug,
    collectionSlug: row.collection_slug,
    line: row.line,
    description: row.description,
    material: row.material,
    stone: row.stone,
    measures: row.measures,
    reference: row.reference,
    drawing: row.drawing as DrawingVariant,
    imageFit: (row.image_fit === "cutout" ? "cutout" : "full") as ImageFit,
    imageFocus: row.image_focus,
    madeToOrder: row.made_to_order,
    featured: row.featured,
    position: row.position,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowFromInput(input: Partial<EditorialInput>): Partial<CatalogItemRow> {
  const row: Partial<CatalogItemRow> = {};
  if (input.hostingerProductId !== undefined) row.hostinger_product_id = input.hostingerProductId;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.displayName !== undefined) row.display_name = input.displayName;
  if (input.category !== undefined) row.category = input.category;
  if (input.collectionSlug !== undefined) row.collection_slug = input.collectionSlug;
  if (input.line !== undefined) row.line = input.line;
  if (input.description !== undefined) row.description = input.description;
  if (input.material !== undefined) row.material = input.material;
  if (input.stone !== undefined) row.stone = input.stone;
  if (input.measures !== undefined) row.measures = input.measures;
  if (input.reference !== undefined) row.reference = input.reference;
  if (input.drawing !== undefined) row.drawing = input.drawing;
  if (input.imageFit !== undefined) row.image_fit = input.imageFit;
  if (input.imageFocus !== undefined) row.image_focus = input.imageFocus;
  if (input.madeToOrder !== undefined) row.made_to_order = input.madeToOrder;
  if (input.featured !== undefined) row.featured = input.featured;
  if (input.position !== undefined) row.position = input.position;
  return row;
}

export type SiteSettingsRow = { show_prototypes: boolean };

export function settingsFromRow(row: SiteSettingsRow | null): SiteSettings {
  return { showPrototypes: row?.show_prototypes ?? true };
}
