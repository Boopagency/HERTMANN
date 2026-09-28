"use client";

import { useActionState } from "react";
import { LoaderIcon } from "lucide-react";
import { requestPasswordReset, type FormState } from "@/lib/admin/auth/actions";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { FormMessage } from "@/components/admin/FormMessage";

const initial: FormState = { ok: false, message: null };

export function ResetForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending || state.ok} className="w-full">
        {pending && <LoaderIcon className="animate-spin" />}
        Enviar link
      </Button>
    </form>
  );
}
