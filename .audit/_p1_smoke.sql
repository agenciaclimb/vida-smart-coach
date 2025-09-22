-- P1 smoke verification queries
-- Trigger on auth.users
select tgname, tgenabled, pg_get_triggerdef(t.oid) as definition
from pg_trigger t
join pg_class c on t.tgrelid = c.oid
join pg_namespace n on c.relnamespace = n.oid
where n.nspname = 'auth'
  and c.relname = 'users'
  and tgname = 'on_auth_user_created';

-- Functions presence
select n.nspname as schema, p.proname, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on p.pronamespace = n.oid
where p.proname in ('handle_new_user','on_auth_user_created','sync_profile_from_auth')
order by n.nspname, p.proname;

-- View sample
select * from public.plans_normalized limit 1;

-- Index definition
select schemaname, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname = 'idx_whatsapp_messages_external_id';
