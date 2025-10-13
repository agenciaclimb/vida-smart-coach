import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/core/supabase';
import { useAuth } from '@/components/auth/AuthProvider';

const GamificationContext = createContext(undefined);

export const GamificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [gamificationData, setGamificationData] = useState(null);
    const [dailyActivities, setDailyActivities] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [userAchievements, setUserAchievements] = useState([]);
    const [dailyMissions, setDailyMissions] = useState([]);
    const [leaderboards, setLeaderboards] = useState({
        global: [],
        weekly: [],
        monthly: [],
        category: {}
    });
    const [events, setEvents] = useState([]);
    const [userParticipation, setUserParticipation] = useState([]);
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);

    // ==========================================
    // FETCH FUNCTIONS
    // ==========================================

    const fetchGamificationData = useCallback(async () => {
        if (!user?.id) return;
        
        try {
            const { data, error } = await supabase
                .from('gamification')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (!data) {
                // New user detected, run the onboarding function
                const { data: newUserGamificationData, error: onboardError } = await supabase.rpc('handle_new_user_onboarding');

                if (onboardError) {
                    throw onboardError;
                }
                
                setGamificationData(newUserGamificationData);
                toast.success('Boas-vindas! Você ganhou seus primeiros pontos! 🎉');
            } else {
                setGamificationData(data);
            }
        } catch (error) {
            console.error('Error fetching gamification data:', error);
            toast.error('Erro ao carregar dados de gamificação');
        }
    }, [user?.id]);

    const fetchDailyActivities = useCallback(async (startDate, endDate) => {
        if (!user?.id) return;
        
        try {
            let query = supabase
                .from('daily_activities')
                .select('*')
                .eq('user_id', user.id)
                .order('activity_date', { ascending: false });
            
            if (startDate) query = query.gte('activity_date', startDate);
            if (endDate) query = query.lte('activity_date', endDate);

            const { data, error } = await query;
            if (error) throw error;
            
            setDailyActivities(data || []);
        } catch (error) {
            console.error('Error fetching daily activities:', error);
            toast.error('Erro ao carregar atividades diárias');
        }
    }, [user?.id]);

    const fetchAchievements = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('achievements')
                .select('*')
                .eq('is_active', true)
                .order('category', { ascending: true });

            if (error) throw error;
            setAchievements(data || []);
        } catch (error) {
            console.error('Error fetching achievements:', error);
            toast.error('Erro ao carregar conquistas');
        }
    }, []);

    const fetchUserAchievements = useCallback(async () => {
        if (!user?.id) return;
        
        try {
            const { data, error } = await supabase
                .from('user_achievements')
                .select(`
                    *,
                    achievements!inner(*)
                `)
                .eq('user_id', user.id)
                .order('earned_at', { ascending: false });

            if (error) throw error;
            setUserAchievements(data || []);
        } catch (error) {
            console.error('Error fetching user achievements:', error);
            toast.error('Erro ao carregar suas conquistas');
        }
    }, [user?.id]);

    const fetchDailyMissions = useCallback(async (date = new Date().toISOString().split('T')[0]) => {
        if (!user?.id) return;
        
        try {
            const { data, error } = await supabase
                .from('daily_missions')
                .select('*')
                .eq('user_id', user.id)
                .eq('mission_date', date)
                .order('mission_type', { ascending: true });

            if (error) throw error;
            setDailyMissions(data || []);

            // Se não há missões para hoje, gerar novas
            if (!data || data.length === 0) {
                await generateDailyMissions(date);
            }
        } catch (error) {
            console.error('Error fetching daily missions:', error);
            toast.error('Erro ao carregar missões diárias');
        }
    }, [user?.id]);

    const fetchLeaderboards = useCallback(async () => {
        try {
            // Global leaderboard
            const { data: globalData, error: globalError } = await supabase
                .from('user_gamification_summary')
                .select('*')
                .order('total_points', { ascending: false })
                .limit(100);

            if (globalError) throw globalError;

            // Category leaderboards
            const categories = ['physical', 'nutrition', 'emotional', 'spiritual'];
            const categoryLeaderboards = {};

            for (const category of categories) {
                const { data: categoryData, error: categoryError } = await supabase
                    .from('user_gamification_summary')
                    .select('*')
                    .order(`${category}_points`, { ascending: false })
                    .limit(50);

                if (!categoryError) {
                    categoryLeaderboards[category] = categoryData || [];
                }
            }

            setLeaderboards({
                global: globalData || [],
                category: categoryLeaderboards
            });
        } catch (error) {
            console.error('Error fetching leaderboards:', error);
            toast.error('Erro ao carregar rankings');
        }
    }, []);

    const fetchEvents = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('gamification_events')
                .select('*')
                .eq('is_active', true)
                .gte('end_date', new Date().toISOString())
                .order('start_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Erro ao carregar eventos');
        }
    }, []);

    const fetchUserParticipation = useCallback(async () => {
        if (!user?.id) return;
        
        try {
            const { data, error } = await supabase
                .from('user_event_participation')
                .select(`
                    *,
                    gamification_events!inner(*)
                `)
                .eq('user_id', user.id)
                .order('joined_at', { ascending: false });

            if (error) throw error;
            setUserParticipation(data || []);
        } catch (error) {
            console.error('Error fetching user participation:', error);
        }
    }, [user?.id]);

    const fetchReferrals = useCallback(async () => {
        if (!user?.id) return;
        
        try {
            const { data, error } = await supabase
                .from('referrals')
                .select('*')
                .eq('referrer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReferrals(data || []);
        } catch (error) {
            console.error('Error fetching referrals:', error);
        }
    }, [user?.id]);

    // ==========================================
    // ACTION FUNCTIONS
    // ==========================================

    const addDailyActivity = useCallback(async (activityData) => {
        if (!user?.id) return;

        try {
            const activity = {
                user_id: user.id,
                activity_date: activityData.date || new Date().toISOString().split('T')[0],
                activity_type: activityData.type,
                activity_name: activityData.name,
                points_earned: activityData.points,
                is_bonus: activityData.isBonus || false,
                bonus_type: activityData.bonusType || null,
                description: activityData.description || '',
                metadata: activityData.metadata || {}
            };

            const { data, error } = await supabase
                .from('daily_activities')
                .insert([activity])
                .select()
                .single();

            if (error) throw error;

            // Refresh data
            await fetchGamificationData();
            await fetchDailyActivities();
            
            toast.success(`+${activityData.points} pontos! 🎉`);
            return data;
        } catch (error) {
            console.error('Error adding daily activity:', error);
            if (error.code === '23505') {
                toast.error('Atividade já registrada hoje!');
            } else {
                toast.error('Erro ao registrar atividade');
            }
            throw error;
        }
    }, [user?.id, fetchGamificationData, fetchDailyActivities]);

    const completeMission = useCallback(async (missionId, progress = {}) => {
        if (!user?.id) return;

        try {
            const { data, error } = await supabase
                .from('daily_missions')
                .update({
                    is_completed: true,
                    completed_at: new Date().toISOString(),
                    current_progress: progress
                })
                .eq('id', missionId)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            // Add points for mission completion
            await addDailyActivity({
                type: 'mission',
                name: `Missão: ${data.title}`,
                points: data.points_reward,
                description: `Missão ${data.mission_type} completada`,
                metadata: { missionId, originalMission: data }
            });

            await fetchDailyMissions();
            toast.success(`Missão completada! +${data.points_reward} pontos! 🎯`);
            
            return data;
        } catch (error) {
            console.error('Error completing mission:', error);
            toast.error('Erro ao completar missão');
            throw error;
        }
    }, [user?.id, addDailyActivity, fetchDailyMissions]);

    const generateDailyMissions = useCallback(async (date = new Date().toISOString().split('T')[0]) => {
        if (!user?.id) return;

        try {
            const { error } = await supabase.rpc('generate_daily_missions_for_user', {
                p_user_id: user.id,
                p_date: date
            });

            if (error) throw error;
            await fetchDailyMissions(date);
        } catch (error) {
            console.error('Error generating daily missions:', error);
            toast.error('Erro ao gerar missões diárias');
        }
    }, [user?.id, fetchDailyMissions]);

    const joinEvent = useCallback(async (eventId) => {
        if (!user?.id) return;

        try {
            const participation = {
                user_id: user.id,
                event_id: eventId,
                current_progress: {},
                is_completed: false
            };

            const { data, error } = await supabase
                .from('user_event_participation')
                .insert([participation])
                .select()
                .single();

            if (error) throw error;

            // Update event participant count
            await supabase.rpc('increment_event_participants', { event_uuid: eventId });

            await fetchUserParticipation();
            toast.success('Você entrou no evento! 🎉');
            
            return data;
        } catch (error) {
            console.error('Error joining event:', error);
            if (error.code === '23505') {
                toast.error('Você já está participando deste evento!');
            } else {
                toast.error('Erro ao entrar no evento');
            }
            throw error;
        }
    }, [user?.id, fetchUserParticipation]);

    const createReferral = useCallback(async (referredUserId, referralCode = null) => {
        if (!user?.id) return;

        try {
            const referral = {
                referrer_id: user.id,
                referred_id: referredUserId,
                referral_code: referralCode,
                status: 'registered',
                points_earned: 200, // Points for registration
                milestone_reached: 'registration'
            };

            const { data, error } = await supabase
                .from('referrals')
                .insert([referral])
                .select()
                .single();

            if (error) throw error;

            // Add referral points
            await addDailyActivity({
                type: 'referral',
                name: 'Indicação realizada',
                points: 200,
                description: 'Amigo se cadastrou via sua indicação',
                metadata: { referralId: data.id, milestone: 'registration' }
            });

            await fetchReferrals();
            toast.success('Indicação registrada! +200 pontos! 🤝');
            
            return data;
        } catch (error) {
            console.error('Error creating referral:', error);
            toast.error('Erro ao registrar indicação');
            throw error;
        }
    }, [user?.id, addDailyActivity, fetchReferrals]);

    const updateReferralMilestone = useCallback(async (referralId, newStatus, points, milestone) => {
        try {
            const { error } = await supabase
                .from('referrals')
                .update({
                    status: newStatus,
                    points_earned: points,
                    milestone_reached: milestone,
                    updated_at: new Date().toISOString()
                })
                .eq('id', referralId);

            if (error) throw error;

            // Add milestone points
            await addDailyActivity({
                type: 'referral',
                name: `Indicação: ${milestone}`,
                points: points,
                description: `Amigo alcançou marco: ${milestone}`,
                metadata: { referralId, milestone, status: newStatus }
            });

            await fetchReferrals();
        } catch (error) {
            console.error('Error updating referral milestone:', error);
            toast.error('Erro ao atualizar indicação');
            throw error;
        }
    }, [addDailyActivity, fetchReferrals]);

    // ==========================================
    // COMPUTED VALUES
    // ==========================================

    const userStats = useMemo(() => {
        if (!gamificationData) return null;

        const pointsForNextLevel = gamificationData.level * 1000;
        const currentLevelProgress = gamificationData.total_points % 1000;
        const progressPercentage = (currentLevelProgress / 1000) * 100;

        return {
            ...gamificationData,
            pointsForNextLevel,
            currentLevelProgress,
            progressPercentage,
            totalBadges: userAchievements.length,
            todayActivities: dailyActivities.filter(a => 
                a.activity_date === new Date().toISOString().split('T')[0]
            ).length,
            currentMissions: dailyMissions.filter(m => !m.is_completed).length,
            completedMissions: dailyMissions.filter(m => m.is_completed).length
        };
    }, [gamificationData, userAchievements, dailyActivities, dailyMissions]);

    const userRankings = useMemo(() => {
        if (!gamificationData || !leaderboards.global.length) return null;

        const globalRank = leaderboards.global.findIndex(u => u.email === user?.email) + 1;
        
        const categoryRanks = {};
        Object.keys(leaderboards.category).forEach(category => {
            const rank = leaderboards.category[category].findIndex(u => u.email === user?.email) + 1;
            categoryRanks[category] = rank > 0 ? rank : null;
        });

        return {
            global: globalRank > 0 ? globalRank : null,
            categories: categoryRanks
        };
    }, [gamificationData, leaderboards, user?.email]);

    // ==========================================
    // EFFECTS
    // ==========================================

    useEffect(() => {
        if (user?.id) {
            const fetchAllData = async () => {
                setLoading(true);
                try {
                    await Promise.all([
                        fetchGamificationData(),
                        fetchDailyActivities(),
                        fetchAchievements(),
                        fetchUserAchievements(),
                        fetchDailyMissions(),
                        fetchLeaderboards(),
                        fetchEvents(),
                        fetchUserParticipation(),
                        fetchReferrals()
                    ]);
                } finally {
                    setLoading(false);
                }
            };

            fetchAllData();
        }
    }, [user?.id]);

    // ==========================================
    // CONTEXT VALUE
    // ==========================================

    const value = useMemo(() => ({
        // Data
        gamificationData,
        dailyActivities,
        achievements,
        userAchievements,
        dailyMissions,
        leaderboards,
        events,
        userParticipation,
        referrals,
        loading,
        
        // Computed
        userStats,
        userRankings,

        // Actions
        addDailyActivity,
        completeMission,
        generateDailyMissions,
        joinEvent,
        createReferral,
        updateReferralMilestone,

        // Refresh functions
        fetchGamificationData,
        fetchDailyActivities,
        fetchAchievements,
        fetchUserAchievements,
        fetchDailyMissions,
        fetchLeaderboards,
        fetchEvents,
        fetchUserParticipation,
        fetchReferrals
    }), [
        gamificationData, dailyActivities, achievements, userAchievements,
        dailyMissions, leaderboards, events, userParticipation, referrals,
        loading, userStats, userRankings,
        addDailyActivity, completeMission, generateDailyMissions, joinEvent,
        createReferral, updateReferralMilestone,
        fetchGamificationData, fetchDailyActivities, fetchAchievements,
        fetchUserAchievements, fetchDailyMissions, fetchLeaderboards,
        fetchEvents, fetchUserParticipation, fetchReferrals
    ]);

    return (
        <GamificationContext.Provider value={value}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (context === undefined) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
};