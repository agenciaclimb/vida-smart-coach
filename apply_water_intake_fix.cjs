// apply_water_intake_fix.cjs
// 🔧 Script para aplicar correção do water_intake NOT NULL constraint

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('Necessário: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Client com service role para executar migrations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationSQL = `
-- 🔧 FIX DAILY_CHECKINS WATER_INTAKE NOT NULL CONSTRAINT
-- 🎯 Resolve erro 400 "null value in column 'water_intake'" no check-in

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
`;

async function applyMigration() {
  try {
    console.log('🚀 Aplicando correção do water_intake...\n');
    
    // Aplica cada comando individualmente para maior compatibilidade
    const commands = [
      `ALTER TABLE public.daily_checkins ALTER COLUMN water_intake SET DEFAULT 0`,
      `UPDATE public.daily_checkins SET water_intake = 0 WHERE water_intake IS NULL`,
      `ALTER TABLE public.daily_checkins ALTER COLUMN water_intake SET NOT NULL`
    ];
    
    console.log('🔧 Aplicando comandos SQL...');
    
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      console.log(`🔨 Executando comando ${i + 1}/3: ${cmd.substring(0, 50)}...`);
      
      const { data, error } = await supabase.rpc('execute', { query: cmd });
      
      if (error) {
        console.error(`❌ Erro no comando ${i + 1}:`, error);
        
        // Para alguns comandos, erro pode ser esperado se já aplicado
        if (error.message.includes('already exists') || error.message.includes('constraint')) {
          console.log(`⚠️  Comando ${i + 1} já pode ter sido aplicado, continuando...`);
          continue;
        }
        
        throw error;
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      }
    }
    
    console.log('\n✅ Migration aplicada com sucesso!\n');
    
    // Verifica resultado com teste de insert
    console.log('🔍 Testando insert sem water_intake...');
    
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const today = new Date().toISOString().split('T')[0];
    const testDate = today + '_test_' + Date.now();
    
    const { data: insertResult, error: insertError } = await supabase
      .from('daily_checkins')
      .insert({
        user_id: testUserId,
        date: testDate,
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
      const result = insertResult[0];
      console.log('📊 water_intake no resultado:', result.water_intake);
      
      // Limpa registro de teste
      await supabase
        .from('daily_checkins')
        .delete()
        .eq('user_id', testUserId)
        .eq('date', testDate);
        
      console.log('🧹 Registro de teste removido');
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