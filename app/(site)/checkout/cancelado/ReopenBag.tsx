"use client";

import { useStore } from "@/components/commerce/StoreProvider";

/** Reabre a sacola, tal como ficou, para retomar o pagamento. */
export function ReopenBag() {
  const { setBagOpen } = useStore();

  return (
    <button type="button" onClick={() => setBagOpen(true)} className="link-edit">
      <span>Voltar à sacola</span>
      <span aria-hidden="true" className="arrow">
        →
      </span>
    </button>
  );
}
