"use client";

import { ActionForm } from "@/components/admin/ActionForm";
import Link from "next/link";
import { useActionState } from "react";
import { LoaderIcon } from "lucide-react";
import { signIn, type FormState } from "@/lib/admin/auth/actions";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { FormMessage } from "@/components/admin/FormMessage";

const initial: FormState = { ok: false, message: null };

export function LoginForm({ next, notice }: { next?: string; notice?: string | null }) {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <ActionForm action={action} className="grid gap-4">
      {next && <input type="hidden" name="seguir" value={next} />}
      {notice && !state.message && <FormMessage state={{ ok: false, message: notice }} />}
      <div className="grid gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <Link href="/admin/senha/recuperar" className="text-xs text-brand hover:underline">
            Esqueci a senha
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending && <LoaderIcon className="animate-spin" />}
        Entrar
      </Button>
    </ActionForm>
  );
}
