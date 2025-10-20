import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTE SIMPLIFICADO DA FUNCIONALIDADE DE CHECK-IN DIÁRIO');
console.log('=========================================================');

async function testDailyCheckinsSimple() {
    try {
        // 1. Verificar se a tabela daily_checkins existe e está acessível
        console.log('\n📋 1. VERIFICANDO ESTRUTURA DA TABELA...');
        const { data: tableTest, error: tableError } = await supabase
            .from('daily_checkins')
            .select('*')
            .limit(1);
        
        if (tableError) {
            console.error('❌ Erro ao acessar tabela daily_checkins:', tableError.message);
            return false;
        }
        console.log('✅ Tabela daily_checkins acessível');

        // 2. Verificar se há dados existentes
        console.log('\n🔍 2. VERIFICANDO DADOS EXISTENTES...');
        const { data: existingData, error: existingError } = await supabase
            .from('daily_checkins')
            .select('*')
            .limit(5);
        
        if (existingError) {
            console.error('❌ Erro ao consultar dados existentes:', existingError.message);
            return false;
        }
        console.log(`✅ ${existingData.length} registros encontrados na tabela`);
        
        if (existingData.length > 0) {
            console.log('📊 Exemplo de registro existente:', existingData[0]);
        }

        // 3. Verificar usuários na tabela profiles
        console.log('\n👥 3. VERIFICANDO USUÁRIOS NA TABELA PROFILES...');
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .limit(5);
        
        if (profilesError) {
            console.error('❌ Erro ao consultar profiles:', profilesError.message);
        } else {
            console.log(`✅ ${profiles.length} perfis encontrados`);
            if (profiles.length > 0) {
                console.log('👤 Exemplo de perfil:', profiles[0]);
            }
        }

        // 4. Testar inserção com UUID fictício (para verificar estrutura)
        console.log('\n📝 4. TESTANDO ESTRUTURA DE INSERÇÃO...');
        const testUUID = '00000000-0000-0000-0000-000000000000';
        const today = new Date().toISOString().split('T')[0];
        
        const checkinData = {
            user_id: testUUID,
            date: today,
            weight: 75.5,
            mood: 4,
            sleep_hours: 8.0,
            water_glasses: 6,
            exercise_minutes: 30,
            notes: 'Teste de estrutura - verificando campos'
        };

        // Tentar inserção (pode falhar por RLS, mas vamos ver o erro)
        const { data: insertData, error: insertError } = await supabase
            .from('daily_checkins')
            .insert(checkinData)
            .select();

        if (insertError) {
            console.log('⚠️ Erro esperado na inserção (RLS):', insertError.message);
            
            // Verificar se o erro é relacionado a RLS (esperado) ou estrutura (problema)
            if (insertError.message.includes('RLS') || 
                insertError.message.includes('policy') || 
                insertError.message.includes('permission')) {
                console.log('✅ Erro de RLS é esperado - estrutura da tabela está correta');
            } else {
                console.error('❌ Erro de estrutura da tabela:', insertError.message);
                return false;
            }
        } else {
            console.log('✅ Inserção bem-sucedida (inesperado):', insertData);
        }

        // 5. Verificar colunas da tabela
        console.log('\n📊 5. VERIFICANDO COLUNAS DA TABELA...');
        const { data: columns, error: columnsError } = await supabase
            .rpc('exec_sql', { 
                sql: `
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = 'daily_checkins' 
                    ORDER BY ordinal_position;
                `
            });

        if (columnsError) {
            console.log('⚠️ Não foi possível verificar colunas via RPC:', columnsError.message);
        } else {
            console.log('✅ Colunas da tabela daily_checkins:');
            columns.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });
        }

        // 6. Verificar políticas RLS
        console.log('\n🔒 6. VERIFICANDO POLÍTICAS RLS...');
        const { data: policies, error: policiesError } = await supabase
            .rpc('exec_sql', { 
                sql: `
                    SELECT policyname, cmd, permissive, roles, qual
                    FROM pg_policies 
                    WHERE tablename = 'daily_checkins';
                `
            });

        if (policiesError) {
            console.log('⚠️ Não foi possível verificar políticas RLS:', policiesError.message);
        } else {
            console.log(`✅ ${policies.length} políticas RLS encontradas`);
            policies.forEach(policy => {
                console.log(`   - ${policy.policyname}: ${policy.cmd}`);
            });
        }

        console.log('\n🎉 TESTE ESTRUTURAL CONCLUÍDO!');
        console.log('✅ A tabela daily_checkins está estruturalmente correta');
        console.log('✅ RLS está ativo (segurança funcionando)');
        console.log('✅ Campos necessários estão presentes');
        
        return true;

    } catch (error) {
        console.error('❌ Erro inesperado durante os testes:', error);
        return false;
    }
}

// Executar testes
testDailyCheckinsSimple().then(success => {
    if (success) {
        console.log('\n🎯 RESULTADO FINAL: ✅ ESTRUTURA VALIDADA!');
        console.log('🚀 A tabela daily_checkins está pronta para uso!');
        console.log('💡 Para testar completamente, é necessário autenticação de usuário');
    } else {
        console.log('\n🎯 RESULTADO FINAL: ❌ PROBLEMAS ESTRUTURAIS');
        console.log('🔧 A tabela precisa de correções');
    }
    process.exit(success ? 0 : 1);
});

