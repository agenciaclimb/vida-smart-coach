import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { 
    Trophy, Users, TrendingUp, Calendar, Target, Award, Gift, 
    Plus, Edit, Trash2, Play, Pause, BarChart3, Loader2, 
    CheckCircle, XCircle, Eye, Settings, Zap, Crown, Medal,
    Dumbbell, Apple, Heart, Sparkles, Star, Flame
} from 'lucide-react';
import { supabase } from '@/core/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GamificationManagementTab = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // States for different data
    const [stats, setStats] = useState({});
    const [achievements, setAchievements] = useState([]);
    const [events, setEvents] = useState([]);
    const [userActivities, setUserActivities] = useState([]);
    const [leaderboards, setLeaderboards] = useState([]);
    const [userStats, setUserStats] = useState([]);
    
    // Form states
    const [newAchievement, setNewAchievement] = useState({
        name: '',
        description: '',
        icon: '🏆',
        category: 'milestone',
        points_reward: 100,
        requirements: '{}'
    });
    
    const [newEvent, setNewEvent] = useState({
        name: '',
        description: '',
        event_type: 'challenge',
        category: 'monthly_challenge',
        start_date: '',
        end_date: '',
        requirements: '{}',
        rewards: '{}',
        bonus_multiplier: 1.0
    });

    // ==========================================
    // FETCH FUNCTIONS
    // ==========================================

    const fetchStats = async () => {
        try {
            // Total users with gamification data
            const { count: totalUsers } = await supabase
                .from('gamification')
                .select('*', { count: 'exact', head: true });

            // Active users (users who logged points in last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const { count: activeUsers } = await supabase
                .from('daily_activities')
                .select('user_id', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo.toISOString());

            // Total points distributed
            const { data: pointsData } = await supabase
                .from('gamification')
                .select('total_points');
            
            const totalPoints = pointsData?.reduce((sum, user) => sum + (user.total_points || 0), 0) || 0;

            // Total achievements earned
            const { count: totalAchievementsEarned } = await supabase
                .from('user_achievements')
                .select('*', { count: 'exact', head: true });

            // Active events
            const { count: activeEvents } = await supabase
                .from('gamification_events')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true)
                .gte('end_date', new Date().toISOString());

            setStats({
                totalUsers: totalUsers || 0,
                activeUsers: activeUsers || 0,
                totalPoints,
                totalAchievementsEarned: totalAchievementsEarned || 0,
                activeEvents: activeEvents || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('Erro ao carregar estatísticas');
        }
    };

    const fetchAchievements = async () => {
        try {
            const { data, error } = await supabase
                .from('achievements')
                .select('*')
                .order('category', { ascending: true });

            if (error) throw error;
            setAchievements(data || []);
        } catch (error) {
            console.error('Error fetching achievements:', error);
            toast.error('Erro ao carregar conquistas');
        }
    };

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('gamification_events')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Erro ao carregar eventos');
        }
    };

    const fetchUserActivities = async () => {
        try {
            const { data, error } = await supabase
                .from('daily_activities')
                .select(`
                    *,
                    user_profiles!inner(name, email)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setUserActivities(data || []);
        } catch (error) {
            console.error('Error fetching user activities:', error);
            toast.error('Erro ao carregar atividades dos usuários');
        }
    };

    const fetchLeaderboards = async () => {
        try {
            const { data, error } = await supabase
                .from('user_gamification_summary')
                .select('*')
                .order('total_points', { ascending: false })
                .limit(20);

            if (error) throw error;
            setLeaderboards(data || []);
        } catch (error) {
            console.error('Error fetching leaderboards:', error);
            toast.error('Erro ao carregar ranking');
        }
    };

    const fetchUserStats = async () => {
        try {
            const { data, error } = await supabase
                .from('user_gamification_summary')
                .select('*')
                .order('total_points', { ascending: false });

            if (error) throw error;
            setUserStats(data || []);
        } catch (error) {
            console.error('Error fetching user stats:', error);
            toast.error('Erro ao carregar estatísticas dos usuários');
        }
    };

    // ==========================================
    // ACTION FUNCTIONS
    // ==========================================

    const createAchievement = async () => {
        setIsSubmitting(true);
        try {
            const achievement = {
                code: newAchievement.name.toLowerCase().replace(/\s+/g, '_'),
                name: newAchievement.name,
                description: newAchievement.description,
                icon: newAchievement.icon,
                category: newAchievement.category,
                points_reward: parseInt(newAchievement.points_reward),
                requirements: JSON.parse(newAchievement.requirements || '{}'),
                is_active: true
            };

            const { error } = await supabase
                .from('achievements')
                .insert([achievement]);

            if (error) throw error;

            toast.success('Conquista criada com sucesso!');
            setNewAchievement({
                name: '',
                description: '',
                icon: '🏆',
                category: 'milestone',
                points_reward: 100,
                requirements: '{}'
            });
            
            await fetchAchievements();
        } catch (error) {
            console.error('Error creating achievement:', error);
            toast.error('Erro ao criar conquista');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleAchievement = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('achievements')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            
            toast.success(`Conquista ${!currentStatus ? 'ativada' : 'desativada'}!`);
            await fetchAchievements();
        } catch (error) {
            console.error('Error toggling achievement:', error);
            toast.error('Erro ao alterar conquista');
        }
    };

    const createEvent = async () => {
        setIsSubmitting(true);
        try {
            const event = {
                name: newEvent.name,
                description: newEvent.description,
                event_type: newEvent.event_type,
                category: newEvent.category,
                start_date: new Date(newEvent.start_date).toISOString(),
                end_date: new Date(newEvent.end_date).toISOString(),
                requirements: JSON.parse(newEvent.requirements || '{}'),
                rewards: JSON.parse(newEvent.rewards || '{}'),
                bonus_multiplier: parseFloat(newEvent.bonus_multiplier),
                is_active: true,
                current_participants: 0
            };

            const { error } = await supabase
                .from('gamification_events')
                .insert([event]);

            if (error) throw error;

            toast.success('Evento criado com sucesso!');
            setNewEvent({
                name: '',
                description: '',
                event_type: 'challenge',
                category: 'monthly_challenge',
                start_date: '',
                end_date: '',
                requirements: '{}',
                rewards: '{}',
                bonus_multiplier: 1.0
            });
            
            await fetchEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            toast.error('Erro ao criar evento');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleEvent = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('gamification_events')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            
            toast.success(`Evento ${!currentStatus ? 'ativado' : 'desativado'}!`);
            await fetchEvents();
        } catch (error) {
            console.error('Error toggling event:', error);
            toast.error('Erro ao alterar evento');
        }
    };

    const awardPointsToUser = async (userId, points, activityName, description) => {
        try {
            const activity = {
                user_id: userId,
                activity_date: new Date().toISOString().split('T')[0],
                activity_type: 'admin_award',
                activity_name: activityName,
                points_earned: points,
                description: description,
                metadata: { awarded_by: 'admin' }
            };

            const { error } = await supabase
                .from('daily_activities')
                .insert([activity]);

            if (error) throw error;

            toast.success(`${points} pontos concedidos ao usuário!`);
            await fetchUserActivities();
            await fetchUserStats();
        } catch (error) {
            console.error('Error awarding points:', error);
            toast.error('Erro ao conceder pontos');
        }
    };

    // ==========================================
    // EFFECTS
    // ==========================================

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchStats(),
                    fetchAchievements(),
                    fetchEvents(),
                    fetchUserActivities(),
                    fetchLeaderboards(),
                    fetchUserStats()
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    const getCategoryIcon = (category) => {
        const icons = {
            physical: <Dumbbell className="w-4 h-4" />,
            nutrition: <Apple className="w-4 h-4" />,
            emotional: <Heart className="w-4 h-4" />,
            spiritual: <Sparkles className="w-4 h-4" />,
            consistency: <Flame className="w-4 h-4" />,
            milestone: <Trophy className="w-4 h-4" />,
            social: <Users className="w-4 h-4" />
        };
        return icons[category] || <Star className="w-4 h-4" />;
    };

    const getEventTypeColor = (type) => {
        const colors = {
            challenge: 'bg-blue-100 text-blue-800 border-blue-200',
            competition: 'bg-red-100 text-red-800 border-red-200',
            special_event: 'bg-purple-100 text-purple-800 border-purple-200'
        };
        return colors[type] || colors.challenge;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
                <span className="ml-2 text-lg">Carregando sistema de gamificação...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                                <p className="text-2xl font-bold">{stats.activeUsers}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pontos Distribuídos</p>
                                <p className="text-2xl font-bold">{stats.totalPoints?.toLocaleString()}</p>
                            </div>
                            <Star className="h-8 w-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Conquistas Ganhas</p>
                                <p className="text-2xl font-bold">{stats.totalAchievementsEarned}</p>
                            </div>
                            <Award className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Eventos Ativos</p>
                                <p className="text-2xl font-bold">{stats.activeEvents}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sub-tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="achievements">Conquistas</TabsTrigger>
                    <TabsTrigger value="events">Eventos</TabsTrigger>
                    <TabsTrigger value="users">Usuários</TabsTrigger>
                    <TabsTrigger value="activities">Atividades</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Users */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-yellow-500" />
                                    Top 10 Usuários
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {leaderboards.slice(0, 10).map((user, index) => (
                                        <div key={user.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' : 'bg-gray-200'}`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-xs text-gray-500">Nível {user.level}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">{user.total_points}</p>
                                                <p className="text-xs text-gray-500">pontos</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activities */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-blue-500" />
                                    Atividades Recentes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {userActivities.slice(0, 10).map((activity) => (
                                        <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                {getCategoryIcon(activity.activity_type)}
                                                <div>
                                                    <p className="font-medium text-sm">{activity.user_profiles?.name}</p>
                                                    <p className="text-xs text-gray-600">{activity.activity_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-green-600">+{activity.points_earned}</div>
                                                <div className="text-xs text-gray-500">
                                                    {format(new Date(activity.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Achievements Tab */}
                <TabsContent value="achievements" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Create Achievement Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="w-5 h-5" />
                                    Nova Conquista
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="achievement-name">Nome</Label>
                                    <Input 
                                        id="achievement-name"
                                        value={newAchievement.name}
                                        onChange={(e) => setNewAchievement(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Ex: Streak Master"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="achievement-desc">Descrição</Label>
                                    <Textarea 
                                        id="achievement-desc"
                                        value={newAchievement.description}
                                        onChange={(e) => setNewAchievement(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Descrição da conquista"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="achievement-icon">Ícone</Label>
                                    <Input 
                                        id="achievement-icon"
                                        value={newAchievement.icon}
                                        onChange={(e) => setNewAchievement(prev => ({ ...prev, icon: e.target.value }))}
                                        placeholder="🏆"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="achievement-category">Categoria</Label>
                                    <Select value={newAchievement.category} onValueChange={(value) => setNewAchievement(prev => ({ ...prev, category: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="consistency">Consistência</SelectItem>
                                            <SelectItem value="milestone">Marco</SelectItem>
                                            <SelectItem value="social">Social</SelectItem>
                                            <SelectItem value="physical">Físico</SelectItem>
                                            <SelectItem value="nutrition">Alimentação</SelectItem>
                                            <SelectItem value="emotional">Emocional</SelectItem>
                                            <SelectItem value="spiritual">Espiritual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="achievement-points">Pontos de Recompensa</Label>
                                    <Input 
                                        id="achievement-points"
                                        type="number"
                                        value={newAchievement.points_reward}
                                        onChange={(e) => setNewAchievement(prev => ({ ...prev, points_reward: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="achievement-requirements">Requisitos (JSON)</Label>
                                    <Textarea 
                                        id="achievement-requirements"
                                        value={newAchievement.requirements}
                                        onChange={(e) => setNewAchievement(prev => ({ ...prev, requirements: e.target.value }))}
                                        placeholder='{"type": "consecutive_days", "target": 30}'
                                    />
                                </div>
                                <Button 
                                    onClick={createAchievement}
                                    disabled={isSubmitting || !newAchievement.name}
                                    className="w-full vida-smart-gradient"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4 mr-2" />
                                    )}
                                    Criar Conquista
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Achievements List */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="w-5 h-5" />
                                        Conquistas ({achievements.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {achievements.map((achievement) => (
                                            <div key={achievement.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{achievement.icon}</span>
                                                    <div>
                                                        <p className="font-medium">{achievement.name}</p>
                                                        <p className="text-sm text-gray-600">{achievement.description}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                {getCategoryIcon(achievement.category)}
                                                                <span className="ml-1">{achievement.category}</span>
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs">
                                                                {achievement.points_reward} pts
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => toggleAchievement(achievement.id, achievement.is_active)}
                                                    >
                                                        {achievement.is_active ? (
                                                            <Pause className="w-3 h-3" />
                                                        ) : (
                                                            <Play className="w-3 h-3" />
                                                        )}
                                                    </Button>
                                                    {achievement.is_active ? (
                                                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                                                    ) : (
                                                        <Badge className="bg-red-100 text-red-800">Inativo</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Events Tab */}
                <TabsContent value="events" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Create Event Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="w-5 h-5" />
                                    Novo Evento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="event-name">Nome</Label>
                                    <Input 
                                        id="event-name"
                                        value={newEvent.name}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Ex: Desafio Janeiro"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="event-desc">Descrição</Label>
                                    <Textarea 
                                        id="event-desc"
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Descrição do evento"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="event-type">Tipo</Label>
                                    <Select value={newEvent.event_type} onValueChange={(value) => setNewEvent(prev => ({ ...prev, event_type: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="challenge">Desafio</SelectItem>
                                            <SelectItem value="competition">Competição</SelectItem>
                                            <SelectItem value="special_event">Evento Especial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="event-start">Data Início</Label>
                                    <Input 
                                        id="event-start"
                                        type="datetime-local"
                                        value={newEvent.start_date}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, start_date: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="event-end">Data Fim</Label>
                                    <Input 
                                        id="event-end"
                                        type="datetime-local"
                                        value={newEvent.end_date}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, end_date: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="event-multiplier">Multiplicador de Pontos</Label>
                                    <Input 
                                        id="event-multiplier"
                                        type="number"
                                        step="0.1"
                                        value={newEvent.bonus_multiplier}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, bonus_multiplier: e.target.value }))}
                                    />
                                </div>
                                <Button 
                                    onClick={createEvent}
                                    disabled={isSubmitting || !newEvent.name || !newEvent.start_date || !newEvent.end_date}
                                    className="w-full vida-smart-gradient"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4 mr-2" />
                                    )}
                                    Criar Evento
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Events List */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        Eventos ({events.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {events.map((event) => (
                                            <div key={event.id} className="p-4 border rounded-lg">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="font-medium">{event.name}</h4>
                                                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => toggleEvent(event.id, event.is_active)}
                                                        >
                                                            {event.is_active ? (
                                                                <Pause className="w-3 h-3" />
                                                            ) : (
                                                                <Play className="w-3 h-3" />
                                                            )}
                                                        </Button>
                                                        {event.is_active ? (
                                                            <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                                                        ) : (
                                                            <Badge className="bg-red-100 text-red-800">Inativo</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <Badge className={getEventTypeColor(event.event_type)}>
                                                        {event.event_type === 'challenge' ? 'Desafio' : 
                                                         event.event_type === 'competition' ? 'Competição' : 'Evento Especial'}
                                                    </Badge>
                                                    <span>
                                                        {format(new Date(event.start_date), 'dd/MM/yyyy', { locale: ptBR })} - 
                                                        {format(new Date(event.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                                                    </span>
                                                    <span>{event.current_participants || 0} participantes</span>
                                                    {event.bonus_multiplier !== 1 && (
                                                        <span className="text-green-600 font-medium">
                                                            {event.bonus_multiplier}x pontos
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Estatísticas dos Usuários
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Usuário</TableHead>
                                        <TableHead>Nível</TableHead>
                                        <TableHead>Pontos Totais</TableHead>
                                        <TableHead>Sequência</TableHead>
                                        <TableHead>Conquistas</TableHead>
                                        <TableHead>Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userStats.slice(0, 20).map((user) => (
                                        <TableRow key={user.email}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">Nível {user.level}</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{user.total_points}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Flame className="w-4 h-4 text-orange-500" />
                                                    {user.current_streak}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{user.achievements_count}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const points = prompt('Quantos pontos conceder?');
                                                        const reason = prompt('Motivo da concessão:');
                                                        if (points && reason) {
                                                            awardPointsToUser(user.user_id, parseInt(points), 'Pontos Admin', reason);
                                                        }
                                                    }}
                                                >
                                                    <Gift className="w-3 h-3 mr-1" />
                                                    Conceder Pontos
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activities Tab */}
                <TabsContent value="activities" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Log de Atividades Recentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Usuário</TableHead>
                                        <TableHead>Atividade</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Pontos</TableHead>
                                        <TableHead>Data</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userActivities.map((activity) => (
                                        <TableRow key={activity.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{activity.user_profiles?.name}</p>
                                                    <p className="text-sm text-gray-500">{activity.user_profiles?.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{activity.activity_name}</p>
                                                    <p className="text-sm text-gray-500">{activity.description}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {getCategoryIcon(activity.activity_type)}
                                                    <span className="text-sm">{activity.activity_type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-green-600">
                                                    +{activity.points_earned}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default GamificationManagementTab;