-- Fase 3.5 — private AI beta entitlements and atomic per-account daily reservations.
-- Future billing webhooks MUST write entitlements through a privileged, verified server.
begin;

create table public.ai_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'inactive' check (status in ('inactive','trial','active')),
  expires_at timestamptz,
  daily_limit smallint not null default 2 check (daily_limit between 1 and 10),
  updated_at timestamptz not null default now()
);
create table public.ai_generation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now()
);
create index ai_generation_attempts_user_day on public.ai_generation_attempts (user_id,requested_at desc);
alter table public.ai_entitlements enable row level security;
alter table public.ai_generation_attempts enable row level security;
revoke all on public.ai_entitlements,public.ai_generation_attempts from anon,authenticated;
grant select on public.ai_entitlements,public.ai_generation_attempts to authenticated;
create policy "select_my_entitlement" on public.ai_entitlements for select to authenticated using ((select auth.uid())=user_id);
create policy "select_my_attempts" on public.ai_generation_attempts for select to authenticated using ((select auth.uid())=user_id);

-- User must grant separate consent to send a minimized profile to the model provider.
alter table public.training_assessments
  add column ai_provider_consent_at timestamptz;

-- Only the authenticated owner may claim a rate-limited attempt. Ineligible users do not consume usage.
-- Advisory transaction lock prevents same-user concurrent requests bypassing the daily cap.
-- Beta v1: attempts are billed against the daily cap even if provider generation fails.
create function public.claim_training_ai_attempt()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_uid uuid := (select auth.uid());
  permitted_limit integer;
  today_used integer;
begin
  if current_uid is null then return 'unauthenticated'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(current_uid::text));
  select e.daily_limit into permitted_limit
    from public.ai_entitlements e
    where e.user_id=current_uid
      and e.status in ('active','trial')
      and (e.expires_at is null or e.expires_at > now());
  if permitted_limit is null then return 'subscription_required'; end if;
  select count(*) into today_used
    from public.ai_generation_attempts a
    where a.user_id=current_uid and a.requested_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
  if today_used>=permitted_limit then return 'daily_limit'; end if;
  insert into public.ai_generation_attempts(user_id) values (current_uid);
  return 'ok';
end;
$$;
revoke all on function public.claim_training_ai_attempt() from public;
grant execute on function public.claim_training_ai_attempt() to authenticated;

commit;