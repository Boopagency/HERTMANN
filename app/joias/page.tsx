import type { Metadata } from "next";
import { Catalogue } from "@/components/product/CatalogueView";
import { pieces } from "@/lib/data/catalogue";
import { catalogueInsert } from "@/lib/data/editorial";

export const metadata: Metadata = {
  title: "Joias",
  description:
    "O catálogo completo da HERTMANN: anéis, colares, brincos e pulseiras em ouro 18k, executados à mão em ateliê próprio.",
  alternates: { canonical: "/joias" },
};

export default function JewelleryPage() {
  return (
    <Catalogue
      pieces={pieces}
      label="Catálogo"
      title="Todas as joias"
      line="Doze peças em produção contínua, cada uma dimensionada à mão — e refeita, redimensionada ou reparada sem limite de tempo."
      insert={catalogueInsert}
      category="todas"
    />
  );
}
