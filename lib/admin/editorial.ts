import "server-only";
import { adminAuthMode } from "@/lib/admin/config";
import { nextSimulatedId, simulatedState } from "@/lib/simulated/store";
import { createAdminSupabase } from "@/lib/supabase/server";
import {
  CATALOG_ITEM_COLUMNS,
  itemFromRow,
  rowFromInput,
  settingsFromRow,
  type CatalogItemRow,
  type SiteSettingsRow,
} from "@/lib/supabase/rows";
import type { EditorialInput, EditorialItem, SiteSettings } from "@/lib/catalog/types";
import type { AdminMember } from "./auth/member";

/* ============================================================================
   Fichas editoriais e configuração do site, vistas pelo Admin
   ----------------------------------------------------------------------------
   Com Supabase, tudo corre com a sessão do membro — o RLS decide (editor e
   admin escrevem, leitura só lê, só admin arquiva e mexe na configuração).
   No modo simulado, os mesmos contratos em memória.
   ========================================================================== */

export class EditorialError extends Error {
  constructor(message: string, readonly detail: string | null = null) {
    super(message);
    this.name = "EditorialError";
  }
}

function friendly(error: { code?: string; message: string }): EditorialError {
  if (error.code === "23505") {
    return new EditorialError("Já existe uma peça com este endereço (slug). Escolha outro.", error.message);
  }
  if (error.code === "42501") {
    return new EditorialError("O seu papel não permite esta alteração.", error.message);
  }
  if (error.code === "23514") {
    return new EditorialError("Algum campo da ficha tem um valor inválido.", error.message);
  }
  console.error("[admin:supabase]", error.code, error.message);
  return new EditorialError("Não foi possível gravar a ficha do site. Tente de novo.", error.message);
}

export interface EditorialRepository {
  list(): Promise<EditorialItem[]>;
  byProductId(productId: string): Promise<EditorialItem | null>;
  bySlug(slug: string): Promise<EditorialItem | null>;
  create(input: EditorialInput): Promise<EditorialItem>;
  update(id: string, patch: Partial<EditorialInput>): Promise<EditorialItem>;
  setArchived(id: string, archived: boolean): Promise<void>;
  settings(): Promise<SiteSettings>;
  updateSettings(patch: SiteSettings): Promise<void>;
}

class SupabaseEditorial implements EditorialRepository {
  private client() {
    return createAdminSupabase();
  }

  async list() {
    const { data, error } = await (await this.client())
      .from("catalog_items")
      .select(CATALOG_ITEM_COLUMNS)
      .order("position")
      .order("created_at");
    if (error) throw friendly(error);
    return (data as CatalogItemRow[]).map(itemFromRow);
  }

  private async one(column: "hostinger_product_id" | "slug", value: string) {
    const { data, error } = await (await this.client())
      .from("catalog_items")
      .select(CATALOG_ITEM_COLUMNS)
      .eq(column, value)
      .maybeSingle();
    if (error) throw friendly(error);
    return data ? itemFromRow(data as CatalogItemRow) : null;
  }

  byProductId(productId: string) {
    return this.one("hostinger_product_id", productId);
  }

  bySlug(slug: string) {
    return this.one("slug", slug);
  }

  async create(input: EditorialInput) {
    const { data, error } = await (await this.client())
      .from("catalog_items")
      .insert(rowFromInput(input))
      .select(CATALOG_ITEM_COLUMNS)
      .single();
    if (error) throw friendly(error);
    return itemFromRow(data as CatalogItemRow);
  }

  async update(id: string, patch: Partial<EditorialInput>) {
    const { hostingerProductId: _ignored, ...rest } = patch;
    const { data, error } = await (await this.client())
      .from("catalog_items")
      .update(rowFromInput(rest))
      .eq("id", id)
      .select(CATALOG_ITEM_COLUMNS)
      .maybeSingle();
    if (error) throw friendly(error);
    if (!data) throw new EditorialError("A ficha não foi gravada: o seu papel não o permite ou ela já não existe.");
    return itemFromRow(data as CatalogItemRow);
  }

