# Implementação — Hostinger Storefront no front atual (Fases 0 e 1)

_Gerado em 2026-09-25 · branch `feature/hostinger-storefront-current` · nada foi alterado na `main`,
na loja Hostinger, em pagamentos, frete, domínio ou DNS._

Este documento substitui `hostinger-storefront-current.md` como referência do estado da integração.
O diagnóstico somente leitura de 2026-09-24 continua válido para a conta e a loja
(`hostinger-storefront-diagnostico-2026-09-24.md`).

---

## Resumo

- **Infraestrutura técnica pronta, sem virar loja real.**
  - A sacola trabalha com `variantId` + `quantity`.
  - Preço, promoção e estoque vêm ao vivo da Hostinger nas peças ligadas.
  - "Finalizar compra" cria o checkout hospedado e redireciona.
  - O regresso tem páginas próprias.
- **O catálogo visual não mudou.** As 12 peças continuam protótipo. Nenhuma foi ligada a produto,
  nenhum preço foi copiado para a Hostinger e nenhum estoque foi criado.
- **Homologação isolada.** Uma página técnica, `/produto/homologacao-hostinger`, liga-se ao produto
  de teste da loja.
  - Só existe com `NEXT_PUBLIC_HOSTINGER_HOMOLOGATION=true` e nunca em produção.
  - Não é indexada.
- **SEO sem domínio próprio.** Nada aponta mais para `hertmann.com.br`: a origem vem de
  `lib/site-url.ts`, e nenhum ambiente é indexado até existir domínio definitivo.
- **Validação da API real: pendente.** A rede do ambiente de desenvolvimento bloqueia
  `api-ecommerce.hostinger.com`. O comportamento do site foi validado ponta a ponta contra uma
  Storefront **simulada** (rotulada como tal). A validação real faz-se no Preview, pelo roteiro da
  secção 11.

---

## 1. Decisões desta etapa (definidas pelo usuário)

| Tema | Decisão |
|---|---|
| Hospedagem | Frontend continua na Vercel. Não migrar, não comprar hospedagem. |
| Arquitetura | GitHub → Vercel → Next.js → Hostinger Ecommerce → Checkout Hostinger |
| Domínio | Ainda não existe. Não mexer em DNS, domínio do canal, e-mail. Não tratar `hertmann.com.br` como da empresa. |
| Produtos | Os 12 do catálogo são protótipos; preços não comerciais. Não cadastrar na Hostinger. |
| Estoque | Não existe estoque físico. Não criar estoque artificial. |
| Produto de teste | Usar só para homologação. Não excluir. |
| Pagamentos | Stripe planeado para depois. Agora: só Test Payment. Não conectar gateways, não desligar Test Payment. |
| Frete | "Região Sul grátis a partir de R$ 150" planeado, **não** configurar ainda. |

---

## 2. Fase 0 — preparação

### Estado da branch

`feature/hostinger-storefront-current` partia da `main` (`28d0419`). Em cima dela estavam só a camada
de dados (`lib/hostinger/`), a rota `/api/hostinger-status`, o `.env.example` e dois documentos.
Nenhuma página usava a Hostinger.

### Comparação com `feature/hostinger-ecommerce` (sem merge — só referência)

A branch antiga parte de `6b3561a`, anterior ao redesign.

**Portado (só a lógica):**
- a migração do `localStorage` v1 → v2 com a correção do React StrictMode;
- o teto de quantidade pelo estoque;
- o conversor de centavos;
- a leitura server-side com ISR de 60 s e o JSON-LD com preço real;
- o fallback "Consultar disponibilidade";
- a ideia das páginas de retorno.

**Não portado:**
- os componentes antigos (markup, classes, `PieceFigure`);
- **a migração que descartava em silêncio linhas sem vínculo;**
- **o `BagReset` que esvaziava a sacola inteira no sucesso;**
- a peça "Solitário" dentro do catálogo, com copy de marca inventada;
- o carregamento simulado de 550 ms;
- a leitura de variantes sem filtro;
- o texto de sucesso que prometia e-mail de confirmação.

