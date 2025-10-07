import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
const CORS = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization' };

Deno.serve(async (req) => {
  if (req.method==='OPTIONS') return new Response('ok',{headers:CORS});
  const payload = await req.json();
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: ver } = await supabase.from('agent_versions')
    .select('version,config_json').eq('agent_id', payload.agent_id)
    .order('version',{ ascending:false }).limit(1).maybeSingle();

  const system = `Você é engenheiro de qualidade de agentes. Dado o config atual e um report, gere JSON:
{ "patch_yaml": "...", "tests":[{"input":"..","expect":".."}], "risk_level":"low|medium|high", "auto_apply":true|false }.
Respeite PT-BR e o estilo do config.`;

  const body = { issue: payload, current_config: ver?.config_json || {} };

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${Deno.env.get('OPENAI_API_KEY')}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ model:'gpt-4o-mini', temperature:0.2, messages:[
      { role:'system', content: system },
      { role:'user', content: JSON.stringify(body) }
    ]})
  });
  let gen:any = {};
  try { gen = JSON.parse((await r.json()).choices[0].message.content); } catch { gen = { patch_yaml:'summary: Ajuste\nchanges: []', tests:[], risk_level:'low', auto_apply:false }; }

  const { data: issue } = await supabase.from('issue_reports').insert({
    agent_id: payload.agent_id,
    title: payload.title, description: payload.description,
    expected_behavior: payload.expected_behavior,
    severity: payload.severity || 'medium',
    attachments: payload.attachments || null,
    status: 'in_review', created_by: 'client'
  }).select('*').single();

  const nextVersion = (ver?.version ?? 1) + 1;

  const { data: patch } = await supabase.from('prompt_patches').insert({
    agent_id: payload.agent_id,
    from_version: ver?.version ?? 1,
    to_version: nextVersion,
    patch_yaml: gen.patch_yaml,
    summary: 'Patch automático baseado no report',
    risk_level: gen.risk_level || 'low',
    auto_applied: false,
    created_by: 'system'
  }).select('*').single();

  return new Response(JSON.stringify({
    issue_id: issue?.id, patch_id: patch?.id,
    risk_level: patch?.risk_level, tests: gen.tests, auto_apply: gen.auto_apply
  }), { headers:{...CORS,'Content-Type':'application/json'}});
});