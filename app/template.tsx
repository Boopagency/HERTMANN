"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DUR, EASE } from "@/components/motion/tokens";

/* ============================================================================
   Transição entre páginas — discreta. A página nova assenta em 340 ms:
   opacidade e 6 px de subida. A navegação não espera por nada — a rota
   troca de imediato e só a entrada é animada.

   A primeira página servida nunca é animada (chega pintada, pronta para
   o LCP), e mudar só os filtros da URL também não: apenas uma mudança de
   caminho conta como navegação.
   ========================================================================== */

let lastPath: string | null = null;

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // A chave pelo caminho cobre também /joias/aneis → /joias/brincos e
  // /produto/a → /produto/b, onde o template da raiz não se renova.
  return (
    <PageEnter key={pathname} pathname={pathname}>
      {children}
    </PageEnter>
  );
}

function PageEnter({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [enter] = useState(() => lastPath !== null && lastPath !== pathname);

  useEffect(() => {
    lastPath = pathname;
  }, [pathname]);

  if (!enter || reduced) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.normal, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
