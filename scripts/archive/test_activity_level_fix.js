import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 TESTANDO CORREÇÃO DO ACTIVITY_LEVEL E GOAL_TYPE\\n');

async function testActivityLevelFix() {
  console.log('1️⃣ Verificando se as constraints foram aplicadas...');
  
  try {
    // Verificar estrutura da tabela
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(0);
      
    if (tableError) {
      console.log('❌ Erro ao acessar tabela:', tableError.message);
      return;
    }
    
    console.log('✅ Tabela user_profiles acessível');
    
    // Verificar se há sessão ativa
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      console.log('⚠️ Nenhum usuário logado - testando constraints apenas');
      
      // Testar se as constraints estão funcionando
      console.log('\\n2️⃣ Testando constraints (deve falhar por RLS, não por constraint)...');
      
      const testData = {
        id: '00000000-0000-0000-0000-000000000000',
        full_name: 'Test User',
        activity_level: 'moderate', // valor correto
        goal_type: 'lose_weight' // valor correto
      };
      
      const { error } = await supabase
        .from('user_profiles')
        .insert(testData);
        
      if (error) {
        if (error.message.includes('RLS') || error.message.includes('policy') || error.code === '42501') {
          console.log('✅ RLS funcionando (esperado) - constraints provavelmente OK');
        } else if (error.message.includes('constraint') || error.message.includes('violates')) {
          console.log('❌ Problema de constraint:', error.message);
        } else {
          console.log('ℹ️ Outro erro:', error.message);
        }
      } else {
        console.log('⚠️ Inserção permitida - verificar RLS');
      }
      
    } else {
      console.log('✅ Usuário logado:', session.session.user.email);
      const userId = session.session.user.id;
      
      console.log('\\n2️⃣ Testando salvamento com valores corretos...');
      
      // Testar com valores corretos
      const correctData = {
        id: userId,
        full_name: 'Teste Activity Level Fix',
        activity_level: 'moderate',
        goal_type: 'lose_weight',
        age: 30,
        height: 175,
        current_weight: 75.5,
        target_weight: 70.0,
        gender: 'masculino',
        updated_at: new Date().toISOString()
      };
      
      const { data: result1, error: error1 } = await supabase
        .from('user_profiles')
        .upsert(correctData)
        .select();
        
      if (error1) {
        console.log('❌ Erro com valores corretos:', error1.message);
        console.log('🔍 Código:', error1.code);
        console.log('🔍 Detalhes:', error1.details);
      } else {
        console.log('✅ Salvamento com valores corretos OK!');
        console.log('📊 Dados salvos:', {
          activity_level: result1[0]?.activity_level,
          goal_type: result1[0]?.goal_type
        });
      }
      
      console.log('\\n3️⃣ Testando salvamento com valores em PT-BR (deve normalizar)...');
      
      // Testar com a função safe_upsert se existe
      const { data: safeResult, error: safeError } = await supabase
        .rpc('safe_upsert_user_profile', {
          p_user_id: userId,
          p_full_name: 'Teste Normalização',
          p_activity_level: 'moderadamente ativo', // PT-BR
          p_goal_type: 'perder peso', // PT-BR
          p_age: 25,
          p_height: 170
        });
        
      if (safeError) {
        if (safeError.message.includes('does not exist')) {
          console.log('⚠️ Função safe_upsert não existe - execute a migração SQL primeiro');
        } else {
          console.log('❌ Erro na função safe:', safeError.message);
        }
      } else {
        console.log('✅ Normalização funcionando!');
        console.log('📊 Valores normalizados:', {
          activity_level: safeResult?.activity_level,
          goal_type: safeResult?.goal_type
        });
      }
    }
    
  } catch (e) {
    console.log('❌ Erro inesperado:', e.message);
  }
  
  console.log('\\n' + '='.repeat(60));
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('1. 🗄️ Execute ACTIVITY_LEVEL_CONSTRAINT_FIX.sql no Supabase');
  console.log('2. 🔄 Recarregue a aplicação (Ctrl+F5)');
  console.log('3. 🧪 Teste salvamento no /dashboard?tab=profile');
  console.log('4. 🎯 Selecione "Moderadamente Ativo" e "Perder Peso"');
  console.log('5. 💾 Clique "Salvar" - deve retornar 200 (não 400)');
  
  console.log('\\n🔗 LINKS ÚTEIS:');
  console.log('📊 SQL Editor: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/sql/new');
  console.log('🛠️ Dashboard: https://5173-i980bncctri6yqqpcxtrd-6532622b.e2b.dev/dashboard?tab=profile');
}

testActivityLevelFix().catch(console.error);