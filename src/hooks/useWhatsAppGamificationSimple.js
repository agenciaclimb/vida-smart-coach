import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/core/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import toast from 'react-hot-toast';

/**
 * Simplified WhatsApp Gamification Hook
 * Works with existing database tables
 */
export const useWhatsAppGamificationSimple = () => {
    const { user } = useAuth();
    const [processingActivity, setProcessingActivity] = useState(false);
    const [activityLog, setActivityLog] = useState([]);

    // ==========================================
    // ANTI-FRAUD SYSTEM (Simplified)
    // ==========================================

    const antifraudChecks = {
        maxPointsPerHour: 100,
        maxActivitiesPerHour: 5,
        minIntervalBetweenActivities: 5, // minutes
        dailyPointsLimit: 500
    };

    const validateActivity = useCallback(async (activityData) => {
        if (!user?.id) return { valid: false, reason: 'Usuário não autenticado' };

        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const today = new Date().toISOString().split('T')[0];

        try {
            // Check recent activity from user_achievements table (using it as activity log)
            const { data: recentActivities, error } = await supabase
                .from('user_achievements')
                .select('*')
                .eq('user_id', user.id)
                .gte('earned_at', oneHourAgo.toISOString());

            if (error) {
                console.error('Error checking recent activities:', error);
                return { valid: true }; // Allow on error to avoid blocking users
            }

            // Count activities in the last hour
            const recentCount = recentActivities?.length || 0;
            
            if (recentCount >= antifraudChecks.maxActivitiesPerHour) {
                return {
                    valid: false,
                    reason: `Limite de ${antifraudChecks.maxActivitiesPerHour} atividades por hora atingido. Aguarde um pouco.`
                };
            }

            // Check total points for the hour
            const hourlyPoints = recentActivities?.reduce((sum, activity) => 
                sum + (activity.points_earned || 0), 0
            ) || 0;

            if (hourlyPoints + activityData.points > antifraudChecks.maxPointsPerHour) {
                return {
                    valid: false,
                    reason: `Limite de ${antifraudChecks.maxPointsPerHour} pontos por hora atingido.`
                };
            }

            // Check if last activity was too recent
            if (recentActivities && recentActivities.length > 0) {
                const lastActivity = recentActivities
                    .sort((a, b) => new Date(b.earned_at) - new Date(a.earned_at))[0];
                
                const timeSinceLastActivity = (now - new Date(lastActivity.earned_at)) / (1000 * 60);
                
                if (timeSinceLastActivity < antifraudChecks.minIntervalBetweenActivities) {
                    return {
                        valid: false,
                        reason: `Aguarde ${Math.ceil(antifraudChecks.minIntervalBetweenActivities - timeSinceLastActivity)} minutos entre atividades.`
                    };
                }
            }

            return { valid: true };

        } catch (error) {
            console.error('Erro na validação antifraude:', error);
            return { valid: true }; // Allow on error
        }
    }, [user?.id]);

    // ==========================================
    // WHATSAPP MESSAGE ANALYSIS
    // ==========================================

    const analyzeWhatsAppMessage = (messageText) => {
        const message = messageText.toLowerCase();
        const timestamp = new Date();

        const activityPatterns = [
            {
                keywords: ['treino', 'academia', 'exercicio', 'malhei', 'workout', 'ginástica'],
                type: 'physical_activity',
                name: 'Treino Realizado',
                points: 25,
                icon: '💪'
            },
            {
                keywords: ['caminhei', 'caminhada', 'andei', 'corri', 'corrida'],
                type: 'cardio_activity',
                name: 'Atividade Cardio',
                points: 20,
                icon: '🏃'
            },
            {
                keywords: ['água', 'hidratei', 'bebi água', 'meta de água'],
                type: 'hydration',
                name: 'Meta de Hidratação',
                points: 15,
                icon: '💧'
            },
            {
                keywords: ['comi saudável', 'salada', 'refeição saudável', 'dieta'],
                type: 'nutrition',
                name: 'Alimentação Saudável',
                points: 20,
                icon: '🥗'
            },
            {
                keywords: ['meditei', 'meditação', 'respiração', 'relaxei'],
                type: 'mindfulness',
                name: 'Prática de Mindfulness',
                points: 25,
                icon: '🧘'
            },
            {
                keywords: ['grato', 'gratidão', 'agradeço', 'obrigado pela vida'],
                type: 'gratitude',
                name: 'Prática de Gratidão',
                points: 15,
                icon: '🙏'
            }
        ];

        // Find matching pattern
        for (const pattern of activityPatterns) {
            const hasKeyword = pattern.keywords.some(keyword => 
                message.includes(keyword)
            );
            
            if (hasKeyword) {
                return {
                    type: pattern.type,
                    name: pattern.name,
                    points: pattern.points,
                    icon: pattern.icon,
                    description: `${pattern.name} detectada via WhatsApp`,
                    timestamp: timestamp.toISOString()
                };
            }
        }

        // Check for numbers (possible step counts, weights, etc.)
        const numbers = message.match(/\d+/g);
        if (numbers && numbers.length > 0) {
            const value = parseInt(numbers[0]);
            
            if (value >= 1000 && value <= 50000) {
                // Possible step count
                return {
                    type: 'step_count',
                    name: 'Contagem de Passos',
                    points: Math.min(30, Math.floor(value / 1000) * 3),
                    icon: '👟',
                    description: `${value} passos registrados`,
                    timestamp: timestamp.toISOString()
                };
            }
        }

        return null;
    };

    // ==========================================
    // ACTIVITY PROCESSING
    // ==========================================

    const processWhatsAppActivity = useCallback(async (messageText) => {
        if (!user?.id) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        setProcessingActivity(true);
        
        try {
            // Analyze the message
            const detectedActivity = analyzeWhatsAppMessage(messageText);
            
            if (!detectedActivity) {
                return { 
                    success: false, 
                    error: 'Não foi possível identificar uma atividade válida na mensagem' 
                };
            }

            // Validate with anti-fraud
            const validation = await validateActivity(detectedActivity);
            
            if (!validation.valid) {
                return { 
                    success: false, 
                    error: validation.reason,
                    fraudDetected: true 
                };
            }

            // Record activity in user_achievements table
            const { data: newActivity, error: insertError } = await supabase
                .from('user_achievements')
                .insert([{
                    user_id: user.id,
                    achievement_type: detectedActivity.type,
                    achievement_name: detectedActivity.name,
                    points_earned: detectedActivity.points,
                    earned_at: detectedActivity.timestamp
                }])
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            // Update user's gamification points
            const { data: currentGam, error: fetchError } = await supabase
                .from('gamification')
                .select('total_points, level, current_streak')
                .eq('user_id', user.id)
                .single();

            let newPoints = detectedActivity.points;
            let newLevel = 1;
            let newStreak = 1;

            if (currentGam) {
                newPoints = (currentGam.total_points || 0) + detectedActivity.points;
                newLevel = Math.max(1, Math.floor(newPoints / 1000) + 1);
                newStreak = (currentGam.current_streak || 0) + 1;
            }

            // Update or create gamification record
            const { error: upsertError } = await supabase
                .from('gamification')
                .upsert([{
                    user_id: user.id,
                    total_points: newPoints,
                    level: newLevel,
                    current_streak: newStreak,
                    longest_streak: Math.max(newStreak, currentGam?.longest_streak || 0),
                    badges: currentGam?.badges || [],
                    updated_at: new Date().toISOString()
                }]);

            if (upsertError) {
                console.error('Error updating gamification:', upsertError);
                // Don't fail the whole operation if gamification update fails
            }

            // Add to local activity log
            setActivityLog(prev => [{
                id: newActivity.id,
                ...detectedActivity,
                source: 'whatsapp',
                processedAt: new Date().toISOString()
            }, ...prev.slice(0, 9)]); // Keep last 10 activities

            toast.success(`🎉 +${detectedActivity.points} pontos! ${detectedActivity.icon} ${detectedActivity.name}`);

            return { 
                success: true, 
                activity: newActivity, 
                points: detectedActivity.points,
                newTotalPoints: newPoints,
                levelUp: newLevel > (currentGam?.level || 1)
            };

        } catch (error) {
            console.error('Erro ao processar atividade:', error);
            return { 
                success: false, 
                error: 'Erro interno. Tente novamente mais tarde.' 
            };
        } finally {
            setProcessingActivity(false);
        }
    }, [user?.id, validateActivity]);

    // ==========================================
    // DEMO FUNCTION FOR TESTING
    // ==========================================

    const simulateWhatsAppMessage = useCallback(async (messageText) => {
        console.log('🧪 Simulando mensagem WhatsApp:', messageText);
        
        const result = await processWhatsAppActivity(messageText);
        
        if (result.success) {
            if (result.levelUp) {
                toast.success(`🚀 Level UP! Você subiu para o nível ${Math.floor(result.newTotalPoints / 1000) + 1}!`, {
                    duration: 5000,
                    icon: '👑'
                });
            }
        } else {
            toast.error(result.error);
        }
        
        return result;
    }, [processWhatsAppActivity]);

    // Load recent activity log on mount
    useEffect(() => {
        if (user?.id) {
            const loadRecentActivities = async () => {
                try {
                    const { data, error } = await supabase
                        .from('user_achievements')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('earned_at', { ascending: false })
                        .limit(10);

                    if (data && !error) {
                        const formattedLog = data.map(activity => ({
                            id: activity.id,
                            type: activity.achievement_type,
                            name: activity.achievement_name,
                            points: activity.points_earned,
                            icon: getActivityIcon(activity.achievement_type),
                            source: 'history',
                            processedAt: activity.earned_at
                        }));
                        setActivityLog(formattedLog);
                    }
                } catch (error) {
                    console.error('Error loading activity log:', error);
                }
            };

            loadRecentActivities();
        }
    }, [user?.id]);

    // Helper function to get icon for activity type
    const getActivityIcon = (type) => {
        const icons = {
            'physical_activity': '💪',
            'cardio_activity': '🏃',
            'hydration': '💧',
            'nutrition': '🥗',
            'mindfulness': '🧘',
            'gratitude': '🙏',
            'step_count': '👟'
        };
        return icons[type] || '🎯';
    };

    return {
        // Core functions
        processWhatsAppActivity,
        simulateWhatsAppMessage,
        validateActivity,
        analyzeWhatsAppMessage,
        
        // State
        processingActivity,
        activityLog,
        
        // Configuration
        antifraudChecks,
        
        // Utils
        getActivityIcon
    };
};