import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/core/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { useGamification } from '@/contexts/data/GamificationContext';
import toast from 'react-hot-toast';

/**
 * Hook para integração do sistema de gamificação com WhatsApp
 * Permite atualização automática de pontos via interações com IA
 */
export const useWhatsAppGamification = () => {
    const { user } = useAuth();
    const { addDailyActivity, fetchGamificationData } = useGamification();
    const [processingActivity, setProcessingActivity] = useState(false);

    // ==========================================
    // SISTEMA ANTIFRAUDE
    // ==========================================

    const antifraudChecks = {
        // Limite de pontos por dia por categoria
        maxPointsPerDay: {
            physical: 200,
            nutrition: 150,
            emotional: 120,
            spiritual: 100,
            whatsapp_interaction: 50
        },

        // Intervalo mínimo entre atividades similares (minutos)
        minIntervalBetweenSimilar: 30,

        // Limite de atividades por hora
        maxActivitiesPerHour: 10,

        // Padrões suspeitos
        suspiciousPatterns: {
            sameActivityRepeated: 5, // máximo da mesma atividade por dia
            rapidSuccession: 3, // máximo de atividades em 5 minutos
            perfectScores: 10 // máximo de scores perfeitos por dia
        }
    };

    const validateActivity = useCallback(async (activityData) => {
        if (!user?.id) return { valid: false, reason: 'Usuário não autenticado' };

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        try {
            // 1. Verificar pontos totais do dia por categoria
            const { data: todayActivities, error: todayError } = await supabase
                .from('daily_activities')
                .select('points_earned, activity_type, activity_name, created_at')
                .eq('user_id', user.id)
                .eq('activity_date', today);

            if (todayError) throw todayError;

            const categoryPoints = todayActivities
                ?.filter(a => a.activity_type === activityData.type)
                ?.reduce((sum, a) => sum + a.points_earned, 0) || 0;

            if (categoryPoints + activityData.points > antifraudChecks.maxPointsPerDay[activityData.type]) {
                return {
                    valid: false,
                    reason: `Limite diário de pontos para ${activityData.type} excedido`,
                    currentPoints: categoryPoints,
                    maxAllowed: antifraudChecks.maxPointsPerDay[activityData.type]
                };
            }

            // 2. Verificar atividades na última hora
            const recentActivities = todayActivities?.filter(a => 
                new Date(a.created_at) > oneHourAgo
            ) || [];

            if (recentActivities.length >= antifraudChecks.maxActivitiesPerHour) {
                return {
                    valid: false,
                    reason: 'Muitas atividades na última hora. Aguarde um pouco.',
                    activitiesInHour: recentActivities.length
                };
            }

            // 3. Verificar atividades em sucessão rápida
            const veryRecentActivities = todayActivities?.filter(a => 
                new Date(a.created_at) > fiveMinutesAgo
            ) || [];

            if (veryRecentActivities.length >= antifraudChecks.suspiciousPatterns.rapidSuccession) {
                return {
                    valid: false,
                    reason: 'Atividades muito frequentes. Aguarde 5 minutos entre registros.',
                    recentCount: veryRecentActivities.length
                };
            }

            // 4. Verificar repetição da mesma atividade
            const sameActivityToday = todayActivities?.filter(a => 
                a.activity_name === activityData.name
            ) || [];

            if (sameActivityToday.length >= antifraudChecks.suspiciousPatterns.sameActivityRepeated) {
                return {
                    valid: false,
                    reason: `Atividade "${activityData.name}" já foi registrada muitas vezes hoje`,
                    repetitions: sameActivityToday.length
                };
            }

            // 5. Verificar intervalo mínimo entre atividades similares
            if (sameActivityToday.length > 0) {
                const lastSimilar = sameActivityToday
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                
                const timeDiff = (now - new Date(lastSimilar.created_at)) / (1000 * 60); // minutos
                
                if (timeDiff < antifraudChecks.minIntervalBetweenSimilar) {
                    return {
                        valid: false,
                        reason: `Aguarde ${Math.ceil(antifraudChecks.minIntervalBetweenSimilar - timeDiff)} minutos para registrar "${activityData.name}" novamente`,
                        waitTime: Math.ceil(antifraudChecks.minIntervalBetweenSimilar - timeDiff)
                    };
                }
            }

            return { valid: true };

        } catch (error) {
            console.error('Erro na validação antifraude:', error);
            return { valid: false, reason: 'Erro na validação. Tente novamente.' };
        }
    }, [user?.id]);

    // ==========================================
    // PROCESSAMENTO DE ATIVIDADES VIA WHATSAPP
    // ==========================================

    const processWhatsAppActivity = useCallback(async (messageData) => {
        if (!user?.id) return { success: false, error: 'Usuário não autenticado' };
        
        setProcessingActivity(true);
        
        try {
            // Analisar mensagem e extrair atividade
            const activity = analyzeWhatsAppMessage(messageData);
            
            if (!activity) {
                return { success: false, error: 'Não foi possível identificar uma atividade válida na mensagem' };
            }

            // Validação antifraude
            const validation = await validateActivity(activity);
            
            if (!validation.valid) {
                return { 
                    success: false, 
                    error: validation.reason,
                    fraudCheck: true,
                    details: validation
                };
            }

            // Registrar atividade
            const result = await addDailyActivity({
                ...activity,
                description: `${activity.description} (via WhatsApp)`,
                metadata: {
                    source: 'whatsapp',
                    messageId: messageData.id,
                    timestamp: new Date().toISOString(),
                    fraudChecksPasssed: true
                }
            });

            // Log da atividade para auditoria
            await logWhatsAppActivity(user.id, messageData, activity, 'success');

            return { success: true, activity: result, points: activity.points };

        } catch (error) {
            console.error('Erro ao processar atividade do WhatsApp:', error);
            
            // Log do erro para auditoria
            await logWhatsAppActivity(user.id, messageData, null, 'error', error.message);
            
            return { success: false, error: 'Erro interno. Tente novamente mais tarde.' };
        } finally {
            setProcessingActivity(false);
        }
    }, [user?.id, addDailyActivity, validateActivity]);

    // ==========================================
    // ANÁLISE DE MENSAGENS DO WHATSAPP
    // ==========================================

    const analyzeWhatsAppMessage = (messageData) => {
        const message = messageData.body?.toLowerCase() || '';
        const timestamp = new Date();

        // Padrões de reconhecimento de atividades
        const patterns = {
            physical: {
                treino: {
                    keywords: ['treino', 'academia', 'exercicio', 'malhei', 'workout'],
                    points: 25,
                    name: 'Treino realizado'
                },
                caminhada: {
                    keywords: ['caminhei', 'caminhada', 'andei', 'passei'],
                    points: 20,
                    name: 'Caminhada/Corrida'
                },
                passos: {
                    keywords: ['passos', 'meta de passos', 'steps'],
                    points: 20,
                    name: 'Meta de passos atingida'
                }
            },
            nutrition: {
                refeicao: {
                    keywords: ['comi', 'almocei', 'jantei', 'lanche', 'refeição'],
                    points: 15,
                    name: 'Refeição registrada'
                },
                agua: {
                    keywords: ['água', 'hidratei', 'bebi água', 'meta de água'],
                    points: 15,
                    name: 'Meta de água atingida'
                },
                dieta: {
                    keywords: ['dieta', 'plano alimentar', 'segui o plano'],
                    points: 25,
                    name: 'Plano alimentar seguido'
                }
            },
            emotional: {
                humor: {
                    keywords: ['bem', 'feliz', 'animado', 'positivo', 'humor'],
                    points: 10,
                    name: 'Check-in de humor positivo'
                },
                meditacao: {
                    keywords: ['meditei', 'meditação', 'respiração', 'mindfulness'],
                    points: 20,
                    name: 'Prática de meditação'
                }
            },
            spiritual: {
                gratidao: {
                    keywords: ['grato', 'gratidão', 'agradeco', 'obrigado'],
                    points: 15,
                    name: 'Prática de gratidão'
                },
                reflexao: {
                    keywords: ['reflexão', 'pensei', 'refletindo'],
                    points: 10,
                    name: 'Reflexão diária'
                }
            }
        };

        // Buscar padrões na mensagem
        for (const [category, activities] of Object.entries(patterns)) {
            for (const [activityKey, activityConfig] of Object.entries(activities)) {
                const hasKeyword = activityConfig.keywords.some(keyword => 
                    message.includes(keyword)
                );
                
                if (hasKeyword) {
                    return {
                        type: category,
                        name: activityConfig.name,
                        points: activityConfig.points,
                        description: `${activityConfig.name} identificada automaticamente`,
                        date: timestamp.toISOString().split('T')[0],
                        isBonus: false
                    };
                }
            }
        }

        // Verificar menções de números (possíveis scores ou quantidades)
        const numbers = message.match(/\d+/g);
        if (numbers && numbers.length > 0) {
            const value = parseInt(numbers[0]);
            
            if (value >= 1000 && value <= 50000) {
                // Possível contagem de passos
                return {
                    type: 'physical',
                    name: 'Contagem de passos',
                    points: Math.min(25, Math.floor(value / 1000) * 2),
                    description: `${value} passos registrados`,
                    date: timestamp.toISOString().split('T')[0],
                    isBonus: value >= 10000
                };
            }
        }

        return null;
    };

    // ==========================================
    // LOG DE AUDITORIA
    // ==========================================

    const logWhatsAppActivity = async (userId, messageData, activity, status, errorMessage = null) => {
        try {
            await supabase
                .from('whatsapp_gamification_log')
                .insert([{
                    user_id: userId,
                    message_id: messageData.id,
                    message_body: messageData.body,
                    detected_activity: activity ? JSON.stringify(activity) : null,
                    status: status,
                    error_message: errorMessage,
                    processed_at: new Date().toISOString(),
                    metadata: JSON.stringify({
                        source: messageData.from,
                        timestamp: messageData.timestamp,
                        type: messageData.type
                    })
                }]);
        } catch (error) {
            console.error('Erro ao registrar log de auditoria:', error);
        }
    };

    // ==========================================
    // NOTIFICAÇÕES AUTOMÁTICAS
    // ==========================================

    const sendGamificationNotification = useCallback(async (type, data) => {
        if (!user?.id) return;

        const notifications = {
            pointsEarned: {
                template: `🎉 Parabéns! Você ganhou ${data.points} pontos pela atividade "${data.activityName}"!\n\n💰 Total: ${data.totalPoints} pontos\n🏆 Nível: ${data.level}\n\n Continue assim! 💪`,
                priority: 'high'
            },
            levelUp: {
                template: `🚀 LEVEL UP! 🚀\n\nVocê subiu para o Nível ${data.newLevel}!\n\n🎁 Nova recompensa desbloqueada\n🏅 Badge "${data.badgeName}" conquistada\n\nParabéns pela evolução! 👑`,
                priority: 'urgent'
            },
            achievementUnlocked: {
                template: `🏆 CONQUISTA DESBLOQUEADA!\n\n${data.achievementIcon} ${data.achievementName}\n"${data.achievementDescription}"\n\n🎁 +${data.bonusPoints} pontos de bônus!\n\nVocê é incrível! ⭐`,
                priority: 'high'
            },
            dailyStreak: {
                template: `🔥 SEQUÊNCIA DE ${data.streakDays} DIAS! 🔥\n\nVocê está em fogo! Sua consistência é inspiradora.\n\n🎯 Continue assim para desbloquear recompensas especiais!\n💎 Próximo marco: ${data.nextMilestone} dias`,
                priority: 'medium'
            },
            fraudAlert: {
                template: `⚠️ Atividade Suspeita Detectada\n\nPor favor, aguarde entre registros de atividades para evitar duplicações.\n\n⏰ Próximo registro em: ${data.waitTime} minutos\n\n🛡️ Isso protege seu progresso!`,
                priority: 'low'
            }
        };

        const notification = notifications[type];
        if (!notification) return;

        try {
            // Enviar via WhatsApp (integração com webhook)
            await supabase.functions.invoke('send-whatsapp-notification', {
                body: {
                    user_id: user.id,
                    phone: user.profile?.phone,
                    message: notification.template,
                    priority: notification.priority,
                    type: type,
                    data: data
                }
            });
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
        }
    }, [user]);

    // ==========================================
    // WEBHOOK LISTENER
    // ==========================================

    useEffect(() => {
        if (!user?.id) return;

        // Listener para mensagens do WhatsApp via Supabase Realtime
        const channel = supabase
            .channel('whatsapp-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'whatsapp_messages',
                    filter: `user_id=eq.${user.id}`
                },
                async (payload) => {
                    const messageData = payload.new;
                    
                    // Processar apenas mensagens do cliente (não respostas da IA)
                    if (messageData.direction === 'inbound' && messageData.body) {
                        const result = await processWhatsAppActivity(messageData);
                        
                        if (result.success) {
                            toast.success(`🎉 +${result.points} pontos via WhatsApp!`);
                            
                            // Atualizar dados no contexto
                            await fetchGamificationData();
                            
                            // Enviar notificação de confirmação
                            await sendGamificationNotification('pointsEarned', {
                                points: result.points,
                                activityName: result.activity.activity_name,
                                totalPoints: user.gamification?.total_points + result.points,
                                level: user.gamification?.level
                            });
                        } else if (result.fraudCheck) {
                            // Notificar sobre detecção de fraude
                            await sendGamificationNotification('fraudAlert', {
                                waitTime: result.details.waitTime || 30
                            });
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, processWhatsAppActivity, fetchGamificationData, sendGamificationNotification]);

    return {
        processWhatsAppActivity,
        validateActivity,
        sendGamificationNotification,
        processingActivity,
        antifraudChecks
    };
};