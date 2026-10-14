-- Fase 3.3: avaliacao minima, plano sugerido e check-ins.
-- Nao guarda diagnosticos, medicamentos ou historico clinico.
-- Executar como migracao. Sem alterar os dados existentes da Fase 3.2.
begin;

create table if not exists public.training_assessments (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal text not null check (goal in ('massa','gordura','recomposicao','condicionamento','consistencia')),
  experience text not null check (experience in ('iniciante','intermediario','avancado')),
  training_place text not null check (training_place in ('academia','casa','ar_livre')),
  equipment text[] not null default '{}'::text[]
     check (equipment <@ array['halteres','elasticos']::text[] and cardinality(equipment) <= 2),
  days_per_week integer not null check (days_per_week between 1 and 5),
  minutes_per_session integer not null check (minutes_per_session in (20,30,45,60,90)),
  age_confirmed boolean not null check (age_confirmed = true),
  readiness text not null check (readiness in ('ready','requires_clearance')),
  consent_accepted_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  blueprint jsonb not null check (
    jsonb_typeof(blueprint) = 'object'
    and octet_length(blueprint::text) <= 100000
  ),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.training_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null,
  session_index integer not null check (session_index between 0 and 4),
  week_number integer not null check (week_number between 1 and 4),
  effort text not null check (effort in ('leve','adequado','dificil')),
  completed_at timestamptz not null default now(),
  unique (user_id,plan_id,session_index,week_number),
  constraint training_checkins_plan_owner_fk
     foreign key (plan_id,user_id) references public.training_plans(id,user_id)
     on delete cascade
);

create index if not exists training_plans_owner_created_idx
 on public.training_plans (user_id,created_at desc);
create index if not exists training_checkins_owner_plan_idx
 on public.training_checkins (user_id,plan_id,week_number);

alter table public.training_assessments enable row level security;
alter table public.training_plans enable row level security;
alter table public.training_checkins enable row level security;

revoke all on public.training_assessments,public.training_plans,public.training_checkins from anon;
grant select,insert,update,delete on public.training_assessments,public.training_plans,public.training_checkins to authenticated;

do $$
declare tbl text;
begin
 foreach tbl in array array['training_assessments','training_plans','training_checkins'] loop
   execute format('create policy owner_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)',tbl);
   execute format('create policy owner_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',tbl);
   execute format('create policy owner_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',tbl);
   execute format('create policy owner_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',tbl);
 end loop;
end $$;

commit;