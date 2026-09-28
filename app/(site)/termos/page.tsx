import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Termos",
  description: "Condições de venda, entrega, trocas e reparações da HERTMANN.",
  alternates: { canonical: "/termos" },
};

export default function TermsPage() {
  return (
    <LegalPage
      label="Institucional"
      title={["Termos"]}
      lead="As condições que regem a compra, a entrega e o acompanhamento das peças HERTMANN."
      sections={[
        {
          heading: "Encomendas",
          body: [
            "As peças em stock são expedidas em até três dias úteis. As peças sob encomenda têm um prazo médio de execução de catorze semanas, confirmado por escrito no momento da encomenda.",
            "Alterações a uma encomenda são possíveis enquanto a peça não tiver entrado em construção. A partir dessa etapa, a casa entra em contacto para avaliar cada caso.",
          ],
        },
        {
          heading: "Preços e pagamento",
          body: [
            "Os preços apresentados incluem os impostos aplicáveis e a embalagem HERTMANN. Peças com pedras seleccionadas individualmente podem ter o preço ajustado após a escolha da pedra, sempre com acordo prévio.",
          ],
        },
        {
          heading: "Entrega",
          body: [
            "A entrega é feita por transporte assegurado em todo o território brasileiro, com seguro pelo valor integral da peça e assinatura no acto de recepção.",
          ],
        },
        {
          heading: "Trocas e devoluções",
          body: [
            "Trocas e devoluções são aceites no prazo de trinta dias a contar da recepção, desde que a peça não tenha sido usada, redimensionada ou gravada, e seja devolvida na embalagem original.",
            "Peças executadas sob encomenda, com pedra escolhida pelo cliente ou com gravação, não são passíveis de devolução.",
          ],
        },
        {
          heading: "Reparações",
          body: [
            "A HERTMANN repara, redimensiona e refaz qualquer peça da casa, sem limite de tempo. Os custos de material são cobrados a preço de custo; a mão de obra é gratuita.",
          ],
        },
      ]}
    />
  );
}
