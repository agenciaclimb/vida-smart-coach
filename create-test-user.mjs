#!/usr/bin/env node
/**
 * HOTFIX PROTOCOL 1.0 - Criar usuário de teste via Supabase Admin
 * Solução: Usar Service Role Key para criar usuário completo
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const ENV_PATH = join(process.cwd(), '.env.local');

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
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔧 CRIANDO USUÁRIO DE TESTE');
console.log('═══════════════════════════════════════════\n');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_EMAIL = 'healthcheck@vidasmart.test';

async function createTestUser() {
  try {
    // 1. Criar usuário no auth.users
    console.log('1️⃣ Criando usuário no auth.users...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      id: TEST_USER_ID,
      email: TEST_EMAIL,
      email_confirm: true,
      user_metadata: {
        full_name: 'Health Check Test User',
        test_user: true
      }
    });
    
    if (authError && !authError.message.includes('already exists')) {
      throw new Error(`Auth error: ${authError.message}`);
    }
    
    console.log('   ✅ Usuário auth criado/já existe');
    
    // 2. Criar profile
    console.log('2️⃣ Criando profile em user_profiles...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: TEST_USER_ID,
        full_name: 'Health Check Test User',
        age: 30,
        current_weight: 75,
        target_weight: 70,
        height: 175,
        goal_type: 'general_health',
        activity_level: 'sedentary'
      })
      .select()
      .single();
    
    if (profileError) {
      throw new Error(`Profile error: ${profileError.message}`);
    }
    
    console.log('   ✅ Profile criado');
    
    // 3. Verificar
    console.log('3️⃣ Verificando...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_profiles')
      .select('id, full_name, goal_type, activity_level')
      .eq('id', TEST_USER_ID)
      .single();
    
    if (verifyError) {
      throw new Error(`Verify error: ${verifyError.message}`);
    }
    
    console.log('   ✅ Verificado:', verifyData);
    
    console.log('\n═══════════════════════════════════════════');
    console.log('✅ USUÁRIO DE TESTE CRIADO COM SUCESSO');
    console.log(`📧 Email: ${TEST_EMAIL}`);
    console.log(`🆔 UUID: ${TEST_USER_ID}`);
    console.log('═══════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.log('\n📋 Verificar:');
    console.log('- SUPABASE_SERVICE_ROLE_KEY está configurada?');
    console.log('- RLS policies permitem insert com service role?');
    console.log('- FK constraints estão corretas?\n');
    process.exit(1);
  }
}

createTestUser();
