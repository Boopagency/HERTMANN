# Painel HERTMANN — plano da integração real (Supabase e Hostinger só leitura)

_2026-09-28 · branch `feature/hertmann-admin` · **plano; nada foi executado em serviços reais.**
Referências: [`admin-implementacao-2026-09-28.md`](admin-implementacao-2026-09-28.md) e
[`admin-arquitetura-revisao-2026-09-28.md`](admin-arquitetura-revisao-2026-09-28.md)._

## Regras desta fase

- Só `feature/hertmann-admin`. Sem merge na `main`, sem alterar Production.
- **Nenhuma escrita na Hostinger** até ao relatório de leitura ser apresentado e autorizado.
- O token da Hostinger nunca passa pela conversa nem por este ambiente: vai direto do hPanel para a
  Vercel.

## Limitações deste ambiente de desenvolvimento (verificadas em 2026-09-28)

| Ponto | Situação | Consequência |
|---|---|---|
| Rede para `*.supabase.co` e `developers.hostinger.com` | bloqueada pela política de rede do ambiente | a validação real corre no **Preview da Vercel**, não aqui (salvo liberação da rede, opcional) |
| Conector Supabase | ligado à conta da Boop; vê só `boop-admin` (ativo) e dois projetos inativos | se o projeto HERTMANN ficar numa organização da HERTMANN, só o vejo se esta conta for membro. Sem isso, você aplica o SQL no editor do Supabase |
| Conector Vercel | 403 no time `boop10` | não leio deploys nem logs, e não cadastro variáveis. Opcional: reautenticar o conector, só para leitura de deploys e logs |

## 1. Supabase — o que criar e configurar

1. **Projeto**
   - Nome `hertmann`, região `sa-east-1`.
   - Numa organização da HERTMANN (recomendado).
   - A senha do banco fica só com você; não é necessária.
2. **Authentication → Sign In / Providers → Email**
   - E-mail ativo.
   - **"Allow new users to sign up": desligado.**
   - "Confirm email": ligado.
   - Tamanho mínimo da senha: 12.
3. **Authentication → URL Configuration**
   - **Site URL:** o endereço fixo do Preview da branch (alias da Vercel para
     `feature/hertmann-admin`).
   - **Redirect URLs:** só `https://<alias do Preview>/admin/auth/confirmar`.
4. **Authentication → Emails → modelos** (links que funcionam em qualquer dispositivo, sem
   depender de cookie PKCE):
   - **Invite user**, no lugar de `{{ .ConfirmationURL }}`:
     `{{ .SiteURL }}/admin/auth/confirmar?token_hash={{ .TokenHash }}&type=invite&seguir=/admin/senha/nova`
   - **Reset password**, no lugar de `{{ .ConfirmationURL }}`:
     `{{ .SiteURL }}/admin/auth/confirmar?token_hash={{ .TokenHash }}&type=recovery&seguir=/admin/senha/nova`
5. **Migração** `supabase/migrations/20260928120000_admin_inicial.sql`:
   - aplicada por mim pelo conector, se eu tiver acesso ao projeto;
   - ou por você, no SQL Editor.
6. **Usuários:** só depois da migração e dos testes de RLS.
   - Authentication → Users → *Add user* (convite ou senha com confirmação automática).
   - O papel entra em `admin_members`.

## 2. Valores e classificação

| Valor | Classificação | Para onde vai | Quem o coloca |
|---|---|---|---|
| `SUPABASE_URL` (`https://<ref>.supabase.co`) | Config | Vercel: Preview, branch `feature/hertmann-admin` | você |
| `SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`) | Config (pública por natureza; mantida só no servidor) | idem | você |
| ref do projeto | Config | conversa (para eu aplicar a migração e testar o RLS) | você |
| alias do Preview da branch | Config | conversa e Supabase (Site URL, Redirect URLs) | você |
| e-mails e papéis da equipe | dado pessoal, não segredo | conversa | você |
| `HOSTINGER_API_TOKEN` | **Secret** (Sensitive na Vercel) | **só** Vercel: Preview, branch `feature/hertmann-admin` | **só você; nunca na conversa** |
| `HOSTINGER_STORE_ID` = `store_01M2XKR3V3JR3YG7QKNRG8NK47` | Config | idem | você |
| `ADMIN_COMMERCE_PROVIDER` = `hostinger` | Config | idem | você |
| `HOSTINGER_WRITE_ENABLED` | Config | **não criar agora** (ausente = só leitura) | só depois da sua autorização |

