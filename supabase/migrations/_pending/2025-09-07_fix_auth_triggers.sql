-- Garantias básicas (idempotente)
create extension if not exists "pg_net" with schema extensions;
create extension if not exists "supabase_vault" with schema vault;

-- 1. Remover triggers antigos/órfãos
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_updated on auth.users;

-- 2. Conectar o AFTER INSERT de auth.users -> public.on_auth_user_created()
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.on_auth_user_created();

-- 3. Sincronizar updates essenciais do auth.users -> profiles
create trigger on_auth_user_updated
after update of email, phone, raw_user_meta_data, last_sign_in_at on auth.users
for each row
when (old.* is distinct from new.*)
execute function public.sync_profile_from_auth();
