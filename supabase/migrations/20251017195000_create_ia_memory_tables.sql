-- Enable pgvector extension for semantic memory if not already present
create extension if not exists vector;

-- Conversation memory table to store user/agent exchanges with optional embeddings
create table if not exists conversation_memory (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  conversation_id text,
  message_type text check (message_type in ('user', 'agent')) not null,
  message_text text not null,
  emotional_tone text,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Harmonize legacy schema from 20251015020000_create_ia_coach_strategic_system_final.sql
alter table conversation_memory
  add column if not exists conversation_id text,
  add column if not exists message_type text check (message_type in ('user', 'agent')) default 'user',
  add column if not exists message_text text,
  add column if not exists emotional_tone text,
  add column if not exists embedding vector(1536);

alter table conversation_memory
  alter column message_type drop default;

drop index if exists idx_conversation_memory_user_type;

alter table conversation_memory
  drop column if exists memory_type,
  drop column if exists content,
  drop column if exists context,
  drop column if exists importance,
  drop column if exists last_referenced,
  drop column if exists reference_count;

create index if not exists conversation_memory_user_idx on conversation_memory (user_id, created_at desc);
create index if not exists conversation_memory_conversation_idx on conversation_memory (conversation_id, created_at desc);

-- Client psychology profile table captures behavioural insights used by the coach
create table if not exists client_psychology_profile (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) unique not null,
  profile_type varchar(50) check (profile_type in ('analytical','driver','amiable','expressive')) default 'expressive',
  pain_points text[] default '{}',
  motivators text[] default '{}',
  objections_history text[] default '{}',
  communication_style varchar(50) default 'equilibrado',
  engagement_score integer default 0,
  buying_signals_score integer default 0,
  micro_conversions_completed text[] default '{}',
  best_contact_time time,
  response_pattern jsonb default '{}'::jsonb,
  last_summary text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists client_psychology_profile_user_idx on client_psychology_profile (user_id);
