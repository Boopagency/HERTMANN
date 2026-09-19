# Diagnóstico — Hostinger Ecommerce → Frontend Hertmann

_Gerado em 2026-09-19 · somente leitura, nenhuma alteração feita na loja ou no código nesta etapa._

**Loja:** Hertmann — `store_01M2XKR3V3JR3YG7QKNRG8NK47` (engine `v2_standalone`)
**Canal de venda:** Hertmann (custom) — `scha_01M2XNKMQ4ZWZ2DY9ZD7MJ8FPK`

> Isto é um retrato do estado da loja no momento da consulta. Se muito tempo tiver passado (produtos adicionados, pagamento conectado, etc.), reexecute o diagnóstico antes de agir sobre estas informações.

**Metodologia:** consultado via Hostinger Connector (MCP), usando só chamadas de leitura: `getStoresV1`, `getStoreMetadataV1`, `listSalesChannelsV1`, `listProductsV1` (com `include=variants`), `listStorePaymentProvidersV1` e `getCustomStorefrontSetupInstructionsV1`. Não existe endpoint de leitura para frete — só um de escrita (`setStoreShippingV1`), que não foi chamado.

---

## Índice

1. [Loja](#1-loja)
2. [Metadados da loja](#2-metadados-da-loja)
3. [Canais de venda](#3-canais-de-venda)
4. [Produtos e variantes](#4-produtos-e-variantes)
5. [Provedores de pagamento](#5-provedores-de-pagamento)
6. [Envio](#6-envio)
7. [Instruções oficiais — Custom Storefront Setup](#7-instruções-oficiais--custom-storefront-setup)
8. [IDs, URLs e variáveis de ambiente](#8-ids-urls-e-variáveis-de-ambiente)
9. [Como isso se encaixa no projeto Next.js 15 / React 19 / TS atual](#9-como-isso-se-encaixa-no-projeto-nextjs-15--react-19--ts-atual)
10. [Plano de implementação por etapas](#10-plano-de-implementação-por-etapas)

---

## 1. Loja

Única loja na conta: **Hertmann** — `store_01M2XKR3V3JR3YG7QKNRG8NK47`, engine `v2_standalone` (compatível com a Storefront API V2 usada abaixo).

## 2. Metadados da loja

| Campo | Valor |
|---|---|
| `has_payment_methods` | `true` |
| `has_shipping` | `true` |
| Moeda padrão | `BRL` (R$, 2 casas decimais, template `R$$1`) |
| Pedido mínimo | R$4,00 |

## 3. Canais de venda

Um único canal:

| Campo | Valor |
|---|---|
| `id` | `scha_01M2XNKMQ4ZWZ2DY9ZD7MJ8FPK` |
| `name` | Hertmann |
| `type` | `custom` |
| `is_primary` | `true` |
| `is_active` | `true` |
| `domain` | `null` |

Bate com o canal personalizado descrito. O `domain` vazio é esperado — só é preenchido depois do deploy do frontend (fase 4 do plano).

## 4. Produtos e variantes

Apenas **1 produto** cadastrado:

| Campo | Valor |
|---|---|
| Título | Anel Solitário de Prata com Zircônias |
| `product_id` | `prod_01M2XN4RWHN3YSHPJJMMRBF6SD` |
| Tipo | `physical` |
| Status | `published` |
| Variante | `variant_01M2XN4RY2MTVB57FTFBQ3BNM7` (única, sem SKU, sem opções) |
| Estoque | 10 (controlado — `manage_inventory: true`) |
| Preço | R$399,90 riscado → R$299,90 promocional (valores brutos da API: `39990`/`29990` centavos) |

⚠️ **Gap relevante:** `lib/data/catalogue.ts` no repositório tem **13 peças** com categoria, coleção, material e variações de tamanho — nenhuma delas existe ainda na loja Hostinger. Isso condiciona a estratégia da seção 9.

## 5. Provedores de pagamento

| Provedor | Estado | Observação |
|---|---|---|
| Manual ("Pagamento na Entrega") | ✅ conectado, habilitado | aparece no checkout |
| Test Payment | ✅ conectado, habilitado | ambiente de teste — remover antes de produção |
| Stripe | instalado, **não conectado** à loja | falta concluir o fluxo de conexão para aceitar cartão real |
| PayPal | instalado, **não conectado** à loja | idem |

Hoje a loja só processaria pedido real via pagamento manual — nenhum gateway de cartão está ativo ainda.

## 6. Envio

`has_shipping: true` confirma que existe alguma configuração de frete, mas não há ferramenta de **leitura** para zonas/valores/prazos no conjunto disponível — só a de escrita (`ecommerce_setStoreShippingV1`), fora do escopo desta etapa. Para ver os valores exatos, confira o hPanel → Ecommerce → Envio diretamente.

## 7. Instruções oficiais — Custom Storefront Setup

Resumo do documento oficial retornado pela ferramenta `getCustomStorefrontSetupInstructionsV1`:

- **Duas superfícies de API**, não misturar:
  - **Storefront Core V2** (`https://api-ecommerce.hostinger.com/v2`) — pública, **sem autenticação**, usada para ler catálogo e fazer checkout.
  - **Management API** (MCP/Connector) — autenticada, só para administração (o que foi usado para este diagnóstico).
- A API pública é indexada por **`sales_channel_id`** (`scha_...`), não por `store_id`.
- Preços vivem nas **variantes**, sempre em centavos (unidade mínima da moeda) — nunca no produto.
- CORS aberto → dá para ler catálogo e fazer checkout **direto do browser**, sem backend.
- Regra de segurança explícita da Hostinger: **nunca** colocar um token da API no storefront — leitura e checkout não precisam (nem devem) de autenticação.
- Fluxo de compra:
  1. Buscar produto por **ID** (slug retorna 404 — mapear slug→id a partir da listagem).
  2. Carrinho local como `{ variant_id, quantity }`, resolvendo dados de exibição sempre do catálogo ao vivo.
  3. Um único `POST /channels/{sales_channel_id}/checkout` com os itens + `success_url`/`cancel_url`:
     ```
     POST /channels/{sales_channel_id}/checkout
     { "items": [{ "variant_id": "variant_01...", "quantity": 1 }],
       "success_url": "https://SEUDOMINIO/checkout/sucesso/",
       "cancel_url": "https://SEUDOMINIO/checkout/cancelado/",
       "locale": "pt-BR" }
     ```
  4. Resposta traz `{ url, cart_token }` — redirecionar o navegador para `url` (checkout hospedado em `checkout.hostinger.com`).
- **Catálogo deve ser buscado em runtime**, nunca embutido no build estático — preço e estoque mudam e não podem "congelar" numa build.
- Schema OpenAPI completo da Storefront V2: `https://api-ecommerce.hostinger.com/v2/docs.json`.

## 8. IDs, URLs e variáveis de ambiente

Nada do que foi lido aqui é segredo — e, pelo próprio desenho da Hostinger, **este fluxo (catálogo + checkout) não exige token algum no frontend**:

| Variável | Valor | Segredo? | Uso |
|---|---|---|---|
| `NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID` | `scha_01M2XNKMQ4ZWZ2DY9ZD7MJ8FPK` | Não | toda chamada à Storefront API |
| `NEXT_PUBLIC_HOSTINGER_STOREFRONT_API_URL` | `https://api-ecommerce.hostinger.com/v2` | Não | idem |
| `NEXT_PUBLIC_SITE_URL` | domínio final do site (já existe equivalente em `lib/data/site.ts` → `site.url`) | Não | montar `success_url`/`cancel_url` do checkout |
| _(referência)_ `store_id` | `store_01M2XKR3V3JR3YG7QKNRG8NK47` | Não é segredo, mas só serve ao lado administrativo (MCP) | não entra no frontend |

Se no futuro houver chamadas servidor-a-servidor à Management API fora do Connector (webhooks, sincronização de pedidos), aí sim existirá um token da Hostinger — esse token nunca leva prefixo `NEXT_PUBLIC_`, fica só em variável de ambiente server-side da hospedagem, e não foi obtido nem é necessário nesta etapa.

## 9. Como isso se encaixa no projeto Next.js 15 / React 19 / TS atual

Pontos concretos identificados na leitura do código:

- **Incompatibilidade de unidade de preço.** `lib/format.ts:1-11` formata `price()` assumindo reais inteiros (`price(9800)` → "R$ 9.800"). A Hostinger devolve centavos (`39990` = R$399,90). Passar o valor da API direto pro `price()` atual infla o preço em 100×. Precisa de conversão (`amount / 10**decimal_digits`) antes do formatter — ou um formatter dedicado para valores vindos da Hostinger.
- **`generateStaticParams` gera tudo em build-time** (`app/produto/[slug]/page.tsx:21-23`) a partir do array estático — o oposto do que a Hostinger recomenda para dados de comércio. Trocar por fetch em Server Component com `revalidate` curto (ISR, ex. 60s), mantendo geração estática só para o conteúdo editorial.
- **Carrinho muda de `slug+option` para `variant_id`.** Hoje `components/commerce/StoreProvider.tsx` guarda `{slug, option, quantity}` resolvido via `pieceBySlug()` estático; a Hostinger espera `{variant_id, quantity}` resolvido do catálogo vivo — é mudança de esquema no `localStorage` (`hertmann:store:v1`), não só de nomes de campo.
- **Checkout ainda não existe de fato.** O botão "Finalizar compra" em `components/commerce/BagDrawer.tsx:134` só fecha a gaveta. Precisa virar `POST /channels/{sales_channel_id}/checkout` (client-side, já que CORS é aberto) + redirecionamento para a `url` retornada.
- **Domínio de imagem não liberado.** `next.config.mjs` não tem `images.remotePatterns`; as fotos de produto da Hostinger vêm de `cdn.zyrosite.com`, que precisa ser adicionado ali para o `<Image>` funcionar.
- **Conteúdo editorial não tem equivalente no modelo genérico de e-commerce.** Material, pedra, medidas, coleção, "linha" (frase poética) e a ilustração técnica (`drawing`) são específicos da marca — a Hostinger não modela nada disso.

**Recomendação:** não substituir `lib/data/catalogue.ts`. Em vez disso:
- Estender `Piece` (e suas variantes) com `hostingerProductId?: string` / `hostingerVariantId?: string`.
- Criar uma camada `lib/hostinger/` (cliente REST tipado + mapeamento) que resolve **só preço, estoque e checkout** a partir da Hostinger.
- Manter nome, fotos, narrativa e tamanhos disponíveis curados no repositório, como hoje.

Isso também contorna o fato de hoje só existir 1 de 13 produtos na loja — a migração pode ser gradual, peça a peça, sem quebrar o site enquanto o catálogo é populado na Hostinger.

Como leitura pública e checkout não pedem autenticação, dá para implementar com `fetch()` puro em Server Components (catálogo/SEO) e no client (checkout) — sem SDK nem rota de API própria como proxy.

## 10. Plano de implementação por etapas

_Nada disto foi executado — é o roteiro para as próximas sessões._

**Fase 0 — Conteúdo na Hostinger** (decisão do usuário, fora do código)
1. Popular a loja com os demais produtos/variantes (tamanhos = variantes).
2. Decidir sobre Stripe/PayPal: conectar de verdade ou seguir só com pagamento manual por enquanto.
3. Confirmar zonas e valores de frete no hPanel.

**Fase 1 — Camada de dados**
4. Criar `lib/hostinger/types.ts` com os tipos de produto/variante/preço/checkout.
5. Criar `lib/hostinger/client.ts`: `getProducts()`, `getProductById()`, `createCheckout(items, urls)`.
6. Criar util de conversão de centavos → reais, sem tocar no `price()` atual (que continua servindo o conteúdo editorial/legado).

**Fase 2 — Ligar ao catálogo existente**
7. Estender `Piece`/variantes com `hostingerProductId?`/`hostingerVariantId?`.
8. Nas páginas de produto/listagem, mesclar preço+estoque reais (Server Component, `revalidate` curto) com os dados editoriais; peças sem ID da Hostinger continuam mostrando os dados estáticos como hoje — transição gradual, sem quebrar nada.
9. Liberar `cdn.zyrosite.com` em `next.config.mjs`.

**Fase 3 — Carrinho e checkout**
10. Migrar o esquema do `StoreProvider` de `{slug, option}` para `{variantId, quantity}` (com migração/limpeza do `localStorage` antigo).
11. Trocar o botão "Finalizar compra" do `BagDrawer` por chamada real ao endpoint de checkout + redirecionamento.
12. Criar rotas `app/checkout/sucesso` e `app/checkout/cancelado`.

**Fase 4 — Deploy e ligação final**
13. Deploy do frontend (Hostinger Websites ou outro host, à escolha do usuário).
14. Só então: `ecommerce_updateSalesChannelV1` para gravar o domínio final no canal `scha_01M2XNKMQ4ZWZ2DY9ZD7MJ8FPK`.
15. Teste ponta-a-ponta: catálogo real, carrinho, checkout, confirmação de pagamento.
