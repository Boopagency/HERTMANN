"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/* ============================================================================
   Newsletter — um fio e um botão rectangular. Estados: repouso, foco,
   a enviar, enviado, erro. Nenhum deles altera a composição.
   ========================================================================== */

type Status = "idle" | "loading" | "done" | "error";

export function Newsletter({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    // Ponto de integração: substituir por POST para o serviço de newsletter.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setStatus("done");
    setEmail("");
  }

  return (
    <div className={className}>
      <p className="t-h4">O círculo HERTMANN</p>
      <p className="t-body mt-2 max-w-[40ch] !text-[0.8125rem]">
        Novas peças, coleções e convites para a boutique — antes de chegarem ao
        catálogo.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-5 flex max-w-[26rem] items-end gap-3">
        <div className="field flex-1">
          <label htmlFor="newsletter-email" className="sr-only">
            O seu e-mail
          </label>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            value={email}
            required
            autoComplete="email"
            placeholder="O seu e-mail"
            aria-invalid={status === "error"}
            aria-describedby="newsletter-status"
            onChange={(event) => {
              setEmail(event.target.value);
              if (status !== "idle") setStatus("idle");
            }}
            disabled={status === "loading"}
          />
        </div>
        <button
          type="submit"
          className={cn(
            "t-label-sm h-10 shrink-0 border border-current px-5",
            "transition-[background-color,color,opacity] duration-500 [transition-timing-function:var(--ease-editorial)]",
            "hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)] disabled:opacity-35",
          )}
          disabled={status === "loading"}
        >
          {status === "loading" ? "A enviar" : "Inscrever"}
        </button>
      </form>

      <p
        id="newsletter-status"
        aria-live="polite"
        className={cn(
          "t-label-sm mt-3 transition-opacity duration-500",
          status === "idle" ? "opacity-0" : "opacity-100",
        )}
      >
        {status === "error" && "Verifique o endereço indicado."}
        {status === "loading" && "A subscrever…"}
        {status === "done" && "Obrigado. Está subscrito."}
        {status === "idle" && " "}
      </p>
    </div>
  );
}
