alter table conversation_memory
  add column if not exists content text;

alter table conversation_memory
  add column if not exists memory_type text;

alter table conversation_memory
  add column if not exists importance integer default 1;

alter table conversation_memory
  add column if not exists stage_discovered text;

alter table conversation_memory
  add column if not exists last_referenced timestamptz default now();

alter table conversation_memory
  add column if not exists created_at timestamptz default now();

update conversation_memory
  set content = coalesce(content, ''),
      memory_type = coalesce(memory_type, 'note'),
      importance = coalesce(importance, 1),
      last_referenced = coalesce(last_referenced, now()),
      created_at = coalesce(created_at, now());

alter table conversation_memory
  alter column content set not null;

alter table conversation_memory
  alter column memory_type set default 'note';

alter table conversation_memory
  alter column memory_type set not null;

alter table conversation_memory
  alter column importance set default 1;

alter table conversation_memory
  alter column importance set not null;

alter table conversation_memory
  alter column last_referenced set default now();

alter table conversation_memory
  alter column created_at set default now();
