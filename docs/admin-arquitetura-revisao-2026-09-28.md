# Painel administrativo HERTMANN: revisão da arquitetura (Supabase)

_2026-09-28 · branch `feature/hertmann-admin` · substitui as secções 4 (autenticação), 5 (dados),
7 (escopo) e 10 (ordem) de [`admin-arquitetura-plano-2026-09-28.md`](admin-arquitetura-plano-2026-09-28.md).
O resto daquele documento continua válido: route groups, shadcn/ui, acento `#051D41`,
`CommerceAdminProvider` com o adaptador Hostinger e o provider simulado, pedidos só leitura, e
nenhum token Hostinger no navegador. **Nada foi alterado na Hostinger, na Vercel, no Supabase, em
pagamentos, frete, DNS ou domínio.**_

---

## 0. Decisões do usuário (2026-09-28)

1. **Autenticação:** Supabase Auth, em vez de usuários e sessões mantidos por nós.
2. **Produtos administráveis de verdade:** um produto criado e publicado no Admin aparece no site
   sem commit.
   - **Hostinger:** verdade comercial (produto, variantes, SKU, preço, promoção, estoque, checkout,
     pedidos).
   - **Supabase:** autenticação, mais os dados editoriais e a configuração do site.
   - O site compõe as duas fontes: **editorial (Supabase) + comercial (Hostinger)**.

## 1. Estado do Supabase (leitura, 2026-09-28)

- A organização ligada a esta sessão tem três projetos:
  - `boop-admin`: ativo, criado em 2026-09-25;
  - `boop-os-staging`: inativo;
  - um projeto pessoal: inativo.
- **Nenhum é da HERTMANN. Não vou usar `boop-admin`** (CLAUDE.md: nada de serviços não relacionados).
- **Decisão sua, antes de ligar o código a um banco real:** criar um projeto `hertmann`.
  - Recomendação: numa **organização da HERTMANN** (ou transferível para ela). Pôr os dados e os
    usuários da cliente dentro da organização da Boop recria a dependência que você quer evitar.
  - Região recomendada: `sa-east-1`.
  - Criar projeto pode ter custo, conforme o plano. Não crio sem a sua autorização.

## 2. Modelo mínimo de dados no Supabase

Princípio: **o Supabase não guarda nada que pertence à Hostinger.** Não há preço, estoque, SKU,
variantes, título comercial nem status de publicação no Supabase. O vínculo é só o
`hostinger_product_id`.

```sql
-- Papéis do Admin. O papel NUNCA vem de user_metadata (o próprio usuário pode editá-lo).
create type admin_role as enum ('admin', 'editor', 'leitura');

create table admin_members (
  user_id      uuid primary key references auth.users on delete cascade,
  role         admin_role not null,
  display_name text,
  created_at   timestamptz not null default now()
);

-- Ficha editorial de um produto: o que o site precisa para o mostrar.
create table catalog_items (
  id                    uuid primary key default gen_random_uuid(),
  hostinger_product_id  text not null unique,           -- prod_…
  slug                  text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_name          text,                           -- nome curto do site; vazio = título da Hostinger
  category              text not null check (category in ('aneis','colares','brincos','pulseiras')),
  collection_slug       text,                           -- uma das coleções do site
  line                  text not null default '',       -- uma linha
  description           text not null default '',       -- texto editorial
  material              text not null default '',
  stone                 text,
  measures              text not null default '',
  reference             text,                           -- referência de modelo (não é o SKU)
  drawing               text not null,                  -- desenho de ateliê (DrawingVariant)
  image_fit             text not null default 'full' check (image_fit in ('full','cutout')),
  image_focus           text,                           -- object-position
  made_to_order         boolean not null default false,
  featured              boolean not null default false,
  position              integer not null default 0,     -- ordem nas listagens
  archived_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  updated_by            uuid references auth.users
);

-- Configuração do site (uma linha).
create table site_settings (
  id                 smallint primary key default 1 check (id = 1),
  show_prototypes    boolean not null default true,   -- as 12 peças de protótipo de catalogue.ts
  updated_at         timestamptz not null default now(),
  updated_by         uuid references auth.users
);

-- Auditoria: quem fez o quê, em que sistema, com que resultado.
create table admin_audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  user_id     uuid not null references auth.users,
  action      text not null,          -- ex.: product.create, product.publish, variants.update
  target      text,                   -- prod_… / slug
  system      text not null,          -- hostinger | supabase
  outcome     text not null,          -- ok | error
  detail      jsonb
);
```

**O que vem de onde:**

