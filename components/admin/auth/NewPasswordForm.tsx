"use client";

import { useActionState } from "react";
import { LoaderIcon } from "lucide-react";
import { updatePassword, type FormState } from "@/lib/admin/auth/actions";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { FormMessage } from "@/components/admin/FormMessage";

const initial: FormState = { ok: false, message: null };

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial);

  return (
    <form action={action} className="grid max-w-sm gap-4">
      <div className="grid gap-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
        <p className="text-xs text-muted-foreground">Pelo menos 10 caracteres.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm">Repita a senha</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending && <LoaderIcon className="animate-spin" />}
        Gravar nova senha
      </Button>
    </form>
  );
}
