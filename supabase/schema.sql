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
