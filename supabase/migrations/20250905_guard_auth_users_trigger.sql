do $$
declare
  users_owner text;
  has_trigger boolean;
begin
  select tableowner into users_owner
  from pg_tables
  where schemaname = 'auth' and tablename = 'users';

  if users_owner = current_user then
    create or replace function public.create_user_profile_on_signup()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $$
    begin
      insert into public.profiles (id) values (new.id)
      on conflict (id) do nothing;
      return new;
    end;
    $$;

    select exists(
      select 1 from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'auth'
        and c.relname = 'users'
        and t.tgname in ('on_auth_user_created','create_user_profile_on_auth_user_created')
    ) into has_trigger;

    if has_trigger then
      begin
        execute 'drop trigger if exists on_auth_user_created on auth.users';
        execute 'drop trigger if exists create_user_profile_on_auth_user_created on auth.users';
      exception when others then null;
      end;
    end if;

    execute '
      create trigger create_user_profile_on_auth_user_created
      after insert on auth.users
      for each row
      execute function public.create_user_profile_on_signup()
    ';
    execute $$ comment on trigger create_user_profile_on_auth_user_created on auth.users
              is ''trigger to create user profile after auth user creation'' $$;

    raise notice 'Auth trigger criado/ajustado (owner: %).', users_owner;
  else
   raise notice 'Pulando setup do trigger em auth.users (owner: %, current_user: %).', users_owner, current_user;
  end if;
end
$$;