  async setArchived(id: string, archived: boolean) {
    const { data, error } = await (await this.client())
      .from("catalog_items")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw friendly(error);
    if (!data) throw new EditorialError("Só um admin pode arquivar ou restaurar uma ficha.");
  }

  async settings() {
    const { data, error } = await (await this.client())
      .from("site_settings")
      .select("show_prototypes")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw friendly(error);
    return settingsFromRow(data as SiteSettingsRow | null);
  }

  async updateSettings(patch: SiteSettings) {
    const { data, error } = await (await this.client())
      .from("site_settings")
      .update({ show_prototypes: patch.showPrototypes })
      .eq("id", 1)
      .select("id")
      .maybeSingle();
    if (error) throw friendly(error);
    if (!data) throw new EditorialError("Só um admin pode alterar a configuração do site.");
  }
}

class SimulatedEditorial implements EditorialRepository {
  async list() {
    return structuredClone(simulatedState().editorial);
  }

  async byProductId(productId: string) {
    const item = simulatedState().editorial.find((i) => i.hostingerProductId === productId);
    return item ? structuredClone(item) : null;
  }

  async bySlug(slug: string) {
    const item = simulatedState().editorial.find((i) => i.slug === slug);
    return item ? structuredClone(item) : null;
  }

  async create(input: EditorialInput) {
    const state = simulatedState();
    if (state.editorial.some((i) => i.slug === input.slug)) {
      throw new EditorialError("Já existe uma peça com este endereço (slug). Escolha outro.");
    }
    if (state.editorial.some((i) => i.hostingerProductId === input.hostingerProductId)) {
      throw new EditorialError("Este produto já tem ficha.");
    }
    const now = new Date().toISOString();
    const item: EditorialItem = { ...input, id: nextSimulatedId("sim_ficha"), archivedAt: null, createdAt: now, updatedAt: now };
    state.editorial.push(item);
    return structuredClone(item);
  }

  async update(id: string, patch: Partial<EditorialInput>) {
    const state = simulatedState();
    const item = state.editorial.find((i) => i.id === id);
    if (!item) throw new EditorialError("A ficha já não existe.");
    const { hostingerProductId: _ignored, ...rest } = patch;
    if (rest.slug && state.editorial.some((i) => i.slug === rest.slug && i.id !== id)) {
      throw new EditorialError("Já existe uma peça com este endereço (slug). Escolha outro.");
    }
    Object.assign(item, rest, { updatedAt: new Date().toISOString() });
    return structuredClone(item);
  }

  async setArchived(id: string, archived: boolean) {
    const item = simulatedState().editorial.find((i) => i.id === id);
    if (!item) throw new EditorialError("A ficha já não existe.");
    item.archivedAt = archived ? new Date().toISOString() : null;
  }

  async settings() {
    return { ...simulatedState().settings };
  }

  async updateSettings(patch: SiteSettings) {
    simulatedState().settings = { ...patch };
  }
}

export function editorialRepository(): EditorialRepository {
  return adminAuthMode === "simulado" ? new SimulatedEditorial() : new SupabaseEditorial();
}

/* --------------------------------------------------------------------------
   Auditoria — nunca bloqueia a operação; uma falha fica no registo do servidor
   -------------------------------------------------------------------------- */

export type AuditEntry = {
  action: string;
  target: string | null;
  system: "hostinger" | "supabase";
  outcome: "ok" | "error";
  detail?: Record<string, unknown> | null;
};

export async function recordAudit(member: AdminMember, entry: AuditEntry): Promise<void> {
  const record = { ...entry, detail: entry.detail ?? null, userId: member.userId, at: new Date().toISOString() };
  console.info("[admin:auditoria]", JSON.stringify({ ...record, email: member.email }));

  try {
    if (adminAuthMode === "simulado") {
      simulatedState().audit.unshift(record);
      return;
    }
    const { error } = await (await createAdminSupabase()).from("admin_audit_log").insert({
      user_id: member.userId,
      action: entry.action,
      target: entry.target,
      system: entry.system,
      outcome: entry.outcome,
      detail: entry.detail ?? null,
    });
    if (error) console.error("[admin:auditoria] falha ao gravar", error.message);
  } catch (error) {
    console.error("[admin:auditoria] falha ao gravar", error);
  }
}
