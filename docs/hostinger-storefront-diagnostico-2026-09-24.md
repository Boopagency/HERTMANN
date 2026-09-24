# Diagnóstico — Hostinger eCommerce × storefront atual da HERTMANN

_Gerado em 2026-09-24 · branch `feature/hostinger-storefront-current` (a partir do commit `149ed57`)
· **somente leitura**: nenhuma alteração foi feita na loja, na hospedagem, no domínio, no DNS,
nos pagamentos ou no código._

> Isto é o retrato do momento da consulta. Se a loja mudar (produtos, pagamentos, frete,
> domínio), refaça as leituras antes de agir com base neste documento.

---

## Resumo

- **A loja existe e o canal é o esperado.** A loja `Hertmann` tem um canal de venda `custom`
  ativo, e o ID dele é exatamente o que está no `.env.example`.
- **A loja ainda não está pronta para vender de verdade.** Tem só **1 produto**: um anel de
  prata de teste que não existe no catálogo do site. Não há **nenhum gateway de cartão
  conectado**: os únicos meios ativos no checkout são "Test Payment" e "Pagamento na Entrega".
  O canal está **sem domínio**.
- **Não existe hospedagem de sites na Hostinger.** A conta tem o plano Ecommerce, e-mail (de
  outro domínio) e um domínio pessoal. O front roda na **Vercel** (projeto `hertmann`, time
  `boop10`).
- **`hertmann.com.br` não está nesta conta Hostinger**: não aparece como domínio, zona de DNS
  nem e-mail.
- **Esta branch tem só a camada de dados** (cliente da Storefront API e uma rota de
  diagnóstico). Nenhuma página a usa ainda: os preços são estáticos, a sacola é local e
  "Finalizar compra" só fecha a gaveta.
- **A ligação com a interface já foi prototipada** na branch antiga `feature/hostinger-ecommerce`,
  mas em cima do site anterior ao redesign. Deve ser portada, não mergeada.

---

## Índice

