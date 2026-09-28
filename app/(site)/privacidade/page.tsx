import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { site } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Como a HERTMANN trata os dados de quem visita o site e compra na casa.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      label="Institucional"
      title={["Privacidade"]}
      lead="Recolhemos o mínimo necessário para atender, entregar e acompanhar uma peça ao longo do tempo."
      sections={[
        {
          heading: "Que dados recolhemos",
          body: [
            "Nome, endereço de e-mail, telefone e morada de entrega, quando fornecidos por si numa encomenda, num pedido de contacto ou na subscrição da newsletter.",
            "A sacola e os favoritos ficam guardados apenas no seu navegador, no seu dispositivo. Não são enviados para a HERTMANN nem associados à sua identidade.",
          ],
        },
        {
          heading: "Para que os usamos",
          body: [
            "Para responder ao seu contacto, executar e entregar a sua encomenda, e manter o registo da peça no arquivo da casa — o que nos permite repará-la ou refazê-la décadas mais tarde.",
            "A newsletter só é enviada a quem a subscreve, e pode ser cancelada em qualquer mensagem.",
          ],
        },
        {
          heading: "Com quem os partilhamos",
          body: [
            "Apenas com os parceiros necessários à entrega e ao pagamento, e apenas com os dados estritamente necessários a esse fim. Não vendemos nem cedemos dados a terceiros para fins publicitários.",
          ],
        },
        {
          heading: "Os seus direitos",
          body: [
            `Pode pedir a qualquer momento o acesso, a correcção ou a eliminação dos seus dados, escrevendo para ${site.contact.email}. Respondemos em até um dia útil.`,
          ],
        },
      ]}
    />
  );
}
