import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";

/* ============================================================================
   Cliente Supabase do Admin — por pedido, com a sessão de quem está ligado
   ----------------------------------------------------------------------------
   A sessão vive em cookies httpOnly geridos pelo @supabase/ssr. Cada pedido
   cria o seu cliente (nunca partilhado entre pedidos). Todas as leituras e
   escritas correm como o próprio membro: o RLS do banco decide o que ele
   pode ver e mudar.
   ========================================================================== */

export async function createAdminSupabase(): Promise<SupabaseClient> {
  if (!supabaseConfig) throw new Error("Supabase não configurado (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY).");
  const cookieStore = await cookies();

  return createServerClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Chamado a partir de um Server Component, onde os cookies são só
          // de leitura. A renovação da sessão fica a cargo do middleware.
        }
      },
    },
  });
}
