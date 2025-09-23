create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  phone text,
  message text,
  event text,
  timestamp bigint,
  created_at timestamp with time zone default now()
);

create table if not exists public.whatsapp_gamification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  phone text,
  points integer default 0,
  reason text,
  meta jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create index if not exists idx_whatsapp_messages_created_at
  on public.whatsapp_messages(created_at desc);

create index if not exists idx_whatsapp_gamification_log_created_at
  on public.whatsapp_gamification_log(created_at desc);

alter table if exists public.user_profiles
  add column if not exists phone varchar(20),
  add column if not exists current_weight decimal(5,2),
  add column if not exists target_weight  decimal(5,2),
  add column if not exists gender varchar(10),
  add column if not exists goal_type varchar(50);

alter table if exists public.daily_checkins
  add column if not exists weight decimal(5,2),
  add column if not exists mood_score integer,
  add column if not exists updated_at timestamp with time zone default now();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_daily_checkins_updated_at on public.daily_checkins;

DROP TRIGGER IF EXISTS trg_daily_checkins_updated_at ON public.daily_checkins;

create trigger trg_daily_checkins_updated_at
before update on public.daily_checkins
for each row execute function public.set_updated_at();
