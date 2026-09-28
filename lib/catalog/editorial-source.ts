import "server-only";
import { createClient } from "@supabase/supabase-js";
import { simulationEnabled } from "@/lib/simulation";
import { simulatedState } from "@/lib/simulated/store";
import { isSupabaseConfigured, supabaseConfig } from "@/lib/supabase/config";
import {
  CATALOG_ITEM_COLUMNS,
  itemFromRow,
  settingsFromRow,
  type CatalogItemRow,
  type SiteSettingsRow,
} from "@/lib/supabase/rows";
import type { EditorialItem, SiteSettings } from "./types";

/* ============================================================================
   Leitura editorial para o site público — sem sessão, só leitura
   ----------------------------------------------------------------------------
   O site lê as fichas no servidor com a chave publicável; o RLS só deixa
   ver fichas não arquivadas e a configuração do site. O navegador de quem
   visita nunca fala com o Supabase.

   Sem Supabase configurado (é o caso de Production hoje), não há fichas: o
   site mostra só o catálogo de protótipo, exactamente como antes.
   ========================================================================== */

export const editorialConfigured = simulationEnabled || isSupabaseConfigured;

export type SiteEditorial = { items: EditorialItem[]; settings: SiteSettings };

export class EditorialSourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EditorialSourceError";
  }
}

export async function readSiteEditorial(): Promise<SiteEditorial> {
  if (simulationEnabled) {
    const state = simulatedState();
    return {
      items: state.editorial.filter((item) => !item.archivedAt),
      settings: { ...state.settings },
    };
  }

  if (!supabaseConfig) {
    return { items: [], settings: { showPrototypes: true } };
  }

  const supabase = createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const [items, settings] = await Promise.all([
    supabase
      .from("catalog_items")
      .select(CATALOG_ITEM_COLUMNS)
      .is("archived_at", null)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("site_settings").select("show_prototypes").eq("id", 1).maybeSingle(),
  ]);

  // Um erro aqui sobe de propósito: numa revalidação, o Next continua a
  // servir a última página boa; num build, o deploy falha e a Vercel mantém
  // o anterior. Nunca se publica um site sem as peças por falha de leitura.
  if (items.error) throw new EditorialSourceError(`Supabase (catalog_items): ${items.error.message}`);
  if (settings.error) throw new EditorialSourceError(`Supabase (site_settings): ${settings.error.message}`);

  return {
    items: (items.data as CatalogItemRow[]).map(itemFromRow),
    settings: settingsFromRow(settings.data as SiteSettingsRow | null),
  };
}
