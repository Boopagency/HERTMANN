import "server-only";

/* ============================================================================
   Configuração do Supabase — lida só no servidor
   ----------------------------------------------------------------------------
   SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY são Config: a chave publicável é
   pública por natureza (o que ela alcança é decidido pelo RLS no banco).
   Mesmo assim, fica só no servidor — sem prefixo NEXT_PUBLIC_ — porque o
   navegador nunca fala com o Supabase: o login é uma Server Action e o site
   lê a ficha editorial no servidor.

   Nenhuma chave secreta do Supabase (service_role / sb_secret_…) é usada
   pela aplicação.
   ========================================================================== */

export type SupabaseConfig = { url: string; publishableKey: string };

function read(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

export const supabaseConfig = read();
export const isSupabaseConfigured = supabaseConfig !== null;
