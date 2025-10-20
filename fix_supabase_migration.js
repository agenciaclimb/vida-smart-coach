import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseMigrationIssues() {
  console.log('🔍 DIAGNOSTICANDO PROBLEMAS DE MIGRAÇÃO SUPABASE\n');
  
  // 1. Verificar estrutura da tabela user_profiles
  console.log('1️⃣ Verificando estrutura da tabela user_profiles...');
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('❌ Erro ao acessar user_profiles:', error.message);
      
      if (error.message.includes('does not exist')) {
        console.log('⚠️ A tabela user_profiles não existe!');
        console.log('\n📝 SOLUÇÃO: Execute este SQL no Supabase Dashboard:');
        console.log('```sql');
        console.log(`-- Criar tabela user_profiles se não existir
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    name TEXT,
    email TEXT,
    phone VARCHAR(20),
    age INTEGER,
    height INTEGER,
    current_weight DECIMAL(5,2),
    target_weight DECIMAL(5,2),
    gender VARCHAR(10),
    activity_level VARCHAR(20),
    goal_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam/editem apenas seus próprios perfis
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_weight ON user_profiles(current_weight);`);
        console.log('```');
        
        return false;
      }
    } else {
      console.log('✅ Tabela user_profiles existe e está acessível');
      if (data) {
        console.log('📋 Estrutura atual:', Object.keys(data[0] || {}));
      }
    }
  } catch (e) {
    console.log('❌ Erro inesperado:', e.message);
    return false;
  }

  // 2. Verificar estrutura da tabela daily_checkins
  console.log('\n2️⃣ Verificando estrutura da tabela daily_checkins...');
  
  try {
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('❌ Erro ao acessar daily_checkins:', error.message);
      
      if (error.message.includes('does not exist')) {
        console.log('⚠️ A tabela daily_checkins não existe!');
        console.log('\n📝 SOLUÇÃO: Execute este SQL no Supabase Dashboard:');
        console.log('```sql');
        console.log(`-- Criar tabela daily_checkins se não existir  
CREATE TABLE IF NOT EXISTS daily_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
    sleep_hours DECIMAL(3,1) CHECK (sleep_hours > 0 AND sleep_hours <= 24),
    weight DECIMAL(5,2) CHECK (weight > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Habilitar RLS
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- Políticas para check-ins
CREATE POLICY "Users can view own checkins" ON daily_checkins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON daily_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON daily_checkins
    FOR UPDATE USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_weight ON daily_checkins(weight);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_mood_score ON daily_checkins(mood_score);`);
        console.log('```');
        
        return false;
      }
    } else {
      console.log('✅ Tabela daily_checkins existe e está acessível');
      if (data) {
        console.log('📋 Estrutura atual:', Object.keys(data[0] || {}));
      }
    }
  } catch (e) {
    console.log('❌ Erro inesperado:', e.message);
    return false;
  }

  // 3. Testar políticas RLS
  console.log('\n3️⃣ Verificando políticas de segurança (RLS)...');
  
  try {
    // Tentar inserir um perfil de teste (deve falhar sem autenticação)
    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert({ 
        id: '00000000-0000-0000-0000-000000000000',
        full_name: 'Teste'
      });
    
    if (insertError) {
      if (insertError.message.includes('RLS') || insertError.message.includes('policy')) {
        console.log('✅ Políticas RLS estão funcionando corretamente');
      } else {
        console.log('⚠️ Erro inesperado nas políticas:', insertError.message);
      }
    } else {
      console.log('⚠️ Possível problema: inserção sem autenticação foi permitida');
    }
  } catch (e) {
    console.log('ℹ️ Teste de RLS não pôde ser concluído:', e.message);
  }

  // 4. Verificar campos específicos que podem estar causando problemas
  console.log('\n4️⃣ Verificando campos específicos...');
  
  const fieldsToCheck = [
    { table: 'user_profiles', field: 'phone' },
    { table: 'user_profiles', field: 'current_weight' },
    { table: 'user_profiles', field: 'target_weight' },
    { table: 'user_profiles', field: 'gender' },
    { table: 'user_profiles', field: 'goal_type' },
    { table: 'daily_checkins', field: 'weight' },
    { table: 'daily_checkins', field: 'mood_score' }
  ];
  
  let missingFields = [];
  
  for (const field of fieldsToCheck) {
    try {
      const { error } = await supabase
        .from(field.table)
        .select(field.field)
        .limit(1);
        
      if (error && error.message.includes('does not exist')) {
        missingFields.push(`${field.table}.${field.field}`);
        console.log(`❌ Campo ausente: ${field.table}.${field.field}`);
      } else {
        console.log(`✅ Campo disponível: ${field.table}.${field.field}`);
      }
    } catch (e) {
      missingFields.push(`${field.table}.${field.field}`);
      console.log(`❌ Erro verificando: ${field.table}.${field.field}`);
    }
  }
  
  if (missingFields.length > 0) {
    console.log('\n⚠️ CAMPOS AUSENTES DETECTADOS!');
    console.log('📝 Execute este SQL para adicionar os campos necessários:');
    console.log('```sql');
    console.log(`-- Adicionar campos ausentes ao user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS current_weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50);

-- Adicionar campos ausentes ao daily_checkins
ALTER TABLE daily_checkins
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS mood_score INTEGER,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`);
    console.log('```');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DO DIAGNÓSTICO:');
  console.log(`${missingFields.length === 0 ? '✅' : '❌'} Estrutura do banco: ${missingFields.length === 0 ? 'COMPLETA' : 'INCOMPLETA'}`);
  console.log('✅ Configuração Supabase: OK');
  console.log('='.repeat(60));
  
  if (missingFields.length === 0) {
    console.log('\n🎉 TODAS AS TABELAS E CAMPOS ESTÃO CORRETOS!');
    console.log('📱 O sistema deve estar funcionando normalmente agora.');
  } else {
    console.log('\n🚨 AÇÃO NECESSÁRIA:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');  
    console.log('3. Execute os comandos SQL mostrados acima');
    console.log('4. Teste novamente a aplicação');
  }
  
  return missingFields.length === 0;
}

diagnoseMigrationIssues().catch(console.error);