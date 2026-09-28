# Painel administrativo HERTMANN: diagnóstico, arquitetura e plano

_2026-09-28 · branch de trabalho prevista: `feature/hertmann-admin` (a partir da `main`) · **nenhuma
mudança de código, loja, Vercel, pagamentos, frete, DNS ou domínio foi feita para este documento.**_

Este documento é a explicação inicial pedida antes da implementação. Ele descreve o estado atual, a
arquitetura recomendada, as decisões, os riscos e a ordem de execução do MVP do Admin.

---

## 1. O que encontrei no projeto

- **Next.js 15 (App Router), React 19, Tailwind 4, TypeScript**, na Vercel (projeto `hertmann`).
  Dependências mínimas: `motion`, `lenis`, `clsx`. Não há banco de dados, autenticação,
  `middleware.ts` nem biblioteca de componentes.
- **Um único layout raiz** (`app/layout.tsx`) envolve todas as páginas com barra superior, cabeçalho,
  rodapé, rolagem suave (Lenis), `StoreProvider` e o CSS da marca (`app/globals.css`, com o `@theme`
  editorial: Cormorant, `ink`, `paper`…). Hoje, qualquer rota nova herdaria esse visual.
- **O catálogo do site é código**: `lib/data/catalogue.ts` (12 peças de protótipo; preços não
  comerciais). Uma peça só vende quando recebe `commerce: { productId, variants }` com IDs reais.
  Nenhuma tem.
- **`components/ui/Button.tsx`** já existe (botão do site). O shadcn não pode usar
  `components/ui/button.tsx`: em sistemas de arquivos que não diferenciam maiúsculas (macOS), os dois
  nomes colidem.
- **Scripts de teste**: `scripts/e2e/fluxo-checkout.mjs` (76 verificações) contra uma Storefront
  **simulada** (`storefront-simulada.mjs`). É uma boa base de regressão para o site público.
- **Documentação**: diagnóstico (09-24), implementação (09-25) e release (09-26). A integração das
  Fases 0 e 1 está na `main`. Em Production nada se vende.

## 2. Como funciona hoje a integração com a Hostinger

| Superfície | Uso atual | Autenticação |
|---|---|---|
| **Storefront API V2** (`api-ecommerce.hostinger.com/v2/channels/{scha}/…`) | leitura de produtos e variantes (preço, promoção, estoque) e criação do checkout hospedado | **pública, sem token**, com CORS aberto |
| **API de gestão** (`developers.hostinger.com/api/ecommerce/v1/stores/{store}/…`) | **não é usada pelo código.** Nas sessões anteriores foi usada só pelo conector (leitura) | **token Bearer da conta Hostinger** |

- O cliente fica em `lib/hostinger/client.ts` e os tipos em `lib/hostinger/types.ts`. A ponte entre
  peça e produto fica em `lib/commerce.ts`.
- As leituras são feitas no servidor (ISR de 60 s na página de produto) e no navegador
  (`useLiveProducts`). O checkout é um `POST` público.
- A Storefront é **só leitura + checkout**. Para criar ou editar produtos, preços, estoque, imagens e
  pedidos, o Admin precisa da **API de gestão**, que exige um token secreto.

### A API de gestão (fonte: `hostinger/api-mcp-server`, README, lido em 2026-09-28)

| Área | Endpoints |
|---|---|
| Produtos | `GET …/products` · `POST …/products/physical` · `PATCH …/products/{id}` · `DELETE …/products/{id}` |
| Variantes | `GET/POST …/products/{id}/variants` · `PATCH …/variants/batch` (título, estoque, controle de estoque, preços: **substituídos por inteiro**) · `DELETE …/variants/{id}` |
| Imagens | `POST …/products/{id}/images/upload-url` (URL assinada) · `POST …/products/{id}/images` (anexar por `object_name` ou por URL HTTPS; JPEG/PNG/GIF/WebP até 15 MB) |
| Pedidos | `GET …/orders` · `GET …/orders/{id}` · `POST …/orders/{id}/fulfill` · `POST …/orders/{id}/cancel` (podem enviar e-mail ao cliente) |
| Outros | lojas, canais, pagamentos, frete, descontos |

- **Não verificado:** os corpos exatos das requisições e respostas. Não há token neste ambiente, e o
  README só resume os campos. O adaptador será escrito de forma tolerante e marcado como "não
  verificado" até a primeira leitura real no Preview.
