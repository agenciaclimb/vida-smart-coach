import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 TESTANDO CORREÇÃO SLUG-ONLY\\n');

async function testSlugOnlyFix() {
  console.log('1️⃣ Verificando se o usuário está autenticado...');
  
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      console.log('⚠️ Nenhum usuário logado');
      console.log('📱 Faça login primeiro em: https://5173-i980bncctri6yqqpcxtrd-6532622b.e2b.dev/login');
      return;
    }
    
    const userId = session.session.user.id;
    console.log('✅ Usuário logado:', session.session.user.email);
    
    console.log('\\n2️⃣ Testando salvamento com slugs corretos...');
    
    // Teste com slugs válidos (como o frontend deve enviar)
    const correctSlugPayload = {
      id: userId,
      full_name: 'Teste Slug-Only Fix',
      activity_level: 'moderate',  // ← SLUG correto
      goal_type: 'gain_muscle',    // ← SLUG correto  
      age: 30,
      height: 175,
      current_weight: 75.0,
      target_weight: 80.0,
      gender: 'masculino',
      updated_at: new Date().toISOString()
    };
    
    console.log('🔍 Payload com slugs:', {
      activity_level: correctSlugPayload.activity_level,
      goal_type: correctSlugPayload.goal_type
    });
    
    const { data: result, error } = await supabase
      .from('user_profiles')
      .upsert(correctSlugPayload)
      .select();
      
    if (error) {
      console.log('❌ ERRO com slugs corretos:', error.message);
      console.log('🔍 Código:', error.code);
      console.log('🔍 Detalhes:', error.details);
      
      if (error.message.includes('constraint')) {
        console.log('\\n🚨 PROBLEMA: Constraint ainda não aceita estes valores');
        console.log('📋 Execute primeiro: ACTIVITY_LEVEL_CONSTRAINT_FIX.sql');
      }
    } else {
      console.log('✅ SUCESSO com slugs corretos!');
      console.log('📊 Dados salvos:', {
        activity_level: result[0]?.activity_level,
        goal_type: result[0]?.goal_type
      });
    }
    
    console.log('\\n3️⃣ Testando valores proibidos (devem ser bloqueados pelo constraint)...');
    
    // Teste com valores que devem falhar 
    const invalidPayload = {
      id: userId,
      full_name: 'Teste Valor Inválido',
      activity_level: 'Moderadamente Ativo', // ← PT-BR (deve falhar na constraint)
      goal_type: 'Ganhar Massa Muscular',   // ← PT-BR (deve falhar na constraint)
      updated_at: new Date().toISOString()
    };
    
    console.log('🔍 Payload com PT-BR (deve falhar):', {
      activity_level: invalidPayload.activity_level,
      goal_type: invalidPayload.goal_type
    });
    
    const { error: invalidError } = await supabase
      .from('user_profiles')
      .upsert(invalidPayload);
      
    if (invalidError) {
      if (invalidError.message.includes('constraint') || invalidError.message.includes('check')) {
        console.log('✅ CORRETO: Constraint rejeitou valores PT-BR');
        console.log('ℹ️ Erro esperado:', invalidError.message.substring(0, 100) + '...');
      } else {
        console.log('❌ Erro inesperado:', invalidError.message);
      }
    } else {
      console.log('⚠️ PROBLEMA: Valores PT-BR foram aceitos (constraint não está funcionando)');
    }
    
  } catch (e) {
    console.log('❌ Erro inesperado:', e.message);
  }
  
  console.log('\\n' + '='.repeat(60));
  console.log('📋 TESTE DE ACEITAÇÃO (MANUAL):');
  console.log('1. 🔄 Recarregue /dashboard?tab=profile (Ctrl+F5)');
  console.log('2. 🎯 Selecione "Moderadamente Ativo"'); 
  console.log('3. 🎯 Selecione "Ganhar Massa Muscular"');
  console.log('4. 💾 Clique "Salvar"');
  console.log('5. ✅ Deve aparecer "Perfil atualizado com sucesso!"');
  console.log('6. 🔍 Console deve logar payload com slugs: moderate, gain_muscle');
  
  console.log('\\n🔗 LINKS:');
  console.log('📱 Dashboard: https://5173-i980bncctri6yqqpcxtrd-6532622b.e2b.dev/dashboard?tab=profile');
  console.log('📊 Supabase Logs: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/logs/postgres-logs');
}

testSlugOnlyFix().catch(console.error);