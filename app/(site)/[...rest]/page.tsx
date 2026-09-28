import { notFound } from "next/navigation";

/* ============================================================================
   Endereços que não existem. O site e o Admin têm layouts raiz próprios
   (route groups), por isso a página 404 do site deixou de ser a da raiz da
   aplicação: esta rota apanha o que nenhuma outra resolve e entrega-o ao
   not-found.tsx do site, dentro do layout do site — a mesma página de sempre.
   ========================================================================== */

export default function Unmatched() {
  notFound();
}
