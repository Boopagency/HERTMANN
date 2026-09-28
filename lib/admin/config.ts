import "server-only";
import { simulationEnabled } from "@/lib/simulation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/* ============================================================================
   O painel existe neste ambiente?
   ----------------------------------------------------------------------------
   Fechado por omissão. Sem Supabase configurado (e fora do modo simulado
   local), /admin responde 404 — é o caso de Production enquanto não houver
   autorização para o ligar lá.
   ========================================================================== */

export const adminAuthMode: "supabase" | "simulado" | null = simulationEnabled
  ? "simulado"
  : isSupabaseConfigured
    ? "supabase"
    : null;

export const adminAvailable = adminAuthMode !== null;
