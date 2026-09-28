import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { adminAuthMode } from "@/lib/admin/config";
import { createAdminSupabase } from "@/lib/supabase/server";
import { can, isAdminRole, type AdminRole, type Permission } from "./permissions";
import { SIMULATED_SESSION_COOKIE, simulatedUser } from "./simulated";

/* ============================================================================
   Quem está a usar o painel — verificado no servidor, a cada pedido
   ----------------------------------------------------------------------------
   `getUser()` valida o token junto do Supabase Auth (uma conta removida ou
   bloqueada deixa de passar logo). Nunca `getSession()`, que só lê o cookie.
   O papel vem de admin_members, lido com a sessão do próprio membro (RLS).

   O middleware só redireciona quem não tem sessão; a autorização é esta, e
   corre em cada página e em cada Server Action antes de qualquer escrita.
   ========================================================================== */

export type AdminMember = {
  userId: string;
  email: string;
  name: string | null;
  role: AdminRole;
};

export type MemberState =
  | { status: "anonymous" }
  | { status: "not-member"; email: string }
  | { status: "member"; member: AdminMember };

export class AuthorizationError extends Error {
  constructor(message = "Seu papel não permite esta operação.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

async function readSimulated(): Promise<MemberState> {
  const email = (await cookies()).get(SIMULATED_SESSION_COOKIE)?.value;
  const user = simulatedUser(email);
  if (!user) return { status: "anonymous" };
  if (!isAdminRole(user.role)) return { status: "not-member", email: user.email };
  return {
    status: "member",
    member: { userId: `sim-${user.role}`, email: user.email, name: user.name, role: user.role },
  };
}

async function readSupabase(): Promise<MemberState> {
  const supabase = await createAdminSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anonymous" };

  const { data, error } = await supabase
    .from("admin_members")
    .select("role, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  // Falha a ler o papel não é "sem acesso": sobe, e a página mostra o erro.
  if (error) throw new Error(`Não foi possível verificar o acesso: ${error.message}`);
  if (!data || !isAdminRole(data.role)) return { status: "not-member", email: user.email ?? "" };

  return {
    status: "member",
    member: {
      userId: user.id,
      email: user.email ?? "",
      name: data.display_name ?? null,
      role: data.role,
    },
  };
}

/** Uma verificação por pedido, partilhada por layout, página e ações. */
export const getMemberState = cache(async (): Promise<MemberState> => {
  if (adminAuthMode === "simulado") return readSimulated();
  if (adminAuthMode === "supabase") return readSupabase();
  return { status: "anonymous" };
});

/** Para páginas: sem painel → 404; sem sessão → entrar; sem papel → sem acesso. */
export async function requireMember(): Promise<AdminMember> {
  if (!adminAuthMode) notFound();
  const state = await getMemberState();
  if (state.status === "anonymous") redirect("/admin/entrar");
  if (state.status === "not-member") redirect("/admin/sem-acesso");
  return state.member;
}

/** Para Server Actions: lança AuthorizationError em vez de redirecionar. */
export async function requirePermission(permission: Permission): Promise<AdminMember> {
  if (!adminAuthMode) throw new AuthorizationError("Painel indisponível neste ambiente.");
  const state = await getMemberState();
  if (state.status !== "member") throw new AuthorizationError("Sua sessão terminou. Entre de novo.");
  if (!can(state.member.role, permission)) throw new AuthorizationError();
  return state.member;
}
