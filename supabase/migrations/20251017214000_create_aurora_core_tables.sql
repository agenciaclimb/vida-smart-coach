-- ============================================
-- Aurora Core Tables (values, goals, milestones, actions, reviews)
-- Supports DiscoveryWizard, AuroraTab and weekly review flows
-- ============================================

create extension if not exists pgcrypto;

-- =======================
-- life_values
-- =======================
create table if not exists life_values (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  importance_score integer default 5 check (importance_score between 1 and 10),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table life_values
  alter column user_id set default auth.uid();

create index if not exists life_values_user_idx on life_values (user_id);

alter table life_values enable row level security;

create policy "life_values_select" on life_values
  for select using (user_id = auth.uid());

create policy "life_values_insert" on life_values
  for insert with check (user_id = auth.uid());

create policy "life_values_update" on life_values
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "life_values_delete" on life_values
  for delete using (user_id = auth.uid());

-- =======================
-- life_goals
-- =======================
create table if not exists life_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  value_id uuid references life_values(id) on delete set null,
  area text,
  horizon text,
  title text not null,
  description text,
  success_metric text,
  status text default 'draft' check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  target_date date,
  progress numeric default 0 check (progress between 0 and 1),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table life_goals
  alter column user_id set default auth.uid();

create index if not exists life_goals_user_idx on life_goals (user_id);
create index if not exists life_goals_status_idx on life_goals (user_id, status);

alter table life_goals enable row level security;

create policy "life_goals_select" on life_goals
  for select using (user_id = auth.uid());

create policy "life_goals_insert" on life_goals
  for insert with check (user_id = auth.uid());

create policy "life_goals_update" on life_goals
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "life_goals_delete" on life_goals
  for delete using (user_id = auth.uid());

-- =======================
-- life_milestones
-- =======================
create table if not exists life_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  goal_id uuid references life_goals(id) on delete cascade not null,
  title text not null,
  description text,
  due_date date,
  status text default 'planned' check (status in ('planned', 'in_progress', 'completed', 'skipped')),
  calendar_event_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table life_milestones
  alter column user_id set default auth.uid();

create index if not exists life_milestones_user_idx on life_milestones (user_id);
create index if not exists life_milestones_goal_idx on life_milestones (goal_id);
create index if not exists life_milestones_due_idx on life_milestones (user_id, due_date);

alter table life_milestones enable row level security;

create policy "life_milestones_select" on life_milestones
  for select using (user_id = auth.uid());

create policy "life_milestones_insert" on life_milestones
  for insert with check (user_id = auth.uid());

create policy "life_milestones_update" on life_milestones
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "life_milestones_delete" on life_milestones
  for delete using (user_id = auth.uid());

-- =======================
-- life_actions
-- =======================
create table if not exists life_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  milestone_id uuid references life_milestones(id) on delete cascade not null,
  title text not null,
  description text,
  scheduled_for date,
  status text default 'pending' check (status in ('pending', 'in_progress', 'done', 'skipped', 'blocked')),
  effort_level integer check (effort_level between 1 and 5),
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table life_actions
  alter column user_id set default auth.uid();

create index if not exists life_actions_user_idx on life_actions (user_id);
create index if not exists life_actions_milestone_idx on life_actions (milestone_id);
create index if not exists life_actions_status_idx on life_actions (user_id, status);

alter table life_actions enable row level security;

create policy "life_actions_select" on life_actions
  for select using (user_id = auth.uid());

create policy "life_actions_insert" on life_actions
  for insert with check (user_id = auth.uid());

create policy "life_actions_update" on life_actions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "life_actions_delete" on life_actions
  for delete using (user_id = auth.uid());

-- =======================
-- life_reviews
-- =======================
create table if not exists life_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  review_period_start date,
  review_period_end date,
  clarity_score integer check (clarity_score between 0 and 10),
  momentum_score integer check (momentum_score between 0 and 100),
  satisfaction_score integer check (satisfaction_score between 0 and 10),
  consistency_score integer check (consistency_score between 0 and 100),
  highlights text,
  blockers text,
  next_focus text,
  created_at timestamptz default now()
);

alter table life_reviews
  alter column user_id set default auth.uid();

create index if not exists life_reviews_user_idx on life_reviews (user_id);
create index if not exists life_reviews_period_idx on life_reviews (user_id, review_period_start desc);

alter table life_reviews enable row level security;

create policy "life_reviews_select" on life_reviews
  for select using (user_id = auth.uid());

create policy "life_reviews_insert" on life_reviews
  for insert with check (user_id = auth.uid());

create policy "life_reviews_update" on life_reviews
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "life_reviews_delete" on life_reviews
  for delete using (user_id = auth.uid());

-- =======================
-- Aggregated view for dashboards
-- =======================
create or replace view life_goal_overview as
select
  g.id as goal_id,
  g.user_id,
  g.title,
  g.area,
  g.horizon,
  g.status,
  coalesce(sum(case when a.status = 'done' then 1 else 0 end)::numeric
           / nullif(count(a.id), 0), 0) as action_completion_rate,
  count(distinct m.id) as total_milestones,
  count(distinct case when m.status = 'completed' then m.id end) as completed_milestones,
  min(m.due_date) as next_due_date,
  max(m.updated_at) as last_progress_update
from life_goals g
left join life_milestones m on m.goal_id = g.id
left join life_actions a on a.milestone_id = m.id
group by g.id, g.user_id, g.title, g.area, g.horizon, g.status;
