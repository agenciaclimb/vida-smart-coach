import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    Award, Gift, History, Loader2, Trophy, Target, Users, Calendar,
    TrendingUp, Star, Zap, Crown, Medal, Flame, CheckCircle, Timer,
    Heart, Brain, Dumbbell, Apple, Sparkles, Share2
} from 'lucide-react';
import CompletionProgress from '@/components/client/CompletionProgress';
import { useAuth } from '@/components/auth/AuthProvider';
import { useGamification } from '@/contexts/data/GamificationContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { normalizeActivityKey } from '@/utils/activityKeys';
import { useNavigate } from 'react-router-dom';

const GamificationTabEnhanced = () => {
    const { user: authUser } = useAuth();
    const navigate = useNavigate();
    const {
        userStats,
        userRankings,
        dailyActivities,
        achievements,
        userAchievements,
        dailyMissions,
        leaderboards,
        events,
        userParticipation,
        referrals,
        loading,
        addDailyActivity,
        completeMission,
        joinEvent,
        createReferral,
        generateDailyMissions
    } = useGamification();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const todayStr = new Date().toISOString().split('T')[0];

    const buildActivityKey = (key, name) => normalizeActivityKey(key || name);

    // Build a set of today's activity keys to disable duplicates (daily limiter)
    const todaysActivityKeys = new Set(
        (dailyActivities || [])
            .filter(a => a.activity_date === todayStr)
            .map(a => buildActivityKey(a.activity_key, a.activity_name))
            .filter(Boolean)
    );

    const doneToday = (key, name) => {
        const normalized = buildActivityKey(key, name);
        if (!normalized) return false;
        return todaysActivityKeys.has(normalized);
    };

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    const getLevelInfo = (level) => {
        const levels = [
            { min: 1, max: 1, name: 'Iniciante', badge: '🌟', color: 'bg-gray-500' },
            { min: 2, max: 4, name: 'Comprometido', badge: '🚀', color: 'bg-blue-500' },
            { min: 5, max: 9, name: 'Dedicado', badge: '💪', color: 'bg-green-500' },
            { min: 10, max: 19, name: 'Expert', badge: '🏆', color: 'bg-yellow-500' },
            { min: 20, max: 999, name: 'Lenda', badge: '👑', color: 'bg-purple-500' }
        ];
        
        return levels.find(l => level >= l.min && level <= l.max) || levels[0];
    };

    const getCategoryIcon = (category) => {
        const icons = {
            physical: <Dumbbell className="w-5 h-5" />,
            nutrition: <Apple className="w-5 h-5" />,
            emotional: <Heart className="w-5 h-5" />,
            spiritual: <Sparkles className="w-5 h-5" />
        };
        return icons[category] || <Star className="w-5 h-5" />;
    };

    const getMissionDifficultyColor = (type) => {
        const colors = {
            easy: 'bg-green-100 text-green-800 border-green-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            challenging: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[type] || colors.easy;
    };

    const handleQuickActivity = async ({ activityType, activityName, activityKey, points }) => {
        if (doneToday(activityKey, activityName)) {
            toast.error('Esta ação já foi registrada hoje. Tente novamente amanhã.');
            return;
        }
        setIsSubmitting(true);
        try {
            await addDailyActivity({
                type: activityType,
                name: activityName,
                key: activityKey,
                points: points,
                description: `Atividade rápida: ${activityName}`
            });
        } catch (error) {
            // Error already handled in context
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompleteMission = async (mission) => {
        setIsSubmitting(true);
        try {
            await completeMission(mission.id, { completed: true });
        } catch (error) {
            // Error already handled in context
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleJoinEvent = async (event) => {
        setIsSubmitting(true);
        try {
            await joinEvent(event.id);
        } catch (error) {
            // Error already handled in context
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <TabsContent value="gamification" className="mt-6">
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    <span className="ml-2 text-lg">Carregando gamificação...</span>
                </div>
            </TabsContent>
        );
    }

    if (!userStats) {
        return (
            <TabsContent value="gamification" className="mt-6">
                <div className="flex flex-col justify-center items-center h-64">
                    <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold">Opa! Algo deu errado.</h3>
                    <p className="text-sm text-gray-500">Não foi possível carregar seus dados de gamificação. Tente recarregar a página.</p>
                </div>
            </TabsContent>
        );
    }

    const levelInfo = getLevelInfo(userStats?.level || 1);

    return (
        <TabsContent value="gamification" className="mt-6">
            <div className="space-y-6">
                {/* Header Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="shadow-lg bg-gradient-to-br from-primary to-purple-600 text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Crown className="w-8 h-8" />
                                Seu Progresso de Gamer
                                <Badge className={`ml-auto ${levelInfo.color} text-white border-0`}>
                                    {levelInfo.badge} {levelInfo.name}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="text-purple-200">
                                Continue evoluindo e ganhe recompensas incríveis!
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{userStats?.total_points || 0}</div>
                                    <div className="text-sm text-purple-200">Pontos Totais</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{userStats?.level || 1}</div>
                                    <div className="text-sm text-purple-200">Nível Atual</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{userStats?.current_streak || 0}</div>
                                    <div className="text-sm text-purple-200">Sequência Atual</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{userStats?.totalBadges || 0}</div>
                                    <div className="text-sm text-purple-200">Conquistas</div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-sm mb-1 text-purple-200">
                                    <span>Progresso para o Nível {(userStats?.level || 1) + 1}</span>
                                    <span>{userStats?.currentLevelProgress || 0} / 1000</span>
                                </div>
                                <Progress value={userStats?.progressPercentage || 0} className="w-full [&>div]:bg-amber-400" />
                            </div>

                            {userRankings?.global && (
                                <div className="flex items-center justify-center gap-2 bg-white/20 rounded-lg p-3">
                                    <Trophy className="w-5 h-5 text-amber-300" />
                                    <span>Ranking Global: #{userRankings.global}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Sub-tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="missions">Missões</TabsTrigger>
                        <TabsTrigger value="achievements">Conquistas</TabsTrigger>
                        <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
                        <TabsTrigger value="events">Eventos</TabsTrigger>
                        <TabsTrigger value="referrals">Indicações</TabsTrigger>
                    </TabsList>

                    {/* Dashboard Tab */}
                    <TabsContent value="dashboard" className="mt-6">
                        {/* Bloco de progresso semanal/mensal de conclusões e XP */}
                        <div className="mb-8">
                            <CompletionProgress />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Quick Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="w-5 h-5" />
                                        Ações Rápidas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button 
                                        onClick={() => navigate('/rewards')}
                                        className="w-full justify-start bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                                    >
                                        <Gift className="w-4 h-4 mr-2" />
                                        🎁 Loja de Recompensas
                                    </Button>
                                    <Button 
                                        onClick={() => handleQuickActivity({ activityType: 'physical', activityName: 'Check-in de treino', activityKey: 'quick-checkin-treino', points: 15 })}
                                        disabled={isSubmitting || doneToday('quick-checkin-treino', 'Check-in de treino')}
                                        className="w-full justify-start"
                                        variant="outline"
                                    >
                                        <Dumbbell className="w-4 h-4 mr-2" />
                                        {doneToday('quick-checkin-treino', 'Check-in de treino') ? 'Check-in Treino (já feito hoje)' : 'Check-in Treino (+15 pts)'}
                                    </Button>
                                    <Button 
                                        onClick={() => handleQuickActivity({ activityType: 'nutrition', activityName: 'Meta de água', activityKey: 'quick-meta-agua', points: 15 })}
                                        disabled={isSubmitting || doneToday('quick-meta-agua', 'Meta de água')}
                                        className="w-full justify-start"
                                        variant="outline"
                                    >
                                        <Apple className="w-4 h-4 mr-2" />
                                        {doneToday('quick-meta-agua', 'Meta de água') ? 'Meta de Água (já feita hoje)' : 'Meta de Água (+15 pts)'}
                                    </Button>
                                    <Button 
                                        onClick={() => handleQuickActivity({ activityType: 'emotional', activityName: 'Check-in de humor', activityKey: 'quick-checkin-humor', points: 10 })}
                                        disabled={isSubmitting || doneToday('quick-checkin-humor', 'Check-in de humor')}
                                        className="w-full justify-start"
                                        variant="outline"
                                    >
                                        <Heart className="w-4 h-4 mr-2" />
                                        {doneToday('quick-checkin-humor', 'Check-in de humor') ? 'Check-in Humor (já feito hoje)' : 'Check-in Humor (+10 pts)'}
                                    </Button>
                                    <Button 
                                        onClick={() => handleQuickActivity({ activityType: 'spiritual', activityName: 'Reflexão diária', activityKey: 'quick-reflexao-diaria', points: 10 })}
                                        disabled={isSubmitting || doneToday('quick-reflexao-diaria', 'Reflexão diária')}
                                        className="w-full justify-start"
                                        variant="outline"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        {doneToday('quick-reflexao-diaria', 'Reflexão diária') ? 'Reflexão Diária (já feita hoje)' : 'Reflexão Diária (+10 pts)'}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Today's Progress */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        Progresso de Hoje
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between">
                                        <span>Atividades:</span>
                                        <span className="font-bold">{userStats?.todayActivities || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Missões Completadas:</span>
                                        <span className="font-bold">{userStats?.completedMissions || 0}/3</span>
                                    </div>
                                    <Progress value={((userStats?.completedMissions || 0) / 3) * 100} />
                                </CardContent>
                            </Card>

                            {/* Points by Category */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        Pontos por Área
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Dumbbell className="w-4 h-4 text-blue-500" />
                                            <span>Físico</span>
                                        </div>
                                        <span className="font-bold">{userStats?.physical_points || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Apple className="w-4 h-4 text-green-500" />
                                            <span>Alimentar</span>
                                        </div>
                                        <span className="font-bold">{userStats?.nutrition_points || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Heart className="w-4 h-4 text-red-500" />
                                            <span>Emocional</span>
                                        </div>
                                        <span className="font-bold">{userStats?.emotional_points || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-purple-500" />
                                            <span>Espiritual</span>
                                        </div>
                                        <span className="font-bold">{userStats?.spiritual_points || 0}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Activities */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="w-5 h-5" />
                                    Atividades Recentes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {dailyActivities.slice(0, 10).map((activity, index) => (
                                        <div key={activity.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                {getCategoryIcon(activity.activity_type)}
                                                <div>
                                                    <p className="font-medium">{activity.activity_name}</p>
                                                    <p className="text-sm text-gray-600">{activity.description}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-green-600">+{activity.points_earned}</div>
                                                <div className="text-xs text-gray-500">
                                                    {format(new Date(activity.activity_date), 'dd/MM', { locale: ptBR })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Missions Tab */}
                    <TabsContent value="missions" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Missões de Hoje
                                </CardTitle>
                                <CardDescription>
                                    Complete suas missões diárias e ganhe pontos extras!
                                </CardDescription>
                                <div className="mt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => generateDailyMissions()}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                Atualizando missões
                                            </>
                                        ) : (
                                            'Gerar/Atualizar missões de hoje'
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {dailyMissions.map((mission) => (
                                        <div key={mission.id} className={`p-4 rounded-lg border ${mission.is_completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge className={getMissionDifficultyColor(mission.mission_type)}>
                                                            {mission.mission_type === 'easy' ? 'Fácil' : mission.mission_type === 'medium' ? 'Médio' : 'Desafiante'}
                                                        </Badge>
                                                        {getCategoryIcon(mission.category)}
                                                    </div>
                                                    <h4 className="font-medium">{mission.title}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Star className="w-4 h-4 text-yellow-500" />
                                                        <span className="text-sm font-medium">{mission.points_reward} pontos</span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    {mission.is_completed ? (
                                                        <Badge className="bg-green-100 text-green-800 border-green-200">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Completa
                                                        </Badge>
                                                    ) : (
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => handleCompleteMission(mission)}
                                                            disabled={isSubmitting}
                                                        >
                                                            {isSubmitting ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                'Completar'
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {dailyMissions.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>Nenhuma missão disponível hoje</p>
                                    </div>
                                )}
                                {dailyMissions.length > 0 && dailyMissions.every(m => m.is_completed) && (
                                    <div className="text-center py-6 text-gray-600">
                                        Todas as missões de hoje foram completadas. Clique em "Gerar/Atualizar missões de hoje" para renovar.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Achievements Tab */}
                    <TabsContent value="achievements" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* User Achievements */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Medal className="w-5 h-5" />
                                        Suas Conquistas ({userAchievements.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {userAchievements.map((userAchievement) => (
                                            <div key={userAchievement.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                                                <span className="text-2xl">{userAchievement.achievements.icon}</span>
                                                <div className="flex-1">
                                                    <p className="font-medium">{userAchievement.achievements.name}</p>
                                                    <p className="text-sm text-gray-600">{userAchievement.achievements.description}</p>
                                                    <p className="text-xs text-green-600 font-medium">
                                                        +{userAchievement.achievements.points_reward} pontos
                                                    </p>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {format(new Date(userAchievement.earned_at), "dd 'de' MMM", { locale: ptBR })}
                                                </div>
                                            </div>
                                        ))}
                                        {userAchievements.length === 0 && (
                                            <div className="text-center py-8 text-gray-500">
                                                <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                <p>Você ainda não tem conquistas</p>
                                                <p className="text-sm">Continue progredindo para desbloquear!</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Available Achievements */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="w-5 h-5" />
                                        Conquistas Disponíveis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {achievements.filter(a => !userAchievements.find(ua => ua.achievement_id === a.id)).map((achievement) => (
                                            <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <span className="text-2xl opacity-50">{achievement.icon}</span>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-700">{achievement.name}</p>
                                                    <p className="text-sm text-gray-500">{achievement.description}</p>
                                                    <p className="text-xs text-blue-600 font-medium">
                                                        {achievement.points_reward} pontos
                                                    </p>
                                                </div>
                                                <Badge variant="outline">{achievement.category}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Leaderboard Tab */}
                    <TabsContent value="leaderboard" className="mt-6">
                        <div className="space-y-6">
                            {/* Global Leaderboard */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-yellow-500" />
                                        Ranking Global
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {leaderboards.global.slice(0, 10).map((row, index) => (
                                            <div key={row.email} className={`flex items-center justify-between p-3 rounded-lg ${row.email === authUser?.email ? 'bg-primary/10 border border-primary/20' : 'bg-gray-50'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index < 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' : 'bg-gray-200'}`}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{row.name}</p>
                                                        <p className="text-xs text-gray-500">Nível {row.level}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">{row.total_points}</p>
                                                    <p className="text-xs text-gray-500">pontos</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Category Rankings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {Object.keys(leaderboards.category).map((category) => (
                                    <Card key={category}>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                {getCategoryIcon(category)}
                                                {category === 'physical' ? 'Físico' : 
                                                 category === 'nutrition' ? 'Alimentar' : 
                                                 category === 'emotional' ? 'Emocional' : 'Espiritual'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="space-y-2">
                                                {leaderboards.category[category].slice(0, 5).map((entry, index) => (
                                                    <div key={entry.email} className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold w-4">{index + 1}.</span>
                                                            <span className="truncate">{entry.name}</span>
                                                        </div>
                                                        <span className="font-medium">{entry[`${category}_points`] || 0}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Events Tab */}
                    <TabsContent value="events" className="mt-6">
                        <div className="space-y-6">
                            {events.map((event) => {
                                const isParticipating = userParticipation.find(p => p.event_id === event.id);
                                return (
                                    <Card key={event.id}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        {event.event_type === 'challenge' ? <Target className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                                                        {event.name}
                                                    </CardTitle>
                                                    <CardDescription>{event.description}</CardDescription>
                                                </div>
                                                <Badge variant={isParticipating ? "default" : "outline"}>
                                                    {event.event_type === 'challenge' ? 'Desafio' : 
                                                     event.event_type === 'competition' ? 'Competição' : 'Evento'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {format(new Date(event.start_date), 'dd/MM/yyyy', { locale: ptBR })} - 
                                                        {format(new Date(event.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {event.current_participants || 0} participantes
                                                    </div>
                                                </div>
                                                
                                                {!isParticipating ? (
                                                    <Button 
                                                        onClick={() => handleJoinEvent(event)}
                                                        disabled={isSubmitting}
                                                        className="w-full vida-smart-gradient"
                                                    >
                                                        {isSubmitting ? (
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        ) : (
                                                            'Participar do Evento'
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                                        <div className="flex items-center gap-2 text-green-800">
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span className="font-medium">Você está participando!</span>
                                                        </div>
                                                        {isParticipating.is_completed && (
                                                            <p className="text-sm text-green-600 mt-1">
                                                                Evento completado! +{isParticipating.points_earned} pontos
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            {events.length === 0 && (
                                <Card>
                                    <CardContent className="text-center py-12">
                                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p className="text-gray-500">Nenhum evento ativo no momento</p>
                                        <p className="text-sm text-gray-400 mt-1">Fique de olho para novos eventos!</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Referrals Tab */}
                    <TabsContent value="referrals" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Referral Stats */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Share2 className="w-5 h-5" />
                                        Suas Indicações
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-primary">{referrals.length}</div>
                                        <div className="text-sm text-gray-600">Total de Indicações</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {referrals.reduce((sum, r) => sum + r.points_earned, 0)}
                                        </div>
                                        <div className="text-sm text-gray-600">Pontos Ganhos</div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Referral Rewards */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Sistema de Recompensas</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Amigo se cadastra:</span>
                                        <Badge variant="outline">+200 pts</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Amigo assina plano:</span>
                                        <Badge variant="outline">+1000 pts</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Amigo completa 1 mês:</span>
                                        <Badge variant="outline">+500 pts</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Amigo alcança meta:</span>
                                        <Badge variant="outline">+300 pts</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Referral Link */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Seu Link de Indicação</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input 
                                            value={`https://www.appvidasmart.com/login?tab=register&ref=${authUser?.id}`}
                                            readOnly
                                            className="text-xs"
                                        />
                                        <Button 
                                            size="sm"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`https://www.appvidasmart.com/login?tab=register&ref=${authUser?.id}`);
                                                toast.success('Link copiado!');
                                            }}
                                        >
                                            Copiar
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        Compartilhe este link e ganhe pontos quando seus amigos se cadastrarem!
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Referrals History */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Histórico de Indicações</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {referrals.map((referral) => (
                                        <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium">Indicação #{referral.id.slice(-6)}</p>
                                                <p className="text-sm text-gray-600">
                                                    Status: {referral.milestone_reached} • +{referral.points_earned} pontos
                                                </p>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {format(new Date(referral.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                            </div>
                                        </div>
                                    ))}
                                    {referrals.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Share2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                            <p>Você ainda não fez indicações</p>
                                            <p className="text-sm">Compartilhe seu link e comece a ganhar!</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </TabsContent>
    );
};

export default GamificationTabEnhanced;
