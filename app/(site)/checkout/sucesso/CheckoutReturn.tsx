"use client";

import { useEffect } from "react";
import { useStore } from "@/components/commerce/StoreProvider";
import { clearPendingCheckout, readPendingCheckout } from "@/components/commerce/checkout";

/**
 * Ao voltar de um checkout concluído, retira da sacola o que foi pago — e só
 * isso. Exige que a referência do endereço corresponda ao checkout criado
 * neste dispositivo: abrir a página à mão, ou por um link antigo, não mexe na
 * sacola. Peças sob consulta e peças juntadas depois ficam onde estão.
 */
export function CheckoutReturn() {
  const { ready, removeCheckedOut } = useStore();

  useEffect(() => {
    // Só depois de a sacola ter sido lida do dispositivo; antes disso, a
    // leitura sobrepor-se-ia à remoção.
    if (!ready) return;

    const ref = new URLSearchParams(window.location.search).get("ref");
    const pending = readPendingCheckout();
    if (!ref || !pending || pending.ref !== ref) return;

    removeCheckedOut(pending.items);
    clearPendingCheckout();
  }, [ready, removeCheckedOut]);

  return null;
}
