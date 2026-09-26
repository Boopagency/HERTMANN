# Release — integração Hostinger na `main`

_2026-09-26 · `feature/hostinger-storefront-current` → `main` · merge autorizado explicitamente pelo
usuário nesta data._

Este documento registra a preparação e a execução do merge: auditoria, ajustes, proteções de
produção, verificações, homologação real, merge e deploy. O que foi construído nas Fases 0 e 1
está em [`hostinger-storefront-implementacao-2026-09-25.md`](hostinger-storefront-implementacao-2026-09-25.md).

---

## Resumo

- **O que entra na `main`:**
  - a integração das Fases 0 e 1 (`47fd6dd`, `1c4157e`, `058be66`);
  - os ajustes desta entrega (`ab22a71`);
  - esta documentação.
- **Em Production nada se vende ainda.**
  - Nenhuma peça do catálogo tem `commerce`, e o canal da Hostinger só está configurado no Preview.
  - O site continua vitrine: preço editorial e "Consultar disponibilidade".
- **A homologação real foi concluída.** O usuário a fez no Preview de `058be66`, contra a API real
  da Hostinger e com Test Payment (secção 5).
- **Proteções de Production:**
  - o site continua `noindex, nofollow`;
  - a página de homologação e o diagnóstico respondem 404.
- **Dois tipos de validação, que não se confundem:**
  - **testes automatizados** contra uma Storefront **simulada**, que validam o comportamento do site;
  - **homologação manual** e **leituras somente-leitura** contra a **API real**.

---

## 1. Auditoria antes do merge (PASSO 1)

| Ponto | Resultado |
|---|---|
| HEAD da branch | `058be66`, igual no local e no GitHub |
| HEAD da `main` | `28d0419`, igual no local e no GitHub |
| Base comum | `28d0419`: a `main` não recebeu nenhum commit desde que a branch foi criada |
| Trabalho não commitado ou não enviado | nenhum |
| Divergência e conflitos | nenhum: a `main` é ancestral da branch |
| `1c4157e` → `058be66` | só `README.md` e `docs/` |
| Código homologado | `058be66`, Preview `dpl_3xfHFnMCoKqqBXpdj7PYAsJcn8RG` (READY em 2026-09-26 21:23 UTC; lido pelo conector da Vercel) |
| Mudanças depois de `058be66` | só as desta entrega: `ab22a71` (secção 2) e documentação |

O código que vai para a `main` é o homologado, somado aos ajustes da secção 2. Esses ajustes vieram
depois da homologação manual e foram verificados de forma automatizada e com leituras da API real
(secção 4).

---

## 2. Ajustes (PASSO 2) — `ab22a71`

**Texto da sacola** (`components/commerce/BagDrawer.tsx`):
- antes: "Envio assegurado e embalagem HERTMANN incluídos.";
- agora: "Embalagem HERTMANN incluída. O frete é calculado no checkout.";
- o texto não menciona a regra Sul ≥ R$ 150, que ainda não está configurada;
- nenhum outro texto de frete mudou.

**Diagnóstico `/api/hostinger-status`** (`app/api/hostinger-status/route.ts`): uma função
`diagnosticsEnabled()` no início da rota. É uma mudança pequena, reversível e sem autenticação nova.

| Ambiente | Resposta |
|---|---|
| `next dev` | diagnóstico completo |
| Preview com `NEXT_PUBLIC_HOSTINGER_HOMOLOGATION=true` | diagnóstico completo |
| Preview sem homologação | 404 |
| Production (`VERCEL_ENV=production`) | 404 sem corpo, mesmo que a variável de homologação exista lá |

**Testes** (`scripts/e2e/fluxo-checkout.mjs`): 3 verificações novas, de 73 para 76:
- o texto novo da sacola, no desktop;
- o texto novo da sacola, no mobile;
- o diagnóstico disponível em homologação.

**Não alterado, de propósito:**
- **`atendimento@hertmann.com.br`** (contato, rodapé e JSON-LD). **Pendente:** o domínio não
  existe, então o endereço não recebe mensagens. Falta decidir o e-mail oficial.
- A regra de frete da Região Sul e os demais textos de entrega (barra superior, página de produto,
  termos).

---

## 3. Proteções de Production (PASSO 3)

**Variáveis na Vercel**, lidas pelo conector em 2026-09-26. Foram lidos só os nomes e os
ambientes; nenhum valor foi decifrado.

| Variável | Ambientes na Vercel | Tipo na Vercel |
|---|---|---|
| `NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID` | Preview | config |
| `NEXT_PUBLIC_HOSTINGER_HOMOLOGATION` | Preview | config |
| `NEXT_PUBLIC_HOSTINGER_STOREFRONT_API_URL` | nenhum (o código usa a API V2 por padrão) | — |
| `NEXT_PUBLIC_SITE_URL` | nenhum | — |
| `SITE_INDEXABLE` | nenhum | — |

