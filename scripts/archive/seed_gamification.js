import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[ERRO] Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variaveis de ambiente.');
    process.exit(1);
}

console.log('[INFO] Inserindo dados iniciais de gamificacao...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedGamificationData() {
    try {
        // 1. Inserir conquistas básicas
        console.log('🏆 Inserindo conquistas...');
        
        const achievements = [
            {
                code: 'streak_master',
                name: 'Streak Master',
                description: '30 dias consecutivos de atividade',
                icon: '🔥',
                category: 'consistency',
                points_reward: 1000,
                requirements: JSON.stringify({ type: 'consecutive_days', target: 30 }),
                is_active: true
            },
            {
                code: 'lightning',
                name: 'Lightning',
                description: '7 dias perfeitos de check-ins',
                icon: '⚡',
                category: 'consistency',
                points_reward: 500,
                requirements: JSON.stringify({ type: 'perfect_week', target: 7 }),
                is_active: true
            },
            {
                code: 'fitness_warrior',
                name: 'Fitness Warrior',
                description: 'Metas físicas alcançadas',
                icon: '💪',
                category: 'milestone',
                points_reward: 800,
                requirements: JSON.stringify({ type: 'physical_goals', target: 5 }),
                is_active: true
            },
            {
                code: 'nutrition_ninja',
                name: 'Nutrition Ninja',
                description: 'Alimentação perfeita por 30 dias',
                icon: '🥗',
                category: 'milestone',
                points_reward: 1000,
                requirements: JSON.stringify({ type: 'nutrition_perfect', target: 30 }),
                is_active: true
            },
            {
                code: 'zen_master',
                name: 'Zen Master',
                description: 'Equilíbrio emocional mantido',
                icon: '🧘',
                category: 'milestone',
                points_reward: 800,
                requirements: JSON.stringify({ type: 'emotional_balance', target: 21 }),
                is_active: true
            }
        ];
        
        const { data: achievementData, error: achievementError } = await supabase
            .from('achievements')
            .upsert(achievements, { onConflict: 'code' })
            .select();
        
        if (achievementError) {
            console.error('❌ Erro ao inserir conquistas:', achievementError);
        } else {
            console.log(`✅ ${achievementData?.length || 0} conquistas inseridas`);
        }
        
        // 2. Inserir evento de exemplo
        console.log('📅 Inserindo evento de exemplo...');
        
        const events = [
            {
                name: 'Desafio Janeiro 2025',
                description: 'Comece o ano com energia total! Complete suas atividades diárias por 30 dias.',
                event_type: 'challenge',
                category: 'monthly_challenge',
                start_date: new Date('2025-01-01T00:00:00Z').toISOString(),
                end_date: new Date('2025-01-31T23:59:59Z').toISOString(),
                requirements: JSON.stringify({ daily_checkins: 30, target_points: 1000 }),
                rewards: JSON.stringify({ points: 2000, badge: 'new_year_champion' }),
                bonus_multiplier: 1.5,
                is_active: true,
                current_participants: 0,
                max_participants: 1000
            }
        ];
        
        const { data: eventData, error: eventError } = await supabase
            .from('gamification_events')
            .upsert(events, { onConflict: 'name' })
            .select();
        
        if (eventError) {
            console.error('❌ Erro ao inserir eventos:', eventError);
        } else {
            console.log(`✅ ${eventData?.length || 0} eventos inseridos`);
        }
        
        // 3. Verificar se há usuários para criar dados de gamificação
        console.log('👤 Verificando usuários existentes...');
        
        const { data: users, error: usersError } = await supabase
            .from('user_profiles')
            .select('id, name, email')
            .limit(5);
            
        if (usersError) {
            console.error('❌ Erro ao buscar usuários:', usersError);
        } else {
            console.log(`👥 Encontrados ${users?.length || 0} usuários`);
            
            // Se houver usuários, criar dados de gamificação de exemplo
            if (users && users.length > 0) {
                for (const user of users) {
                    console.log(`🎮 Criando dados de gamificação para ${user.name}...`);
                    
                    // Verificar se já existe registro de gamificação
                    const { data: existingGam } = await supabase
                        .from('gamification')
                        .select('user_id')
                        .eq('user_id', user.id)
                        .single();
                    
                    if (!existingGam) {
                        // Criar registro de gamificação
                        const { error: gamError } = await supabase
                            .from('gamification')
                            .insert([{
                                user_id: user.id,
                                total_points: 0,
                                current_streak: 0,
                                longest_streak: 0,
                                level: 1,
                                badges: [],
                                physical_points: 0,
                                nutrition_points: 0,
                                emotional_points: 0,
                                spiritual_points: 0
                            }]);
                        
                        if (gamError) {
                            console.error(`❌ Erro ao criar gamificação para ${user.name}:`, gamError);
                        } else {
                            console.log(`✅ Dados de gamificação criados para ${user.name}`);
                        }
                    } else {
                        console.log(`⚠️  ${user.name} já tem dados de gamificação`);
                    }
                    
                    // Criar missões diárias de exemplo
                    const today = new Date().toISOString().split('T')[0];
                    const missions = [
                        {
                            user_id: user.id,
                            mission_date: today,
                            mission_type: 'easy',
                            title: 'Check-in de treino',
                            description: 'Faça seu check-in de treino diário',
                            category: 'physical',
                            target_value: JSON.stringify({ checkin: 1 }),
                            current_progress: JSON.stringify({ checkin: 0 }),
                            points_reward: 10,
                            is_completed: false
                        },
                        {
                            user_id: user.id,
                            mission_date: today,
                            mission_type: 'medium',
                            title: 'Meta de água',
                            description: 'Beba sua meta diária de água',
                            category: 'nutrition',
                            target_value: JSON.stringify({ water_glasses: 8 }),
                            current_progress: JSON.stringify({ water_glasses: 0 }),
                            points_reward: 20,
                            is_completed: false
                        },
                        {
                            user_id: user.id,
                            mission_date: today,
                            mission_type: 'challenging',
                            title: 'Treino completo',
                            description: 'Complete um treino de 30 minutos',
                            category: 'physical',
                            target_value: JSON.stringify({ workout_minutes: 30 }),
                            current_progress: JSON.stringify({ workout_minutes: 0 }),
                            points_reward: 40,
                            is_completed: false
                        }
                    ];
                    
                    const { error: missionsError } = await supabase
                        .from('daily_missions')
                        .upsert(missions, { onConflict: 'user_id,mission_date,mission_type' });
                    
                    if (missionsError) {
                        console.error(`❌ Erro ao criar missões para ${user.name}:`, missionsError);
                    } else {
                        console.log(`✅ Missões diárias criadas para ${user.name}`);
                    }
                }
            }
        }
        
        // 4. Verificar status final
        console.log('\n📊 Status final do sistema de gamificação:');
        
        const { count: achievementsCount } = await supabase
            .from('achievements')
            .select('*', { count: 'exact', head: true });
            
        const { count: eventsCount } = await supabase
            .from('gamification_events')
            .select('*', { count: 'exact', head: true });
            
        const { count: gamificationCount } = await supabase
            .from('gamification')
            .select('*', { count: 'exact', head: true });
            
        const { count: missionsCount } = await supabase
            .from('daily_missions')
            .select('*', { count: 'exact', head: true });
        
        console.log(`🏆 Conquistas: ${achievementsCount || 0}`);
        console.log(`📅 Eventos: ${eventsCount || 0}`);
        console.log(`🎮 Usuários com gamificação: ${gamificationCount || 0}`);
        console.log(`🎯 Missões ativas: ${missionsCount || 0}`);
        
        return true;
        
    } catch (error) {
        console.error('💥 Erro durante seed:', error);
        return false;
    }
}

// Executar seed
seedGamificationData()
    .then(success => {
        if (success) {
            console.log('\n🎉 Sistema de gamificação configurado e populado com sucesso!');
            console.log('🚀 Agora você pode testar no painel do cliente!');
        } else {
            console.log('\n❌ Houve problemas durante a configuração');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('🚨 Erro fatal:', error);
        process.exit(1);
    });
