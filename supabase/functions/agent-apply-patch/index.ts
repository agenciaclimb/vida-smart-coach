import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
const CORS = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization' };

Deno.serve(async (req)=>{
  if (req.method==='OPTIONS') return new Response('ok',{headers:CORS});
  const body = await req.json();
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  let patch:any;
  if (body.patch_id === 'last') {
    const { data } = await supabase.from('prompt_patches').select('*')
      .eq('agent_id', body.agent_id).order('created_at', { ascending:false }).limit(1);
    patch = data?.[0];
  } else {
    const { data } = await supabase.from('prompt_patches').select('*').eq('id', body.patch_id).maybeSingle();
    patch = data;
  }
  if (!patch) return new Response(JSON.stringify({ error:'patch_not_found' }), { status:404, headers:CORS });

  const { data: ver } = await supabase.from('agent_versions')
    .select('version,config_json').eq('agent_id', body.agent_id)
    .order('version',{ ascending:false }).limit(1).maybeSingle();

  const newConfig = ver?.config_json || {}; // TODO: aplicar patch_yaml de fato

  const { error: e1 } = await supabase.from('agent_versions').insert({
    agent_id: body.agent_id,
    version: patch.to_version,
    config_json: newConfig,
    changelog: patch.summary,
    created_by: 'system'
  });
  if (e1) return new Response(JSON.stringify({ error:e1.message }), { status:400, headers:CORS });

  await supabase.from('agents').update({ current_version: patch.to_version }).eq('id', body.agent_id);
  await supabase.from('prompt_patches').update({ auto_applied: !!body.auto }).eq('id', patch.id);
  await supabase.from('issue_reports').update({ status:'patched' }).eq('agent_id', body.agent_id).neq('status','patched');

  return new Response(JSON.stringify({ to_version: patch.to_version }), { headers:{...CORS,'Content-Type':'application/json'}});
});