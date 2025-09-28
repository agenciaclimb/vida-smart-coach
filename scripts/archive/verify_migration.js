import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyMigration() {
  console.log('🔍 VERIFICANDO STATUS DA MIGRAÇÃO\n');
  
  const fieldsToCheck = [
    { table: 'user_profiles', field: 'phone', description: 'WhatsApp do cliente' },
    { table: 'user_profiles', field: 'current_weight', description: 'Peso atual' },
    { table: 'user_profiles', field: 'target_weight', description: 'Peso meta' },
    { table: 'user_profiles', field: 'gender', description: 'Gênero' },
    { table: 'user_profiles', field: 'goal_type', description: 'Objetivo principal' },
    { table: 'daily_checkins', field: 'weight', description: 'Peso no check-in' },
    { table: 'daily_checkins', field: 'mood_score', description: 'Score de humor' }
  ];
  
  let successCount = 0;
  let totalCount = fieldsToCheck.length;
  
  console.log('📊 Verificando campos essenciais:\n');
  
  for (const field of fieldsToCheck) {
    try {
      const { error } = await supabase
        .from(field.table)
        .select(field.field)
        .limit(1);
        
      if (!error) {
        console.log(`✅ ${field.table}.${field.field} - ${field.description} - DISPONÍVEL`);
        successCount++;
      } else {
        console.log(`❌ ${field.table}.${field.field} - ${field.description} - FALTANDO`);
      }
    } catch (e) {
      console.log(`❌ ${field.table}.${field.field} - ${field.description} - ERRO: ${e.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📈 RESULTADO: ${successCount}/${totalCount} campos disponíveis`);
  
  if (successCount === totalCount) {
    console.log('🎉 MIGRAÇÃO COMPLETA! TODOS OS CAMPOS ESTÃO DISPONÍVEIS');
    console.log('✅ Agora você pode usar o sistema completo de acompanhamento!');
    console.log('\n📱 Acesse: /dashboard?tab=profile para testar');
  } else {
    console.log('⚠️ MIGRAÇÃO INCOMPLETA - Execute o SQL no Supabase Dashboard');
    console.log('📝 Arquivo: EXECUTE_THIS_SQL.sql');
    console.log('🔗 URL: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/sql/new');
  }
  
  console.log('='.repeat(60));
}

verifyMigration().catch(console.error);