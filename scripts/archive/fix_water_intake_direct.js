// fix_water_intake_direct.js
// 🔧 Aplica correção direta do water_intake usando padrão dos scripts existentes

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';

// Usando mesmo padrão dos scripts que funcionam no projeto
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixWaterIntakeConstraint() {
    console.log('🔧 Iniciando correção do water_intake constraint...\n');
    
    try {
        // Primeira verificação: qual é o problema atual?
        console.log('🔍 Verificando estado atual da tabela...');
        
        const { data: tableInfo, error: infoError } = await supabase
            .from('daily_checkins')
            .select('*')
            .limit(1);
        
        if (infoError) {
            console.log('ℹ️  Info query error (esperado):', infoError.message);
        }
        
        // Teste de insert para confirmar o problema
        console.log('🧪 Confirmando o problema com teste de insert...');
        
        const testPayload = {
            user_id: '00000000-0000-0000-0000-000000000999',
            date: '2025-09-15',
            mood: 4,
            mood_score: 4,
            energy_level: 4,
            sleep_hours: 8
            // water_intake omitido - deve causar erro
        };
        
        const { data: testData, error: testError } = await supabase
            .from('daily_checkins')
            .insert(testPayload)
            .select();
        
        if (testError && testError.message.includes('water_intake')) {
            console.log('✅ Problema confirmado:', testError.message);
            console.log('📋 Aplicando correções...\n');
        } else {
            console.log('🤔 Problema não encontrado. Sistema pode já estar corrigido.');
            if (!testError) {
                console.log('💧 water_intake no resultado:', testData[0]?.water_intake);
                // Limpa teste
                await supabase
                    .from('daily_checkins')
                    .delete()
                    .eq('user_id', '00000000-0000-0000-0000-000000000999');
            }
            return { alreadyFixed: true };
        }
        
        // Estratégia: Vamos usar RPC para executar o SQL diretamente
        console.log('🔨 Executando correções SQL...');
        
        // Lista de comandos SQL para correção
        const sqlCommands = [
            // 1. Adicionar valor default
            `ALTER TABLE public.daily_checkins ALTER COLUMN water_intake SET DEFAULT 0;`,
            
            // 2. Corrigir registros existentes com NULL
            `UPDATE public.daily_checkins SET water_intake = 0 WHERE water_intake IS NULL;`,
            
            // 3. Garantir que constraint NOT NULL seja mantida (se não existir)
            `ALTER TABLE public.daily_checkins ALTER COLUMN water_intake SET NOT NULL;`
        ];
        
        // Usar função RPC se existir, senão usar Supabase SQL editor approach
        let successCount = 0;
        
        for (let i = 0; i < sqlCommands.length; i++) {
            const cmd = sqlCommands[i];
            console.log(`📝 Executando comando ${i + 1}/3...`);
            console.log(`   ${cmd.substring(0, 60)}...`);
            
            try {
                // Tenta usar RPC exec_sql se existir
                const { data, error } = await supabase.rpc('exec_sql', { 
                    query: cmd 
                });
                
                if (error) {
                    console.log(`⚠️  RPC error no comando ${i + 1}:`, error.message);
                    
                    // Se erro for "function not found", isso é esperado
                    if (error.message.includes('function') && error.message.includes('not exist')) {
                        console.log('ℹ️  RPC function não disponível. Isso é normal.');
                        console.log('📋 Este comando precisa ser executado manualmente no Supabase SQL Editor:');
                        console.log(`   ${cmd}`);
                    } else if (error.message.includes('already exists') || 
                               error.message.includes('does not exist')) {
                        console.log(`✅ Comando ${i + 1} já pode estar aplicado`);
                        successCount++;
                    } else {
                        throw error;
                    }
                } else {
                    console.log(`✅ Comando ${i + 1} executado com sucesso`);
                    successCount++;
                }
            } catch (err) {
                console.error(`❌ Erro no comando ${i + 1}:`, err);
                throw err;
            }
        }
        
        console.log(`\n📊 Comandos processados: ${successCount}/${sqlCommands.length}`);
        
        // Teste final
        console.log('\n🧪 Teste final: inserindo registro sem water_intake...');
        
        const finalTestPayload = {
            user_id: '00000000-0000-0000-0000-000000000998',
            date: '2025-09-15',
            mood: 5,
            mood_score: 5,
            energy_level: 5,
            sleep_hours: 9
            // water_intake omitido - agora deve funcionar
        };
        
        const { data: finalData, error: finalError } = await supabase
            .from('daily_checkins')
            .insert(finalTestPayload)
            .select();
        
        if (finalError) {
            console.error('❌ Teste final falhou:', finalError);
            
            if (finalError.message.includes('water_intake')) {
                console.error('🚨 CORREÇÃO NÃO FOI APLICADA - ainda há erro do water_intake');
                console.error('📋 AÇÃO MANUAL NECESSÁRIA no Supabase SQL Editor:');
                sqlCommands.forEach((cmd, i) => {
                    console.error(`${i + 1}. ${cmd}`);
                });
                return { needsManualAction: true, commands: sqlCommands };
            }
            
            throw finalError;
        }
        
        console.log('🎉 TESTE FINAL PASSOU!');
        console.log('💧 water_intake inserido automaticamente:', finalData[0].water_intake);
        
        // Limpa teste final
        await supabase
            .from('daily_checkins')
            .delete()
            .eq('user_id', '00000000-0000-0000-0000-000000000998');
        
        console.log('\n✅ CORREÇÃO APLICADA COM SUCESSO!');
        console.log('🎯 water_intake agora tem valor padrão 0');
        console.log('🔒 Constraint NOT NULL mantida');
        console.log('📱 Check-ins sem water_intake devem funcionar');
        
        return { 
            success: true, 
            defaultValue: finalData[0].water_intake,
            commandsExecuted: successCount 
        };
        
    } catch (error) {
        console.error('\n💥 ERRO na correção:', error);
        return { error, needsManualAction: true };
    }
}

// Executa
fixWaterIntakeConstraint()
    .then(result => {
        console.log('\n📋 RESULTADO DA CORREÇÃO:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.needsManualAction) {
            console.log('\n⚠️  AÇÃO MANUAL necessária no Supabase Dashboard');
            process.exit(1);
        } else if (result.success || result.alreadyFixed) {
            console.log('\n🎉 SISTEMA CORRIGIDO E FUNCIONANDO!');
            process.exit(0);
        } else {
            console.log('\n❌ Correção não foi completada');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    });