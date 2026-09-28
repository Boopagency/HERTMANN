import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMemberState } from "@/lib/admin/auth/member";
import { adminAuthMode } from "@/lib/admin/config";
import { SIMULATED_PASSWORD, simulatedUsers } from "@/lib/admin/auth/simulated";
import { LoginForm } from "@/components/admin/auth/LoginForm";

export const metadata: Metadata = { title: "Entrar" };

type Props = { searchParams: Promise<{ seguir?: string; link?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const state = await getMemberState();
  if (state.status === "member") redirect("/admin");
  const { seguir, link } = await searchParams;

  return (
    <>
      <h1 className="text-lg font-semibold">Entrar no painel</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">Use o e-mail e a senha da sua conta HERTMANN.</p>
      <LoginForm
        next={seguir}
        notice={link === "expirado" ? "O link expirou ou já foi usado. Entre ou peça um novo." : null}
      />
      {adminAuthMode === "simulado" && (
        <div className="mt-6 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Contas de teste (modo simulado)</p>
          <ul className="mt-1.5 grid gap-0.5">
            {simulatedUsers.map((u) => (
              <li key={u.email}>
                <code>{u.email}</code> — {u.role ?? "sem acesso"}
              </li>
            ))}
          </ul>
          <p className="mt-1.5">
            Senha: <code>{SIMULATED_PASSWORD}</code>
          </p>
        </div>
      )}
    </>
  );
}
