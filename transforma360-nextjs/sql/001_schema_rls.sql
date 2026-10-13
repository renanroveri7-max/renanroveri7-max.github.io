-- TRANSFORMA 360 • Fase 3.1. Execute apenas no SQL Editor do SEU projeto Supabase.
-- Sem service_role no navegador. Não executado nesta entrega (faltam suas credenciais).
begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  goal text not null default 'consistencia' check (goal in ('massa','gordura','recomposicao','condicionamento','consistencia')),
  training_place text not null default 'academia' check (training_place in ('academia','casa','ar_livre')),
  days_per_week integer not null default 3 check (days_per_week between 1 and 7),
  minutes_per_session integer not null default 45 check (minutes_per_session in (20,30,45,60,90)),
  prefers_dark boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  sets jsonb not null default '[]'::jsonb check (jsonb_typeof(sets) = 'array' and jsonb_array_length(sets) between 1 and 250),
  created_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  title text not null check (char_length(title) between 1 and 70),
  ingredients text[] not null default array[]::text[],
  portion text not null default '' check (char_length(portion) <= 160),
  created_at timestamptz not null default now()
);

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  kilograms numeric(5,2) not null check (kilograms between 25 and 350),
  unique (user_id, day)
);

create table if not exists public.water_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  milliliters integer not null default 0 check (milliliters between 0 and 20000),
  primary key (user_id,day)
);

create index if not exists workouts_user_day_idx on public.workouts(user_id, day desc);
create index if not exists meals_user_day_idx on public.meals(user_id, day desc);
create index if not exists weight_logs_user_day_idx on public.weight_logs(user_id, day desc);

alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.meals enable row level security;
alter table public.weight_logs enable row level security;
alter table public.water_logs enable row level security;

-- Impede acesso pelo papel anon; serviço autenticado ainda exige RLS por linha.
revoke all on public.profiles,public.workouts,public.meals,public.weight_logs,public.water_logs from anon;
grant select,insert,update,delete on public.profiles,public.workouts,public.meals,public.weight_logs,public.water_logs to authenticated;

-- Policies explícitas: SELECT, INSERT, UPDATE e DELETE por usuário e tabela.
do $$
declare tbl text;
begin
  foreach tbl in array array['profiles','workouts','meals','weight_logs','water_logs'] loop
    execute format('drop policy if exists own_select on public.%I', tbl);
    execute format('drop policy if exists own_insert on public.%I', tbl);
    execute format('drop policy if exists own_update on public.%I', tbl);
    execute format('drop policy if exists own_delete on public.%I', tbl);
    execute format('create policy own_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)', tbl);
    execute format('create policy own_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', tbl);
    execute format('create policy own_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', tbl);
    execute format('create policy own_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', tbl);
  end loop;
end $$;

commit;

-- TESTES MANUAIS IMPORTANTES (com dois usuários reais A e B via SDK):
-- A não deve conseguir selecionar/alterar/excluir registros de B nem inserir user_id de B.
-- B não deve visualizar nenhum registro de A. Não assuma testes completos de RLS sem executá-los.
