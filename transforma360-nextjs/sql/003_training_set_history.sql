-- TRANSFORMA 360 · Fase 3.3.1
-- Granular training history. No changes to existing users/plans/legacy workout data.
begin;

create table public.training_set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null,
  week_number smallint not null check (week_number between 1 and 4),
  session_index smallint not null check (session_index between 0 and 4),
  exercise_id text not null check (char_length(exercise_id) between 2 and 80),
  set_number smallint not null check (set_number between 1 and 8),
  repetitions smallint check (repetitions between 1 and 300),
  duration_minutes smallint check (duration_minutes between 1 and 240),
  load_kg numeric(6,2) check (load_kg >= 0 and load_kg <= 500),
  effort_rpe smallint check (effort_rpe between 1 and 10),
  recorded_at timestamptz not null default now(),
  constraint training_set_logs_metric_check
    check ((repetitions is not null) <> (duration_minutes is not null)),
  constraint training_set_logs_plan_owner_fk
    foreign key (plan_id,user_id) references public.training_plans(id,user_id) on delete cascade,
  constraint training_set_logs_unique_slot
    unique (user_id,plan_id,week_number,session_index,exercise_id,set_number)
);

create index training_set_logs_owner_history_idx
  on public.training_set_logs(user_id,plan_id,week_number,session_index);

-- Only exercise slots that exist in the stored plan can be written.
-- This validates the prescribed exercise identity and set count, without enforcing clinical use.
create function public.verify_training_set_slot() returns trigger
language plpgsql set search_path = '' as $$
declare
  blueprint jsonb;
  day_data jsonb;
  exercise_data jsonb;
begin
  select p.blueprint into blueprint
    from public.training_plans p
    where p.id = new.plan_id and p.user_id = new.user_id;
  if blueprint is null or coalesce((blueprint->>'version')::int,0) <> 1 then
    raise exception 'Plano de treino inexistente ou incompatível';
  end if;
  select d.value into day_data
    from jsonb_array_elements(blueprint->'days') d(value)
    where (d.value->>'index') ~ '^[0-4]$'
      and (d.value->>'index')::int = new.session_index
    limit 1;
  if day_data is null then
    raise exception 'Sessão não existe neste plano';
  end if;
  select e.value into exercise_data
    from jsonb_array_elements(day_data->'exercises') e(value)
    where e.value->>'id' = new.exercise_id
    limit 1;
  if exercise_data is null then
    raise exception 'Exercício não existe nesta sessão';
  end if;
  if coalesce((exercise_data->>'sets')::int,0) < new.set_number then
    raise exception 'Número de série fora do plano';
  end if;
  if (exercise_data->>'movement') in ('cardio','mobilidade') then
    if new.duration_minutes is null or new.repetitions is not null or new.load_kg is not null then
      raise exception 'Atividade por tempo exige duração em minutos e não usa carga';
    end if;
  else
    if new.repetitions is null or new.duration_minutes is not null then
      raise exception 'Exercício de força exige repetições';
    end if;
  end if;
  return new;
end;
$$;

create trigger training_set_slot_guard
  before insert or update on public.training_set_logs
  for each row execute function public.verify_training_set_slot();

alter table public.training_set_logs enable row level security;
revoke all on public.training_set_logs from anon;
grant select,insert,update,delete on public.training_set_logs to authenticated;
create policy owner_select on public.training_set_logs for select to authenticated
  using ((select auth.uid())=user_id);
create policy owner_insert on public.training_set_logs for insert to authenticated
  with check ((select auth.uid())=user_id);
create policy owner_update on public.training_set_logs for update to authenticated
  using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy owner_delete on public.training_set_logs for delete to authenticated
  using ((select auth.uid())=user_id);

-- Trigger executes as invoker; no elevated privileges exposed to API users.
revoke all on function public.verify_training_set_slot() from public;
grant execute on function public.verify_training_set_slot() to authenticated;

commit;