#!/usr/bin/env node
/**
 * Teste direto da função generate-plan no Supabase
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

const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🧪 TESTE DIRETO - Generate Plan no Supabase\n');
console.log('═══════════════════════════════════════════\n');

const testPayload = {
  userId: 'test-deploy-validation',
  planType: 'physical',
  userProfile: {
    id: 'test',
    full_name: 'Test Deploy',
    age: 30,
    current_weight: 75,
    height: 175,
    goal_type: 'general_health',
    activity_level: 'beginner'
  }
};

console.log('📡 Chamando generate-plan...\n');
console.log('Payload:', JSON.stringify(testPayload, null, 2), '\n');

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s - Edge Functions tem limite de 150s

try {
  const startTime = Date.now();
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-plan`, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testPayload)
  });

  clearTimeout(timeoutId);
  const latency = Date.now() - startTime;

  console.log(`📊 Status: ${response.status}`);
  console.log(`⏱️  Latência: ${latency}ms\n`);

  const responseText = await response.text();
  
  if (response.ok) {
    console.log('✅ SUCESSO!\n');
    const data = JSON.parse(responseText);
    console.log('Plano gerado:', JSON.stringify(data, null, 2).substring(0, 500), '...\n');
    process.exit(0);
  } else {
    console.log('❌ ERRO!\n');
    console.log('Resposta:', responseText, '\n');
    process.exit(1);
  }
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    console.log('❌ TIMEOUT (30s)\n');
  } else {
    console.log('❌ ERRO:', error.message, '\n');
  }
  process.exit(1);
}