- **Não encontrei endpoint** para remover ou reordenar imagens. Se isso se confirmar, remover uma
  imagem continuará exigindo o hPanel (ver riscos).

## 3. Arquitetura recomendada

```
Navegador (Admin, shadcn/ui)
   │  Server Components (leitura) · Server Actions (escrita)  — nunca fala com a Hostinger
   ▼
Camada de aplicação  lib/admin/
   ├─ auth/        sessão, usuários, papéis, limite de tentativas
   ├─ services/    casos de uso: validação (zod), autorização, auditoria
   └─ commerce/    modelo de domínio próprio + interface CommerceAdminProvider
         ├─ hostinger/   adaptador da API de gestão (token só aqui, lista fechada de endpoints)
         └─ simulado/    provider em memória, rotulado "Dados simulados" (dev e testes)
   ▼
Hostinger Ecommerce (fonte da verdade comercial)
```

**Decisões e alternativas:**

1. **Admin dentro do mesmo app Next.js, em `/admin`**, e não num app separado.
   - A favor: reaproveita o deploy, os tipos e as regras de dinheiro em centavos (`lib/format.ts`), e
     não cria projeto novo na Vercel.
   - Contra: o Admin partilha o domínio do site. Mitigação: `noindex`, `no-store`, `frame-ancestors
     'none'` e rotas fechadas por padrão.
2. **Dois layouts raiz com route groups.**
   - As páginas públicas passam para `app/(site)/`. É uma mudança só de pasta: as URLs, o código e o
     CSS ficam iguais.
   - O Admin ganha `app/admin/layout.tsx`, com o seu próprio CSS e tema. Assim, o Admin não carrega
     Lenis, cabeçalho, sacola nem o CSS editorial, e o site não carrega nada do Admin.
   - Para a página 404 do site continuar igual, entra uma rota "pega-tudo" em `(site)` que chama
     `notFound()`.
   - **Verificação:** o CSS gerado do site tem de sair idêntico, e o E2E de 76 verificações e a
     regressão visual têm de passar.
   - Alternativa rejeitada: esconder o cabeçalho e o rodapé no layout atual conforme a rota. Isso
     obrigaria a ler o caminho no servidor (tornando todas as páginas dinâmicas) e misturaria os
     dois CSS.
3. **Leitura por Server Components e escrita por Server Actions.** Não há API REST pública do Admin
   e nenhum dado comercial passa por `fetch` no navegador. O token nunca sai do servidor.
   `import "server-only"` impede, no build, que o adaptador entre num bundle de cliente.
4. **Modelo de domínio próprio** (`AdminProduct`, `AdminVariant`, `Money` em unidades mínimas,
   `ProductStatus`, `AdminOrder`…). As telas só conhecem esse modelo. Trocar de motor significa
   escrever um novo `CommerceAdminProvider`, sem mexer nas telas.
5. **Capacidades declaradas pelo provider** (por exemplo, `images.remove: false`). A interface
   esconde ou explica o que o motor atual não suporta, em vez de falhar.

## 4. Autenticação e autorização

| Opção | Prós | Contras |
|---|---|---|
| Auth.js + Google | login conhecido | exige app OAuth no Google Cloud (serviço externo); todos precisam de conta Google |
| Clerk / Supabase Auth | reset de senha, MFA, gestão de usuários | serviço externo novo, conta, dados de login fora da casa; precisa de autorização |
| **Própria, mínima (recomendada para o MVP)** | sem serviço externo nem banco; tudo auditável no repositório | sem reset de senha por e-mail; troca de senha pede atualizar uma variável e fazer redeploy |

**Escolha: autenticação própria e mínima, atrás de uma interface (`lib/admin/auth`) que pode ser
trocada** por um IdP ou por um banco quando houver mais usuários ou e-mail com domínio (hoje não
existe domínio para enviar e-mails de reset).

- **Usuários:** a variável **Secret** `ADMIN_USERS` guarda JSON com e-mail, nome, papel e hash
  **scrypt** da senha, nunca a senha. Um script local gera o hash.
- **Sessão:** cookie `httpOnly`, `Secure`, `SameSite=Strict`, `path=/admin`, com JWT assinado
  (HS256, biblioteca `jose`) por `ADMIN_SESSION_SECRET` (Secret, ≥ 32 bytes). Validade de 12 h.
  Trocar o segredo encerra todas as sessões.
