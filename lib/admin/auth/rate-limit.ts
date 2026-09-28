import "server-only";

/* ============================================================================
   Limite de tentativas de login — por IP e por e-mail
   ----------------------------------------------------------------------------
   Complementa os limites do próprio Supabase Auth, que veem todos os pedidos
   a chegar do mesmo servidor (a Vercel) e não distinguem visitantes.

   Limitação conhecida: o contador vive na memória de cada instância do
   servidor. Um limite global exige armazenamento partilhado (fase 2).
   ========================================================================== */

const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 8;

const attempts = new Map<string, number[]>();

function prune(key: string, now: number): number[] {
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length === 0) attempts.delete(key);
  else attempts.set(key, recent);
  return recent;
}

/** `true` se ainda pode tentar; regista a tentativa. */
export function allowAttempt(keys: string[]): boolean {
  const now = Date.now();
  if (keys.some((key) => prune(key, now).length >= MAX_ATTEMPTS)) return false;
  for (const key of keys) attempts.set(key, [...(attempts.get(key) ?? []), now]);
  return true;
}

/** Depois de um login bem-sucedido, o e-mail recomeça do zero. */
export function clearAttempts(key: string): void {
  attempts.delete(key);
}
