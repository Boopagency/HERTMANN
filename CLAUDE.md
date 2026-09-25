# HERTMANN — instruções permanentes

Loja da joalheria HERTMANN: Next.js 15 (App Router) na Vercel, com a Hostinger
Ecommerce como backend comercial (produtos, variantes, preços, estoque, frete,
checkout, pagamentos, pedidos). Estas regras valem para toda sessão.

## Ambientes e branches

- **`main` é produção.** Nunca fazer commit, merge ou push para a `main` sem
  autorização explícita do usuário, dada naquela conversa.
- Trabalhar sempre numa branch de feature. Um push numa branch gera apenas um
  Preview na Vercel.
- Nunca reescrever histórico de branch alheia (rebase, amend, force-push).

## Explicar antes de executar

- Antes de uma mudança relevante, explicar o quê, por quê, arquivos, riscos e
  o que muda visual e funcionalmente.
- Parar e pedir autorização explícita antes de qualquer ação que envolva
  produção, pagamentos, DNS, domínio, dados reais da loja, exclusão ou cobrança.

## Nunca sem autorização explícita

- **DNS e domínio:** registros, nameservers, compra, transferência, domínio do
  sales channel (`ecommerce_updateSalesChannelV1`), configuração de e-mail.
- **Pagamentos:** conectar ou desconectar gateways (Stripe, PayPal), ligar ou
  desligar métodos (Test Payment, Pagamento na Entrega), contas bancárias.
- **Dados comerciais reais da loja:** criar, editar ou excluir produtos,
  variantes, preços, estoque, frete e descontos.
- **Exclusões, cobranças, pedidos reais e compras** (domínio, hospedagem, planos).
- **Serviços externos não relacionados à HERTMANN** (por exemplo, outros
  domínios, VPS ou e-mails da conta).

## Segredos e variáveis de ambiente

- Toda variável nova é classificada, no `.env.example` e na documentação, como
  **Config** (pública ou não sensível) ou **Secret**.
- **Secret:** nunca com prefixo `NEXT_PUBLIC_`, nunca commitado, lido só no
  servidor.
- A Storefront API da Hostinger é pública e não usa token. Nenhum token da
  Hostinger entra no frontend.
- Arquivos `.env*` ficam fora do git, exceto `.env.example`, que não tem segredos.

## Frontend visual

- O design atual da HERTMANN está aprovado e deve ser preservado rigorosamente.
- Não redesenhar, não simplificar componentes, não trocar animações,
  tipografia, espaçamentos nem imagens.
- Portar lógica, nunca componentes de versões antigas.
- Textos de marca, frete, legais e de preço: mostrar a proposta ao usuário antes
  de alterar.

## Verificação

- Antes de cada push: `npx tsc --noEmit` e `npm run build`.
- Usar Playwright quando possível (ver `scripts/`). Fixtures ou simulações de
  API devem ser rotuladas como tal e nunca apresentadas como respostas reais.
- Não inventar respostas da API. O que não foi verificado fica escrito como não
  verificado.

## Documentação

- Toda entrega relevante (diagnóstico, plano, implementação, decisão,
  bloqueios) gera também um arquivo Markdown em `docs/`, nomeado
  `<assunto>-<tipo>-AAAA-MM-DD.md`.
- O documento é escrito em português e é autônomo: explica o que foi feito,
  os arquivos alterados, os fluxos, as verificações, os bloqueios e os
  próximos passos.
- É commitado na branch de trabalho (o ambiente é efêmero) e entregue ao
  usuário no fim da resposta.

## Contexto atual (atualizar quando mudar)

- Hospedagem: o frontend fica na Vercel. Não migrar nem comprar hospedagem.
- Domínio definitivo: **ainda não existe.** Não tratar `hertmann.com.br` como
  domínio da empresa. A origem do site vem de `lib/site-url.ts`.
- Catálogo em `lib/data/catalogue.ts`: **protótipo visual.** Os preços não são
  comerciais e não devem ir para a Hostinger. Uma peça só vira comercial quando
  recebe o campo `commerce` com IDs de um produto real.
- Produto de teste da Hostinger: serve só para homologação (página
  `/produto/homologacao-hostinger`, só em Preview e desenvolvimento). Não
  excluir.
- Pagamentos: só Test Payment, para homologação. O Stripe está planejado, mas
  não pode ser conectado sem autorização.
- Frete: a regra "Região Sul grátis a partir de R$ 150" está planejada e ainda
  não configurada. Só é configurável pelo hPanel; a API só aceita tarifa fixa.
