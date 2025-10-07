'use client';
import { useState } from 'react';
export default function ReportPage({ params }: { params: { id: string } }) {
  const [payload, setPayload] = useState({ agent_id: params.id, title:'', description:'', expected_behavior:'', severity:'medium' });
  const submit = async (e:any) => {
    e.preventDefault();
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-report`;
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const data = await res.json();
    alert(data.error ? `Erro: ${data.error}` : `Patch proposto: ${data.patch_id} | Risco: ${data.risk_level}`);
  };
  const apply = async () => {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-apply-patch`;
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ agent_id: payload.agent_id, patch_id: 'last', auto: true }) });
    const data = await res.json();
    alert(data.error ? `Erro: ${data.error}` : `Patch aplicado. Nova versão: ${data.to_version}`);
  };
  return (<main className="max-w-xl mx-auto p-6 space-y-3">
    <h1 className="text-2xl font-semibold">Reportar problema</h1>
    <form onSubmit={submit} className="space-y-3">
      <input className="border p-2 w-full" value={payload.agent_id} readOnly />
      <input className="border p-2 w-full" placeholder="Título" onChange={e=>setPayload(p=>({...p, title:e.target.value}))}/>
      <textarea className="border p-2 w-full" rows={3} placeholder="Descrição" onChange={e=>setPayload(p=>({...p, description:e.target.value}))}/>
      <textarea className="border p-2 w-full" rows={3} placeholder="Comportamento esperado" onChange={e=>setPayload(p=>({...p, expected_behavior:e.target.value}))}/>
      <select className="border p-2 w-full" onChange={e=>setPayload(p=>({...p, severity:e.target.value}))}>
        <option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="critical">critical</option>
      </select>
      <div className="flex gap-2">
        <button className="border px-4 py-2" type="submit">Gerar Patch</button>
        <button className="border px-4 py-2" type="button" onClick={apply}>Aplicar último Patch</button>
      </div>
    </form>
  </main>);
}