### `CLAUDE.md`

Criado na raiz, adaptado ao projeto atual. Fixa as seguintes regras:
- explicar antes de executar;
- `main` = produção;
- trabalhar em branch;
- não mexer em DNS, domínio, pagamentos, dados comerciais reais, exclusões ou cobranças sem
  autorização;
- nada de segredos no frontend;
- classificar variáveis como Config ou Secret;
- testar TypeScript e build;
- documentar em `docs/`;
- preservar o frontend visual.

Traz ainda o contexto atual do projeto.

### Revisão do cliente (`lib/hostinger/`)

- **Variantes pedidas por produto** (`product_ids[]`) e com `limit=100`. A lista sem filtro é
  eventualmente consistente, e a paginação por omissão não está documentada.
- **`getProductSnapshot()`** devolve todas as variantes de um produto já normalizadas: preço, promoção,
  moeda, casas decimais, estoque e disponibilidade.
- **Checkout com segunda tentativa sem `locale`**, se a API responder 400 ou 422. O valor aceito não
  está confirmado; o checkout abre no idioma padrão da loja em vez de falhar.
- **`checkoutReturnUrls(ref)`**:
  - usa sempre a origem do navegador (local, Preview ou produção, sem configuração);
  - acrescenta `?ref=` ao `success_url`.
- **Erros da API guardam o início do corpo da resposta**, para diagnóstico.
- **`/api/hostinger-status`** mostra:
  - o catálogo normalizado;
  - uma **amostra crua** da primeira resposta de produto e de variante, para conferir o formato real
    no Preview.

### Validação da Storefront API V2

Fontes oficiais lidas:
- `ecommerce_getCustomStorefrontSetupInstructionsV1` (Hostinger Connector);
- `hostinger/api-mcp-server` → `skills/headless/references/STORE.md` (atualizado em 2026-09-25);
- `hostinger/api` → `openapi.json` (API de gestão).

| Ponto | Situação |
|---|---|
| Base `https://api-ecommerce.hostinger.com/v2`, pública, sem token, CORS aberto | ✅ confirmado |
| Chave: `sales_channel_id` de um canal `custom` | ✅ confirmado |
| `GET /channels/{scha}/products`; detalhe por ID (slug → 404) | ✅ confirmado |
| `GET /channels/{scha}/variants?product_ids[]=…`; `limit` máx. 100 | ✅ confirmado |
| Preço em `prices[0].amount` / `sale_amount` (centavos), `prices[0].currency` com `decimal_digits` e `template` | ✅ confirmado |
| `POST /channels/{scha}/checkout` com `items[{variant_id, quantity}]`, `success_url`, `cancel_url` obrigatórios; resposta `{ url, cart_token }` | ✅ confirmado |
| Envelope das listas (array ou `{ data, meta }`) | ⚠️ não confirmado — o cliente aceita os dois |
| Campos de estoque na Storefront (`inventory_quantity`, `manage_inventory` na API de gestão) | ⚠️ não confirmado |
| Formato das opções da variante (`[{ name, value }]` na API de gestão) | ⚠️ não confirmado |
| Valores aceitos em `locale` (exemplo oficial: `"en"`; o site envia `"pt-BR"`) | ⚠️ não confirmado — com segunda tentativa sem `locale` |
| Parâmetros acrescentados pela Hostinger ao `success_url` | ⚠️ não confirmado — o site só depende do seu `ref` |

**Para validar de verdade, libere na política de rede do ambiente de desenvolvimento** (menu do ambiente
na barra de título da sessão → *Edit* → *Network access*):

- `api-ecommerce.hostinger.com`: **obrigatório** (API e `docs.json`);
- `checkout.hostinger.com`: para seguir o redirecionamento até o Test Payment.

---

## 3. Fase 1 — integração no frontend