| Vem da Hostinger (ao vivo, Storefront pública) | Vem do Supabase |
|---|---|
| título comercial, variantes e opções (aro, comprimento), preço, promoção, estoque, disponibilidade, imagens do produto, publicado ou não | slug, nome curto, categoria, coleção, linha, descrição, material, pedra, medidas, referência, desenho, enquadramento da imagem, sob encomenda, destaque, ordem |

- **Imagens:** as fotos do produto são as da Hostinger, geridas pelo Admin. Não duplico no Storage.
  Fotografia editorial própria (campanha, packshot à parte) fica para a fase 2.
- **Categorias e coleções:** continuam no código, porque têm fotografia e páginas próprias. O Admin
  escolhe numa lista. Criar coleções pela interface fica para a fase 2.
- **Opções da peça** (ex.: "Aro 12 · 14 · 16"): são derivadas das variantes da Hostinger, e não
  copiadas.

### Segurança (RLS em todas as tabelas)

| Tabela | Quem lê | Quem escreve |
|---|---|---|
| `admin_members` | cada membro só a própria linha | ninguém pela aplicação (gerido no painel do Supabase ou por SQL) |
| `catalog_items` | membros; e a leitura do site (ver abaixo) | `admin` e `editor` (insert e update). Excluir: ninguém; arquiva-se |
| `site_settings` | membros; e a leitura do site | `admin` |
| `admin_audit_log` | `admin` | qualquer membro, só com `user_id = auth.uid()` |

- As políticas usam `private.admin_role()` (`security definer`, `search_path` fixo), que lê o papel
  do `auth.uid()` em `admin_members`.
- **A leitura do site** usa a chave publicável com uma política `select` para `anon` em
  `catalog_items` (não arquivados) e em `site_settings`.
  - A chave fica **só no servidor**: não usa `NEXT_PUBLIC_`.
  - O navegador do visitante nunca fala com o Supabase.
  - Assim, **o app não precisa de nenhuma chave secreta do Supabase.**
  - Trade-off aceito: quem obtivesse a chave publicável poderia ler o texto editorial de produtos
    ainda não publicados na Hostinger. A chave não sai do servidor. Se isso vier a ser inaceitável,
    passa-se a ler com uma chave secreta, só no servidor.

## 3. Fluxo "criar produto → publicar → aparecer no site"

1. **Criar** (`/admin/produtos/novo`, papel `editor` ou `admin`):
   1. valida no servidor (zod) o título, a categoria, o slug (formato, único no Supabase e diferente
      dos slugs de protótipo) e o preço da primeira variante;
   2. **Hostinger:** cria o produto físico **como rascunho** e a variante inicial;
   3. **Supabase:** cria a ficha editorial com o `hostinger_product_id`;
   4. regista a auditoria e abre a página do produto.
2. **Completar:**
   - cada secção grava no seu sistema e tem o seu botão "Salvar":
     - Informações da loja (título) → Hostinger;
     - Variantes, preço e estoque → Hostinger;
     - Imagens → Hostinger;
     - Ficha do site → Supabase;
   - não há um "salvar tudo" que escreva nos dois sistemas de uma vez.
3. **Publicar:**
   1. o servidor verifica a lista de publicação: ficha completa, pelo menos uma variante com preço
      e, recomendado, uma imagem;
   2. **Hostinger:** muda o status para `published` (o único sistema escrito);
   3. `revalidateTag("site-catalogue")`.
4. **Aparecer no site:**
   - a camada de catálogo do site (`lib/catalog/`) junta:
     - as peças de protótipo de `catalogue.ts`, enquanto `show_prototypes` estiver ligado;
     - as fichas do Supabase **cujo produto a Storefront devolve como publicado**;
   - daí saem o `Piece` com `commerce`, as opções derivadas das variantes, as imagens e o preço;
   - home, `/joias`, categoria, coleção, busca, sacola, sitemap e `/produto/[slug]` passam a ler
     dessa camada;
   - a página de um slug novo é gerada no primeiro acesso (ISR);
   - como rede de segurança para alterações feitas fora do Admin (hPanel), as listagens também se
     revalidam de 5 em 5 minutos.
5. **Despublicar:** Hostinger → `draft` e revalidação. A peça sai do site; a ficha fica.

**Publicado = publicado na Hostinger.** Não existe um segundo interruptor no Supabase. O site só
mostra o que **as duas fontes** confirmam: há ficha e a Hostinger devolve o produto como publicado.

## 4. Autenticação e papéis com Supabase Auth

**Integração:** `@supabase/ssr` com a sessão em cookies geridos no servidor. **O navegador nunca
recebe um cliente Supabase.**

