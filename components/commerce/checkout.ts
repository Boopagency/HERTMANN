"use client";

import { checkoutReturnUrls, createCheckout } from "@/lib/hostinger/client";
import type { CheckoutItem } from "@/lib/hostinger/types";

/* ============================================================================
   Checkout hospedado pela Hostinger
   ----------------------------------------------------------------------------
   A sacola troca-se por uma sessão de checkout e o navegador segue para a
   Hostinger. Antes de sair, fica registado neste dispositivo o que foi
   enviado, com uma referência aleatória que viaja no `success_url`: ao
   voltar, só sai da sacola o que foi a checkout, e só se a referência
   corresponder — abrir /checkout/sucesso à mão não esvazia nada.
   ========================================================================== */

const PENDING_KEY = "hertmann:checkout:pending";

/** Um regresso mais tardio do que isto já não corresponde a este checkout. */
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

export type PendingCheckout = {
  ref: string;
  items: CheckoutItem[];
  cartToken: string | null;
  createdAt: number;
};

function newRef(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }
}

/** Cria a sessão na Hostinger e entrega-lhe o navegador. */
export async function openHostedCheckout(items: CheckoutItem[]): Promise<void> {
  const ref = newRef();
  const session = await createCheckout(items, checkoutReturnUrls(ref));

  try {
    const pending: PendingCheckout = {
      ref,
      items,
      cartToken: session.cart_token ?? null,
      createdAt: Date.now(),
    };
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    /* sem registo, o regresso não esvazia a sacola — o lado seguro */
  }

  window.location.assign(session.url);
}

export function readPendingCheckout(): PendingCheckout | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingCheckout>;
    const items = Array.isArray(parsed.items)
      ? parsed.items.filter(
          (item): item is CheckoutItem =>
            typeof item?.variant_id === "string" && typeof item?.quantity === "number",
        )
      : [];

    if (typeof parsed.ref !== "string" || typeof parsed.createdAt !== "number") return null;
    if (Date.now() - parsed.createdAt > PENDING_TTL_MS) return null;

    return {
      ref: parsed.ref,
      items,
      cartToken: typeof parsed.cartToken === "string" ? parsed.cartToken : null,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export function clearPendingCheckout(): void {
  try {
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    /* nada a fazer */
  }
}