### A. Carrinho (`components/commerce/StoreProvider.tsx`)

- **Linha `{ variantId?, slug, option?, quantity }`**, guardada em `hertmann:store:v2`.
  - A identidade comercial é o `variantId`.
  - O `slug` serve para mostrar nome, fotografia e ligação.
- **Migração v1 → v2 sem apagar nada:**
  - linhas de peças não vendáveis ficam na sacola, **sob consulta**, fora do total e do checkout;
  - linhas cuja peça já não existe ficam guardadas, mas não se mostram (como antes);
  - se uma peça passar a estar ligada à Hostinger, as suas linhas antigas ganham a variante
    automaticamente.
- **StrictMode:**
  - a leitura é pura;
  - a chave v1 só é apagada no efeito de persistência, depois de a v2 ficar escrita;
  - validado em `next dev`, onde o StrictMode corre os efeitos duas vezes.
- **Retirada no regresso:** `removeCheckedOut(items)` retira da sacola só o que seguiu para um
  checkout concluído.

### B. Preços (`lib/format.ts`)

- **`priceFromMinorUnits(12900)` → "R$ 129,00".**
  - Mostra sempre os centavos e usa as casas decimais da moeda.
  - Um valor inválido dá "—", nunca um preço errado.
- **`minorUnitsToDecimal(12900)` → "129.00"**, exato, para o JSON-LD.
- **`price()` editorial intacto.** Nenhum valor da Hostinger passa por ele, porque sairia 100× maior.

### C. Página de produto (`ProductDetail` + `app/produto/[slug]/page.tsx`)

- **Peça ligada:**
  - preço e preço anterior riscado, quando há promoção;
  - estoque como teto da quantidade;
  - a opção escolhida resolve a variante;
  - estados "Esgotado", "Indisponível" e "Preço indisponível de momento", este com
    "Tentar novamente".
  - A leitura do servidor (ISR, 60 s) serve até chegar a do navegador.
- **Peça editorial:**
  - preço do catálogo, como antes;
  - "Consultar disponibilidade" → `/contato`;
  - sem seletor de quantidade.
- **JSON-LD:** a oferta só existe com dados reais (`Offer` ou `AggregateOffer`). As peças editoriais
  deixam de anunciar preço fictício a motores de busca.
- **Falha da Hostinger durante uma revalidação (ISR):**
  - O Next não reutiliza a leitura antiga: busca de novo, e só guarda respostas 200. A página é
    refeita sem dados comerciais até a revalidação seguinte (~60 s).
  - A interface não sofre, porque o navegador relê. Só a oferta no JSON-LD desaparece por um ou
    dois minutos.
  - A alternativa (deixar o erro subir para manter a última página boa) daria erro 500 na primeira
    visita com a API fora do ar, ou seja, bloquearia a página. Foi rejeitada.
  - Testado: depois de a API voltar, o HTML recupera a oferta.
- **Contagem de estoque não exibida.** O componente segue a regra da marca de não usar contagens de
  urgência; o estoque só limita a quantidade.

### D. Sacola (`BagDrawer`)

- **Com a sacola aberta:** preço real × quantidade por linha, total só das peças compráveis e teto de
  quantidade pelo estoque.
- **Estados:** carregando ("—"), falha de leitura (aviso com "Tentar novamente"), esgotado,
  indisponível e acima do estoque.
- **"Finalizar compra":**
  1. relê preço e estoque à força;
  2. se algo mudou, avisa e não segue;
  3. `POST /checkout` só com as linhas compráveis;
  4. regista o checkout pendente;
  5. redireciona para a URL devolvida.
  - Com erro, aviso, e a sacola fica intacta.
- **Voltar pelo botão do navegador** (página vinda da cache) desfaz o estado de carregamento.
- **Texto de frete intacto** ("Envio assegurado e embalagem HERTMANN incluídos."): aguarda decisão
  (secção 9).

### E. Checkout (`/checkout/sucesso`, `/checkout/cancelado`)

