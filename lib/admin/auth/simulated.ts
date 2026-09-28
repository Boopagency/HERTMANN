import "server-only";
import type { AdminRole } from "./permissions";

/* ============================================================================
   Contas do modo simulado — só local (lib/simulation.ts)
   ----------------------------------------------------------------------------
   Três contas de teste, uma por papel, para correr o painel e os testes E2E
   sem Supabase. Não existem em nenhum deploy: fora do modo simulado este
   módulo nunca é consultado.
   ========================================================================== */

export { SIMULATED_SESSION_COOKIE } from "@/lib/simulation";
export const SIMULATED_PASSWORD = "simulacao-local";

export const simulatedUsers: { email: string; name: string; role: AdminRole | null }[] = [
  { email: "admin@simulacao.local", name: "Admin (simulado)", role: "admin" },
  { email: "editor@simulacao.local", name: "Editor (simulado)", role: "editor" },
  { email: "leitura@simulacao.local", name: "Leitura (simulado)", role: "leitura" },
  // Conta que existe mas não é membro — para testar "sem acesso".
  { email: "fora@simulacao.local", name: "Sem acesso (simulado)", role: null },
];

export function simulatedUser(email: string | undefined) {
  return simulatedUsers.find((u) => u.email === email);
}
