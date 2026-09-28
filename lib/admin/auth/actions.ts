"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminAuthMode } from "@/lib/admin/config";
import { createAdminSupabase } from "@/lib/supabase/server";
import { getMemberState } from "./member";
import { isAdminRole } from "./permissions";
import { allowAttempt, clearAttempts } from "./rate-limit";
import { SIMULATED_PASSWORD, SIMULATED_SESSION_COOKIE, simulatedUser } from "./simulated";

/* ============================================================================
   Entrar, sair e redefinir a senha — tudo no servidor
   ----------------------------------------------------------------------------
   O navegador nunca recebe um cliente Supabase: o formulário chama estas
   ações, e é o servidor que fala com o Auth e grava os cookies httpOnly.
   ========================================================================== */

export type FormState = { ok: boolean; message: string | null };

const GENERIC_LOGIN_ERROR = "E-mail ou senha incorretos.";

/** Só caminhos do próprio painel — nunca um redirecionamento aberto. */
function safeNext(value: unknown): string {
  if (typeof value !== "string") return "/admin";
  if (!value.startsWith("/admin") || value.startsWith("//") || value.includes("\\")) return "/admin";
  return value;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconhecido";
}

async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  if (!adminAuthMode) return { ok: false, message: "Painel indisponível neste ambiente." };

  const parsed = credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { ok: false, message: "Preencha o e-mail e a senha." };
  const { email, password } = parsed.data;

  const ip = await clientIp();
  if (!allowAttempt([`ip:${ip}`, `email:${email}`])) {
    return { ok: false, message: "Muitas tentativas. Aguarde 15 minutos e tente de novo." };
  }

  if (adminAuthMode === "simulado") {
    const user = simulatedUser(email);
    if (!user || password !== SIMULATED_PASSWORD) return { ok: false, message: GENERIC_LOGIN_ERROR };
    (await cookies()).set(SIMULATED_SESSION_COOKIE, user.email, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" && !(await origin()).startsWith("http://"),
      path: "/admin",
      maxAge: 60 * 60 * 12,
    });
  } else {
    const supabase = await createAdminSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { ok: false, message: GENERIC_LOGIN_ERROR };

    // Conta válida mas sem papel no painel: não fica com sessão.
    const { data: member } = await supabase
      .from("admin_members")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (!member || !isAdminRole(member.role)) {
      await supabase.auth.signOut();
      return { ok: false, message: "Esta conta não tem acesso ao painel. Fale com um administrador." };
    }
  }

  clearAttempts(`email:${email}`);
  redirect(safeNext(form.get("seguir")));
}

export async function signOut(): Promise<void> {
  if (adminAuthMode === "simulado") {
    (await cookies()).delete({ name: SIMULATED_SESSION_COOKIE, path: "/admin" });
  } else if (adminAuthMode === "supabase") {
    const supabase = await createAdminSupabase();
    await supabase.auth.signOut();
  }
  redirect("/admin/entrar");
}

const RESET_MESSAGE =
  "Se este e-mail tiver acesso ao painel, enviamos um link para criar uma nova senha. Veja também a caixa de spam.";

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const email = z.string().trim().toLowerCase().email().safeParse(form.get("email"));
  if (!email.success) return { ok: false, message: "Indique um e-mail válido." };

  const ip = await clientIp();
  if (!allowAttempt([`reset-ip:${ip}`, `reset:${email.data}`])) {
    return { ok: false, message: "Muitos pedidos. Aguarde 15 minutos e tente de novo." };
  }

  if (adminAuthMode === "supabase") {
    const supabase = await createAdminSupabase();
    // O Supabase só aceita redirecionamentos da lista de URLs permitidas do
    // projeto — um Host forjado não produz um link para outro domínio.
    await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${await origin()}/admin/auth/confirmar?seguir=/admin/senha/nova`,
    });
  }
  // A mesma resposta exista ou não a conta: não se revela quem tem acesso.
  return { ok: true, message: RESET_MESSAGE };
}

const newPassword = z
  .object({
    password: z.string().min(10, "A senha precisa de pelo menos 10 caracteres.").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "As duas senhas não coincidem.", path: ["confirm"] });

export async function updatePassword(_: FormState, form: FormData): Promise<FormState> {
  const state = await getMemberState();
  if (state.status === "anonymous") return { ok: false, message: "O link expirou. Peça um novo." };

  const parsed = newPassword.safeParse({ password: form.get("password"), confirm: form.get("confirm") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Senha inválida." };

  if (adminAuthMode === "supabase") {
    const supabase = await createAdminSupabase();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return { ok: false, message: "Não foi possível alterar a senha. Tente outra." };
  }
  redirect("/admin");
}
