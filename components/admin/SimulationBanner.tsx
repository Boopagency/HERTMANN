import { FlaskConicalIcon } from "lucide-react";

/** Faixa permanente do modo simulado: nada do que se vê é real. */
export function SimulationBanner() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-1.5 text-xs font-medium text-[color-mix(in_oklab,var(--warning)_70%,black)]"
    >
      <FlaskConicalIcon className="size-3.5" aria-hidden="true" />
      Dados simulados — loja e banco de teste, em memória. Nada aqui chega à Hostinger nem ao Supabase.
    </div>
  );
}
