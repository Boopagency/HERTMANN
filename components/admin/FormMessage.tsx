import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import type { ActionResult } from "@/lib/admin/action-result";
import { cn } from "@/components/admin/ui/cn";

/** Mensagem de um formulário (sucesso ou erro), anunciada a leitores de ecrã. */
export function FormMessage({ state, className }: { state: Pick<ActionResult, "ok" | "message">; className?: string }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cn("flex items-start gap-2 text-sm", state.ok ? "text-success" : "text-destructive", className)}
    >
      {state.ok ? <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" /> : <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />}
      <span>{state.message}</span>
    </p>
  );
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  );
}
