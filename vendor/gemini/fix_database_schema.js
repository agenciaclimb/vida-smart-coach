import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 DIAGNÓSTICO DO BANCO DE DADOS SUPABASE\n');

async function checkDatabaseSchema() {
  console.log('📋 Verificando schema atual das tabelas...\n');
  
  // Testar colunas existentes em user_profiles
  console.log('👤 USER_PROFILES - Testando colunas:');
  const profileFields = [
    'id', 'full_name', 'name', 'email', 'phone', 
    'current_weight', 'target_weight', 'height',
    'age', 'gender', 'activity_level', 'goal_type',
    'created_at', 'updated_at'
  ];
  
  const existingProfileFields = [];
  const missingProfileFields = [];
  
  for (const field of profileFields) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select(field)
        .limit(1);
        
      if (!error) {
        console.log(`  ✅ ${field} - EXISTE`);
        existingProfileFields.push(field);
      } else {
        console.log(`  ❌ ${field} - FALTA (${error.message})`);
        missingProfileFields.push(field);
      }
    } catch (e) {
      console.log(`  ❌ ${field} - ERRO: ${e.message}`);
      missingProfileFields.push(field);
    }
  }
  
  // Testar colunas existentes em daily_checkins
  console.log('\n📊 DAILY_CHECKINS - Testando colunas:');
  const checkinFields = [
    'id', 'user_id', 'date', 'weight', 'mood', 'mood_score',
    'energy_level', 'sleep_hours', 'water_intake', 'exercise_minutes',
    'notes', 'created_at', 'updated_at'
  ];
  
  const existingCheckinFields = [];
  const missingCheckinFields = [];
  
  for (const field of checkinFields) {
    try {
      const { error } = await supabase
        .from('daily_checkins')
        .select(field)
        .limit(1);
        
      if (!error) {
        console.log(`  ✅ ${field} - EXISTE`);
        existingCheckinFields.push(field);
      } else {
        console.log(`  ❌ ${field} - FALTA (${error.message})`);
        missingCheckinFields.push(field);
      }
    } catch (e) {
      console.log(`  ❌ ${field} - ERRO: ${e.message}`);
      missingCheckinFields.push(field);
    }
  }
  
  // Resumo
  console.log('\n📈 RESUMO DO DIAGNÓSTICO:');
  console.log('\n👤 USER_PROFILES:');
  console.log(`  ✅ Campos existentes: ${existingProfileFields.join(', ')}`);
  console.log(`  ❌ Campos faltando: ${missingProfileFields.join(', ')}`);
  
  console.log('\n📊 DAILY_CHECKINS:');
  console.log(`  ✅ Campos existentes: ${existingCheckinFields.join(', ')}`);
  console.log(`  ❌ Campos faltando: ${missingCheckinFields.join(', ')}`);
  
  // Gerar SQL para adicionar campos faltando
  if (missingProfileFields.length > 0 || missingCheckinFields.length > 0) {
    console.log('\n🔧 SQL PARA ADICIONAR CAMPOS FALTANDO:');
    console.log('-- Execute estes comandos no Supabase SQL Editor:\n');
    
    if (missingProfileFields.length > 0) {
      console.log('-- Adicionar campos à tabela user_profiles:');
      console.log('ALTER TABLE user_profiles');
      
      const profileAlters = [];
      missingProfileFields.forEach(field => {
        switch(field) {
          case 'phone':
            profileAlters.push('ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
            break;
          case 'current_weight':
            profileAlters.push('ADD COLUMN IF NOT EXISTS current_weight DECIMAL(5,2)');
            break;
          case 'target_weight':
            profileAlters.push('ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,2)');
            break;
          case 'age':
            profileAlters.push('ADD COLUMN IF NOT EXISTS age INTEGER');
            break;
          case 'gender':
            profileAlters.push('ADD COLUMN IF NOT EXISTS gender VARCHAR(10)');
            break;
          case 'activity_level':
            profileAlters.push('ADD COLUMN IF NOT EXISTS activity_level VARCHAR(20)');
            break;
          case 'goal_type':
            profileAlters.push('ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50)');
            break;
        }
      });
      
      if (profileAlters.length > 0) {
        console.log(profileAlters.join(',\n') + ';\n');
      }
    }
    
    if (missingCheckinFields.length > 0) {
      console.log('-- Adicionar campos à tabela daily_checkins:');
      console.log('ALTER TABLE daily_checkins');
      
      const checkinAlters = [];
      missingCheckinFields.forEach(field => {
        switch(field) {
          case 'weight':
            checkinAlters.push('ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2)');
            break;
          case 'mood_score':
            checkinAlters.push('ADD COLUMN IF NOT EXISTS mood_score INTEGER');
            break;
          case 'water_intake':
            checkinAlters.push('ADD COLUMN IF NOT EXISTS water_intake DECIMAL(5,2)');
            break;
          case 'exercise_minutes':
            checkinAlters.push('ADD COLUMN IF NOT EXISTS exercise_minutes INTEGER');
            break;
          case 'notes':
            checkinAlters.push('ADD COLUMN IF NOT EXISTS notes TEXT');
            break;
        }
      });
      
      if (checkinAlters.length > 0) {
        console.log(checkinAlters.join(',\n') + ';\n');
      }
    }
  }
  
  return { existingProfileFields, missingProfileFields, existingCheckinFields, missingCheckinFields };
}

checkDatabaseSchema().catch(console.error);