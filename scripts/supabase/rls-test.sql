-- Testes de RLS da migração inicial (Postgres local + auth-stub.sql).
\set ON_ERROR_STOP on
insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a','admin@teste'),
  ('00000000-0000-0000-0000-00000000000e','editor@teste'),
  ('00000000-0000-0000-0000-00000000000c','leitura@teste'),
  ('00000000-0000-0000-0000-00000000000d','fora@teste');
insert into public.admin_members values
  ('00000000-0000-0000-0000-00000000000a','admin','A'),
  ('00000000-0000-0000-0000-00000000000e','editor','E'),
  ('00000000-0000-0000-0000-00000000000c','leitura','L');

create function pg_temp.as_user(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid, false);
  execute 'set role authenticated';
end $$;

create function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    raise notice 'OK (recusado): % — %', label, sqlerrm;
    return;
  end;
  raise exception 'FALHA: deveria ter sido recusado: %', label;
end $$;

-- editor cria e edita
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
insert into public.catalog_items (hostinger_product_id, slug, category, drawing)
  values ('prod_1', 'anel-teste', 'aneis', 'band');
update public.catalog_items set line = 'Linha' where slug = 'anel-teste';
select pg_temp.expect_fail($$update public.catalog_items set archived_at = now() where slug = 'anel-teste'$$, 'editor arquiva');
select pg_temp.expect_fail($$update public.catalog_items set hostinger_product_id = 'prod_2' where slug = 'anel-teste'$$, 'mudar o produto ligado');
select pg_temp.expect_fail($$delete from public.catalog_items$$, 'editor exclui ficha');
reset role;

-- leitura não escreve
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.expect_fail($$insert into public.catalog_items (hostinger_product_id, slug, category, drawing) values ('prod_3','x','aneis','band')$$, 'leitura cria');
do $$ begin
  if (select count(*) from public.catalog_items) <> 1 then raise exception 'FALHA: leitura devia ver 1 ficha'; end if;
  update public.catalog_items set line = 'hack';
  if exists (select 1 from public.catalog_items where line = 'hack') then raise exception 'FALHA: leitura editou'; end if;
  raise notice 'OK: leitura vê e não edita';
end $$;
reset role;

-- quem não é membro não vê nada
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
do $$ begin
  if (select count(*) from public.catalog_items) <> 0 then raise exception 'FALHA: não-membro vê fichas'; end if;
  if (select count(*) from public.admin_members) <> 0 then raise exception 'FALHA: não-membro vê membros'; end if;
  raise notice 'OK: não-membro não vê nada';
end $$;
select pg_temp.expect_fail($$insert into public.admin_members values ('00000000-0000-0000-0000-00000000000d','admin',null)$$, 'autopromoção a admin');
reset role;

-- anon (o site): lê fichas não arquivadas e a configuração; não escreve
set role anon;
do $$ begin
  if (select count(*) from public.catalog_items) <> 1 then raise exception 'FALHA: anon devia ver 1 ficha'; end if;
  if (select show_prototypes from public.site_settings) is not true then raise exception 'FALHA: anon lê config'; end if;
  raise notice 'OK: anon lê o que o site mostra';
end $$;
select pg_temp.expect_fail($$select * from public.admin_members$$, 'anon lê membros');
select pg_temp.expect_fail($$select * from public.admin_audit_log$$, 'anon lê auditoria');
select pg_temp.expect_fail($$insert into public.catalog_items (hostinger_product_id, slug, category, drawing) values ('prod_4','y','aneis','band')$$, 'anon cria');
reset role;

-- admin arquiva; anon deixa de ver
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
update public.catalog_items set archived_at = now() where slug = 'anel-teste';
update public.site_settings set show_prototypes = false;
insert into public.admin_audit_log (user_id, action, system, outcome) values ('00000000-0000-0000-0000-00000000000a','teste','supabase','ok');
select pg_temp.expect_fail($$insert into public.admin_audit_log (user_id, action, system, outcome) values ('00000000-0000-0000-0000-00000000000e','forjado','supabase','ok')$$, 'auditoria em nome de outro');
reset role;
set role anon;
do $$ begin
  if (select count(*) from public.catalog_items) <> 0 then raise exception 'FALHA: anon vê arquivada'; end if;
  raise notice 'OK: arquivada some do site';
end $$;
reset role;

-- editor não altera config (a atualização não afeta linhas)
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
update public.site_settings set show_prototypes = true;
reset role;
do $$ begin
  if (select show_prototypes from public.site_settings) then raise exception 'FALHA: editor alterou config'; end if;
  raise notice 'OK: editor não altera config';
end $$;
select 'TODOS OS TESTES DE RLS PASSARAM' as resultado;
