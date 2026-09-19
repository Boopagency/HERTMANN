# POC Hostinger Ecommerce — implementação (Fases 1 a 4)

_Gerado em 2026-09-19 · branch `feature/hostinger-ecommerce` · commit `4a888b7`_

**Objetivo do POC:** validar o caminho completo `produto real → preço/estoque real → carrinho → checkout Hostinger → pagamento teste → pedido`, usando **apenas** o produto já cadastrado na loja.

**Produto piloto**
- Produto: `prod_01M2XN4RWHN3YSHPJJMMRBF6SD` — "Anel Solitário de Prata com Zircônias"
- Variante: `variant_01M2XN4RY2MTVB57FTFBQ3BNM7`
- Canal de venda: `scha_01M2XNKMQ4ZWZ2DY9ZD7MJ8FPK`
- Loja: `store_01M2XKR3V3JR3YG7QKNRG8NK47`

**Restrições respeitadas:** nenhum produto adicional cadastrado, nenhum deploy, nenhum domínio ligado, pagamentos e frete não alterados, identidade visual intacta, catálogo editorial preservado, nenhum merge na `main`, nenhum PR aberto.

---

## 1. Verificações executadas

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0, sem erros |
| `npm run build` | ✅ exit 0 — 36 páginas geradas, `/produto/[slug]` em ISR (revalidate 60s) |
| `npm run lint` | ⚠️ **não executado** — o repositório não tem configuração de ESLint; o comando abre um assistente interativo de instalação. Não foi instalado por estar fora do escopo |
| Validação no browser (Playwright) | ✅ fluxo completo percorrido, sem erros de JS |

### O que a validação no browser cobriu

| Passo | Resultado |
|---|---|
| Página do produto piloto renderiza | ✅ título "Solitário", layout e tipografia intactos |
| Botão de compra | ✅ "Adicionar à sacola", habilitado |
| Adicionar à sacola | ✅ grava `{"variantId":"variant_01M2XN4RY2MTVB57FTFBQ3BNM7","slug":"anel-solitario","quantity":1}` |
| Chave `localStorage` v1 | ✅ ausente após migração |
| Requisição de catálogo | ✅ `GET /channels/scha_…/products?limit=100` |
| Requisição de checkout | ✅ `POST /channels/scha_…/checkout` disparada com a URL correta |
| Erro de checkout tratado | ✅ mensagem exibida (a API está bloqueada neste ambiente — ver bloqueios) |
| Migração do `localStorage` legado | ✅ linha convertida para `variantId` com quantidade preservada; peça sem ligação descartada; favoritos intactos |
| `/checkout/sucesso` | ✅ renderiza e esvazia a sacola (0 itens) |
| `/checkout/cancelado` | ✅ renderiza, sacola preservada |
| Peça sem ligação à Hostinger | ✅ mantém preço editorial (R$ 24.500) e exibe "Consultar disponibilidade" |

### Bug real encontrado e corrigido durante a validação

Em React StrictMode o efeito de hidratação roda **duas vezes**. Como a primeira passagem apagava a chave `hertmann:store:v1` logo após ler, a segunda passagem encontrava um estado vazio e **zerava o carrinho recém-migrado** (e os favoritos).

Correção: a leitura passou a ser pura e idempotente — a chave antiga só é removida **depois** de a nova (`v2`) ficar gravada, no efeito de persistência. Reconfirmado no browser:

```json
{"bag":[{"variantId":"variant_01M2XN4RY2MTVB57FTFBQ3BNM7","slug":"anel-solitario","quantity":2}],
 "favourites":["colar-noturno","brinco-ponto"]}
```

---

## 2. Arquivos alterados (12)

### Novos

| Arquivo | Função |
|---|---|
| `lib/hostinger/types.ts` | Contratos da Storefront API: produto, variante, preço, snapshot normalizado, checkout |
| `lib/hostinger/client.ts` | Cliente tipado: listar produtos, produto por ID, variantes, preço, estoque, criar checkout |
| `app/checkout/sucesso/page.tsx` | Página de pedido confirmado |
| `app/checkout/sucesso/BagReset.tsx` | Componente cliente que esvazia a sacola à chegada |
| `app/checkout/cancelado/page.tsx` | Página de compra interrompida |
| `.env.example` | Documenta as três variáveis públicas |

### Modificados

| Arquivo | Mudança |
|---|---|
| `lib/format.ts` | Novo `priceFromMinorUnits()`. O `price()` editorial **não foi tocado** |
| `lib/data/catalogue.ts` | Campos opcionais `hostingerProductId`/`hostingerVariantId` no tipo `Piece` + a peça piloto. **Nenhuma peça existente foi alterada** |
| `components/commerce/StoreProvider.tsx` | Carrinho por `variantId`, preços lidos ao vivo, migração segura do `localStorage` |
| `components/commerce/BagDrawer.tsx` | Preços ao vivo, teto de quantidade pelo estoque real, checkout funcional |
| `components/product/ProductDetail.tsx` | Preço/estoque ao vivo, adição por `variantId`, fallback para peças não vendáveis |
| `app/produto/[slug]/page.tsx` | Leitura em runtime (ISR 60s) + JSON-LD com preço e disponibilidade reais |

---

## 3. Fluxo completo

