# Painel administrativo HERTMANN — implementação do MVP

_2026-09-28 · branch `feature/hertmann-admin` (a partir da `main` `797322e`) · **nada foi alterado na
`main`, na Hostinger, na Vercel, no Supabase, em pagamentos, frete, DNS, domínio ou indexação.**_

Documentos anteriores desta etapa:
- [`admin-arquitetura-plano-2026-09-28.md`](admin-arquitetura-plano-2026-09-28.md): diagnóstico e
  primeira proposta;
- [`admin-arquitetura-revisao-2026-09-28.md`](admin-arquitetura-revisao-2026-09-28.md): revisão
  com Supabase (Auth e ficha editorial).

Este documento descreve o que foi construído, como funciona, como foi verificado e o que falta
para ligar o painel a serviços reais.

---

## Resumo

- **O painel existe e funciona de ponta a ponta com dados simulados.** O fluxo coberto:
  entrar → criar → completar a ficha → preço, promoção, variantes, estoque → imagem → publicar
  → a peça aparece no site → despublicar. **O E2E do painel dá 50/50.**
- **O site público não mudou.**
  - Com o Supabase desligado (Production hoje), as 30 páginas têm o **mesmo DOM** da `main`.
  - Sitemap e robots são iguais.
  - Os modos de renderização (estático, SSG, ISR) são os mesmos.
  - **O E2E do site dá 76/76** com o código final.
  - O CSS difere numa única regra que nenhum componente usa (secção 6).
- **Nenhum serviço real foi ligado.**
  - Não há projeto Supabase da HERTMANN nem token da Hostinger (secção 8).
  - Sem eles, `/admin` responde 404 e o site fica exatamente como está.
- **A API de gestão da Hostinger não foi chamada.**
  - O adaptador segue o schema oficial (`hostinger/api-mcp-server`, lido em 2026-09-28).
  - Os formatos das **respostas** estão marcados como **não verificados** até a primeira leitura
    real no Preview.

---

## 1. Arquitetura

```
Navegador (painel, shadcn/ui)
  │  Server Components (leitura) · Server Actions (escrita)
  │  — nunca fala com a Hostinger nem com o Supabase
  ▼
lib/admin/                                   lib/catalog/  (site público)
  auth/      sessão Supabase, papéis            site.ts    protótipos + fichas + loja
  actions/   validar → autorizar → escrever     compose.ts ficha + produto → Piece
             → auditar → revalidar
  commerce/  CommerceAdminProvider
     hostinger/  HostingerAdapter (token só aqui, lista fechada)
     simulated   loja em memória (só local)
  editorial  fichas e configuração (Supabase, RLS)
  ▼                                  ▼
Hostinger (verdade comercial)     Supabase (Auth + ficha editorial)
```

### Decisões

| Decisão | Porquê |
|---|---|
| Painel no mesmo Next.js, em `/admin` | um deploy, os mesmos tipos e as mesmas regras de dinheiro |
| **Route groups com dois layouts raiz** (`app/(site)`, `app/admin`) | o painel não carrega Lenis, cabeçalho, sacola nem o CSS editorial, e o site não carrega nada do painel. A mudança de pasta não altera URLs, DOM nem CSS (verificado) |
| **Uma rota pega-tudo em `app/(site)/[...rest]`** | com dois layouts raiz, é ela que mantém a mesma página 404 do site |
| Leitura em Server Components, escrita em Server Actions | não há API do painel exposta nem dados comerciais pedidos pelo navegador |
| **Modelo comercial próprio** (`lib/admin/commerce/types.ts`) | as telas não conhecem a Hostinger. Trocar de motor é escrever outro `CommerceAdminProvider` |
| **Capacidades declaradas pelo provider** | a interface explica o que o motor não permite (remover imagens, mudar SKU) em vez de falhar |
| Painel sempre dinâmico (`dynamic = "force-dynamic"` no layout do painel) | nada do painel é pré-renderizado nem guardado em cache |

---

## 2. Autenticação e autorização (Supabase Auth)