- **Verificação em camadas:**
  - o `middleware.ts` só atua em `/admin/*`;
  - o layout do Admin verifica de novo;
  - **cada Server Action verifica sessão e papel**, porque o middleware sozinho não é fronteira de
    segurança.
  - As Server Actions já validam a origem (proteção CSRF do Next).
- **Login:** mensagem de erro genérica, comparação em tempo constante e limite de tentativas por IP
  e e-mail. **Limitação:** o limite vive na memória de cada instância. Um limite global exige
  armazenamento (fase 2).
- **Papéis:**

  | Papel | Permissões |
  |---|---|
  | `admin` | tudo, incluindo arquivar produtos e excluir variantes |
  | `editor` | criar e editar produtos, variantes, preços, estoque, imagens e publicação; ver pedidos |
  | `leitura` | só visualizar |

- **Fechado por padrão:**
  - sem os segredos configurados, `/admin` responde 404 (em `next dev`, uma página explica o que
    falta);
  - o provider simulado nunca é aceito em Production;
  - Production não tem nenhuma variável hoje, então **o Admin não existe em Production** até a
    autorização.
- **Fase 2:** segundo fator (TOTP), limite de tentativas global, gestão de usuários pela interface.

## 5. Onde vivem os dados

| Dado | Fonte da verdade (MVP) | Observação |
|---|---|---|
| Preço, promoção, estoque, SKU, variantes, status de publicação, imagens do produto, pedidos | **Hostinger** | o Admin lê ao vivo e não guarda cópia |
| Texto editorial (linha, descrição de marca, material, desenho, coleção), fotografia do site | **`lib/data/catalogue.ts`** (git) | inalterado no MVP |
| Vínculo peça do site ↔ produto Hostinger | **`lib/data/catalogue.ts`** (`commerce`) | o Admin **mostra** o vínculo (“aparece no site como…” / “ainda não aparece no site”) |
| Usuários do Admin | variável Secret `ADMIN_USERS` | banco na fase 2 |
| Auditoria (quem mudou o quê) | log estruturado no servidor (logs da Vercel) | tabela própria na fase 2 |

**Consequência:** no MVP, um produto criado no Admin existe na loja e no checkout, mas **só aparece
no site depois de ligado a uma peça editorial**, o que hoje exige um commit. A interface diz isso
com clareza. A **fase 2** proposta leva o editorial e o vínculo para um armazenamento editável
(banco ou CMS). Essa decisão envolve um serviço externo e fica para autorização.

## 6. Como a Hostinger fica abstraída

- `CommerceAdminProvider`: `listProducts`, `getProduct`, `createProduct`, `updateProduct`,
  `setProductStatus`, `createVariant`, `updateVariants`, `deleteVariant`, `addImage`, `listOrders`,
  `getOrder` e `capabilities`.
- **Adaptador Hostinger:**
  - traduz o domínio para o formato da API (centavos, `prices` substituídos por inteiro, `status`) e
    de volta;
  - tem uma **lista fechada de métodos e caminhos**, só `ecommerce/v1/stores/{HOSTINGER_STORE_ID}/…`
    de produtos, variantes, imagens e pedidos. Qualquer outro caminho é recusado antes da rede. O
    token da conta alcança faturamento, DNS e domínios, e esta lista é a barreira;
  - devolve erros normalizados, com mensagem em português para a equipe e detalhe técnico só no log.
- **Provider simulado:** fixture em memória, com banner permanente "Dados simulados". Serve para
  desenvolvimento, demonstração e testes E2E sem tocar na loja real.
- `ADMIN_COMMERCE_PROVIDER=hostinger|simulado` escolhe o provider.

## 7. Escopo do MVP

**Dentro:**
- login, logout e papéis;
- visão geral (contagens, estoque baixo, últimos pedidos);
- produtos:
  - lista com busca e filtro por status;
  - criar produto físico;
  - editar nome e descrição;
  - publicar, despublicar (rascunho) e arquivar;
  - variantes: criar, editar título, SKU, preço, preço promocional, estoque e controle de estoque,
    excluir com confirmação (só `admin`);
  - imagens: ver e enviar;
  - indicador de vínculo com o site;
- pedidos: lista com filtro por status e detalhe (itens, cliente, endereço, totais, pagamento,
  envio). **Só leitura.**

**Fora (fases seguintes):**
- marcar pedido como enviado ou cancelá-lo (dispara e-mail ao cliente; fica para a fase 2);
- editorial e vínculo pela interface;
- descontos, frete, pagamentos, clientes, relatórios;
- exclusão definitiva de produto (o MVP arquiva);
- MFA;
- auditoria consultável.