1. **Servidor** — `/produto/anel-solitario` (ISR, revalidate 60s) chama `GET /channels/{canal}/variants?product_ids[]=prod_…`, normaliza a variante num snapshot (preço cheio, preço promocional, estoque, disponibilidade) e renderiza o preço já correto no HTML, inclusive no JSON-LD (`schema.org/Offer`).
2. **Conteúdo editorial** — nome, descrição, material, medidas, referência e a prancha desenhada continuam a vir do repositório. A Hostinger substitui **apenas**: preço, preço promocional, estoque, disponibilidade e o `variant_id` usado no carrinho.
3. **Adicionar à sacola** — grava `{ variantId, quantity }` em `hertmann:store:v2`. O `slug` viaja junto só para resolver nome, prancha e link; **deixou de ser identidade comercial**.
4. **Sacola** — relê os preços do catálogo ao vivo (nunca do que foi guardado) e limita a quantidade ao estoque real quando a Hostinger o controla.
5. **Finalizar compra** — `POST /channels/{canal}/checkout` com `items[{variant_id, quantity}]`, `success_url`, `cancel_url` e `locale: pt-BR`; o navegador é redirecionado para a `url` devolvida (checkout hospedado pela Hostinger).
6. **Retorno** — `/checkout/sucesso` esvazia a sacola; `/checkout/cancelado` preserva tudo.

### Consequência visível da migração do carrinho

Só peças ligadas à Hostinger são compráveis. As outras 12 peças passam a exibir **"Consultar disponibilidade"** (link para `/contato`) no lugar de "Adicionar à sacola". Isto decorre diretamente de migrar a identidade do carrinho para `variantId` — uma peça sem variante não tem como entrar num checkout real.

### Conversão monetária

A Hostinger devolve centavos; o formatador editorial (`price()`) assume reais inteiros. Passar um valor da API direto ao formatador antigo inflaria o preço em 100×. O novo `priceFromMinorUnits()` divide por `10^decimal_digits` e mostra centavos **apenas quando existem**, para que valores redondos continuem a ler-se como no resto do catálogo.

- `29990` → **R$ 299,90**
- `39990` → **R$ 399,90** (exibido riscado, como preço cheio)

---

## 4. Variáveis de ambiente

Nenhum token. A Storefront API é pública e sem autenticação.

```
NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID=scha_01M2XNKMQ4ZWZ2DY9ZD7MJ8FPK
NEXT_PUBLIC_HOSTINGER_STOREFRONT_API_URL=https://api-ecommerce.hostinger.com/v2
NEXT_PUBLIC_SITE_URL=https://hertmann.com.br
```

---

## 5. Bloqueios e pendências

1. **Rede bloqueada para `api-ecommerce.hostinger.com` no ambiente de execução** (política de egresso do container — 403 no CONNECT). Consequências: não foi possível ler o schema OpenAPI nem concluir o teste E2E real. A requisição de checkout **é disparada com a URL correta**, mas a resposta nunca chega neste ambiente. **A validação real tem de ser feita localmente.**

2. **Caminhos dos endpoints não verificados contra o schema.** Foram derivados das instruções oficiais de Custom Storefront da Hostinger. Estão centralizados no objeto `endpoints` em `lib/hostinger/client.ts` — se algum divergir, corrige-se num único lugar.

3. **Preço no card de listagem diverge do preço real.** O card em `/joias` mostra R$ 300 (valor editorial) enquanto a página do produto mostra R$ 299,90 (valor real). Levar preço ao vivo às listagens exigiria propagar dados por `ProductGrid`/`ProductCard` — ficou de fora para não refatorar sem necessidade.

4. **Conteúdo editorial escrito pelo assistente** para a peça piloto (material "Prata 925", medidas, referência `HM–AR–052`, descrição) — precisa de aprovação, é copy de marca.

5. **Foto do produto.** Foi usada a prancha técnica da marca (`image: null`), pelo que `next.config.mjs` **não foi alterado**. Para usar a foto real da Hostinger é preciso liberar `cdn.zyrosite.com` em `images.remotePatterns`.

6. **Copy da sacola** — "Envio assegurado e embalagem HERTMANN incluídos" pode conflitar com frete cobrado no checkout da Hostinger. Não foi alterada; é decisão de marca.

7. **"Test Payment" continua ativo** na loja. Adequado para este POC, mas tem de sair antes de produção.

---

## 6. Como validar localmente

```bash
cp .env.example .env.local
npm install
npm run dev
# abrir http://localhost:3000/produto/anel-solitario
```

**Resultado esperado com rede disponível:** a página mostra **R$ 299,90** com **R$ 399,90** riscado ao lado; adicionar à sacola e clicar em "Finalizar compra" redireciona para `checkout.hostinger.com`; concluir com o pagamento de teste gera um pedido na loja e devolve a `/checkout/sucesso`.

---

## 7. Próximos passos sugeridos (não executados)

1. Validar o E2E real localmente e confirmar que o pedido aparece na loja.
2. Ajustar os caminhos de endpoint, se a validação revelar divergência.
3. Decidir sobre preço ao vivo nas listagens.
4. Rever/aprovar o conteúdo editorial da peça piloto.
5. Só depois: cadastrar as restantes peças, conectar gateway de pagamento real, remover o "Test Payment", ligar domínio ao canal e fazer deploy.