| Camada | O que faz |
|---|---|
| **Login e logout** | Server Actions (`lib/admin/auth/actions.ts`) com `signInWithPassword` e `signOut`. Os cookies `httpOnly` são gravados pelo servidor (`@supabase/ssr`). O navegador nunca recebe um cliente Supabase |
| **`middleware.ts`** | atua **só em `/admin/*`**: 404 se o painel não estiver configurado; renova o token (`getClaims`); redireciona quem não tem sessão; cabeçalhos `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `no-store`, `noindex`. **É só a primeira linha** |
| **`requireMember()`** | em cada página: `auth.getUser()` (valida o token no Supabase Auth, nunca `getSession()`) e o papel em `admin_members`, lido com a sessão do membro |
| **`requirePermission()`** | **no início de cada Server Action**, antes de tocar em qualquer sistema |
| **RLS** | segunda barreira, independente do código (secção 3) |
| **Limite de tentativas** | por IP (30) e por e-mail (8) em 15 min, **só as falhas contam**. Limitação: fica na memória de cada instância |
| **Conta sem papel** | a sessão é recusada no login; quem já tinha sessão vai para "Sem acesso" |
| **Redefinição de senha** | e-mail do Supabase → `/admin/auth/confirmar` (troca do código por sessão, no servidor) → `/admin/senha/nova`. A resposta é a mesma exista ou não a conta |
| **Redirecionamentos** | só para caminhos `/admin…`, nunca abertos |

**Papéis** (`lib/admin/auth/permissions.ts`):

| Papel | Pode |
|---|---|
| `admin` | tudo; arquivar; excluir variantes; configuração do site |
| `editor` | criar e editar produtos, variantes, preços, estoque, imagens, ficha e publicação; ver pedidos |
| `leitura` | ver (os campos aparecem desativados) |

---

## 3. Dados no Supabase — `supabase/migrations/20260928120000_admin_inicial.sql`

| Tabela | Conteúdo | RLS |
|---|---|---|
| `admin_members` | `user_id`, `role` (`admin`/`editor`/`leitura`), `display_name` | cada membro vê a própria linha (o admin vê todas); **ninguém escreve pela aplicação** |
| `catalog_items` | ficha editorial: `hostinger_product_id` (único e **imutável**), `slug` (único), nome curto, categoria, coleção, linha, descrição, material, pedra, medidas, referência, desenho, enquadramento e ponto focal da foto, sob encomenda, destaque, ordem, `archived_at` | `anon` (o site) lê as não arquivadas; membros leem; admin e editor criam e editam; **só admin arquiva** (gatilho); **ninguém exclui** |
| `site_settings` | `show_prototypes` | `anon` e membros leem; só admin altera |
| `admin_audit_log` | quem, o quê, em que sistema, resultado | membros inserem **só em nome próprio**; só admin lê |

**Não há no Supabase:** preço, estoque, SKU, variantes, título comercial, imagens nem estado de
publicação. Tudo isso é da Hostinger.

**A chave publicável fica só no servidor**, e o app não usa nenhuma chave secreta do Supabase.
- Trade-off aceito: quem obtivesse a chave publicável poderia ler o texto editorial de produtos
  ainda não publicados na Hostinger.
- A chave não chega ao navegador (verificado nos bundles, secção 6).

---

## 4. Fluxo criar → publicar → aparecer no site

1. **Criar** (`/admin/produtos/novo`):
   1. o servidor valida os campos;
   2. **Hostinger:** cria o produto;
   3. o painel passa-o **imediatamente a rascunho**, porque a API o cria já publicado. Se isso
      falhar duas vezes, o erro diz-o com todas as letras;
   4. ajusta a primeira variante. Se houver SKU ou opção (ex.: Aro · 16), cria a variante completa
      e remove a automática, porque a API só aceita SKU e opções ao criar uma variante;
   5. **Supabase:** cria a ficha.
2. **Completar:**
   - cada secção grava num só sistema, com o seu botão;
   - Variantes, preço e estoque → Hostinger;
   - Ficha do site → Supabase;
   - Imagens → Hostinger;
   - Informações da loja → Hostinger.
3. **Publicar:**
   1. o servidor confere a lista de publicação (obrigatório: ficha e uma variante com preço;
      recomendado: linha, descrição, imagem);
   2. muda o status na Hostinger;
   3. `revalidateTag("site-catalogue")`.
4. **Site** (`lib/catalog/site.ts`):
   - junta as peças de protótipo (enquanto `show_prototypes`) com as fichas cujo produto a
     **Storefront pública** devolve como publicado;
   - opções, preço e imagens saem das variantes e do produto da loja;
   - home, joias, categoria, coleção, produto, busca, sacola e sitemap leem daqui;
   - um slug novo gera a página no primeiro acesso;
   - revalidação por tag ao publicar e, como rede de segurança, a cada 5 min.
5. **Despublicar:** Hostinger → rascunho e revalidação. A peça sai do site; a ficha fica.

**Travas:**
- o endereço (slug) não muda com o produto publicado;
- nenhum slug pode repetir o de uma peça de protótipo;
- "Destaque na página inicial" coloca a peça na primeira vitrine da home.

### Consistência entre os dois sistemas

| Situação | Resultado | Reparação |
|---|---|---|
| A ficha falha ao criar | produto rascunho na loja, fora do site e da venda | a página abre com "Falta a ficha do site"; completar e salvar |
| Produto excluído fora do painel (hPanel) | a ficha fica órfã; o site deixa de o mostrar | listada em "Fichas sem produto na loja", com arquivar |
| Publicado na loja sem ficha | não aparece no site | alerta "Publicado na loja, mas sem ficha do site" na visão geral e no produto |
| Supabase ou Hostinger fora do ar na revalidação | a composição **falha de propósito**; o Next continua a servir a última página boa | automático |
| Build com Supabase configurado e em erro | o build falha; a Vercel mantém o deploy anterior | automático |

---

## 5. Hostinger — `lib/admin/commerce/hostinger/`

- **Lista fechada** (`http.ts`), relativa a `/api/ecommerce/v1/stores/{HOSTINGER_STORE_ID}`:
  - produtos: listar, criar físico, atualizar (nome, descrição, status);
  - variantes: listar, criar, atualizar em lote, excluir;
  - imagens: URL de envio e anexar;
  - pedidos: listar e ler.
- **Qualquer outro método ou caminho é recusado antes de sair o pedido.** Fora, de propósito:
  - excluir produto;
  - lojas, canais, pagamentos, frete, descontos;
  - enviar ou cancelar pedido (notificam o cliente).
- **Preço sempre completo:** a atualização em lote substitui a lista de preços. O adaptador envia
  sempre o preço cheio **e** o promocional.
- **Limitações da API refletidas na interface:**
  - SKU só na criação da variante;
  - sem remover nem reordenar imagens.
- **Envio de imagem:**
  1. o servidor confere a assinatura do arquivo (JPEG, PNG, WebP, GIF; até 4 MB);
  2. pede uma URL assinada;
  3. envia o arquivo;
  4. anexa pelo `object_name`.
  - O token nunca vai para a URL assinada.
  - **Não verificado:** o formato da resposta de `upload-url`.
- **Erros:** mensagem em português para a equipe; o detalhe técnico fica só no registo do
  servidor.

---

## 6. Verificações

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ |
| `npm run build` (sem configuração, como Production) | ✅. Site: mesmos modos de renderização da `main`; painel todo dinâmico (`ƒ`) |
| DOM das 30 páginas do site vs. `main` (build sem Supabase) | ✅ **idêntico** (scripts e *chunks* ignorados). Só muda `_not-found.html`, o 404 embutido do Next, que deixou de ser servido: os endereços inexistentes vão para a 404 do site (verificado com `next start`: status 404 e a mesma página) |
| Sitemap e robots vs. `main` | ✅ iguais |
| CSS do site vs. `main` | uma regra a menos, `.table{display:table}`, que nenhum componente do site usa. Vinha da varredura automática de texto do Tailwind, não de uma classe real. O CSS do painel é gerado à parte |
| **E2E do site** (`scripts/e2e/fluxo-checkout.mjs --prod`, Storefront **simulada**) | ✅ **76/76** com o código final (build de produção) |
| **E2E do painel** (`scripts/e2e/admin-simulado.mjs`, dados **simulados**) | ✅ **50/50**, desktop e Pixel 7 |
| RLS (`scripts/supabase/testar-rls.sh`, Postgres 16 local + esquema `auth` **simulado**) | ✅ todos os casos: editor não arquiva, leitura não escreve, não-membro não vê, sem autopromoção, `anon` só lê o que o site mostra, auditoria só em nome próprio |
| Sem configuração: `/admin`, `/admin/entrar`, `/api/simulacao/*` | ✅ 404 |
| `VERCEL=1` + `ADMIN_SIMULATION=true` | ✅ continua 404 (o modo simulado não liga em deploy) |
| Supabase configurado mas inalcançável | ✅ `/admin` → entrar; entrar abre; `/admin/auth/confirmar` sem código → "link expirado" |
| Segredos e código de servidor nos bundles do navegador | ✅ nenhum `HOSTINGER_API_TOKEN`, `developers.hostinger.com`, `SUPABASE_PUBLISHABLE_KEY`, `admin_members` nem senha de teste |

**O que o E2E do painel cobre:**
- **acesso:**
  - redirecionamento sem sessão;
  - cabeçalhos de segurança;
  - senha errada com mensagem genérica;
  - conta sem papel;
  - leitura sem botões de escrita, com campos desativados e sem acesso à configuração;
- **criar:**
  - slug sugerido;
  - slug com acento recusado no servidor;
  - rascunho fora do site;
- **ficha:** o "Destaque" continua marcado depois de salvar;
- **imagem:** PNG aceito; arquivo falso recusado pela assinatura;
- **variantes:**
  - adicionar;
  - promocional ≥ preço recusado;
  - salvar preço e promoção;
  - só o admin exclui;
- **publicar:**
  - slug travado;
  - site 200 com nome, preço promocional ao vivo e opções da loja;
  - listagem, home (destaque), coleção e sitemap;
- **despublicar:** 404;
- **configuração do site:** esconder e voltar a mostrar os protótipos;
- **pedidos:** lista, filtro "a enviar", detalhe com total e endereço;
- **celular:** gaveta e ausência de rolagem horizontal;
- **sair.**

**Achados e correções durante a verificação:**
- **As páginas do painel saíam estáticas no build** (pré-renderizadas sem sessão). Corrigido com
  `force-dynamic` no layout do painel.
- **O React 19 reinicia os formulários ligados a Server Actions,** e os Switch e Checkbox do
  Radix voltavam ao valor inicial. A tela mostrava "Destaque" desmarcado depois de gravado, e uma
  segunda gravação o desfaria. Corrigido com `ActionForm` (envio sem reinício), com teste de
  regressão.
- **O limite de login contava também os logins bem-sucedidos,** o que bloquearia uma equipe no
  mesmo IP. Agora só as falhas contam.
- **O CSS do site passou a ver os arquivos do painel,** com classes a mais. Corrigido com
  `@source not` em `app/(site)/globals.css`.
- **O envio de imagens estava limitado a 1 MB** (padrão das Server Actions), abaixo dos 4 MB
  prometidos na interface. Corrigido com `bodySizeLimit`, e o E2E envia agora uma imagem de
  cerca de 3 MB.
- **Uma peça do painel sem referência mostrava o rótulo "Referência" vazio.** Medidas e referência
  passam a ser condicionais, como a pedra já era. As peças de protótipo não mudam (têm sempre as
  duas).
- **Numa execução do E2E do painel apareceu um erro de consola "404"** sem URL, que não se repetiu
  nas duas execuções seguintes (com registo de todas as respostas ≥ 400). **Não determinado**;
  fica como observação.

**Não verificado:**
- o painel contra o Supabase real e a Hostinger real (não existem as credenciais);
- o formato real das respostas da API de gestão;
- o CDN das imagens (`cdn.zyrosite.com`, visto no diagnóstico de 2026-09-24);
- o comportamento do SMTP padrão do Supabase.

---

## 7. Arquivos

| Onde | O quê |
|---|---|
| `app/(site)/**` | o site, movido sem mudanças de conteúdo, mais `[...rest]` (404) |
| `app/(site)/layout.tsx`, `page.tsx`, `joias/**`, `colecoes/**`, `produto/[slug]`, `checkout/**`, `not-found.tsx`, `app/sitemap.ts` | leem o catálogo composto (`getSiteCatalogue`) |
| `app/(site)/globals.css` | `@source not` para os arquivos do painel |
| `lib/catalog/` | tipos da ficha, composição, fontes (Supabase e Storefront), catálogo do site |
| `lib/data/catalogue.ts`, `lib/data/homologation.ts`, `lib/search.ts` | acessores que aceitam a lista do catálogo |
| `components/commerce/CatalogueProvider.tsx`, `StoreProvider.tsx`, `components/layout/SearchOverlay.tsx`, `SideMenu.tsx` | busca e sacola com as peças do painel |
| `components/product/ProductDetail.tsx` | medidas e referência condicionais |
| `lib/hostinger/types.ts`, `next.config.mjs` | imagens do produto na Storefront; `remotePatterns` do CDN da loja; `serverActions.bodySizeLimit` de 5 MB (envio de imagens pelo painel) |
| `middleware.ts` | só `/admin` |
| `app/admin/**` | layout, entrada, painel (visão geral, produtos, pedidos, site, nova senha), `auth/confirmar` |
| `components/admin/**` | shadcn/ui (`ui/`), casca, formulários e painéis |
| `lib/admin/**` | auth, providers, ações, consultas, validação, dinheiro, prontidão |
| `lib/supabase/**`, `lib/simulated/**`, `lib/simulation.ts` | clientes, mapeamentos, dados simulados |
| `app/api/simulacao/**` | Storefront e imagens simuladas (404 fora do modo simulado) |
| `supabase/migrations/…_admin_inicial.sql` | esquema e RLS |
| `scripts/e2e/admin-simulado.mjs`, `scripts/supabase/*` | testes |
| `.env.example`, `README.md`, `CLAUDE.md` | variáveis classificadas e contexto |

**Dependências novas:**
- `@supabase/supabase-js`, `@supabase/ssr`;
- `zod`, `server-only`;
- `radix-ui`, `class-variance-authority`, `tailwind-merge`, `lucide-react`, `sonner`;
- `tw-animate-css` (desenvolvimento).

---

## 8. Variáveis de ambiente

| Variável | Classificação | Onde |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Config · servidor | Preview da branch; Production só com autorização |
| `HOSTINGER_API_TOKEN` | **Secret** · servidor (Sensitive na Vercel) | **só** o Preview da branch `feature/hertmann-admin`, de início |
| `HOSTINGER_STORE_ID` | Config · servidor | `store_01M2XKR3V3JR3YG7QKNRG8NK47` |
| `ADMIN_COMMERCE_PROVIDER` | Config · servidor | `hostinger` |
| `HOSTINGER_API_URL` | Config · servidor, opcional | padrão `https://developers.hostinger.com` |
| `ADMIN_SIMULATION` | Config · só local | nunca na Vercel (e ignorada lá) |

Nenhuma usa `NEXT_PUBLIC_`. Não há chave secreta do Supabase.

---

## 9. Riscos e limitações

1. **O token da Hostinger vale para a conta inteira.**
   - Mitigações:
     - lista fechada;
     - só servidor;
     - Sensitive;
     - validade curta;
     - só no Preview da branch.
   - **Confirmar que a proteção de deployments da Vercel está ativa nos Previews:** um Preview com
     o token escreve na loja real.
2. **Formatos das respostas da API de gestão não verificados.** Esperam-se ajustes pequenos nos
   mapeamentos (`mappers.ts`) na primeira leitura real.
3. **A criação passa por um instante "publicado"** (limitação da API). Se a passagem a rascunho
   falhar, o erro avisa. A peça não aparece no site sem ficha.
4. Não há remoção nem reordenação de imagens pela API; o SKU não muda depois de criado.
5. Edição concorrente: a última gravação vence.
6. O limite de tentativas de login vive na memória de cada instância.
7. O SMTP padrão do Supabase tem limites baixos. Chega para 2 ou 3 pessoas; é preciso SMTP
   próprio quando houver domínio.
8. Até 100 produtos na Storefront por leitura do catálogo do site (paginação para depois).
9. Imagens até 4 MB por arquivo: a Vercel limita o corpo de um pedido a 4,5 MB.
   Fotografias maiores têm de ser reduzidas antes de enviar.
10. As faixas de preço dos filtros continuam as do catálogo de protótipo.

---

## 10. Próximos passos — precisam de você

1. **Projeto Supabase da HERTMANN.**
   - Recomendado: numa organização da HERTMANN, região `sa-east-1`.
   - Depois, com a sua autorização, eu:
     - aplico a migração;
     - desligo a inscrição pública;
     - configuro as URLs de redirecionamento do Preview;
     - cadastro `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` no Preview.
2. **Usuários:**
   - convidar no Supabase (Authentication → Users);
   - inserir o papel de cada um:

     ```sql
     insert into public.admin_members (user_id, role, display_name)
     values ('<uuid do usuário>', 'admin', 'Nome');
     ```
3. **Token da Hostinger:**
   - criar no hPanel, com validade curta;
   - cadastrar como Sensitive **só no Preview da branch**;
   - depois, a primeira sessão real deve ser **só de leitura** (lista de produtos e pedidos),
     para confirmar os mapeamentos antes de qualquer escrita.
4. **Escritas reais na loja** (criar produto, preço, estoque): só com a sua autorização, e de
   preferência primeiro sobre o produto de teste.
5. **Fase 2 (proposta):**
   - enviar ou cancelar pedido com rastreio;
   - gestão de membros pela interface;
   - MFA obrigatório para `admin`;
   - limite de tentativas partilhado;
   - coleções pela interface;
   - fotografia editorial própria;
   - paginação do catálogo.
