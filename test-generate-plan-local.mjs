#!/usr/bin/env node
/**
 * Teste local da lógica do generate-plan
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const ENV_PATH = join(process.cwd(), '.env.local');
const envContent = readFileSync(ENV_PATH, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=#]+)=(.+)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const OPENAI_API_KEY = env.OPENAI_API_KEY;

console.log('\n🧪 TESTE LOCAL - Generate Plan\n');
console.log('═══════════════════════════════════════════\n');

if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('xxx')) {
  console.log('❌ OPENAI_API_KEY não configurada\n');
  process.exit(1);
}

console.log('✅ OPENAI_API_KEY encontrada:', OPENAI_API_KEY.substring(0, 20) + '...\n');

// Testar chamada simplificada à OpenAI
const prompt = `Personal Trainer (NSCA/ACSM). Plano treino JSON.

PERFIL: Test User, 30anos, 75kg, objetivo: saúde

JSON:
{
  "title": "Plano de Treino",
  "description": "Plano básico",
  "duration_weeks": 1
}`;

console.log('📡 Testando OpenAI API...\n');

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 25000);

try {
  const startTime = Date.now();
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: 'POST',
    signal: controller.signal,
    headers: { 
      Authorization: `Bearer ${OPENAI_API_KEY}`, 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: 'system',
          content: 'Especialista que retorna APENAS JSON válido, sem texto adicional.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  clearTimeout(timeoutId);
  const latency = Date.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`❌ OpenAI Error ${response.status}: ${errorText}\n`);
    console.log(`⏱️  Latência: ${latency}ms\n`);
    process.exit(1);
  }

  const data = await response.json();
  console.log('✅ OpenAI respondeu com sucesso!');
  console.log(`⏱️  Latência: ${latency}ms\n`);
  console.log('📄 Resposta:', JSON.stringify(data.choices[0]?.message?.content, null, 2), '\n');
  
  process.exit(0);
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    console.log('❌ TIMEOUT (25s)\n');
  } else {
    console.log('❌ ERRO:', error.message, '\n');
  }
  process.exit(1);
}
