create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan_id text,
  status text,
  current_period_end timestamptz,
  trial_start timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename='subscriptions' and policyname='sub:owner read'
  ) then
    create policy "sub:owner read" on public.subscriptions
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename='subscriptions' and policyname='sub:service write'
  ) then
    create policy "sub:service write" on public.subscriptions
      for all using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

create index if not exists idx_subscriptions_customer on public.subscriptions(stripe_customer_id);
create index if not exists idx_subscriptions_subscription on public.subscriptions(stripe_subscription_id);
