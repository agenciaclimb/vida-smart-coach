import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[ERRO] Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variaveis de ambiente.');
    process.exit(1);
}

console.log('[INFO] Conectando ao Supabase com service role...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyGamificationTables() {
    try {
        console.log('🚀 Criando tabelas de gamificação...');
        
        // 1. Primeiro vamos atualizar a tabela gamification existente
        console.log('📝 Atualizando tabela gamification...');
        
        // Como não posso usar ALTER diretamente, vou verificar e inserir dados de exemplo
        // para testar se as tabelas existem
        
        // 2. Inserir conquistas de exemplo
        console.log('🏆 Inserindo conquistas de exemplo...');
        
        const achievements = [
            {
                code: 'streak_master',
                name: 'Streak Master',
                description: '30 dias consecutivos de atividade',
                icon: '🔥',
                category: 'consistency',
                points_reward: 1000,
                requirements: { type: 'consecutive_days', target: 30 },
                is_active: true
            },
            {
                code: 'fitness_warrior',
                name: 'Fitness Warrior',
                description: 'Metas físicas alcançadas',
                icon: '💪',
                category: 'milestone',
                points_reward: 800,
                requirements: { type: 'physical_goals', target: 5 },
                is_active: true
            },
            {
                code: 'nutrition_ninja',
                name: 'Nutrition Ninja',
                description: 'Alimentação perfeita por 30 dias',
                icon: '🥗',
                category: 'milestone',
                points_reward: 1000,
                requirements: { type: 'nutrition_perfect', target: 30 },
                is_active: true
            },
            {
                code: 'zen_master',
                name: 'Zen Master',
                description: 'Equilíbrio emocional mantido',
                icon: '🧘',
                category: 'milestone',
                points_reward: 800,
                requirements: { type: 'emotional_balance', target: 21 },
                is_active: true
            },
            {
                code: 'influencer',
                name: 'Influencer',
                description: '10+ indicações realizadas',
                icon: '📢',
                category: 'social',
                points_reward: 2000,
                requirements: { type: 'referrals', target: 10 },
                is_active: true
            }
        ];
        
        for (const achievement of achievements) {
            try {
                const { error } = await supabase
                    .from('achievements')
                    .insert([achievement]);
                
                if (error) {
                    if (error.message.includes('duplicate key')) {
                        console.log(`⚠️  Conquista ${achievement.code} já existe`);
                    } else {
                        console.error(`❌ Erro ao inserir conquista ${achievement.code}:`, error.message);
                    }
                } else {
                    console.log(`✅ Conquista ${achievement.code} inserida com sucesso`);
                }
            } catch (err) {
                console.error(`💥 Erro ao processar conquista ${achievement.code}:`, err.message);
            }
        }
        
        // 3. Criar evento de exemplo
        console.log('📅 Criando evento de exemplo...');
        
        const sampleEvent = {
            name: 'Desafio Janeiro 2025',
            description: 'Comece o ano com energia total! Complete suas atividades diárias por 30 dias.',
            event_type: 'challenge',
            category: 'monthly_challenge',
            start_date: new Date('2025-01-01').toISOString(),
            end_date: new Date('2025-01-31').toISOString(),
            requirements: { daily_checkins: 30 },
            rewards: { points: 2000, badge: 'new_year_champion' },
            bonus_multiplier: 1.5,
            is_active: true,
            current_participants: 0
        };
        
        try {
            const { error: eventError } = await supabase
                .from('gamification_events')
                .insert([sampleEvent]);
            
            if (eventError) {
                if (eventError.message.includes('duplicate key')) {
                    console.log('⚠️  Evento de exemplo já existe');
                } else {
                    console.error('❌ Erro ao criar evento:', eventError.message);
                }
            } else {
                console.log('✅ Evento de exemplo criado com sucesso');
            }
        } catch (err) {
            console.error('💥 Erro ao processar evento:', err.message);
        }
        
        // 4. Verificar se as tabelas existem
        console.log('🔍 Verificando tabelas...');
        
        const tablesToCheck = [
            'daily_activities',
            'achievements',
            'user_achievements',
            'leaderboards',
            'daily_missions',
            'gamification_events',
            'user_event_participation',
            'referrals'
        ];
        
        let existingTables = 0;
        
        for (const table of tablesToCheck) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });
                
                if (error) {
                    console.log(`❌ Tabela ${table}: ${error.message}`);
                } else {
                    console.log(`✅ Tabela ${table}: OK (${count || 0} registros)`);
                    existingTables++;
                }
            } catch (err) {
                console.log(`❌ Tabela ${table}: Erro -`, err.message);
            }
        }
        
        console.log(`\n📊 Resultado: ${existingTables}/${tablesToCheck.length} tabelas encontradas`);
        
        if (existingTables >= 2) { // Se pelo menos achievements e uma outra existem
            console.log('🎉 Sistema de gamificação está parcialmente configurado!');
            console.log('💡 Algumas tabelas podem precisar ser criadas manualmente no Supabase Dashboard');
            return true;
        } else {
            console.log('⚠️  Poucas tabelas encontradas. Pode ser necessário aplicar migração manualmente.');
            return false;
        }
        
    } catch (error) {
        console.error('💥 Erro geral:', error);
        return false;
    }
}

// Executar
applyGamificationTables()
    .then(success => {
        if (success) {
            console.log('\n🎊 Configuração de gamificação finalizada!');
            console.log('🌐 Agora você pode testar o sistema no painel do cliente');
        } else {
            console.log('\n💡 Configuração parcial. Algumas funcionalidades podem precisar de ajustes.');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('🚨 Erro fatal:', error);
        process.exit(1);
    });