- **Mesma composição da página 404 atual:** rótulo, título, frase, dois caminhos, vitrine
  "Também da casa". As duas páginas levam `noindex`.
- **A vitrine leva `priority`**, porque é o maior elemento do primeiro ecrã (LCP).
- **Sucesso:**
  - confirma o regresso;
  - **só retira da sacola o que foi pago**, e só se o `ref` do endereço corresponder ao checkout
    pendente deste dispositivo (válido 24 h);
  - aberta à mão, ou por um link antigo, não mexe em nada.
- **Cancelado:** a sacola fica intacta, com "Voltar à sacola" (reabre a gaveta) e "Continuar a ver as
  joias".

### F. SEO e URL (`lib/site-url.ts`)

| Elemento | Antes | Agora |
|---|---|---|
| Origem (`metadataBase`, canónicos, OG, sitemap, JSON-LD) | `https://hertmann.com.br` fixo | `NEXT_PUBLIC_SITE_URL` → domínio de produção da Vercel (`VERCEL_PROJECT_PRODUCTION_URL`) ou do Preview (`VERCEL_URL`) → `localhost` |
| Indexação | `index, follow` em todo o lado | `noindex, nofollow` (meta e `X-Robots-Tag`) até `SITE_INDEXABLE=true` **e** produção |
| `robots.txt` | `Allow` + sitemap em `hertmann.com.br` | `Allow` (para os robôs lerem o `noindex`); sitemap só quando indexável |
| `success_url` / `cancel_url` | origem do navegador ou `NEXT_PUBLIC_SITE_URL` | sempre a origem do navegador |

- A Vercel já envia `X-Robots-Tag: noindex` nos Previews. O código acrescenta a mesma proteção à
  produção e aos Previews com domínio próprio.
- Quando o domínio for ligado à Vercel como domínio de produção, a origem acompanha sozinha. A
  indexação liga-se depois, conscientemente, com `SITE_INDEXABLE=true`.
- **Pendente:** o e-mail `atendimento@hertmann.com.br` continua no site (contato, rodapé, JSON-LD). O
  domínio não foi comprado, então esse endereço não recebe nada. É preciso decidir um e-mail
  alternativo.

### G. Vitrines (`PiecePrice`)

- **Uma só regra de preço para tile, busca e menu**, a mesma da página de produto:
  - peça ligada: preço ao vivo, o menor entre variantes, com "A partir de" quando diferem;
  - peça editorial: preço do catálogo.
- Para as 12 peças atuais, o texto é idêntico ao anterior.
- **Filtros e ordenação por preço continuam a usar o catálogo.** As faixas ("até R$ 10 mil" etc.)
  terão de ser refeitas para o catálogo real, perto de R$ 129 por peça.

---

## 4. Arquivos

| Arquivo | Estado |
|---|---|
| `CLAUDE.md` | novo |
| `lib/site-url.ts` | novo — origem e política de indexação |
| `lib/commerce.ts` | novo — peça ↔ produto (`isSellable`, `variantIdFor`) |
| `lib/data/homologation.ts` | novo — peça técnica e `findPiece` |
| `components/commerce/useLiveProducts.ts` | novo — cache ao vivo partilhada |
| `components/commerce/PiecePrice.tsx` | novo — preço das vitrines |
| `components/commerce/checkout.ts` | novo — checkout hospedado e registo pendente |
| `app/checkout/sucesso/{page,CheckoutReturn}.tsx` | novo |
| `app/checkout/cancelado/{page,ReopenBag}.tsx` | novo |
| `scripts/e2e/{storefront-simulada,fluxo-checkout}.mjs` | novo — testes de ponta a ponta |
| `lib/hostinger/client.ts`, `types.ts` | revistos |
| `lib/format.ts` | + `priceFromMinorUnits`, `minorUnitsToDecimal` |
| `lib/data/catalogue.ts` | + tipo `PieceCommerce`, campo opcional `commerce` (nenhuma peça o tem) |
| `lib/data/site.ts` | − `url` |
| `components/commerce/StoreProvider.tsx`, `BagDrawer.tsx` | sacola v2 e checkout |
| `components/product/ProductDetail.tsx`, `ProductTile.tsx` | dados ao vivo e fallback |
| `components/layout/SearchOverlay.tsx`, `SideMenu.tsx` | preço via `PiecePrice` |
| `app/produto/[slug]/page.tsx` | ISR 60 s, `findPiece`, JSON-LD real, origem |
| `app/layout.tsx`, `robots.ts`, `sitemap.ts`, `next.config.mjs` | SEO e indexação |
| `app/api/hostinger-status/route.ts` | diagnóstico com amostra crua |
| `.env.example`, `.gitignore`, `README.md` | variáveis classificadas e documentação |

