// test_water_intake_issue.js
// 🧪 Testa se o issue do water_intake NOT NULL ainda existe

import { createClient } from '@supabase/supabase-js';
import { buildDailyCheckinPayload, validateCheckinInput } from './src/utils/checkinHelpers.js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWaterIntakeIssue() {
    console.log('🧪 Testando issue do water_intake NOT NULL...\n');
    
    try {
        // Simula dados de check-in SEM water_intake
        const mockInput = {
            mood: 4,
            sleep_hours: 8,
            weight: 75.5
            // water_intake omitido propositalmente
        };
        
        console.log('📝 Dados de entrada (sem water_intake):', mockInput);
        
        // Testa validação
        const validation = validateCheckinInput(mockInput);
        console.log('✅ Validação:', validation);
        
        // Testa construção do payload
        const testUserId = '00000000-0000-0000-0000-000000000001';
        const payload = buildDailyCheckinPayload(testUserId, mockInput);
        
        console.log('🔍 Payload construído:', {
            user_id: payload.user_id,
            date: payload.date,
            water_intake: payload.water_intake,
            mood: payload.mood,
            sleep_hours: payload.sleep_hours,
            weight: payload.weight
        });
        
        // Testa insert no Supabase (pode dar erro se migration não foi aplicada)
        console.log('\n🎯 Testando insert no Supabase...');
        
        // Adiciona timestamp para evitar conflitos
        const testDate = payload.date + '_test_' + Date.now();
        const testPayload = { ...payload, date: testDate };
        
        const { data, error } = await supabase
            .from('daily_checkins')
            .insert(testPayload)
            .select();
        
        if (error) {
            console.error('❌ ERRO no insert:', error);
            
            if (error.message.includes('water_intake')) {
                console.error('\n🚨 CONFIRMADO: Problema do water_intake NOT NULL ainda existe!');
                console.error('📋 Necessário aplicar migration para resolver');
                return { hasIssue: true, error };
            } else {
                console.error('🤔 Erro diferente:', error.message);
                return { hasIssue: false, otherError: error };
            }
        } else {
            console.log('✅ INSERT bem-sucedido!');
            console.log('📊 Resultado:', data[0]);
            console.log('💧 water_intake no banco:', data[0].water_intake);
            
            // Limpa registro de teste
            await supabase
                .from('daily_checkins')
                .delete()
                .eq('user_id', testUserId)
                .eq('date', testDate);
            
            console.log('🧹 Registro de teste removido');
            console.log('\n🎉 Sem problemas! Migration pode já estar aplicada');
            
            return { hasIssue: false, success: true, data: data[0] };
        }
        
    } catch (error) {
        console.error('💥 Erro inesperado:', error);
        return { hasIssue: true, unexpectedError: error };
    }
}

// Executa teste
testWaterIntakeIssue()
    .then(result => {
        console.log('\n📋 RESULTADO DO TESTE:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.hasIssue) {
            console.log('\n⚠️  AÇÃO NECESSÁRIA: Aplicar migration do water_intake');
            process.exit(1);
        } else {
            console.log('\n✅ TUDO OK: Sistema funcionando corretamente');
            process.exit(0);
        }
    })
    .catch(error => {
        console.error('💥 Erro fatal no teste:', error);
        process.exit(1);
    });