Não há nenhuma variável em Production (`hiddenProductionEnvCount: 0`) e nenhum Secret.

**Classificação:**

| Variável | Classificação | Regra |
|---|---|---|
| `NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID` | Config · pública, não sensível | — |
| `NEXT_PUBLIC_HOSTINGER_STOREFRONT_API_URL` | Config · pública, não sensível | — |
| `NEXT_PUBLIC_HOSTINGER_HOMOLOGATION` | Config · pública, não sensível | só Preview |
| `NEXT_PUBLIC_SITE_URL` | Config · pública, não sensível | não configurar até existir domínio |
| `SITE_INDEXABLE` | Config · servidor, não sensível | `false` ou ausente |

Esta etapa não cria nenhum Secret nem nenhum token administrativo, e nenhum token entra em
`NEXT_PUBLIC_*`.

**Cada proteção, como está garantida e como foi verificada.** A verificação usou um build local
de Production simulada (`VERCEL_ENV=production`), no pior caso: homologação e canal ligados.

| Proteção | Garantia | Verificado |
|---|---|---|
| Homologação desligada em Production | variável só no Preview, e o código exige `NEXT_PUBLIC_VERCEL_ENV !== "production"` | `/produto/homologacao-hostinger` → 404, mesmo com a variável ligada |
| Diagnóstico fora de Production | `VERCEL_ENV !== "production"` | `/api/hostinger-status` → 404, corpo vazio |
| `noindex, nofollow` | `SITE_INDEXABLE` ausente | ver abaixo |
| Nenhum domínio fictício | `NEXT_PUBLIC_SITE_URL` ausente; a origem é o domínio de produção da Vercel | nenhum URL `hertmann.com.br` no HTML; o e-mail de contato fica, como pendência |
| Nada à venda em Production | canal só no Preview; nenhuma peça com `commerce` | ver abaixo |

Detalhe da verificação de `noindex, nofollow`:
- `X-Robots-Tag: noindex, nofollow` nas 19 rotas verificadas;
- meta `robots` `noindex, nofollow` nas 16 páginas, e `noindex` nas páginas 404;
- `robots.txt` sem sitemap.

Detalhe da verificação de "nada à venda":
- nenhum pedido do navegador à Hostinger;
- o produto de protótipo mostra "Consultar disponibilidade";
- o JSON-LD não tem oferta.

---

## 4. Verificações (PASSO 4)

### 4.1 Tipos e build (commit `ab22a71`)

| Verificação | Resultado |
|---|---|
| `npm ci` | ✅ |
| `npx tsc --noEmit` | ✅ sem erros |
| `npm run build` | ✅ 35 rotas |

O `tsc` e o build são repetidos antes de cada push, e também na `main` depois do merge (secção 6).

### 4.2 Testes automatizados — Storefront **simulada**

Estes testes rodam contra `scripts/e2e/storefront-simulada.mjs`, uma imitação local da API com os
dados do produto de teste. **Não é a Hostinger.** Eles validam o comportamento do site (sacola,
checkout, regresso, erros, SEO), não a API.

| Execução | Resultado |
|---|---|
| E2E em `next dev` (React StrictMode) | ✅ **76/76**, sem erros de console |
| E2E em produção (`next build` + `next start`) | ✅ **76/76**; depois da falha simulada, o ISR recuperou a oferta em 65 s |

### 4.3 Production simulada, no navegador (desktop 1440 px e Pixel 7)

Um build local com `VERCEL_ENV=production` e `NEXT_PUBLIC_VERCEL_ENV=production`, e com a
homologação ligada (pior caso). Resultado: 32/32.

O que funciona:
- home e menu;
- busca: "meridiano" devolve a peça com o preço editorial; "homolog" não devolve nada;
- `/joias`, `/joias/aneis`, `/colecoes` e `/colecoes/noturno`;
- produto de protótipo, com "Consultar disponibilidade" e sem compra online;
- sacola vazia;
- `/checkout/sucesso` e `/checkout/cancelado`.

O que fica fechado:
- `/produto/homologacao-hostinger` → 404;
- nenhum pedido à Hostinger;
- nenhuma resposta ≥ 400 além desse 404, que o teste pede de propósito;
- nenhum erro de JavaScript.

### 4.4 API real — só leitura, sem checkout

O site rodou localmente em modo Preview (`VERCEL_ENV=preview`), ligado ao canal real.

**Servidor — `/api/hostinger-status`:** 200, `ok: true`, 1 produto.
- Produto `prod_01M2XN4RWHN3YSHPJJMMRBF6SD`, "Anel Solitário de Prata com Zircônias".
- Variante `variant_01M2XN4RY2MTVB57FTFBQ3BNM7`:

  | Campo | Valor |
  |---|---|
  | `amount` | 39990 |
  | `sale_amount` | 29990 |
  | moeda | BRL, 2 casas decimais |
  | `manage_inventory` | `true` |
  | `inventory_quantity` | 10 |
  | `is_available` | `true` |

