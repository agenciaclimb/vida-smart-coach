create or replace function public.exec_sql(sql_query text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  execute sql_query;
  result := json_build_object('status', 'success');
  return result;
exception when others then
  result := json_build_object('error', SQLERRM);
  return result;
end;
$$;

grant execute on function public.exec_sql(text) to authenticated;