## 8. Estrutura das telas

- **Casca:** barra lateral fixa (monograma HM e "Admin"; Visão geral, Produtos, Pedidos; usuário e
  sair no rodapé), cabeçalho com trilha e ação principal. No celular, a barra vira gaveta.
- **Visual:**
  - base neutra do shadcn (fundo branco e zinco, bordas finas, Inter);
  - **azul `#051D41` só como acento**: botão primário, item ativo da navegação, anel de foco, links,
    indicadores;
  - Cormorant SC apenas na assinatura "HERTMANN" da barra lateral;
  - sem gradientes, sem cartões decorativos.
- `/admin/login`
- `/admin`: visão geral
- `/admin/produtos` (tabela: miniatura, nome, status, variantes, faixa de preço, estoque total)
- `/admin/produtos/novo`
- `/admin/produtos/[id]` (seções: Informações · Publicação · Imagens · Variantes, preço e estoque ·
  Presença no site)
- `/admin/pedidos` · `/admin/pedidos/[id]`

## 9. Principais riscos

1. **O token da Hostinger vale para a conta inteira** (faturamento e compras, DNS, domínios, excluir
   loja). Não encontrei documentação de escopos.
   - Mitigações:
     - lista fechada no adaptador;
     - Secret "Sensitive" na Vercel, só no servidor;
     - validade curta e rotação;
     - de início, **só no Preview desta branch** (a Vercel permite variável de Preview por branch).
   - **A criação do token e o seu cadastro na Vercel são ações suas, e só com autorização.**
2. **Previews com token escrevem na loja real.** Qualquer Preview com a variável pode alterar
   produtos. Confirmar que a proteção de deployments da Vercel está ativa nos Previews.
3. **Contrato da API de gestão não verificado.** Há risco de ajuste de mapeamento na primeira
   leitura real. Até lá, as escritas reais ficam proibidas por mim sem autorização; testo contra o
   provider simulado.
4. **Duas fontes da verdade:** um produto novo não aparece sozinho no site (secção 5).
5. **Autenticação própria:** precisa de cuidado. Mitigação: bibliotecas padrão (`crypto.scrypt`,
   `jose`), verificação em cada ação e testes E2E de acesso negado.
6. **Mudança dos route groups:** risco de regressão no site público. Mitigação: mudança só de pasta,
   CSS idêntico, E2E e regressão visual.
7. **Edição concorrente:** "a última gravação vence" (não há controle de versão exposto).
8. **Preços substituídos por inteiro** no batch: o adaptador envia sempre o preço completo, para não
   apagar a promoção por omissão.
9. **Imagens:** limite de corpo nas Server Actions (a configurar para cerca de 5 MB). Não há remoção
   ou reordenação pela API (a confirmar).
10. **Deploys:** pushes em branch já deixaram de gerar Preview (2026-09-25). Se acontecer, aviso e
    não forço.

## 10. Ordem de implementação

1. Branch `feature/hertmann-admin` a partir da `main`.
2. Route groups (`app/(site)`, `app/admin`) e verificação de que o site não muda (CSS, build, E2E).
3. Base shadcn em `components/admin/ui`, tema do Admin e casca (barra lateral, cabeçalho).
4. Autenticação e autorização (usuários, sessão, middleware, login, papéis, limite de tentativas) e
   script de hash.
5. Domínio + interface do provider + provider simulado.
6. Produtos: lista, criação, edição, variantes, preços, estoque, publicação, imagens.
7. Pedidos: lista e detalhe.
8. Visão geral.
9. Adaptador Hostinger (lista fechada, mapeamentos), marcado "não verificado".
10. E2E do Admin (simulado) + regressão do site + `tsc` + build.
11. Documentação de implementação, `.env.example` e README.

**Variáveis previstas:**

| Variável | Classificação |
|---|---|
| `ADMIN_SESSION_SECRET` | **Secret** |
| `ADMIN_USERS` | **Secret** |
| `HOSTINGER_API_TOKEN` | **Secret** |
| `ADMIN_COMMERCE_PROVIDER` | Config · servidor |
| `HOSTINGER_STORE_ID` | Config · servidor (`store_01M2XKR3V3JR3YG7QKNRG8NK47`) |
| `HOSTINGER_API_URL` | Config · servidor, opcional |

Nenhuma delas usa o prefixo `NEXT_PUBLIC_`.