**HTML da página de homologação:**
- R$ 299,90 e R$ 399,90 riscado;
- JSON-LD `Offer` 299.90 BRL;
- `noindex`.

**Navegador (desktop e Pixel 7), 18/18:**
- o preço aparece;
- sacola: R$ 299,90; com quantidade 2, R$ 599,80; de volta a 1, R$ 299,90;
- o texto novo da sacola aparece;
- "Finalizar compra" fica ativo, mas **não foi clicado**;
- a sacola persiste ao recarregar, com o `variantId` real;
- só houve pedidos GET e nenhum erro.

**Limitação deste ambiente, e como foi contornada:**
- O Chromium do ambiente de desenvolvimento não confia na cadeia de certificados pública da
  Hostinger quando ela passa pelo proxy (`ERR_CERT_AUTHORITY_INVALID`). O `curl` e o Node a
  validam normalmente.
- Por isso, no navegador, as leituras à API foram feitas pelo Playwright no Node (`route.fetch`,
  com TLS verificado) e entregues ao navegador tal como vieram. **Os dados são os reais.**
- Qualquer pedido que não fosse leitura seria abortado, e nenhum saiu.

**Contrato conferido na API real e no schema oficial** (`/v2/docs.json`, OpenAPI 3.1.0,
"[BETA] Hostinger Ecommerce Core API V2"):

| Ponto | Resultado |
|---|---|
| Listas | envelope `{ count, data, limit, offset }` |
| Filtro de variantes | `product_ids[]` e `product_ids=` são respeitados; um ID inexistente devolve 0 |
| Variante | `product_id`, `prices[0]` (moeda com `decimal_digits`), `manage_inventory`, `inventory_quantity`, `is_available`, `options: []` |
| Produto | sem campo `status`; traz as `variants` embutidas |
| Checkout | `locale` é texto livre; `success_url` e `cancel_url` são URIs obrigatórias; resposta `{ url, cart_token }` |

O cliente não precisou de nenhuma mudança.

### 4.5 Regressão visual contra a `main`

Foram 32 capturas: 13 rotas mais menu, busca e sacola, em desktop e Pixel 7.

- **28 idênticas pixel a pixel.**
- **As 4 restantes são as 2 páginas de produto de protótipo, nos 2 viewports.**
  - O seletor de quantidade sai e o botão passa a "Consultar disponibilidade". Isso foi aprovado nas
    Fases 0 e 1.
  - Há ainda 1 px de antialiasing no rótulo da coleção, com o mesmo texto.

**Na primeira passagem, 5 capturas de desktop tiveram diferenças mínimas** (6 a 385 px), dentro de
fotografias. Isso é ruído de captura:
- a `main` comparada consigo mesma dá 0;
- os bytes das imagens otimizadas e o HTML das `<img>` são iguais nos dois lados;
- com 4 s de espera antes da captura, em vez de 0,8 s, as 5 ficam idênticas.

---

## 5. Homologação manual — API real (relatada pelo usuário)

**Preview homologado:** `dpl_3xfHFnMCoKqqBXpdj7PYAsJcn8RG`, commit `058be66`, READY em 2026-09-26
21:23 UTC. As variáveis `NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID` e
`NEXT_PUBLIC_HOSTINGER_HOMOLOGATION` foram criadas no Preview às 21:14 UTC.

**Resultados relatados pelo usuário.** Estes resultados não foram observados por mim.

| Item | Resultado |
|---|---|
| `/api/hostinger-status` | OK; produto e variante reais encontrados |
| Preço | R$ 399,90 e promoção R$ 299,90, lidos corretamente |
| Estoque | lido da Hostinger |
| `/produto/homologacao-hostinger` | OK |
| Adicionar à sacola, quantidade, subtotal e total | OK |
| Checkout hospedado | abriu, em português |
| Test Payment | funcionou; pedido de teste concluído |
| Regresso de sucesso | `/checkout/sucesso?ref=…` OK |
| Cancelamento | `/checkout/cancelado` OK; a sacola ficou preservada |
| Depois do pedido | o produto continuou disponível para novo checkout |

**Não relatados à parte** (sem resultado registrado):
- persistência da sacola ao recarregar;
- migração de uma sacola antiga (v1);
- remoção da linha paga no regresso de sucesso;
- diferenças entre mobile e desktop;
- se o `pt-BR` foi aceito na primeira tentativa: a segunda tentativa, sem `locale`, é silenciosa;
- parâmetros que a Hostinger acrescenta ao `success_url`.

