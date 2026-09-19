"use client";

import { useEffect } from "react";
import { useStore } from "@/components/commerce/StoreProvider";

/** O pedido deixou de viver no dispositivo: a sacola esvazia-se à chegada. */
export function BagReset() {
  const { clearBag, ready } = useStore();

  useEffect(() => {
    if (ready) clearBag();
  }, [ready, clearBag]);

  return null;
}
