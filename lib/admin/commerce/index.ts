import "server-only";
import { simulationEnabled } from "@/lib/simulation";
import { HostingerAdapter } from "./hostinger/provider";
import { readHostingerAdminConfig } from "./hostinger/http";
import { SimulatedProvider } from "./simulated";
import type { CommerceAdminProvider } from "./types";

/* ============================================================================
   Qual motor de e-commerce o painel usa
   ----------------------------------------------------------------------------
   ADMIN_COMMERCE_PROVIDER=hostinger (com HOSTINGER_API_TOKEN e
   HOSTINGER_STORE_ID) ou, só localmente, o simulado. O simulado nunca é
   aceite num deploy: fora do modo simulado (lib/simulation.ts) ele não
   existe, esteja a variável como estiver.
   ========================================================================== */

export type ProviderResolution =
  | { ok: true; provider: CommerceAdminProvider }
  | { ok: false; reason: string };

export function resolveCommerceProvider(): ProviderResolution {
  if (simulationEnabled) return { ok: true, provider: new SimulatedProvider() };

  const choice = process.env.ADMIN_COMMERCE_PROVIDER?.trim() || "hostinger";
  if (choice !== "hostinger") {
    return { ok: false, reason: `Motor "${choice}" não disponível neste ambiente.` };
  }

  const config = readHostingerAdminConfig();
  if (!config) {
    return {
      ok: false,
      reason:
        "A ligação à loja não está configurada neste ambiente (HOSTINGER_API_TOKEN e HOSTINGER_STORE_ID).",
    };
  }
  return { ok: true, provider: new HostingerAdapter(config) };
}

export * from "./types";