---

## 5. Variáveis de ambiente

| Variável | Classificação | Onde | Valor |
|---|---|---|---|
| `NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID` | **Config** · pública | Preview (e Production, quando vender) | `scha_01M2XNKMQ4ZWZ2DY9ZD7MJ8FPK` |
| `NEXT_PUBLIC_HOSTINGER_STOREFRONT_API_URL` | **Config** · pública | opcional | `https://api-ecommerce.hostinger.com/v2` |
| `NEXT_PUBLIC_HOSTINGER_HOMOLOGATION` | **Config** · pública | **só Preview** | `true` |
| `NEXT_PUBLIC_SITE_URL` | **Config** · pública | Production, **só com domínio definitivo** | vazio por enquanto |
| `SITE_INDEXABLE` | **Config** · servidor, não sensível | Production, só com domínio definitivo | `false` / ausente |

- **Secret:** nenhum nesta etapa. Um token administrativo futuro será Secret: nunca `NEXT_PUBLIC_`,
  nunca commitado, só no servidor.
- **Mudanças nas `NEXT_PUBLIC_*` exigem novo deploy**, porque entram no build.

---

## 6. Fluxo completo

1. **Página de produto** (servidor, ISR 60 s): peça ligada → `GET /channels/{scha}/variants?product_ids[]=…`
   → preço e oferta no HTML e no JSON-LD. Peça editorial → nenhum pedido.
2. **Navegador:** a cache ao vivo relê o produto ao montar (validade de 1 min), partilhada com
   vitrines e sacola.
3. **Adicionar à sacola:** grava `{ variantId, slug, option, quantity }` em `hertmann:store:v2`.
4. **Abrir a sacola:** relê preço e estoque das peças compráveis.
5. **Finalizar compra:**
   1. releitura forçada e validação;
   2. `POST /channels/{scha}/checkout` com `items`, `success_url` (`/checkout/sucesso?ref=…`),
      `cancel_url` e `locale`;
   3. registo `hertmann:checkout:pending`;
   4. `window.location.assign(url)`.
6. **Hostinger:** checkout hospedado (frete e pagamento; hoje Test Payment e Pagamento na Entrega).
7. **Regresso:**
   - sucesso → retira da sacola o que foi pago (se o `ref` bater);
   - cancelado → nada muda.

---

## 7. O que mudou visualmente e funcionalmente

**Visual (tudo o resto verificado idêntico à `main` — secção 8):**
- **12 peças de protótipo:**
  - "Adicionar à sacola" passa a "Consultar disponibilidade" (mesmo botão, mesmo estilo);
  - o seletor de quantidade deixa de aparecer.
- **Sacola:**
  - "Sob consulta" nas linhas legadas, com uma nota no rodapé;
  - estados de carregamento, erro e esgotado.
- **Páginas novas:** `/checkout/sucesso`, `/checkout/cancelado` e, só no Preview, a homologação.

**Funcional:**
- a sacola identifica-se por `variantId`;
- o checkout real existe;
- preço e estoque são lidos ao vivo;
- a quantidade tem teto pelo estoque;
- o SEO usa a origem real, com `noindex` por omissão;
- o JSON-LD só traz ofertas reais.

