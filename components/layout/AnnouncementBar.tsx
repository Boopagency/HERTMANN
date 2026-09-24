"use client";

import { useEffect, useState } from "react";
import { IconClose } from "@/components/brand/Icons";
import { announcements } from "@/lib/data/editorial";

/* ============================================================================
   Barra superior — uma linha fina em azul-marinho, a cor da casa, que
   desliza muito devagar. Letra pequena em branco, pausa ao passar o
   cursor, imóvel com movimento reduzido.
   Pode ser fechada; a escolha dura a sessão.
   ========================================================================== */

const KEY = "hertmann:bar:closed";

export function AnnouncementBar() {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(KEY) === "1") close(false);
    } catch {
      /* armazenamento indisponível — a barra fica visível */
    }
  }, []);

  function close(remember = true) {
    setClosed(true);
    document.documentElement.style.setProperty("--bar-h", "0px");
    if (!remember) return;
    try {
      window.sessionStorage.setItem(KEY, "1");
    } catch {
      /* sem persistência: fecha só nesta página */
    }
  }

  if (closed) return null;

  // Cada cópia tem de ser mais larga do que o ecrã para o laço não se ver.
  const line = [...announcements, ...announcements];

  return (
    <div
      className="on-ink relative z-[61] overflow-x-clip text-[rgba(255,255,255,0.86)]"
      style={{ height: "var(--bar-h)" }}
      role="region"
      aria-label="Informações da casa"
    >
      <p className="sr-only">{announcements.join(". ")}.</p>

      {/* A faixa termina antes do botão de fechar: o texto desvanece, não passa por baixo. */}
      <div
        className="marquee mr-[calc(var(--spacing-gutter)+1.5rem)] h-full overflow-hidden"
        aria-hidden="true"
      >
        <div className="marquee-track h-full items-center">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center">
              {line.map((message, i) => (
                <li
                  key={`${copy}-${i}`}
                  className="flex items-center whitespace-nowrap text-[0.625rem] uppercase leading-none tracking-[0.16em]"
                >
                  <span className="px-[1.6rem]">{message}</span>
                  <span className="opacity-40">·</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => close()}
        className="tap absolute right-[calc(var(--spacing-gutter)-0.5rem)] top-0 grid h-full w-7 place-items-center opacity-70 transition-opacity duration-(--dur-fast) hover:opacity-100"
        aria-label="Fechar a barra de informações"
      >
        <IconClose size={11} strokeWidth={1.2} />
      </button>
    </div>
  );
}
