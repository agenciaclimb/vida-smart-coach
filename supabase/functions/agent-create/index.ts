import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const input = await req.json().catch(() => ({}));

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const system = `Você é um arquiteto de agentes. Gere APENAS um JSON AgentConfig v1 válido para PT-BR. Campos:
identity{name,role,company}, channels[], persona{tone,style}, objetivos[], boundaries{do_not[],handoff_rules}, intents[], ctas{primary,fallback}, compliance{lgpd,pii_masking}, knowledge_refs[].
Retorne somente JSON. Nome do agente: "ClimbAI".`;

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${Deno.env.get('OPENAI_API_KEY')}`, 'Content-Type':'application/json' },
    body: JSON.stringify({
      model:'gpt-4o-mini',
      temperature:0.2,
      messages:[
        { role:'system', content: system },
        { role:'user', content: JSON.stringify(input) }
      ]
    })
  });
  const out = await resp.json();
  let config:any;
  try { config = JSON.parse(out.choices?.[0]?.message?.content ?? '{}'); }
  catch { return new Response(JSON.stringify({ error:'invalid_llm_output' }), { status:500, headers:CORS }); }

  const { data: agent, error: e1 } = await supabase.from('agents').insert({
    name: input.agent_name || 'ClimbAI',
    channel: input.channel || 'whatsapp',
    status: 'draft'
  }).select('*').single();
  if (e1) return new Response(JSON.stringify({ error:e1.message }), { status:400, headers:CORS });

  const { error: e2 } = await supabase.from('agent_versions').insert({
    agent_id: agent.id, version: 1, config_json: config, created_by: 'system'
  });
  if (e2) return new Response(JSON.stringify({ error:e2.message }), { status:400, headers:CORS });

  return new Response(JSON.stringify({ agent_id: agent.id, version:1, config_json: config }), {
    headers: { ...CORS, 'Content-Type':'application/json' }
  });
});