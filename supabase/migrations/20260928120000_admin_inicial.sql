-- =============================================================================
-- HERTMANN — painel administrativo: papéis, ficha editorial, configuração do
-- site e auditoria.
--
-- O Supabase guarda só o que NÃO pertence à Hostinger. Preço, promoção,
-- estoque, SKU, variantes, título comercial, imagens e estado de publicação
-- continuam na loja; a ficha liga-se ao produto só por hostinger_product_id.
--
-- Todas as tabelas têm RLS. A aplicação usa apenas a chave publicável (e a
-- sessão de cada membro); nenhuma política depende da service_role.
-- =============================================================================

create schema if not exists private;

-- -----------------------------------------------------------------------------
-- Papéis
-- -----------------------------------------------------------------------------

create type public.admin_role as enum ('admin', 'editor', 'leitura');

-- O papel vive aqui e nunca em user_metadata, que o próprio usuário pode
-- editar. Gerido pelo painel do Supabase (ou SQL) — a aplicação só o lê.
create table public.admin_members (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         public.admin_role not null,
  display_name text,
  created_at   timestamptz not null default now()
);

comment on table public.admin_members is
  'Membros do painel HERTMANN e o seu papel. Inserir aqui depois de convidar o usuário no Auth.';

-- Papel de quem faz o pedido; nulo para quem não é membro.
create or replace function private.admin_role()
returns public.admin_role
language sql
stable
security definer
set search_path = ''
as $$
  select m.role from public.admin_members m where m.user_id = (select auth.uid())
$$;

revoke all on function private.admin_role() from public;
grant usage on schema private to authenticated;
grant execute on function private.admin_role() to authenticated;

-- -----------------------------------------------------------------------------
-- Ficha editorial de um produto
-- -----------------------------------------------------------------------------

create table public.catalog_items (
  id                   uuid primary key default gen_random_uuid(),
  hostinger_product_id text not null unique,
  slug                 text not null unique
                       check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  display_name         text check (display_name is null or char_length(display_name) <= 80),
  category             text not null check (category in ('aneis', 'colares', 'brincos', 'pulseiras')),
  collection_slug      text check (collection_slug is null or collection_slug ~ '^[a-z0-9-]+$'),
  line                 text not null default '' check (char_length(line) <= 140),
  description          text not null default '' check (char_length(description) <= 2000),
  material             text not null default '' check (char_length(material) <= 140),
  stone                text check (stone is null or char_length(stone) <= 140),
  measures             text not null default '' check (char_length(measures) <= 140),
  reference            text check (reference is null or char_length(reference) <= 40),
  drawing              text not null check (drawing in (
                         'band', 'solitaire', 'pendant', 'pendantGem', 'choker',
                         'hoop', 'drop', 'stud', 'links', 'bangle')),
  image_fit            text not null default 'full' check (image_fit in ('full', 'cutout')),
  image_focus          text check (image_focus is null or image_focus ~ '^\d{1,3}% \d{1,3}%$'),
  made_to_order        boolean not null default false,
  featured             boolean not null default false,
  position             integer not null default 0,
  archived_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  updated_by           uuid references auth.users (id) on delete set null
);

create index catalog_items_position_idx on public.catalog_items (position, created_at)
  where archived_at is null;

comment on table public.catalog_items is
  'Ficha editorial de cada produto do site. Nada comercial: isso é da Hostinger.';

-- Carimbo de quem mudou, vínculo imutável e arquivo só por admin.
create or replace function private.catalog_items_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());

  if tg_op = 'UPDATE' then
    if new.hostinger_product_id is distinct from old.hostinger_product_id then
      raise exception 'O produto ligado a uma ficha não pode mudar.'
        using errcode = '42501';
    end if;
    if new.archived_at is distinct from old.archived_at
       and private.admin_role() is distinct from 'admin' then
      raise exception 'Só um admin pode arquivar ou restaurar uma ficha.'
        using errcode = '42501';
    end if;
  elsif new.archived_at is not null then
    raise exception 'Uma ficha nova não pode nascer arquivada.' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger catalog_items_guard
  before insert or update on public.catalog_items
  for each row execute function private.catalog_items_guard();

-- -----------------------------------------------------------------------------
-- Configuração do site (uma única linha)
-- -----------------------------------------------------------------------------

create table public.site_settings (
  id              smallint primary key default 1 check (id = 1),
  show_prototypes boolean not null default true,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users (id) on delete set null
);

insert into public.site_settings (id) values (1);

create or replace function private.site_settings_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end;
$$;

create trigger site_settings_touch
  before update on public.site_settings
  for each row execute function private.site_settings_touch();

-- -----------------------------------------------------------------------------
-- Auditoria
-- -----------------------------------------------------------------------------

create table public.admin_audit_log (
  id      bigint generated always as identity primary key,
  at      timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action  text not null check (char_length(action) <= 60),
  target  text check (target is null or char_length(target) <= 200),
  system  text not null check (system in ('hostinger', 'supabase')),
  outcome text not null check (outcome in ('ok', 'error')),
  detail  jsonb
);

create index admin_audit_log_at_idx on public.admin_audit_log (at desc);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.admin_members   enable row level security;
alter table public.catalog_items   enable row level security;
alter table public.site_settings   enable row level security;
alter table public.admin_audit_log enable row level security;

-- Quem não tem sessão só lê o que o site mostra — e nunca escreve.
revoke all on public.admin_members, public.admin_audit_log from anon;
revoke insert, update, delete, truncate on public.catalog_items, public.site_settings from anon;
revoke delete, truncate on public.catalog_items, public.site_settings from authenticated;
revoke update, delete, truncate on public.admin_audit_log from authenticated;
revoke insert, update, delete, truncate on public.admin_members from authenticated;

-- admin_members: cada um vê a própria linha; o admin vê todas.
create policy "membros: ver a própria linha"
  on public.admin_members for select to authenticated
  using (user_id = (select auth.uid()) or (select private.admin_role()) = 'admin');

-- catalog_items
create policy "fichas: o site lê as não arquivadas"
  on public.catalog_items for select to anon
  using (archived_at is null);

create policy "fichas: membros leem"
  on public.catalog_items for select to authenticated
  using ((select private.admin_role()) is not null);

create policy "fichas: admin e editor criam"
  on public.catalog_items for insert to authenticated
  with check ((select private.admin_role()) in ('admin', 'editor'));

create policy "fichas: admin e editor editam"
  on public.catalog_items for update to authenticated
  using ((select private.admin_role()) in ('admin', 'editor'))
  with check ((select private.admin_role()) in ('admin', 'editor'));

-- site_settings
create policy "configuração: o site lê"
  on public.site_settings for select to anon
  using (true);

create policy "configuração: membros leem"
  on public.site_settings for select to authenticated
  using ((select private.admin_role()) is not null);

create policy "configuração: só admin altera"
  on public.site_settings for update to authenticated
  using ((select private.admin_role()) = 'admin')
  with check ((select private.admin_role()) = 'admin');

-- admin_audit_log
create policy "auditoria: membros registam os próprios atos"
  on public.admin_audit_log for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.admin_role()) is not null);

create policy "auditoria: só admin lê"
  on public.admin_audit_log for select to authenticated
  using ((select private.admin_role()) = 'admin');
