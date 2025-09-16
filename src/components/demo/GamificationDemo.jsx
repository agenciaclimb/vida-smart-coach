import React, { useState, useEffect } from 'react';
import { useWhatsAppGamificationSimple } from '@/hooks/useWhatsAppGamificationSimple';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/core/supabase';
import { toast } from 'react-hot-toast';

const GamificationDemo = () => {
    const { user } = useAuth();
    const { 
        simulateWhatsAppMessage, 
        processingActivity, 
        activityLog,
        antifraudChecks 
    } = useWhatsAppGamificationSimple();
    
    const [messageInput, setMessageInput] = useState('');
    const [userStats, setUserStats] = useState({
        totalPoints: 0,
        level: 1,
        currentStreak: 0
    });
    const [recentAchievements, setRecentAchievements] = useState([]);

    // Sample WhatsApp messages for testing
    const sampleMessages = [
        'Acabei de fazer um treino na academia! 💪',
        'Caminhei 8000 passos hoje 👟',
        'Bebi 2L de água hoje 💧',
        'Comi uma salada super saudável 🥗',
        'Meditei por 15 minutos 🧘',
        'Gratidão por este dia incrível 🙏'
    ];

    // Load user stats
    const loadUserStats = async () => {
        if (!user?.id) return;
        
        try {
            const { data: gamData, error } = await supabase
                .from('gamification')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (gamData && !error) {
                setUserStats({
                    totalPoints: gamData.total_points || 0,
                    level: gamData.level || 1,
                    currentStreak: gamData.current_streak || 0
                });
            }

            // Load recent achievements
            const { data: achievements } = await supabase
                .from('user_achievements')
                .select('*')
                .eq('user_id', user.id)
                .order('earned_at', { ascending: false })
                .limit(5);

            if (achievements) {
                setRecentAchievements(achievements);
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    };

    useEffect(() => {
        loadUserStats();
    }, [user?.id]);

    // Handle message simulation
    const handleSimulateMessage = async (message) => {
        const result = await simulateWhatsAppMessage(message);
        
        if (result.success) {
            // Refresh stats after successful activity
            await loadUserStats();
        }
        
        // Clear input if it was typed
        if (message === messageInput) {
            setMessageInput('');
        }
    };

    const resetGamification = async () => {
        if (!user?.id) return;
        
        try {
            // Reset gamification data
            const { error: gamError } = await supabase
                .from('gamification')
                .upsert([{
                    user_id: user.id,
                    total_points: 0,
                    level: 1,
                    current_streak: 0,
                    longest_streak: 0,
                    badges: []
                }]);

            // Clear achievements
            const { error: achError } = await supabase
                .from('user_achievements')
                .delete()
                .eq('user_id', user.id);

            if (!gamError && !achError) {
                setUserStats({ totalPoints: 0, level: 1, currentStreak: 0 });
                setRecentAchievements([]);
                toast.success('Gamificação resetada com sucesso!');
            }
        } catch (error) {
            console.error('Error resetting gamification:', error);
            toast.error('Erro ao resetar gamificação');
        }
    };

    if (!user) {
        return (
            <div className="p-6 bg-gray-100 rounded-lg">
                <p className="text-center text-gray-600">
                    Faça login para testar o sistema de gamificação
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-2">🎮 Demo: Sistema de Gamificação</h1>
                <p className="text-blue-100">
                    Teste o sistema de pontuação automática via WhatsApp com anti-fraude
                </p>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                    <h3 className="text-lg font-semibold text-gray-700">Pontos Totais</h3>
                    <p className="text-3xl font-bold text-blue-600">{userStats.totalPoints}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-lg font-semibold text-gray-700">Nível Atual</h3>
                    <p className="text-3xl font-bold text-green-600">{userStats.level}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
                    <h3 className="text-lg font-semibold text-gray-700">Sequência</h3>
                    <p className="text-3xl font-bold text-orange-600">{userStats.currentStreak}</p>
                </div>
            </div>

            {/* WhatsApp Simulator */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    📱 Simulador de Mensagens WhatsApp
                </h2>
                
                {/* Custom Message Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Digite uma mensagem personalizada:
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Ex: Fiz exercício hoje..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && messageInput.trim()) {
                                    handleSimulateMessage(messageInput.trim());
                                }
                            }}
                        />
                        <button
                            onClick={() => messageInput.trim() && handleSimulateMessage(messageInput.trim())}
                            disabled={!messageInput.trim() || processingActivity}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processingActivity ? '⏳' : '📤'}
                        </button>
                    </div>
                </div>

                {/* Sample Messages */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {sampleMessages.map((message, index) => (
                        <button
                            key={index}
                            onClick={() => handleSimulateMessage(message)}
                            disabled={processingActivity}
                            className="p-3 text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {message}
                        </button>
                    ))}
                </div>
            </div>

            {/* Anti-Fraud Info */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    🛡️ Sistema Anti-Fraude Ativo
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Máximo {antifraudChecks.maxActivitiesPerHour} atividades por hora</li>
                    <li>• Máximo {antifraudChecks.maxPointsPerHour} pontos por hora</li>
                    <li>• Intervalo mínimo: {antifraudChecks.minIntervalBetweenActivities} minutos</li>
                    <li>• Limite diário: {antifraudChecks.dailyPointsLimit} pontos</li>
                </ul>
            </div>

            {/* Activity Log */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">📝 Log de Atividades Recentes</h2>
                {activityLog.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                        Nenhuma atividade registrada ainda. Experimente enviar uma mensagem!
                    </p>
                ) : (
                    <div className="space-y-2">
                        {activityLog.map((activity, index) => (
                            <div key={activity.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">{activity.icon}</span>
                                    <div>
                                        <p className="font-medium">{activity.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(activity.processedAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600">+{activity.points} pts</p>
                                    <p className="text-xs text-gray-400">{activity.source}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">🏆 Conquistas Recentes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {recentAchievements.map((achievement) => (
                            <div key={achievement.id} className="flex items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border">
                                <div className="text-2xl mr-3">🏆</div>
                                <div className="flex-1">
                                    <p className="font-medium">{achievement.achievement_name}</p>
                                    <p className="text-sm text-gray-600">
                                        +{achievement.points_earned} pontos • {new Date(achievement.earned_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex justify-center space-x-4">
                <button
                    onClick={loadUserStats}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    🔄 Atualizar Stats
                </button>
                <button
                    onClick={resetGamification}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    🗑️ Resetar Demo
                </button>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    ℹ️ Como Funciona
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>1. Simule uma mensagem WhatsApp clicando nos botões ou digitando</li>
                    <li>2. O sistema analisa automaticamente o texto e identifica atividades</li>
                    <li>3. Pontos são atribuídos baseado no tipo de atividade detectada</li>
                    <li>4. O sistema anti-fraude previne abuso e limita pontuações</li>
                    <li>5. Progresso é salvo em tempo real no banco de dados</li>
                </ul>
            </div>
        </div>
    );
};

export default GamificationDemo;