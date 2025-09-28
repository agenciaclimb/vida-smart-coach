import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
    console.log('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTE COMPLETO DA FUNCIONALIDADE DE CHECK-IN DIÁRIO');
console.log('=====================================================');

async function testDailyCheckins() {
    try {
        // 1. Verificar estrutura da tabela
        console.log('\n📋 1. VERIFICANDO ESTRUTURA DA TABELA...');
        const { data: tableInfo, error: tableError } = await supabase
            .from('daily_checkins')
            .select('*')
            .limit(1);
        
        if (tableError) {
            console.error('❌ Erro ao acessar tabela daily_checkins:', tableError.message);
            return false;
        }
        console.log('✅ Tabela daily_checkins acessível');

        // 2. Verificar se há usuários disponíveis
        console.log('\n👥 2. VERIFICANDO USUÁRIOS DISPONÍVEIS...');
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError || !users || users.users.length === 0) {
            console.log('⚠️ Nenhum usuário encontrado. Criando usuário de teste...');
            
            // Tentar criar um usuário de teste
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: 'teste@vidasmartcoach.com',
                password: 'teste123456',
                email_confirm: true
            });
            
            if (createError) {
                console.error('❌ Erro ao criar usuário de teste:', createError.message);
                return false;
            }
            console.log('✅ Usuário de teste criado:', newUser.user.id);
        } else {
            console.log(`✅ ${users.users.length} usuários encontrados`);
        }

        // 3. Obter primeiro usuário para teste
        const { data: firstUser } = await supabase.auth.admin.listUsers();
        const testUserId = firstUser.users[0].id;
        console.log(`🎯 Usando usuário para teste: ${testUserId}`);

        // 4. Testar inserção de check-in
        console.log('\n📝 3. TESTANDO INSERÇÃO DE CHECK-IN...');
        const today = new Date().toISOString().split('T')[0];
        
        const checkinData = {
            user_id: testUserId,
            date: today,
            weight: 75.5,
            mood: 4,
            sleep_hours: 8.0,
            water_glasses: 6,
            exercise_minutes: 30,
            notes: 'Teste de check-in - sistema funcionando!'
        };

        const { data: insertData, error: insertError } = await supabase
            .from('daily_checkins')
            .upsert(checkinData)
            .select();

        if (insertError) {
            console.error('❌ Erro ao inserir check-in:', insertError.message);
            return false;
        }
        console.log('✅ Check-in inserido com sucesso:', insertData[0]);

        // 5. Testar consulta de check-ins
        console.log('\n🔍 4. TESTANDO CONSULTA DE CHECK-INS...');
        const { data: queryData, error: queryError } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('user_id', testUserId)
            .order('date', { ascending: false });

        if (queryError) {
            console.error('❌ Erro ao consultar check-ins:', queryError.message);
            return false;
        }
        console.log(`✅ ${queryData.length} check-ins encontrados para o usuário`);
        console.log('📊 Último check-in:', queryData[0]);

        // 6. Testar atualização
        console.log('\n✏️ 5. TESTANDO ATUALIZAÇÃO DE CHECK-IN...');
        const { data: updateData, error: updateError } = await supabase
            .from('daily_checkins')
            .update({ 
                water_glasses: 8,
                notes: 'Check-in atualizado - teste de update funcionando!'
            })
            .eq('user_id', testUserId)
            .eq('date', today)
            .select();

        if (updateError) {
            console.error('❌ Erro ao atualizar check-in:', updateError.message);
            return false;
        }
        console.log('✅ Check-in atualizado com sucesso:', updateData[0]);

        // 7. Testar estatísticas
        console.log('\n📈 6. TESTANDO ESTATÍSTICAS...');
        const { data: statsData, error: statsError } = await supabase
            .from('daily_checkins')
            .select('water_glasses, exercise_minutes, mood')
            .eq('user_id', testUserId);

        if (statsError) {
            console.error('❌ Erro ao consultar estatísticas:', statsError.message);
            return false;
        }

        const avgWater = statsData.reduce((sum, item) => sum + (item.water_glasses || 0), 0) / statsData.length;
        const avgExercise = statsData.reduce((sum, item) => sum + (item.exercise_minutes || 0), 0) / statsData.length;
        const avgMood = statsData.reduce((sum, item) => sum + (item.mood || 0), 0) / statsData.length;

        console.log('✅ Estatísticas calculadas:');
        console.log(`   💧 Média de copos de água: ${avgWater.toFixed(1)}`);
        console.log(`   🏃 Média de exercício (min): ${avgExercise.toFixed(1)}`);
        console.log(`   😊 Humor médio: ${avgMood.toFixed(1)}/5`);

        console.log('\n🎉 TODOS OS TESTES PASSARAM!');
        console.log('✅ Funcionalidade de check-in diário está 100% funcional!');
        return true;

    } catch (error) {
        console.error('❌ Erro inesperado durante os testes:', error);
        return false;
    }
}

// Executar testes
testDailyCheckins().then(success => {
    if (success) {
        console.log('\n🎯 RESULTADO FINAL: ✅ SUCESSO TOTAL!');
        console.log('🚀 O sistema de check-in diário está funcionando perfeitamente!');
    } else {
        console.log('\n🎯 RESULTADO FINAL: ❌ FALHAS DETECTADAS');
        console.log('🔧 Ainda há problemas que precisam ser corrigidos');
    }
    process.exit(success ? 0 : 1);
});