Parte disso é coberto pelos testes automatizados (4.2) e pela verificação somente-leitura (4.4).

**Observação minha, pela leitura da API:**
- O estoque do produto de teste era 10 em 2026-09-24 (diagnóstico) e continuava 10 em 2026-09-26,
  depois do pedido de teste.
- Não verifiquei se um pedido com Test Payment desconta estoque ou se o estoque foi reposto.
  **Confirmar no hPanel antes de vender.**

---

## 6. Merge (PASSO 6)

**Estratégia:**
- `git merge --no-ff feature/hostinger-storefront-current` sobre a `main` atual, com a mensagem
  "Merge da branch feature/hostinger-storefront-current na main".
- É o mesmo padrão do merge anterior (`28d0419`).

**Por que esta estratégia:**
- A `main` é ancestral da branch, então não há conflitos possíveis.
- O merge commit mantém o histórico da branch intacto: sem rebase, sem squash e sem reescrita.
- Dá um único ponto de reversão, se for preciso: `git revert -m 1 <merge>`.

**Controles:**
- antes do push, a árvore da `main` tem de ser igual à da branch, e `tsc` e build passam na `main`;
- depois do push, o hash local tem de ser igual ao remoto.

O hash do merge, o deploy e o smoke test vão para a secção 8. Ela é preenchida depois do push, num
commit só de documentação na branch `feature/hostinger-storefront-current`. A `main` não recebe mais
commits sem nova autorização.

---

## 7. Deploy (PASSO 7) — o que se espera

- **A integração Git da Vercel publica a `main` em Production.** Em 2026-09-24, o `28d0419` entrou
  em Production automaticamente, cerca de 30 s depois do commit.
- **Em 2026-09-25, os pushes na branch não geraram deployment automático** (`47fd6dd`, `1c4157e`,
  `058be66`). O Preview de `058be66` só foi criado em 2026-09-26 às 21:23 UTC, pelo dono da conta.
- **Correção de um diagnóstico anterior.** Em 2026-09-25 levantei a hipótese de a Vercel bloquear
  commits com autor "Claude" no plano Hobby. Os dados não a confirmam: commits com esse autor foram
  publicados automaticamente em 2026-09-24 (`28d0419` em Production, `d50c012` em Preview). A
  causa da falha de 2026-09-25 não foi determinada.
- **Se o push da `main` não gerar deployment,** não crio commits vazios nem mudanças de código. O
  caminho é publicar o mesmo commit pela Vercel (conector ou painel), ou pedir decisão ao usuário.

---

## 8. Resultado do merge, do deploy e do smoke test

_A preencher depois do push, com o que for observado._

---

## 9. Pendências (inalteradas por esta entrega)

**Comerciais:**
- produtos reais, preços, SKUs, variantes, estoque, peso e dimensões;
- política final de frete, incluindo a regra Sul ≥ R$ 150 no hPanel;
- Stripe;
- domínio definitivo;
- e-mail oficial: `atendimento@hertmann.com.br` continua no site, sem domínio;
- ativação da indexação (`SITE_INDEXABLE=true` e `NEXT_PUBLIC_SITE_URL`), só com domínio e com
  autorização.

**Técnicas:**
- textos legais e de entrega, a rever com a política final;
- filtros e faixas de preço, a refazer com o catálogo real;
- aviso de hidratação do `CrystalMark` com movimento reduzido, que já existia na `main` antes desta
  integração;
- recomendação: usar o campo `is_available` da variante, que a API real traz, na regra de
  disponibilidade (não alterado agora).

---

## 10. Arquivos desta entrega

| Arquivo | Mudança |
|---|---|
| `components/commerce/BagDrawer.tsx` | texto de frete da sacola (`ab22a71`) |
| `app/api/hostinger-status/route.ts` | diagnóstico fora de Production (`ab22a71`) |
| `scripts/e2e/fluxo-checkout.mjs` | +3 verificações (`ab22a71`) |
| `docs/hostinger-storefront-release-2026-09-26.md` | novo — este documento |
| `docs/hostinger-storefront-implementacao-2026-09-25.md` | atualizado com a validação real |
| `README.md` | rota de diagnóstico e homologação |
| `CLAUDE.md` | contexto atual |

---

## 11. Autorizações

**Autorizado nesta entrega:**
- merge na `main` e push;
- os ajustes da secção 2.

**Continua a exigir autorização explícita:**
- cadastrar produtos ou variantes reais;
- preços e estoque;
- Stripe ou PayPal;
- desligar o Test Payment;
- mudar o Pagamento na Entrega;
- frete definitivo e a regra Sul ≥ R$ 150;
- domínio, DNS e e-mail;
- ativar a indexação;
- cobranças reais;
- excluir produtos ou dados;
- qualquer outro projeto ou serviço da Boop.
