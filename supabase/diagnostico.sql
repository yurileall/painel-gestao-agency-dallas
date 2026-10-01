-- =====================================================================
-- DIAGNÓSTICO: por que o cliente cadastrado não aparece na tabela
-- Rode no Supabase → SQL Editor. Nada aqui altera dados.
-- =====================================================================

-- 1) As tabelas existem e o id é do tipo certo?
--    O painel gera ids de texto ("c_mabc123xy"), então clients.id e leads.id
--    precisam ser text/varchar. Se estiverem como uuid, todo insert falha.
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('clients','leads','app_settings','ad_spend')
order by table_name, ordinal_position;

-- 2) Os papéis anon/authenticated têm privilégio de tabela?
--    Esta é a causa mais provável: sem GRANT, o PostgREST devolve
--    42501 "permission denied for table clients" e o insert nunca acontece.
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privilegios
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('clients','leads','app_settings','ad_spend')
  and grantee in ('anon','authenticated')
group by table_name, grantee
order by table_name, grantee;

-- 3) RLS está ligado e existem políticas?
--    RLS ligado SEM política = nenhuma linha entra, e sem erro no select.
select c.relname as tabela, c.relrowsecurity as rls_ligado, c.relforcerowsecurity as rls_forcado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('clients','leads','app_settings','ad_spend');

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('clients','leads','app_settings','ad_spend')
order by tablename, policyname;

-- 4) Quantas linhas existem de fato (ignora RLS, roda como postgres)?
select
  (select count(*) from public.clients)      as clients,
  (select count(*) from public.leads)        as leads,
  (select count(*) from public.ad_spend)     as ad_spend,
  (select count(*) from public.app_settings) as app_settings;