1. [Metodologia](#1-metodologia)
2. [Conta Hostinger — o que existe](#2-conta-hostinger--o-que-existe)
3. [Loja Hertmann](#3-loja-hertmann)
4. [Canal de venda](#4-canal-de-venda)
5. [Produtos](#5-produtos)
6. [Pagamentos](#6-pagamentos)
7. [Frete, pedidos e descontos](#7-frete-pedidos-e-descontos)
8. [Domínio, DNS e hospedagem do front](#8-domínio-dns-e-hospedagem-do-front)
9. [Repositório — estado atual](#9-repositório--estado-atual)
10. [Comparação: loja × repositório](#10-comparação-loja--repositório)
11. [Arquitetura final proposta](#11-arquitetura-final-proposta)
12. [Passos que pretendo executar](#12-passos-que-pretendo-executar)
13. [O que pode afetar produção, domínio, DNS ou pagamentos](#13-o-que-pode-afetar-produção-domínio-dns-ou-pagamentos)
14. [Bloqueios desta sessão](#14-bloqueios-desta-sessão)
15. [Decisões pendentes (preciso de você)](#15-decisões-pendentes-preciso-de-você)

---

## 1. Metodologia

**Hostinger Connector: só chamadas de leitura.**

| Chamada | Resultado |
|---|---|
| `hosting_listOrdersV1` | 0 pedidos de hospedagem |
| `hosting_listWebsitesV1` | 0 sites |
| `agency-hosting_listOrdersV1` / `listAgencyPlanWebsitesV1` | 0 / 0 |
| `horizons_getWebsiteListV1` | 0 sites Horizons |
| `hosting_listGitInstallationsV1` | nenhuma conta Git conectada |
| `billing_getSubscriptionListV1` | 3 assinaturas (ver §2) |
| `domains_getDomainListV1` / `getDomainDetailsV1` / `DNS_getDNSRecordsV1` | 1 domínio, que não é da Hertmann |
| `mail_listOrdersV1` | 1 plano de e-mail, de `deumboop.com.br` |
| `ecommerce_getStoresV1` | 1 loja: **Hertmann** |
| `ecommerce_getStoreMetadataV1` | pagamento e frete marcados como configurados, BRL |
| `ecommerce_listSalesChannelsV1` | 1 canal `custom` |
| `ecommerce_listProductsV1` (`include=variants,media`) | 1 produto, 1 variante |
| `ecommerce_listStorePaymentProvidersV1` | 2 conectados, 2 disponíveis |
| `ecommerce_listStoreOrdersV1` / `listDiscountsV1` | 0 / 0 |
| `ecommerce_getCustomStorefrontSetupInstructionsV1` | instruções oficiais (resumo em §11) |

**Vercel Connector: só leitura.** `list_projects` encontrou o projeto `hertmann`. As leituras de
domínios, deploys e variáveis devolveram **403** (ver §14).

**Local:**

- `npm ci`
- `npx tsc --noEmit`: ✅ sem erros
- `npm run build`: ✅ 33 rotas geradas
- comparação `git` entre `main`, esta branch e `feature/hostinger-ecommerce`

**Não verificável daqui:** a Storefront API pública (`api-ecommerce.hostinger.com`),
`hertmann.com.br` e `*.vercel.app` estão bloqueados pela política de rede do container (ver §14).

---

## 2. Conta Hostinger — o que existe

| Recurso | Situação |
|---|---|
| Hospedagem de sites (web, Agency, Horizons) | **nenhuma** |
| Assinatura **Ecommerce Growth** | ativa desde 2026-09-19 · R$ 61,99/mês · renovação automática |
| Assinatura **Standard Business Email** | ativa · R$ 155,88/ano · domínio **`deumboop.com.br`** (não é da Hertmann) |
| Domínio **`jabezrodrigues.online`** | ativo, **sem** renovação automática, expira em 2027-03-17 |

`jabezrodrigues.online` é um domínio pessoal. O DNS dele aponta `@` para `2.57.91.91`, e
`evo`, `n8n`, `n8n2` e `easypanel` para uma VPS (`72.62.136.35`). **Não faz parte deste projeto
e não será tocado.**

**Consequência:** nesta conta, a Hostinger serve **só de backend de e-commerce** (catálogo,
estoque, checkout, pagamentos, pedidos). Para hospedar o front na Hostinger, seria preciso
**comprar** um plano com Node.js.

---

## 3. Loja Hertmann

| Campo | Valor |
|---|---|
| `store_id` | `store_01M2XKR3V3JR3YG7QKNRG8NK47` |
| Nome | Hertmann |
| Motor | `v2_standalone` (compatível com a Storefront API V2) |
| Criada em | 2026-09-19 |
| `company_name` | não preenchido |
| `has_payment_methods` | `true` |
| `has_shipping` | `true` |
| Moeda | BRL: 2 casas decimais, template `R$$1` |
| Valor mínimo de pedido | R$ 4,00 (`min_amount: 400`) |

---

## 4. Canal de venda

| Campo | Valor |
|---|---|
| `id` | `scha_01M2XNKMQ4ZWZ2DY9ZD7MJ8FPK` |
| Nome | Hertmann |
| Tipo | `custom` (o único tipo que a Storefront API aceita) |
| Primário / ativo | sim / sim |
| `external_id` | vazio |
| `domain` | **vazio**: só se preenche no go-live |

✅ É o mesmo ID de `NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID` no `.env.example`.

---

## 5. Produtos

A loja tem **1 produto**:

| Campo | Valor |
|---|---|
| Título | Anel Solitário de Prata com Zircônias |
| `product_id` | `prod_01M2XN4RWHN3YSHPJJMMRBF6SD` |
| Tipo / status | `physical` / `published` |
| Variante | `variant_01M2XN4RY2MTVB57FTFBQ3BNM7`: única, sem SKU, sem opções |
| Preço | R$ 399,90 → **R$ 299,90** promocional (API: `39990` / `29990` centavos) |
| Estoque | 10, controlado (`manage_inventory: true`) |
| Imagem | `cdn.zyrosite.com/cdn-ecommerce/store_01M2XK…/assets/e195045c-….jpg` |

Esse produto **não corresponde a nenhuma peça** de `lib/data/catalogue.ts`. O catálogo do site é
de ouro 18k, entre R$ 4.200 e R$ 32.000. É um produto de teste.

### O que o catálogo do site exigiria na Hostinger

São 12 peças no repositório. Cada peça vira um produto, e cada opção de tamanho vira uma
variante: **12 produtos e 30 variantes**.

| Peça (slug) | Nome | Coleção | Preço no site | Opções → variantes | Observação |
|---|---|---|---|---|---|
| `aliança-perene` | Perene | Arquétipo | R$ 9.800 | Aro 12–22 → 6 | |
| `par-vertente` | Vertente | Vertente | R$ 16.400 | Aro 12–20 → 5 | |
| `colar-meridiano` | Meridiano | Vertente | R$ 7.200 | 40 / 42 / 45 cm → 3 | |
| `colar-noturno` | Noturno | Noturno | R$ 24.500 | → 1 | sob encomenda |
| `brinco-circunferencia` | Circunferência | Arquétipo | R$ 6.400 | 16 / 22 / 30 mm → 3 | |
| `brinco-solsticio` | Solstício | Solstício | R$ 11.900 | → 1 | |
| `pulseira-cadencia` | Cadência | Vertente | R$ 13.800 | 17 / 18 / 19 cm → 3 | |
| `pulseira-arquetipo` | Arquétipo | Arquétipo | R$ 18.600 | → 1 | |
| `anel-noturno` | Noturno | Noturno | R$ 32.000 | Aro 12–18 → 4 | sob encomenda |
| `colar-solsticio` | Solstício | Solstício | R$ 9.600 | → 1 | |
| `brinco-ponto` | Ponto | Arquétipo | R$ 4.200 | → 1 | |
| `pulseira-noturno` | Noturno | Noturno | R$ 27.400 | → 1 | sob encomenda |

Observações:

- Os preços do site estão em **reais inteiros** (`9800` = R$ 9.800). Na Hostinger ficam em
  **centavos** (`980000`).
- O campo `reference` do site (ex.: `HM–AR–014`) serve como SKU. Para variantes de tamanho, dá
  para usar um sufixo (ex.: `HM–AR–014–16`).
- As 3 peças **sob encomenda** exigem uma decisão: vender online sem controle de estoque, ou
  mostrar "Consultar disponibilidade" e encaminhar para o atendimento.

---

## 6. Pagamentos

| Provedor | Estado | Aparece no checkout? |
|---|---|---|
| `manual` — "Pagamento na Entrega" | conectado, habilitado | **sim** |
| `test` — "Test Payment" | conectado, habilitado | **sim** |
| `stripe` | disponível (instalável, aceita BRL) | não: **não está conectado à loja** |
| `paypal` | disponível (instalável, aceita BRL) | não: **não está conectado à loja** |

Hoje, um checkout real ofereceria **"Test Payment"**, que fecha pedidos sem cobrança, e
"Pagamento na Entrega". Isso serve para testes, mas não para produção:

- O **Test Payment tem de ser desligado antes do go-live.**
- **Pagamento na entrega** combina pouco com peças de R$ 4.200 a R$ 32.000. A decisão é sua.
- Não há gateway de cartão ativo. Para cartão, e eventualmente Pix e parcelamento, é preciso
  conectar Stripe ou PayPal e confirmar no painel do gateway o que ele oferece em BRL. A conexão
  é feita pelo titular da conta: gera-se um link de conexão e você conclui no site do gateway.
- Detalhe cosmético: o título do método manual está gravado com um espaço no início
  (`" Pagamento na Entrega"`).

---

## 7. Frete, pedidos e descontos

- **Frete:** `has_shipping: true`, mas o Connector **não tem leitura** de zonas e valores. Só
  existe a escrita `setStoreShippingV1`, que define **uma tarifa fixa única** e cria a zona se
  ela não existir. Não foi chamada. Os valores precisam ser conferidos no hPanel → Ecommerce →
  Envio. Se a configuração atual for mais rica que uma tarifa fixa (várias zonas ou faixas),
  ajuste-a pelo hPanel, não por essa chamada.
- ⚠️ A sacola do site diz **"Envio assegurado e embalagem HERTMANN incluídos."** Se o checkout da
  Hostinger cobrar frete, as duas mensagens se contradizem. É preciso alinhar: frete grátis na
  loja, ou mudar o texto.
- **Pedidos:** 0. **Descontos:** 0.

---

## 8. Domínio, DNS e hospedagem do front

| Ponto | Situação |
|---|---|
| Domínio do canal de venda | vazio |
| `lib/data/site.ts` → `site.url` | `https://hertmann.com.br`: usado em `metadataBase`, canônicos, `sitemap.xml`, `robots.txt` e JSON-LD |
| E-mail de atendimento no site | `atendimento@hertmann.com.br` |
| `.env.example` → `NEXT_PUBLIC_SITE_URL` | `https://hertmann-tan.vercel.app`: usado só como alternativa no servidor para montar as URLs de retorno do checkout (no navegador vale `window.location.origin`) |
| `hertmann.com.br` na conta Hostinger | **não existe** (nem domínio, nem zona DNS, nem e-mail) |
| Onde está registrado / quem gere o DNS | **desconhecido** (Registro.br? outra conta?); não deu para consultar daqui |
| Hospedagem do front | **Vercel**, projeto `hertmann` (`prj_M3skhFaP5onrwpgco8tgXEvfPELX`), time `boop10`. O histórico de commits indica deploys de Preview por branch |

Pontos de atenção:

1. **Duas "URLs do site" divergentes.** O SEO aponta para `hertmann.com.br`, e o retorno do
   checkout fora do navegador aponta para `hertmann-tan.vercel.app`. Se `hertmann.com.br` ainda
   não serve este site, os canônicos e o sitemap de produção já apontam para um domínio que não
   é este. Isso precisa ser verificado.
2. **Qualquer mudança no DNS de `hertmann.com.br`** tem de preservar os registros de e-mail
   (MX, SPF, DKIM) de `atendimento@hertmann.com.br`, onde quer que ele esteja hospedado.

---

## 9. Repositório — estado atual

### Branches

| Branch | Commit | Situação |
|---|---|---|
| `main` | `28d0419` | redesign de alta joalheria mergeado; comércio 100% local |
| **`feature/hostinger-storefront-current`** | `149ed57` | `main` + 5 commits: **só a camada de dados** |
| `feature/hostinger-ecommerce` | `7e871d7` (2026-09-19) | piloto completo, mas **sobre o site anterior ao redesign** (base `6b3561a`) |
| `redesign/loja-alta-joalheria` | `da5090d` | já mergeada na `main` |

### O que esta branch acrescenta à `main`

| Arquivo | Conteúdo |
|---|---|
| `.env.example` | as 3 variáveis públicas: canal, URL da API, URL do site |
| `lib/hostinger/types.ts` | tipos de produto, variante, preço, snapshot e checkout |
| `lib/hostinger/client.ts` | `listProducts`, `getProduct`, `listVariants`, `variantSnapshot`, `getVariantSnapshot`, `createCheckout`, `checkoutReturnUrls` |
| `app/api/hostinger-status/route.ts` | rota de diagnóstico: lista o catálogo do canal |
| `docs/hostinger-storefront-current.md` | nota da integração |

**Nenhuma página ou componente importa `lib/hostinger/`.** Só a rota de diagnóstico usa o
cliente. `tsc` e `next build` passam.

### O que continua estático ou local na interface

| Local | Hoje |
|---|---|
| `components/commerce/StoreProvider.tsx` | sacola `{slug, option, quantity}` em `localStorage` (`hertmann:store:v1`), com preço de `catalogue.ts` |
| `components/commerce/BagDrawer.tsx` | "Finalizar compra" **só fecha a gaveta** |
| `components/product/ProductDetail.tsx` | preço estático; a opção escolhida (aro, comprimento) é guardada como texto, sem `variant_id` |
| `ProductTile`, `SearchOverlay`, `SideMenu` | `price(piece.price)` estático |
| `app/produto/[slug]/page.tsx` | 100% SSG; o JSON-LD `Offer` usa o preço estático |
| `lib/format.ts` | `price()` recebe **reais inteiros**; um valor da Hostinger, em centavos, sairia **100× maior** |
| `/checkout/sucesso`, `/checkout/cancelado` | **não existem**, mas `checkoutReturnUrls()` já aponta para elas (dariam 404) |
| `next.config.mjs` | sem `images.remotePatterns` (só importa se usarmos fotos do CDN da Hostinger) |

### O que o piloto antigo (`feature/hostinger-ecommerce`) já resolveu e pode ser portado

- Sacola por `variantId` com migração segura do `localStorage` v1 → v2, incluindo a correção de
  um bug do React StrictMode que zerava a sacola migrada.
- Preço e estoque ao vivo em `ProductDetail` e `BagDrawer`, com limite de quantidade pelo estoque.
- Checkout real (`POST /checkout` e redirecionamento) com tratamento de erro.
- Páginas `/checkout/sucesso` (esvazia a sacola) e `/checkout/cancelado` (preserva a sacola).
- `priceFromMinorUnits()` em `lib/format.ts`.
- Página de produto em ISR (60 s), com JSON-LD de preço e disponibilidade reais.
- Peças sem vínculo com a Hostinger: "Consultar disponibilidade", com link para `/contato`.

Essa branch também traz o **`CLAUDE.md`**, com a regra de documentar toda entrega em `docs/`. Ele
**não existe na `main` nem nesta branch**.

### Pontos do cliente atual a validar contra a API real

As rotas vêm das instruções oficiais, mas não foram conferidas no schema
`https://api-ecommerce.hostinger.com/v2/docs.json`, que está inacessível daqui:

1. `createCheckout` envia `locale: "pt-BR"`, e o exemplo oficial usa `"en"`. Os valores aceitos
   precisam ser confirmados.
2. A listagem pública de produtos pode não trazer as variantes embutidas. Nesse caso,
   `/api/hostinger-status` mostra `variants: []`, e o preço tem de vir de `listVariants`.
3. `/api/hostinger-status` fica público em produção. Só expõe dados já públicos, mas convém
   removê-la ou restringi-la no go-live.

---

## 10. Comparação: loja × repositório

| Tema | Loja Hostinger | Repositório | Situação |
|---|---|---|---|
| Canal `custom` | `scha_01M2XNKMQ4ZWZ2DY9ZD7MJ8FPK` | mesmo ID no `.env.example` | ✅ alinhado |
| URL da API | Storefront V2 | `https://api-ecommerce.hostinger.com/v2` | ✅ alinhado |
| Moeda / unidade | BRL em centavos | `price()` em reais inteiros | ❌ falta conversor |
| Catálogo | 1 produto de teste | 12 peças editoriais | ❌ nenhuma peça cadastrada |
| Variantes | 1 variante sem opções | 6 peças com opções (24 tamanhos) | ❌ mapa opção → `variant_id` inexistente |
| Estoque | controlado (10 no produto de teste) | inexistente (só "sob encomenda" / "pronta-entrega") | ❌ |
| Sacola | espera `{variant_id, quantity}` | `{slug, option, quantity}` | ❌ |
| Checkout | hospedado (`checkout.hostinger.com`) | botão sem ação | ❌ |
| Retorno do checkout | exige `success_url` e `cancel_url` | páginas inexistentes | ❌ |
| Pagamentos | só teste + na entrega | — | ❌ falta gateway real |
| Frete | configurado (valores desconhecidos) | texto "envio incluído" | ⚠️ alinhar |
| Domínio | canal sem domínio | SEO em `hertmann.com.br`; retorno em `*.vercel.app` | ⚠️ definir |
| Segredos | a Storefront API é pública | nenhum token no front | ✅ correto |

---

## 11. Arquitetura final proposta

### Regras oficiais do Custom Storefront (Hostinger)

- Há **duas superfícies de API**:
  - **Storefront V2**: pública, sem token, com CORS aberto. Serve para catálogo e checkout.
  - **Management API** (Connector/hPanel): autenticada. Serve para administrar a loja.
- A Storefront é indexada pelo **`sales_channel_id`**, não pelo `store_id`.
- **Os preços ficam nas variantes, em centavos.** O detalhe do produto só funciona por **ID**;
  um slug devolve 404.
- **O catálogo deve ser lido em tempo de execução**, não congelado no build.
- **A sacola é local**, com `{variant_id, quantity}`. O checkout é **um único
  `POST /channels/{scha}/checkout`**; o navegador vai para a `url` devolvida.
- **Nunca pôr token da Hostinger no front.**
- Depois do deploy, **gravar o domínio final no canal** (`ecommerce_updateSalesChannelV1`).

### Desenho

```
                     ┌──────────────────────────────────────────────┐
 visitante ──DNS──▶  │  hertmann.com.br → Vercel (boop10/hertmann)  │
                     │  Next.js 15 · App Router                     │
                     │                                              │
                     │  Conteúdo editorial  ← lib/data/catalogue.ts │
                     │  (nome, texto, fotos, desenho, coleção)      │
                     │                                              │
                     │  Página de produto (ISR ~60 s) ───────────┐  │
                     │  Sacola {variantId, qty} no navegador ──┐ │  │
                     └─────────────────────────────────────────┼─┼──┘
                                                               │ │
             POST /channels/{scha}/checkout ───────────────────┘ │ GET /channels/{scha}/variants
                                                                 ▼ (preço, promo, estoque)
                     ┌──────────────────────────────────────────────┐
                     │ Hostinger Ecommerce — loja Hertmann           │
                     │ canal custom scha_01M2XNKMQ4ZWZ2DY9ZD7MJ8FPK  │
                     │ fonte da verdade: preço, estoque, variantes,  │
                     │ frete, pagamentos, pedidos (gestão no hPanel) │
                     └───────────────────────┬──────────────────────┘
                                             ▼
                     checkout.hostinger.com (frete + Stripe/PayPal)
                                             │ success_url / cancel_url
                                             ▼
                     hertmann.com.br/checkout/sucesso · /checkout/cancelado
```

### Princípios

1. **Duas fontes da verdade.**
   - A **Hostinger** manda no que é comercial: preço, promoção, estoque, variantes, pedidos,
     frete e pagamento.
   - O **repositório** manda no que é marca: nome, "linha", descrição, material, medidas,
     fotografia e desenho de ateliê.
   - `lib/data/catalogue.ts` **não é substituído**.
2. **Vínculo por ID.** Cada `Piece` ganha `hostingerProductId`. As peças com opções ganham um
   mapa `opção → variant_id` (ex.: `{ "16": "variant_…" }`).
3. **Migração gradual.** Uma peça sem vínculo continua visível, com o preço editorial e
   "Consultar disponibilidade". Nada quebra enquanto a loja é populada.
4. **Leitura em runtime.**
   - As páginas de produto usam ISR curto (~60 s), para SEO e JSON-LD reais.
   - A sacola e o momento do checkout revalidam preço e estoque no navegador.
5. **Checkout hospedado pela Hostinger.** Não há dado de cartão no nosso front.
6. **Sem segredos no front.** Só os IDs públicos (`NEXT_PUBLIC_*`). A administração é feita pelo
   Connector ou pelo hPanel.
7. **Hospedagem na Vercel (recomendado).**
   - O projeto já existe lá, com Previews por branch, e o Next.js roda nativo.
   - A conta Hostinger não tem plano de sites. Migrar exigiria comprar um plano Node.js e
     refazer o deploy, sem ganho funcional.
   - _Alternativa:_ hospedar na Hostinger (compra de plano, deploy Node.js e DNS na Hostinger).

---

## 12. Passos que pretendo executar

Nada disto foi executado. Cada fase começa só com a sua aprovação.

### Fase 0 — Preparação (sem efeito em produção)

1. Trazer o `CLAUDE.md` da branch antiga para esta branch.
2. Liberar `api-ecommerce.hostinger.com` na política de rede do ambiente. É uma ação sua (§14).
   Alternativa: validar tudo pelo Preview da Vercel, via `/api/hostinger-status`.
3. Ler o schema `docs.json` da Storefront V2 e ajustar o cliente se algo divergir (`locale`,
   formato das respostas, variantes embutidas).

### Fase 1 — Código nesta branch (só Preview, sem produção)

4. Estender `Piece` com `hostingerProductId` e o mapa `opção → variant_id`.
5. Criar `priceFromMinorUnits()` sem tocar no `price()` editorial.
6. `StoreProvider`: sacola por `variantId`, com migração v1 → v2 portada do piloto (com a
   correção do StrictMode).
7. `ProductDetail`:
   - preço, promoção e estoque ao vivo;
   - a opção escolhida resolve o `variant_id`;
   - fallback "Consultar disponibilidade".
8. `BagDrawer`:
   - preços ao vivo e limite de quantidade pelo estoque;
   - `POST /checkout` e redirecionamento, com estado de erro.
9. Criar `/checkout/sucesso` e `/checkout/cancelado` no visual atual.
10. Página de produto em ISR, com JSON-LD de preço e disponibilidade reais.
11. Preço nas listagens (tile, busca, menu): usar o ao vivo ou a mesma regra da página de
    produto, para não haver dois preços diferentes.
12. Unificar `NEXT_PUBLIC_SITE_URL` e `site.url`.
13. Validar:
    - `tsc` e `build`;
    - Playwright local;
    - ponta a ponta no **Preview** da Vercel com o produto de teste e o "Test Payment".

### Fase 2 — Loja Hostinger (escritas na loja; cada uma com aprovação explícita)

14. Cadastrar os 12 produtos e as 30 variantes, com preço, estoque e SKU **informados por você**
    (`createPhysicalProductV1`, `createAProductVariantV1`, `updateProductVariantsInBatchV1`).
15. Decidir o destino do produto de teste: usá-lo no ponta a ponta do Preview e depois
    **arquivar** (`updateAProductV1` → `archived`, reversível), de preferência a excluir.
16. Frete: conferir no hPanel e, se for o caso, ajustar, alinhado ao texto da sacola.
    `setStoreShippingV1` só serve para tarifa fixa única (`0` = grátis).
17. Pagamentos:
    - gerar o link de conexão do Stripe ou do PayPal (`createAPaymentProviderConnectLinkV1`) para
      você concluir;
    - no go-live, desligar o "Test Payment" (e, se decidido, o "Pagamento na Entrega").

### Fase 3 — Go-live (produção)

18. Configurar as variáveis `NEXT_PUBLIC_*` no ambiente **Production** da Vercel.
19. Fazer o merge na `main`. Isso dispara o deploy de produção na Vercel.
20. Apontar `hertmann.com.br` para a Vercel, no provedor do DNS, preservando os registros de
    e-mail.
21. Gravar o domínio no canal de venda (`ecommerce_updateSalesChannelV1`).
22. Fazer um pedido real de teste em produção (com estorno) e conferir que ele aparece na loja.
23. Remover ou restringir `/api/hostinger-status`.

---

## 13. O que pode afetar produção, domínio, DNS ou pagamentos

| Passo | Afeta | Risco | Reversível? |
|---|---|---|---|
| Commits e push nesta branch (Fases 0–1) | só o **Preview** da Vercel | nenhum em produção | sim |
| Liberar host na rede do ambiente | só este container | nenhum | sim |
| Cadastrar ou editar produtos e variantes | **loja** (estado compartilhado); visível na API pública do canal | baixo: nenhuma vitrine os mostra até o front ligar | sim (editar, despublicar) |
| Arquivar o produto de teste | loja | baixo | sim |
| **Excluir** o produto de teste | loja | baixo | **não** (exclusão é definitiva) |
| Ajustar o frete | **valor cobrado** no checkout; `setStoreShippingV1` substitui por uma tarifa fixa | médio | sim, se a configuração anterior estiver anotada |
| Conectar Stripe ou PayPal | **pagamentos reais**, conta bancária, taxas | **alto** | parcialmente |
| Desligar Test Payment / Pagamento na Entrega | **checkout**: sem gateway real, a loja fica sem meio de pagamento | médio | sim |
| Variáveis na Vercel (Production) | **produção** (os `NEXT_PUBLIC_*` pedem novo build) | médio | sim |
| **Merge na `main`** | **produção** | **alto** | sim (rollback na Vercel) |
| **DNS de `hertmann.com.br`** | **domínio, SSL e e-mail** (MX) | **alto** | sim, mas com propagação e risco para o e-mail |
| Domínio no canal de venda | canal e links do checkout | baixo/médio | sim |
| Pedido real de teste | **cobrança real** | médio | com estorno |
| Comprar hospedagem na Hostinger | **cobrança** | — | só se escolher hospedar lá |
| `jabezrodrigues.online` / VPS / e-mail `deumboop.com.br` | serviços fora do projeto | — | **fora do plano: não serão tocados** |

---

## 14. Bloqueios desta sessão

1. **Rede do ambiente:** `api-ecommerce.hostinger.com`, `hertmann.com.br` e
   `hertmann-tan.vercel.app` são recusados pelo proxy (403 no CONNECT). Por isso não foi possível
   ler o schema OpenAPI, chamar a Storefront pública nem ver os sites.
   **Solução:** nas configurações do ambiente (menu do ambiente na barra de título da sessão →
   *Edit* → *Network access*), adicionar `api-ecommerce.hostinger.com` aos domínios permitidos,
   ou escolher um nível de acesso mais amplo.
2. **Vercel Connector:** o token não tem acesso ao time **`boop10`** (403 *"You must
   re-authenticate to this scope"*). Por isso não foi possível ver domínios, deploys nem
   variáveis do projeto. **Solução:** reautenticar o conector da Vercel com acesso ao time
   `boop10`.
3. **Frete:** não existe leitura no Connector. Conferir no hPanel.
4. **`hertmann.com.br`:** não está nesta conta Hostinger. É preciso saber onde está registrado
   e quem gere o DNS e o e-mail.

---

## 15. Decisões pendentes (preciso de você)

1. **Hospedagem do front:** manter na Vercel (recomendado) ou comprar plano na Hostinger?
2. **Domínio:** onde está `hertmann.com.br` (registro, DNS, e-mail)? Ele já aponta para a Vercel?
3. **Pagamento:**
   - Stripe, PayPal ou ambos?
   - Manter "Pagamento na Entrega"?
   - Há exigência de Pix ou de parcelamento?
4. **Catálogo:**
   - Os preços do site são os preços reais?
   - Qual o estoque por peça e tamanho?
   - As peças sob encomenda são vendáveis online?
   - Quem cadastra: eu, via Connector com a sua aprovação, ou a equipe, pelo hPanel?
5. **Produto de teste:** manter até o fim do ponta a ponta e depois arquivar (recomendado) ou
   excluir?
6. **Frete:** grátis (coerente com "envio incluído") ou cobrado (e então mudar o texto)?
