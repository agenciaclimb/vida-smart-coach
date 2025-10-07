'use client';
import { useState } from 'react';
export default function NewAgentPage() {
  const [form, setForm] = useState({ agent_name:'', channel:'whatsapp', objetivos:'', limites:'', persona:'humano, consultivo, vendedor sutil' });
  const [loading, setLoading] = useState(false);
  const submit = async (e:any) => {
    e.preventDefault(); setLoading(true);
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-create`;
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    const data = await res.json();
    alert(data.error ? `Erro: ${data.error}` : `Agente criado: ${data.agent_id} (v${data.version})`);
    setLoading(false);
  };
  return (<main className="max-w-xl mx-auto p-6 space-y-4">
    <h1 className="text-2xl font-semibold">Criar agente</h1>
    <form onSubmit={submit} className="space-y-3">
      <input className="border p-2 w-full" placeholder="Nome do agente" onChange={e=>setForm(f=>({...f, agent_name:e.target.value}))}/>
      <select className="border p-2 w-full" onChange={e=>setForm(f=>({...f, channel:e.target.value}))}>
        <option value="whatsapp">WhatsApp</option><option value="web">Web</option>
        <option value="voice">Voz</option><option value="instagram">Instagram</option><option value="phone">Telefone</option>
      </select>
      <textarea className="border p-2 w-full" rows={3} placeholder="Objetivos" onChange={e=>setForm(f=>({...f, objetivos:e.target.value}))}/>
      <textarea className="border p-2 w-full" rows={3} placeholder="Limites / guard-rails" onChange={e=>setForm(f=>({...f, limites:e.target.value}))}/>
      <button className="border px-4 py-2" disabled={loading}>{loading ? 'Gerando...' : 'Gerar agente'}</button>
    </form>
  </main>);
}