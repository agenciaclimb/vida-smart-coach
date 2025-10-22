// Teste direto da Evolution API para validar envio
import fs from 'node:fs';
import path from 'node:path';

function loadDotenvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

async function main() {
  loadDotenvLocal();
  
  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const evolutionToken = process.env.EVOLUTION_API_TOKEN || process.env.EVOLUTION_API_SECRET;
  const instanceId = process.env.EVOLUTION_INSTANCE_ID;
  const targetPhone = '5516981459950';
  
  console.log('📞 Testando envio direto Evolution API\n');
  console.log(`URL: ${evolutionUrl}`);
  console.log(`Instance: ${instanceId}`);
  console.log(`Token: ${evolutionToken ? evolutionToken.slice(0, 10) + '...' : 'MISSING'}`);
  console.log(`Phone: ${targetPhone}\n`);
  
  if (!evolutionUrl || !evolutionToken || !instanceId) {
    console.error('❌ Configurações faltando!');
    process.exit(1);
  }
  
  const sendUrl = `${evolutionUrl}/message/sendText/${instanceId}`;
  
  console.log(`🚀 Enviando para: ${sendUrl}\n`);
  
  const res = await fetch(sendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': evolutionToken,
    },
    body: JSON.stringify({
      number: targetPhone,
      text: '🤖 Teste direto da Evolution API - IA Coach funcionando!',
    }),
  });
  
  const resText = await res.text();
  console.log(`Status: ${res.status} ${res.ok ? '✅' : '❌'}`);
  console.log(`Response: ${resText}\n`);
  
  if (res.ok) {
    console.log('✅ Envio bem-sucedido! Verifique o WhatsApp.');
  } else {
    console.log('❌ Falha no envio. Possíveis causas:');
    console.log('  - Token inválido ou expirado');
    console.log('  - Instance ID incorreto');
    console.log('  - Número de telefone inválido');
    console.log('  - Instância offline/desconectada');
  }
}

main().catch(err => {
  console.error('💥 Erro:', err);
  process.exit(1);
});
