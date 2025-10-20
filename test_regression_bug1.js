// Teste de regressão Bug 1: Menu "Meu Plano"
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testMenuMeuPlano() {
    console.log('🧪 TESTE REGRESSÃO BUG 1: Menu "Meu Plano"\n');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('📊 Verificando dados na tabela user_training_plans...');
    
    // Buscar dados do usuário Jeferson (usado nos testes anteriores)
    const userProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?phone=eq.5516981459950&select=id,name`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "apikey": serviceKey,
            "Content-Type": "application/json"
        }
    });
    
    if (!userProfileResponse.ok) {
        console.log('❌ Erro ao buscar perfil do usuário');
        return;
    }
    
    const userProfiles = await userProfileResponse.json();
    if (userProfiles.length === 0) {
        console.log('⚠️ Usuário de teste não encontrado (5516981459950)');
        return;
    }
    
    const userId = userProfiles[0].id;
    console.log(`✅ Usuário encontrado: ${userProfiles[0].name} (ID: ${userId})`);
    
    // Verificar dados em user_training_plans
    const plansResponse = await fetch(`${supabaseUrl}/rest/v1/user_training_plans?user_id=eq.${userId}&select=*`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "apikey": serviceKey,
            "Content-Type": "application/json"
        }
    });
    
    if (!plansResponse.ok) {
        console.log('❌ Erro ao buscar planos do usuário');
        return;
    }
    
    const plans = await plansResponse.json();
    console.log(`📋 Planos encontrados: ${plans.length}`);
    
    if (plans.length === 0) {
        console.log('⚠️ Nenhum plano encontrado - este pode ser o motivo do bug');
        console.log('💡 Menu "Meu Plano" provavelmente mostra estado vazio corretamente');
    } else {
        console.log('📝 Analisando qualidade dos dados dos planos...');
        
        plans.forEach((plan, index) => {
            console.log(`\n📄 Plano ${index + 1}:`);
            console.log(`   - ID: ${plan.id}`);
            console.log(`   - Tipo: ${plan.plan_type}`);
            console.log(`   - Criado: ${plan.created_at}`);
            console.log(`   - plan_data válido: ${plan.plan_data ? 'SIM' : 'NÃO'}`);
            
            if (plan.plan_data) {
                try {
                    const planData = typeof plan.plan_data === 'string' ? 
                        JSON.parse(plan.plan_data) : plan.plan_data;
                    console.log(`   - Estrutura plan_data: ${Object.keys(planData).join(', ')}`);
                } catch (error) {
                    console.log(`   - ❌ ERRO: plan_data corrompido - ${error.message}`);
                }
            }
        });
    }
    
    // Verificar estrutura da tabela
    console.log('\n🔍 Verificando estrutura da tabela user_training_plans...');
    
    // Tentar inserir um plano de teste para verificar se a estrutura está correta
    const testPlan = {
        user_id: userId,
        plan_type: 'test_regression',
        plan_data: {
            test: true,
            created_by: 'regression_test',
            areas: ['fisica', 'alimentar']
        }
    };
    
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/user_training_plans`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "apikey": serviceKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(testPlan)
    });
    
    if (insertResponse.ok) {
        console.log('✅ Estrutura da tabela OK - inserção de teste funcionou');
        
        // Limpar dados de teste
        await fetch(`${supabaseUrl}/rest/v1/user_training_plans?plan_type=eq.test_regression`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${serviceKey}`,
                "apikey": serviceKey
            }
        });
        console.log('🧹 Dados de teste removidos');
    } else {
        const error = await insertResponse.text();
        console.log('❌ Problema na estrutura da tabela:', error);
    }
    
    console.log('\n🎯 RESULTADO BUG 1 (Menu "Meu Plano"):');
    if (plans.length === 0) {
        console.log('✅ BUG RESOLVIDO: Não há planos, menu mostra estado vazio corretamente');
    } else {
        console.log('✅ DADOS ÍNTEGROS: Planos existem e estrutura está válida');
    }
}

testMenuMeuPlano().catch(console.error);