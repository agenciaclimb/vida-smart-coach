// test_water_intake_simple.js
// 🧪 Testa o issue do water_intake NOT NULL de forma simples

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWaterIntakeDefault() {
    console.log('🧪 Testando se water_intake tem valor padrão...\n');
    
    // Generate valid UUIDs for testing
    const testUserId1 = '00000000-0000-0000-0000-000000000001';
    const testUserId2 = '00000000-0000-0000-0000-000000000002';
    const today = new Date().toISOString().split('T')[0];
    const testDate = today;
    
    try {
        // Teste 1: Insert SEM water_intake (deve usar default)
        console.log('🔍 Teste 1: Insert sem water_intake...');
        
        const payloadSemWater = {
            user_id: testUserId1,
            date: testDate,
            mood: 4,
            mood_score: 4,
            energy_level: 4,
            sleep_hours: 8,
            weight: 75.5
            // water_intake omitido - deve usar default 0
        };
        
        console.log('📝 Payload:', payloadSemWater);
        
        const { data: resultSem, error: errorSem } = await supabase
            .from('daily_checkins')
            .insert(payloadSemWater)
            .select();
        
        if (errorSem) {
            console.error('❌ ERRO no insert sem water_intake:', errorSem);
            
            if (errorSem.message.includes('water_intake') && errorSem.message.includes('null')) {
                console.error('🚨 CONFIRMADO: water_intake NOT NULL constraint ainda está causando erro!');
                console.error('📋 MIGRATION NECESSÁRIA');
                return { needsMigration: true, error: errorSem };
            }
            
            throw errorSem;
        }
        
        console.log('✅ Sucesso! water_intake no resultado:', resultSem[0].water_intake);
        
        // Limpa teste 1
        await supabase
            .from('daily_checkins')
            .delete()
            .eq('user_id', testUserId1)
            .eq('date', testDate);
        
        // Teste 2: Insert COM water_intake explícito
        console.log('\n🔍 Teste 2: Insert com water_intake explícito...');
        
        const payloadComWater = {
            user_id: testUserId2,
            date: testDate,
            mood: 3,
            mood_score: 3,
            energy_level: 3,
            sleep_hours: 7,
            water_intake: 2500
        };
        
        const { data: resultCom, error: errorCom } = await supabase
            .from('daily_checkins')
            .insert(payloadComWater)
            .select();
        
        if (errorCom) {
            console.error('❌ Erro no teste 2:', errorCom);
            throw errorCom;
        }
        
        console.log('✅ Sucesso! water_intake explícito:', resultCom[0].water_intake);
        
        // Limpa teste 2
        await supabase
            .from('daily_checkins')
            .delete()
            .eq('user_id', testUserId2)
            .eq('date', testDate);
        
        console.log('\n🎉 TODOS OS TESTES PASSARAM!');
        console.log('✅ water_intake com default funciona');
        console.log('✅ water_intake explícito funciona');
        console.log('🔧 Migration pode já estar aplicada ou não é necessária');
        
        return { 
            needsMigration: false, 
            defaultWorks: true,
            explicitWorks: true,
            defaultValue: resultSem[0].water_intake,
            explicitValue: resultCom[0].water_intake
        };
        
    } catch (error) {
        console.error('💥 Erro no teste:', error);
        return { needsMigration: true, error };
    }
}

// Executa
testWaterIntakeDefault()
    .then(result => {
        console.log('\n📋 RESULTADO:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.needsMigration) {
            console.log('\n⚠️  AÇÃO: Migration necessária');
            process.exit(1);
        } else {
            console.log('\n✅ TUDO OK: Sistema funcionando');
            process.exit(0);
        }
    })
    .catch(error => {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    });