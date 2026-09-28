import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/admin/auth/actions";
import { getMemberState } from "@/lib/admin/auth/member";
import { Button } from "@/components/admin/ui/button";

export const metadata: Metadata = { title: "Sem acesso" };

export default async function NoAccessPage() {
  const state = await getMemberState();
  if (state.status === "anonymous") redirect("/admin/entrar");
  if (state.status === "member") redirect("/admin");

  return (
    <>
      <h1 className="text-lg font-semibold">Esta conta não tem acesso</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Você entrou como <span className="font-medium text-foreground">{state.email}</span>, mas esta conta não tem um papel no
        painel. Peça a um administrador que lhe dê acesso.
      </p>
      <form action={signOut} className="mt-6">
        <Button type="submit" variant="outline" className="w-full">
          Sair
        </Button>
      </form>
    </>
  );
}