---

## 8. Verificações executadas

| Verificação | Resultado |
|---|---|
| `npm ci` (instalação limpa) | ✅ |
| `npx tsc --noEmit` | ✅ sem erros |
| `npm run build` | ✅ 35 rotas; `/produto/[slug]` em ISR de 1 min; `/checkout/*` estáticas |
| E2E em **produção** (`next build` + `next start`) | ✅ **73/73** |
| E2E em **desenvolvimento** (`next dev`, React StrictMode) | ✅ **73/73**, sem erros de consola |
| Regressão visual contra a `main` (desktop 1440 px e mobile Pixel 7) | ✅ 28/32 capturas **idênticas pixel a pixel**; as 4 restantes são as páginas de produto de protótipo (secção 7) |
| Consola do navegador (movimento normal) | ✅ nenhum erro em home, joias, coleções, produto, homologação e checkout |

### O que o E2E cobre (desktop 1440 px e mobile Pixel 7, cada um)

- **Migração v1 → v2:**
  - a v2 é gravada e só depois a v1 é apagada;
  - as 3 linhas são preservadas, incluindo a de uma peça inexistente, com quantidades e favoritos
    intactos.
- **Sacola com linhas antigas:** "Sob consulta", nota no rodapé, checkout impossível.
- **Protótipo:** preço editorial, "Consultar disponibilidade" → `/contato`, sem quantidade, JSON-LD
  sem oferta.
- **Homologação:**
  - 29990 → R$ 299,90 e 39990 → R$ 399,90 riscado;
  - `noindex`;
  - JSON-LD `Offer` 299.90 BRL.
- **Estoque 3:** o "+" para no 3, na página e na sacola.
- **Sacola:** 3 × R$ 299,90 = R$ 899,70, total só das compráveis, persiste ao recarregar.
- **Checkout:**
  - envia só as linhas compráveis (`variant_id`, `quantity`);
  - `success_url` e `cancel_url` na origem atual, com `ref`;
  - `locale`.
- **Cancelar:** a sacola fica inteira; "Voltar à sacola" reabre-a.
- **Pagar (Test Payment simulado):** saem só as linhas pagas; as sob consulta ficam.
- **`/checkout/sucesso?ref=inventado`:** não mexe na sacola.
- **Checkout em falha:** aviso, e a sacola fica intacta.
- **`locale` recusado (422):** nova tentativa sem `locale`, e o checkout abre.
- **Estoque 0:** "Esgotado", botão desativado.
- **Sem erros de JavaScript nem de console.**

Global:
- **API em baixo desde o arranque:** "Preço indisponível de momento", compra bloqueada;
  "Tentar novamente" recupera.
- **API em baixo a meio da navegação:** a página serve a leitura do servidor.
- **Depois de a API voltar:** o HTML recupera a oferta. Em produção demorou 65 s, dentro da janela de
  ISR de 60 s.
- **SEO:**
  - nenhum URL `hertmann.com.br`;
  - `noindex` em meta e cabeçalho;
  - canónico na origem atual;
  - `robots.txt` sem sitemap;
  - sitemap na origem atual e sem a homologação.

### Como correr

```bash
# Com um Chromium pré-instalado de outra versão do Playwright:
PLAYWRIGHT_CHROMIUM_PATH=/caminho/para/chrome node scripts/e2e/fluxo-checkout.mjs         # next dev
PLAYWRIGHT_CHROMIUM_PATH=/caminho/para/chrome node scripts/e2e/fluxo-checkout.mjs --prod  # build + start
```

**Atenção — Storefront simulada.** O E2E corre contra `scripts/e2e/storefront-simulada.mjs`, que
segue o contrato das instruções oficiais e usa os dados reais do produto de teste. **Não é a
Hostinger.** Valida o comportamento do site, não o formato real da API: isso é o roteiro da
secção 11.

