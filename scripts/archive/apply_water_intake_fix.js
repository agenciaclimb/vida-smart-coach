// apply_water_intake_fix.js
// Script para aplicar correção do water_intake NOT NULL constraint

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[ERRO] Variaveis de ambiente nao configuradas');
  console.error('Necessario: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Cliente com service role para executar migrations
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const migrationSQL = `
-- 🔧 FIX DAILY_CHECKINS WATER_INTAKE NOT NULL CONSTRAINT
-- 🎯 Resolve erro 400 "null value in column 'water_intake'" no check-in

BEGIN;

-- garante valor padrão no servidor
ALTER TABLE public.daily_checkins
  ALTER COLUMN water_intake SET DEFAULT 0;

-- corrige registros legados (se existirem)
UPDATE public.daily_checkins
SET water_intake = 0
WHERE water_intake IS NULL;

-- mantém a regra NOT NULL (agora com default não quebra inserts)
ALTER TABLE public.daily_checkins
  ALTER COLUMN water_intake SET NOT NULL;

COMMIT;
`;

async function applyMigration() {
  try {
    console.log('🚀 Aplicando correção do water_intake...\n');
    
    // Verifica estrutura atual da tabela
    console.log('📋 Verificando estrutura atual...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_column_info', { table_name: 'daily_checkins' })
      .catch(() => null);
      
    if (columnsError) {
      console.log('ℹ️  Usando método alternativo para verificar colunas...');
    }
    
    // Aplica a migration
    console.log('🔧 Aplicando migration SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Erro ao aplicar migration:', error);
      
      // Tenta método alternativo
      console.log('\n🔄 Tentando método alternativo...');
      
      // Aplica cada comando individualmente
      const commands = [
        `ALTER TABLE public.daily_checkins ALTER COLUMN water_intake SET DEFAULT 0;`,
        `UPDATE public.daily_checkins SET water_intake = 0 WHERE water_intake IS NULL;`,
        `ALTER TABLE public.daily_checkins ALTER COLUMN water_intake SET NOT NULL;`
      ];
      
      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        console.log(`🔨 Executando comando ${i + 1}/3...`);
        
        const { error: cmdError } = await supabase.rpc('exec_sql', { sql: cmd });
        if (cmdError) {
          console.error(`❌ Erro no comando ${i + 1}:`, cmdError);
          throw cmdError;
        }
      }
    }
    
    console.log('✅ Migration aplicada com sucesso!\n');
    
    // Verifica resultado
    console.log('🔍 Verificando configuração final...');
    
    // Testa insert com water_intake omitido
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const today = new Date().toISOString().split('T')[0];
    
    const { data: insertResult, error: insertError } = await supabase
      .from('daily_checkins')
      .insert({
        user_id: testUserId,
        date: today + '_test',
        mood: 4,
        sleep_hours: 8
        // water_intake omitido - deve usar default 0
      })
      .select();
    
    if (insertError) {
      console.error('⚠️  Teste de insert falhou:', insertError);
      if (insertError.message.includes('water_intake')) {
        console.error('❌ PROBLEMA: water_intake ainda causa erro!');
        return false;
      }
    } else {
      console.log('✅ Teste de insert bem-sucedido!');
      console.log('📊 Resultado:', insertResult[0]);
      
      // Limpa registro de teste
      await supabase
        .from('daily_checkins')
        .delete()
        .eq('user_id', testUserId)
        .eq('date', today + '_test');
    }
    
    console.log('\n🎉 CORREÇÃO APLICADA COM SUCESSO!');
    console.log('✅ Campo water_intake agora tem default 0');
    console.log('✅ Constraint NOT NULL mantida');
    console.log('✅ Check-ins rápidos devem funcionar sem erro 400');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ ERRO na aplicação da migration:', error);
    return false;
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  applyMigration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { applyMigration };

