create or replace view public.community_stats as
select 
  u.id,
  u.user_id,
  u.name,
  coalesce(g.total_points, 0)::bigint as total_points
from public.user_profiles u
left join public.gamification g on g.user_id = u.user_id;

grant usage on schema public to anon, authenticated;
grant select on public.community_stats to anon, authenticated;

-- opcional: RPC para leitura
create or replace function public.get_community_stats()
returns table(id uuid, user_id uuid, name text, total_points bigint)
language sql security definer as $$
  select id, user_id, name, total_points from public.community_stats;
$$;

grant execute on function public.get_community_stats() to anon, authenticated;