- **Login e logout:**
  - login por e-mail e senha, numa **Server Action** (`signInWithPassword`); o cookie é gravado pelo
    servidor;
  - logout também é uma Server Action (`signOut`);
  - por isso a URL e a chave do Supabase podem ficar só no servidor.
- **Sessão:** cookies `httpOnly` e `Secure`, com `SameSite=Lax` (o padrão do `@supabase/ssr`).
  - O `middleware.ts` (matcher **só `/admin/:path*`**; o site público não passa por ele) renova o
    token e redireciona para `/admin/login` quem não tem sessão.
  - Isso é conveniência, não a fronteira de segurança.
- **Autorização no servidor** (`lib/admin/auth`):
  - `requireMember()`:
    - `supabase.auth.getUser()` valida o token no servidor de Auth (nunca `getSession()`, que só lê
      o cookie);
    - lê o papel em `admin_members`, com RLS;
    - memoriza o resultado por pedido com `cache()`.
  - Sem linha em `admin_members` → tela "sem acesso" (o usuário existe, mas não é membro).
  - `requirePermission("products.write")` roda **no início de cada Server Action**, antes de
    qualquer chamada à Hostinger ou ao Supabase.
  - **O RLS no banco é a segunda barreira**, independente do código.
- **Papéis:**

  | Papel | Pode |
  |---|---|
  | `admin` | tudo; arquivar; excluir variantes; configuração do site |
  | `editor` | criar e editar produtos, variantes, preços, estoque, imagens, ficha e publicação; ver pedidos |
  | `leitura` | ver |

- **Contas:**
  - **inscrição pública desligada** no projeto;
  - convite pelo painel do Supabase;
  - o papel é inserido em `admin_members`;
  - a interface de gestão de membros fica para a fase 2.
- **Redefinição de senha:** e-mail do Supabase → `/admin/auth/confirmar` (servidor, `verifyOtp`) →
  nova senha.
  - O SMTP padrão do Supabase tem limites baixos. Sem domínio próprio não há SMTP da HERTMANN.
  - Para 2 ou 3 pessoas basta. Um SMTP próprio fica para quando houver domínio.
- **Fase 2:** MFA (TOTP) nativo do Supabase, obrigatório para `admin`.
- **Testes automatizados sem Supabase:**
  - um modo **simulado** de autenticação e de dados, só com `ADMIN_SIMULATION=true` **e fora da
    Vercel** (`VERCEL` ausente);
  - a Vercel define sempre `VERCEL=1`, então o modo simulado **não é ativável em nenhum deploy**;
  - o modo simulado mostra um banner permanente.

## 5. Consistência entre Hostinger e Supabase

Não há transação entre os dois sistemas. A regra é: **cada operação escreve num só sistema sempre
que possível; quando escreve em dois, a falha deixa um estado visível, inofensivo e reparável
pela interface.**

| Situação | Efeito | Como se resolve |
|---|---|---|
| Criar: a Hostinger aceita e o Supabase falha | produto **rascunho** na loja, sem ficha. Não aparece no site (falta a ficha) nem é comprável (é rascunho) | a lista do Admin parte da Hostinger e mostra "Ficha do site em falta", com o botão **Completar ficha** |
| Criar: a Hostinger falha | nada é criado no Supabase | mensagem de erro; nada a limpar |
| Ficha gravada, mas a Hostinger foi alterada fora do Admin (hPanel) | o Admin lê a Hostinger ao vivo, então vê sempre o estado real | as listagens do site revalidam em 5 min, e o produto em 60 s |
| Produto excluído na Hostinger (hPanel) | a ficha fica órfã; o site deixa de o mostrar | o Admin lista as "Fichas sem produto na loja", com opção de arquivar |
| Publicado na Hostinger, sem ficha | não aparece no site; **seria comprável pela Storefront** se alguém tivesse o ID | a publicação pelo Admin exige a ficha; o Admin avisa "Publicado sem ficha" |
| Supabase fora do ar | Admin: a ficha mostra erro, e as secções da Hostinger continuam a funcionar. Site: a revalidação **falha de propósito** e o Next continua a servir a última página boa | automático, quando o serviço volta |
| Hostinger fora do ar | Admin: erro claro, sem escrita no Supabase. Site: listagens mantêm a última versão boa; página de produto como hoje (sem oferta até voltar) | automático |
| Duplo clique ao criar | o botão fica desativado durante o envio; o servidor recusa um slug repetido | — |
| Mudar o slug de um produto publicado | as ligações antigas quebram | no MVP, o slug fica **travado depois da primeira publicação** (só `admin` o altera, com aviso) |

**Auditoria:** cada passo regista sistema, ação e resultado em `admin_audit_log`. Uma falha parcial
fica rastreável.