### Achados durante a verificação

- **Regressão visual:**
  - nas páginas de produto de protótipo, o único bloco diferente é o painel da peça: sai o seletor de
    quantidade e o botão passa a "Consultar disponibilidade";
  - acima disso, 1 píxel diferente (antialiasing);
  - no mobile, a página fica ~104 px mais curta (a altura do bloco de quantidade).
- **Pré-existente na `main` (não corrigido):**
  - com "movimento reduzido" ativo, o `CrystalMark` do rodapé (`components/brand/Marks.tsx`, igual
    à `main`) gera um aviso de hidratação;
  - servidor e cliente descrevem estados iniciais diferentes dos traços (`opacity: 0` /
    `stroke-dasharray` no servidor; nenhum no cliente);
  - o aviso só aparece em desenvolvimento, e nas capturas o cristal continua visível;
  - merece correção própria, com cuidado, por ser animação aprovada.
- **Do próprio teste (corrigido no script):**
  - `page.screenshot()` do Playwright injeta `caret-color` nos campos para esconder o cursor;
  - tirada antes da hidratação, a captura aparecia como diferença de atributos no React;
  - as capturas usam agora `caret: "initial"`.

---

## 9. Frete — investigação e proposta de texto (nada aplicado)

**O que a Hostinger suporta:**
- **Pelo Connector ou pela API:** só `ecommerce_setStoreShippingV1`, uma **tarifa fixa única**
  (`price` em centavos, `0` = grátis; cria a zona se não existir). O schema oficial não tem região
  nem valor mínimo. **A regra "Sul, grátis a partir de R$ 150" não se configura pela API.**
- **Pelo painel (hPanel)**, segundo a central de ajuda (lida via busca; a leitura direta estava
  bloqueada):
  - zonas por continente, país **ou estado** (cada país ou estado numa só zona);
  - até **25 opções de frete por zona**, cada uma uma tarifa fixa para o pedido inteiro;
  - **condições por valor do pedido** ou peso (mínimo inclusivo, máximo exclusivo).
  - Os artigos são do Website Builder: falta confirmar que a loja standalone (`v2_standalone`)
    mostra as mesmas telas.
  - Não encontrei cálculo automático por transportadora (Correios). Só tarifas fixas com condições.

**Configuração proposta, quando houver produtos, peso, margem e custo médio** (no hPanel, com
autorização):

| Zona | Opção | Tarifa | Condição |
|---|---|---|---|
| Região Sul (PR, SC, RS) | Frete grátis | R$ 0 | valor do pedido ≥ R$ 150,00 |
| Região Sul (PR, SC, RS) | Envio padrão | R$ X | valor do pedido < R$ 150,00 |
| Demais estados | Envio padrão | R$ Y | — |

**Proposta de texto para a sacola** (hoje: "Envio assegurado e embalagem HERTMANN incluídos."):
- **A (recomendada agora):** "Embalagem HERTMANN incluída. O frete é calculado no checkout."
- **B (só quando a regra existir):** "Embalagem HERTMANN incluída. Frete grátis para a Região Sul a
  partir de R$ 150; nas demais regiões, calculado no checkout."
- Evitado de propósito: "faltam R$ X para o frete grátis". O componente da sacola proíbe contagens e
  selos de urgência.

**Outros textos a rever com a política final** (não alterados):

| Onde | Texto atual |
|---|---|
| Barra superior (`lib/data/editorial.ts`) | "Frete especial para todo o Brasil" |
| Página de produto, sob o botão | "Entrega assegurada em todo o Brasil · Prazo de execução de 14 semanas…" |
| Página de produto, "Entrega" | "…expedidas em até três dias úteis, por transporte assegurado…" |
| Termos, "Entrega" | "…transporte assegurado… com seguro pelo valor integral da peça…" |
| Privacidade | diz que a sacola não é enviada à HERTMANN; no checkout os itens vão para a Hostinger |

---

