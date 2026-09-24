"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/* ============================================================================
   Formulário de contacto — três campos e um fio por baixo de cada um.
   Estados completos: repouso, foco, erro, a enviar, enviado.
   ========================================================================== */

type Status = "idle" | "loading" | "done";

const SUBJECTS = ["Uma peça do catálogo", "Peça sob encomenda", "Reparação", "Outro assunto"];

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const next: Record<string, string> = {};
    if (name.length < 2) next.name = "Indique o seu nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = "Verifique o endereço.";
    if (message.length < 10) next.message = "Conte-nos um pouco mais.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("loading");
    // Ponto de integração: substituir por POST para o serviço de atendimento.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setStatus("done");
    event.currentTarget.reset();
  }

  if (status === "done") {
    return (
      <div aria-live="polite">
        <p className="t-h3">Recebemos a sua mensagem.</p>
        <p className="t-body mt-5 max-w-[38ch]">
          Respondemos em até um dia útil. Se for urgente, fale connosco pelo
          WhatsApp.
        </p>
        <Button variant="line" arrow className="mt-8" onClick={() => setStatus("idle")}>
          Escrever outra mensagem
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-[34rem]">
      <fieldset>
        <legend className="t-label-sm muted">Assunto</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {SUBJECTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSubject(value)}
              aria-pressed={subject === value}
              className={cn(
                "t-label-sm h-11 border px-4",
                "transition-[background-color,color,border-color] duration-(--dur-normal)",
                subject === value
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                  : "border-[var(--color-rule)] hover:border-[var(--color-ink)]",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>
      <input type="hidden" name="subject" value={subject} />

      <div className="mt-7 space-y-6">
        <Field id="name" label="Nome" autoComplete="name" error={errors.name} />
        <Field id="email" label="E-mail" type="email" autoComplete="email" error={errors.email} />

        <label className="field block">
          <span className="t-label-sm muted">Mensagem</span>
          <textarea
            id="message"
            name="message"
            rows={4}
            required
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "message-error" : undefined}
            className="mt-2 w-full resize-none border-0 border-b border-[var(--color-rule)] bg-transparent pb-3 pt-2 text-sm font-light outline-none transition-colors duration-(--dur-normal) hover:border-[var(--color-ink-50)] focus:border-[var(--color-ink)]"
            style={{ transitionTimingFunction: "var(--ease-editorial)" }}
          />
          {errors.message && (
            <span id="message-error" className="t-label-sm mt-2 block">
              {errors.message}
            </span>
          )}
        </label>
      </div>

      <Button type="submit" loading={status === "loading"} className="mt-8 w-full sm:w-auto">
        Enviar mensagem
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <label className="field block" htmlFor={id}>
      <span className="t-label-sm muted">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        required
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-1"
      />
      {error && (
        <span id={`${id}-error`} className="t-label-sm mt-2 block">
          {error}
        </span>
      )}
    </label>
  );
}