**Não são necessários e não devem ser enviados:**
- a senha do banco;
- a `service_role`, as chaves `sb_secret_…` e o JWT secret do Supabase.

## 3. Como tudo fica restrito ao Preview

1. **Variáveis na Vercel:** escopo *Preview* com a branch `feature/hertmann-admin`. Nada em
   Production nem em Development.
2. **Guarda no código** (a acrescentar antes de ligar):
   - com `VERCEL_ENV=production`, o painel responde 404 e o site ignora o Supabase, **mesmo que as
     variáveis existam lá por engano**;
   - só `ADMIN_PRODUCTION_ENABLED=true` (a criar no go-live, com autorização) os liga.
3. **Hostinger só leitura por padrão** (a acrescentar):
   - sem `HOSTINGER_WRITE_ENABLED=true`, o adaptador recusa qualquer POST, PATCH ou DELETE antes
     de sair o pedido;
   - o painel mostra "Loja em modo somente leitura" e desativa as ações comerciais.
4. **Proteção de deployments da Vercel nos Previews** (Vercel Authentication): a confirmar por
   você em Settings → Deployment Protection.
5. **Supabase:**
   - inscrição pública desligada;
   - redirecionamentos só para o alias do Preview;
   - projeto próprio, sem ligação a Production.
6. **Token:** Sensitive, validade curta (sugestão: 30 dias), revogável no hPanel.

## 4. Validação do Supabase

1. **Migração** e confirmação do esquema (tabelas, políticas, gatilhos, RLS ativo).
2. **Testes de RLS no banco real** (`scripts/supabase/rls-test.sql` adaptado):
   - dentro de uma transação com **ROLLBACK**;
   - os usuários de teste e as linhas criadas desaparecem no fim.
3. **Preview**, feito por você ou, com rede liberada, por mim:
   - login certo e errado;
   - conta sem papel;
   - papéis `leitura`, `editor`, `admin`;
   - sair;
   - redefinir a senha.
4. **Dados editoriais:**
   - criar, editar e arquivar uma ficha de teste;
   - confirmar RLS e auditoria;
   - arquivar no fim.
   - Aviso: com o comércio em só leitura, a ficha de teste só pode ligar-se ao produto de teste já
     existente. Se ele estiver publicado, a ficha o faz aparecer **no site do Preview**. Arquiva-se
     no fim do teste.

## 5. Primeira validação da Hostinger — só leitura

- **Rota de diagnóstico** `/admin/diagnostico` (a criar):
  - só `admin`, só Preview, só GET;
  - chama as operações de leitura da lista fechada:
    - `GET /products?include[]=variants&include[]=media`;
    - `GET /products/{id}/variants` do primeiro produto;
    - `GET /orders` (página 1);
    - `GET /orders/{id}` do primeiro pedido.
- **Relatório, por chamada:**
  - status HTTP e tempo;
  - **inventário do formato** (chaves e tipos, sem valores);
  - contagens e paginação;
  - o resultado do mapeamento, ou seja, o que o painel mostraria;
  - avisos de mapeamento (campo esperado ausente, status desconhecido).
- **Dados pessoais dos pedidos mascarados** (nomes, e-mails, telefones, endereços).
- **O token nunca aparece.**
- Botão "Copiar relatório": você cola-o na conversa.
- **Depois:**
  1. eu ajusto `mappers.ts`;
  2. apresento o resultado;
  3. peço autorização para as escritas (primeiro só sobre o produto de teste).
