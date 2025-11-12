import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Verificando estado atual do banco de dados...\n');

async function checkStatus() {
  try {
    // Verificar tabela rewards
    const { data: rewardsData, error: rewardsError } = await supabase
      .from('rewards')
      .select('count')
      .limit(1);

    if (rewardsError) {
      if (rewardsError.message.includes('does not exist')) {
        console.log('❌ Tabela rewards: NÃO EXISTE (precisa criar)');
      } else {
        console.log('⚠️  Tabela rewards: Erro -', rewardsError.message);
      }
    } else {
      console.log('✅ Tabela rewards: EXISTE');
    }

    // Verificar tabela reward_redemptions
    const { data: redemptionsData, error: redemptionsError } = await supabase
      .from('reward_redemptions')
      .select('count')
      .limit(1);

    if (redemptionsError) {
      if (redemptionsError.message.includes('does not exist')) {
        console.log('❌ Tabela reward_redemptions: NÃO EXISTE (precisa criar)');
      } else {
        console.log('⚠️  Tabela reward_redemptions: Erro -', redemptionsError.message);
      }
    } else {
      console.log('✅ Tabela reward_redemptions: EXISTE');
    }

    // Verificar view v_user_xp_totals
    const { data: xpView, error: xpViewError } = await supabase
      .from('v_user_xp_totals')
      .select('user_id')
      .limit(1);

    if (xpViewError) {
      if (xpViewError.message.includes('does not exist')) {
        console.log('❌ View v_user_xp_totals: NÃO EXISTE (precisa criar)');
      } else {
        console.log('⚠️  View v_user_xp_totals: Erro -', xpViewError.message);
      }
    } else {
      console.log('✅ View v_user_xp_totals: EXISTE');
    }

    // Verificar view v_rewards_catalog
    const { data: catalogView, error: catalogError } = await supabase
      .from('v_rewards_catalog')
      .select('id')
      .limit(1);

    if (catalogError) {
      if (catalogError.message.includes('does not exist')) {
        console.log('❌ View v_rewards_catalog: NÃO EXISTE (precisa criar)');
      } else {
        console.log('⚠️  View v_rewards_catalog: Erro -', catalogError.message);
      }
    } else {
      console.log('✅ View v_rewards_catalog: EXISTE');
      console.log(`   (${catalogView.length} recompensa(s) no catálogo)`);
    }

    console.log('\n📊 RESUMO:');
    const needsMigration = 
      (rewardsError && rewardsError.message.includes('does not exist')) ||
      (redemptionsError && redemptionsError.message.includes('does not exist')) ||
      (xpViewError && xpViewError.message.includes('does not exist')) ||
      (catalogError && catalogError.message.includes('does not exist'));

    if (needsMigration) {
      console.log('⚠️  Migrations PENDENTES - Executar scripts/apply_all_migrations.sql');
      console.log('\n📝 INSTRUÇÕES:');
      console.log('1. Abrir Supabase Dashboard: https://supabase.com/dashboard/project/zzugbgoylwbaojdunuz');
      console.log('2. Ir em SQL Editor');
      console.log('3. Copiar conteúdo de scripts/apply_all_migrations.sql');
      console.log('4. Colar no editor e executar (RUN)');
      console.log('5. Verificar logs e executar este script novamente para validar\n');
    } else {
      console.log('✅ Todas as migrations JÁ APLICADAS!');
      console.log('\n🎉 Sistema pronto para testes E2E!\n');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
  }
}

checkStatus();