**Build:**
- sem Supabase configurado (é o caso de Production hoje), o site usa só as peças de protótipo. É
  exatamente o comportamento atual;
- com o Supabase configurado e em erro, o build **falha** e a Vercel mantém o deploy anterior, em vez
  de publicar um site sem produtos.

## 6. Variáveis de ambiente

| Variável | Classificação | Onde é lida |
|---|---|---|
| `HOSTINGER_API_TOKEN` | **Secret** | só no servidor (adaptador Hostinger do Admin) |
| `SUPABASE_URL` | Config · servidor | servidor (Admin e catálogo do site) |
| `SUPABASE_PUBLISHABLE_KEY` | Config · pública por natureza, **mantida só no servidor** | servidor |
| `HOSTINGER_STORE_ID` | Config · servidor | servidor |
| `HOSTINGER_API_URL` | Config · servidor, opcional | servidor |
| `ADMIN_COMMERCE_PROVIDER` | Config · servidor (`hostinger` ou `simulado`; `simulado` recusado na Vercel) | servidor |
| `ADMIN_SIMULATION` | Config · só desenvolvimento e testes (ignorada na Vercel) | servidor |
| `NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID` e as demais existentes | inalteradas | — |

- **Nenhuma chave secreta do Supabase no app.** A `service_role` e as chaves `sb_secret_…` não são
  usadas.
- Nenhuma variável nova usa o prefixo `NEXT_PUBLIC_`.
- `.env.example` e README serão atualizados com esta tabela.

## 7. Impacto no escopo do MVP

**Sim, o escopo cresce de forma significativa.**

| Entra de novo | Por quê |
|---|---|
| Esquema Supabase com RLS, em `supabase/migrations/` | a ficha editorial e os papéis |
| Camada de catálogo do site (`lib/catalog/`) | compõe protótipos, Supabase e Hostinger |
| Refatoração de dados do site público | home, joias, categoria, coleção, produto, busca, sacola e sitemap passam a receber a lista composta em vez de importar `catalogue.ts` diretamente. **Só lógica: nenhum componente visual muda** |
| Ficha do site no Admin | e a lista de publicação |
| Fluxos de Auth | login, logout, redefinição de senha, "sem acesso" |
| `images.remotePatterns` | para o CDN de imagens da Hostinger (`cdn.zyrosite.com`, a confirmar) |

**Sai ou fica para depois:**
- a autenticação própria (substituída);
- coleções e categorias pela interface;
- fotografia editorial própria;
- MFA;
- gestão de membros pela interface.

**Critério de regressão do site público:**
- com o Supabase desligado, o HTML e o CSS têm de sair **iguais** aos da `main`;
- os 76 testes E2E e a regressão visual têm de passar.

## 8. Ordem de implementação revista

1. Route groups (`app/(site)`, `app/admin`); o site fica idêntico.
2. Camada de catálogo do site (`lib/catalog/`) com as páginas a lerem dela; o site fica idêntico
   com o Supabase desligado.
3. Base shadcn em `components/admin/ui`, tema e casca do Admin.
4. Supabase:
   - migrações SQL com RLS (no repositório; **aplicar num projeto real só com a sua autorização**);
   - clientes do servidor;
   - `middleware`;
   - login, logout e redefinição de senha;
   - `requireMember` e `requirePermission`;
   - modo simulado para testes.
5. Domínio comercial, `CommerceAdminProvider`, provider simulado e adaptador Hostinger (lista
   fechada de endpoints, "não verificado").
6. Repositório editorial (`EditorialRepository`: Supabase e simulado).
7. Produtos:
   - lista (Hostinger e ficha);
   - criar;
   - secções de edição;
   - variantes, preço, promoção e estoque;
   - imagens;
   - ficha do site;
   - publicar e despublicar, com revalidação.
8. Pedidos (lista e detalhe, só leitura) e visão geral.
9. E2E do Admin (simulado), E2E e regressão do site, `tsc` e build.
10. Documentação de implementação.

## 9. O que depende de você

1. **Criar o projeto Supabase da HERTMANN.** Escolher a organização e autorizar o eventual custo.
   Depois disso, com a sua autorização:
   - aplico as migrações;
   - configuro o Auth: inscrição desligada e URLs de redirecionamento do Preview.
2. **Token da API da Hostinger:** criá-lo no hPanel (Conta → API), com validade curta. Cadastrá-lo
   como **Sensitive** na Vercel, **só no Preview da branch `feature/hertmann-admin`**.
3. **Convidar os usuários** e definir o papel de cada um.
4. **Confirmar que a proteção de deployments da Vercel está ativa nos Previews.** Um Preview com o
   token escreve na loja real.
