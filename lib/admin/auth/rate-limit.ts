import "server-only";

/* ============================================================================
   Limite de tentativas sem sucesso — por IP e por e-mail
   ----------------------------------------------------------------------------
   Complementa os limites do próprio Supabase Auth, que veem todos os pedidos
   a chegar do mesmo servidor (a Vercel) e não distinguem visitantes. Só as
   falhas contam: uma equipe no mesmo escritório pode entrar à vontade.

   Limitação conhecida: o contador vive na memória de cada instância do
   servidor. Um limite global exige armazenamento partilhado (fase 2).
   ========================================================================== */

const WINDOW_MS = 15 * 60_000;
const failures = new Map<string, number[]>();

function recent(key: string, now = Date.now()): number[] {
  const list = (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length === 0) failures.delete(key);
  else failures.set(key, list);
  return list;
}

/** `limits`: chave → máximo de falhas na janela. */
export function isBlocked(limits: Record<string, number>): boolean {
  return Object.entries(limits).some(([key, max]) => recent(key).length >= max);
}

export function recordFailure(keys: string[]): void {
  const now = Date.now();
  for (const key of keys) failures.set(key, [...recent(key, now), now]);
}

export function clearFailures(key: string): void {
  failures.delete(key);
}
