-- TRANSFORMA 360 · Onboarding premium v1
-- Backward compatible: preserves existing assessments and plans.
begin;
alter table public.training_assessments
  add column age_years smallint check (age_years between 18 and 90),
  add column height_cm smallint check (height_cm between 120 and 230),
  add column body_mass_kg numeric(5,1) check (body_mass_kg between 30 and 350),
  add column daily_activity text check (daily_activity in ('sedentario','leve','moderado','alto')),
  add column months_training smallint check (months_training between 0 and 600),
  add column preferred_days text[] not null default '{}'::text[]
    check (preferred_days <@ array['seg','ter','qua','qui','sex','sab','dom']::text[] and cardinality(preferred_days)<=7),
  add column focus_areas text[] not null default '{}'::text[]
    check (focus_areas <@ array['corpo_inteiro','peito','costas','pernas','gluteos','ombros','bracos','cardio']::text[] and cardinality(focus_areas)<=8),
  add column cardio_preference text check (cardio_preference in ('gosto','neutro','nao_gosto')),
  add column progression_preference text check (progression_preference in ('leve','moderada')),
  add column sleep_quality text check (sleep_quality in ('boa','regular','ruim'));

alter table public.training_checkins drop constraint if exists training_checkins_effort_check;
alter table public.training_checkins add constraint training_checkins_effort_check
  check (effort in ('leve','adequado','dificil','nao_informado'));

commit;