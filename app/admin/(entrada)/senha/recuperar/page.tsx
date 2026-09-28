import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/admin/auth/ResetForm";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecoverPage() {
  return (
    <>
      <h1 className="text-lg font-semibold">Recuperar a senha</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Enviamos um link para criar uma nova senha, se o e-mail tiver acesso ao painel.
      </p>
      <ResetForm />
      <Link href="/admin/entrar" className="mt-4 block text-center text-xs text-brand hover:underline">
        Voltar a entrar
      </Link>
    </>
  );
}
