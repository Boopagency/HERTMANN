import { notFound } from "next/navigation";

/** Endereços do painel que não existem: 404 dentro do layout do painel. */
export default function AdminUnmatched() {
  notFound();
}
