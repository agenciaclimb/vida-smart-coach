#!/usr/bin/env node
/**
 * Health Check - Edge Functions
 * HOTFIX PROTOCOL 1.0 - Validação Pós-Deploy
 * 
 * Verifica se todas as Edge Functions estão respondendo corretamente
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const ENV_PATH = join(process.cwd(), '.env.local');

console.log('\n🏥 HEALTH CHECK - Edge Functions\n');
console.log('═══════════════════════════════════════════\n');

// Carregar env
const envContent = readFileSync(ENV_PATH, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=#]+)=(.+)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
const INTERNAL_SECRET = env.INTERNAL_FUNCTION_SECRET;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('❌ Variáveis de ambiente não encontradas\n');
  process.exit(1);
}

// Funções críticas a serem testadas
const CRITICAL_FUNCTIONS = [
  {
    name: 'evolution-webhook',
    path: '/functions/v1/evolution-webhook',
    method: 'POST',
    headers: {
      'apikey': env.EVOLUTION_API_SECRET,
      'Content-Type': 'application/json'
    },
    body: { event: 'health_check' }
  },
  {
    name: 'ia-coach-chat',
    path: '/functions/v1/ia-coach-chat',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'X-Internal-Secret': INTERNAL_SECRET,
      'Content-Type': 'application/json'
    },
    body: {
      messageContent: 'health check',
      userProfile: { id: 'test', full_name: 'Health Check' }
    }
  },
  {
    name: 'generate-plan',
    path: '/functions/v1/generate-plan',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'X-Internal-Secret': INTERNAL_SECRET,
      'Content-Type': 'application/json'
    },
    body: {
      userId: '00000000-0000-0000-0000-000000000001',
      planType: 'physical',
      userProfile: {
        id: '00000000-0000-0000-0000-000000000001',
        full_name: 'Health Check Test User',
        age: 30,
        current_weight: 75,
        target_weight: 70,
        height: 175,
        goal_type: 'general_health',
        activity_level: 'sedentary'
      }
    }
  }
];

let allPassed = true;
let totalLatency = 0;

for (const func of CRITICAL_FUNCTIONS) {
  process.stdout.write(`📡 Testando ${func.name}... `);
  
  const startTime = Date.now();
  
  try {
    // Timeout de 30 segundos para generate-plan otimizado
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(`${SUPABASE_URL}${func.path}`, {
      method: func.method,
      headers: func.headers,
      body: JSON.stringify(func.body),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    totalLatency += latency;
    
    if (response.ok) {
      console.log(`✅ ${response.status} (${latency}ms)`);
    } else if (response.status === 400 || response.status === 404) {
      // Health check pode retornar 400/404 para payloads de teste
      console.log(`⚠️  ${response.status} (${latency}ms) - endpoint acessível`);
    } else {
      console.log(`❌ ${response.status} (${latency}ms)`);
      allPassed = false;
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    if (error.name === 'AbortError') {
      console.log(`❌ TIMEOUT (${latency}ms)`);
    } else {
      console.log(`❌ ERRO: ${error.message} (${latency}ms)`);
    }
    allPassed = false;
  }
}

const avgLatency = Math.round(totalLatency / CRITICAL_FUNCTIONS.length);

console.log('\n═══════════════════════════════════════════');
console.log(`\n📊 Latência média: ${avgLatency}ms`);

if (avgLatency > 3000) {
  console.log('⚠️  ATENÇÃO: Latência alta (> 3s)');
}

if (allPassed) {
  console.log('\n✅ TODAS AS FUNÇÕES ESTÃO RESPONDENDO');
  console.log('✅ Sistema operacional\n');
  process.exit(0);
} else {
  console.log('\n❌ ALGUMAS FUNÇÕES FALHARAM');
  console.log('❌ Verificar logs do Supabase\n');
  process.exit(1);
}