## 10. Riscos e limitações

**Riscos:**
- **Formato real da API não verificado.** Mitigação: cliente tolerante e amostra crua em
  `/api/hostinger-status`.
- **`locale: "pt-BR"` pode ser recusado.** Mitigação: segunda tentativa automática sem `locale`.
- **`success_url` com `?ref=`, ou um Preview**, podem ser recusados se a Hostinger exigir o domínio do
  canal, que não pode ser configurado agora. Só o teste real responde.
- **Um pedido com Test Payment cria um pedido de teste na loja** e provavelmente desconta o estoque do
  produto de teste. Está dentro da homologação autorizada.
- **No merge, a produção passa a `noindex`** até existir domínio e `SITE_INDEXABLE=true`.

**Limitações:**
- só o produto de teste é comprável, e só no Preview;
- filtros por preço usam o catálogo de protótipo;
- sem Stripe;
- sem regra de frete;
- sem domínio;
- sem número de pedido na página de sucesso;
- sem imagens da Hostinger (`cdn.zyrosite.com` não liberado e desnecessário agora).

---

## 11. Roteiro de homologação no Preview

**Pré-requisitos**, nas variáveis de ambiente da Vercel, escopo **Preview** (todas Config):
- `NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID=scha_01M2XNKMQ4ZWZ2DY9ZD7MJ8FPK`
- `NEXT_PUBLIC_HOSTINGER_HOMOLOGATION=true`

Depois, um novo deploy do Preview desta branch.

| # | Passo | Esperado |
|---|---|---|
| 0 | Abrir `/api/hostinger-status` | `ok: true`, 1 produto; conferir `sample.variant` (formato real da API) |
| 1 | Abrir `/produto/homologacao-hostinger` | preço R$ 299,90 e R$ 399,90 riscado |
| 2 | Seleção de variante | produto de teste sem opções: variante `default` resolvida (botão ativo) |
| 3 | Adicionar à sacola | a sacola abre com a linha e o preço real |
| 4 | Alterar quantidade | `+`/`−` atualizam o subtotal; `+` para no estoque |
| 5 | Persistência | recarregar: a sacola mantém-se |
| 6 | Migração | numa janela com sacola antiga (v1): linhas "Sob consulta", nada apagado |
| 7 | Preço Hostinger | igual ao do hPanel (alterar a promoção no hPanel só com autorização) |
| 8 | Estoque | igual ao do hPanel |
| 9 | Checkout | "Finalizar compra" → `checkout.hostinger.com` |
| 10 | Test Payment | concluir com Test Payment (cria pedido de teste) |
| 11 | Retorno de sucesso | `/checkout/sucesso?ref=…`; a linha paga sai da sacola |
| 12 | Cancelamento | noutro checkout, cancelar → `/checkout/cancelado`; a sacola fica |
| 13 | Mobile | repetir 1, 3, 4, 9 e 12 no telemóvel |
| 14 | Desktop | repetir no desktop |
| 15 | Regressões visuais | home, joias, coleções, produto, menu, busca, sacola iguais à produção, salvo o descrito na secção 7 |

**Anotar em cada passo** o que a Hostinger devolve: formato do `sample`, idioma do checkout,
parâmetros no regresso e se o pedido aparece na loja.

---

## 12. Próximos passos e autorizações

**Ações suas:**
- liberar `api-ecommerce.hostinger.com` e `checkout.hostinger.com` na rede do ambiente;
- configurar as variáveis de Preview na Vercel;
- correr o roteiro da secção 11.

**Decisões suas:**
- texto de frete (A ou B);
- e-mail de atendimento (enquanto não houver domínio);
- revisão dos textos legais.

**Precisam de autorização explícita:**
- merge na `main`;
- cadastrar os produtos reais;
- estoque;
- regra de frete no hPanel;
- Stripe;
- desligar o Test Payment;
- domínio e DNS;
- domínio no canal;
- qualquer exclusão ou cobrança real.
