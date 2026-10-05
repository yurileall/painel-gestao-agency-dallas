-- =====================================================================
-- Schema + permissões do painel. Idempotente: pode rodar mais de uma vez.
-- Rode no Supabase → SQL Editor DEPOIS de conferir o diagnostico.sql.
--
-- Regra de acesso: só usuário logado (role "authenticated") lê e grava.
-- O papel "anon" (visitante sem login) não recebe nada.
--
-- As tabelas já existem neste projeto, então os "create table if not exists"
-- abaixo não fazem nada — eles servem de documentação do schema. O que
-- corrige o banco atual é a parte de PRIVILÉGIOS e RLS, no fim do arquivo.
-- =====================================================================

-- ---------- TABELAS ----------
-- Atenção: id é TEXT, porque o painel gera ids como "c_mabc123xy".
create table if not exists public.clients (
  id                  text primary key,
  name                text not null,
  whatsapp            text,
  niche               text,
  combo               text,
  price               numeric(12,2) default 0,
  sale_date           date,
  owner               text,
  status              text not null default 'pendente',
  deliverables        jsonb default '{}'::jsonb,
  notes               text,
  delivered_date      date,
  producao_start_date date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.leads (
  id             text primary key,
  name           text not null,
  whatsapp       text,
  combo          text,
  contact_date   date,
  follow_up_date date,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.app_settings (
  id       integer primary key,
  sla_days integer not null default 3
);

create table if not exists public.ad_spend (
  month  text primary key,          -- "2026-10"
  amount numeric(12,2) not null default 0
);

insert into public.app_settings (id, sla_days)
values (1, 3)
on conflict (id) do nothing;

-- ---------- PRIVILÉGIOS DE TABELA ----------
-- Sem isto o PostgREST responde 42501 "permission denied for table ..."
-- e o RLS nem chega a ser avaliado.
grant usage on schema public to authenticated;
grant select, insert, update, delete
  on public.clients, public.leads, public.app_settings, public.ad_spend
  to authenticated;

-- ---------- RLS ----------
alter table public.clients      enable row level security;
alter table public.leads        enable row level security;
alter table public.app_settings enable row level security;
alter table public.ad_spend     enable row level security;

-- RLS ligado sem política bloqueia tudo. Uma política por tabela,
-- liberando todas as operações para quem está logado.
drop policy if exists clients_authenticated      on public.clients;
drop policy if exists leads_authenticated        on public.leads;
drop policy if exists app_settings_authenticated on public.app_settings;
drop policy if exists ad_spend_authenticated     on public.ad_spend;

create policy clients_authenticated on public.clients
  for all to authenticated using (true) with check (true);
create policy leads_authenticated on public.leads
  for all to authenticated using (true) with check (true);
create policy app_settings_authenticated on public.app_settings
  for all to authenticated using (true) with check (true);
create policy ad_spend_authenticated on public.ad_spend
  for all to authenticated using (true) with check (true);

-- ---------- REGRAS DE DADOS ----------
-- O painel valida no navegador, mas quem tem login também alcança a API
-- direto. Estas regras garantem o mínimo no próprio banco.
-- "not valid": vale para o que for gravado daqui em diante, sem recusar o
-- script por causa de alguma linha antiga fora da regra.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'clients_status_check' and conrelid = 'public.clients'::regclass) then
    alter table public.clients add constraint clients_status_check
      check (status in ('pendente', 'em_producao', 'entregue')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'clients_price_check' and conrelid = 'public.clients'::regclass) then
    alter table public.clients add constraint clients_price_check
      check (price >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'clients_name_check' and conrelid = 'public.clients'::regclass) then
    alter table public.clients add constraint clients_name_check
      check (length(btrim(name)) > 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leads_name_check' and conrelid = 'public.leads'::regclass) then
    alter table public.leads add constraint leads_name_check
      check (length(btrim(name)) > 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_spend_amount_check' and conrelid = 'public.ad_spend'::regclass) then
    alter table public.ad_spend add constraint ad_spend_amount_check
      check (amount >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'app_settings_sla_check' and conrelid = 'public.app_settings'::regclass) then
    alter table public.app_settings add constraint app_settings_sla_check
      check (sla_days between 1 and 365) not valid;
  end if;
end $$;

-- ---------- TEMPO REAL ----------
-- Coloca as tabelas na publicação do Realtime, para o painel receber na hora
-- o que outra pessoa gravou. Sem isto o painel continua funcionando, mas só
-- atualiza ao voltar para a aba ou recarregar. O RLS acima também vale aqui:
-- só quem está logado recebe os eventos.
do $$
declare
  t text;
begin
  foreach t in array array['clients', 'leads', 'app_settings', 'ad_spend'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
