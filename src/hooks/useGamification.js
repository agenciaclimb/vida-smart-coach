import { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useGamification = () => {
  const { user } = useAuth();
  const [gamificationData, setGamificationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGamificationData();
    }
  }, [user]);

  const fetchGamificationData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('total_points, current_level, current_streak, longest_streak, last_activity_date')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setGamificationData(data);
    } catch (error) {
      console.error('Erro ao buscar dados de gamificação:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPoints = async (points, activityType, description = '') => {
    if (!user) return false;

    try {
      // Registra a atividade
      const { error: activityError } = await supabase
        .from('daily_activities')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          activity_name: description || activityType,
          points_earned: points,
          description: description
        });

      if (activityError) throw activityError;

      // Atualiza os pontos do usuário
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          total_points: (gamificationData?.total_points || 0) + points,
          current_level: Math.floor(((gamificationData?.total_points || 0) + points) / 100) + 1,
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Atualiza o estado local
      setGamificationData(prev => ({
        ...prev,
        total_points: (prev?.total_points || 0) + points,
        current_level: Math.floor(((prev?.total_points || 0) + points) / 100) + 1,
        last_activity_date: new Date().toISOString().split('T')[0]
      }));

      // Verifica se desbloqueou alguma conquista
      await checkAchievements();

      // Mostra notificação
      toast.success(`+${points} pontos! ${description}`, {
        icon: '⭐',
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erro ao adicionar pontos:', error);
      toast.error('Erro ao registrar pontos');
      return false;
    }
  };

  const updateStreak = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const lastActivityDate = gamificationData?.last_activity_date;

      let newStreak = 1;
      
      if (lastActivityDate === yesterday) {
        // Continuou a sequência
        newStreak = (gamificationData?.current_streak || 0) + 1;
      } else if (lastActivityDate === today) {
        // Já fez atividade hoje
        return;
      }

      const newLongestStreak = Math.max(newStreak, gamificationData?.longest_streak || 0);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_activity_date: today
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setGamificationData(prev => ({
        ...prev,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today
      }));

      // Bônus por sequência
      if (newStreak > 1) {
        const bonusPoints = Math.min(newStreak * 2, 20); // Máximo 20 pontos de bônus
        await addPoints(bonusPoints, 'streak', `Sequência de ${newStreak} dias!`);
      }

    } catch (error) {
      console.error('Erro ao atualizar sequência:', error);
    }
  };

  const checkAchievements = async () => {
    if (!user || !gamificationData) return;

    try {
      // Busca conquistas disponíveis
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .lte('points_required', gamificationData.total_points);

      if (achievementsError) throw achievementsError;

      // Busca conquistas já desbloqueadas
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id);

      if (userAchievementsError) throw userAchievementsError;

      const unlockedIds = userAchievements.map(ua => ua.achievement_id);
      const newAchievements = achievements.filter(a => !unlockedIds.includes(a.id));

      // Desbloqueia novas conquistas
      for (const achievement of newAchievements) {
        const { error } = await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id
          });

        if (!error) {
          toast.success(`🏆 Conquista desbloqueada: ${achievement.name}!`, {
            duration: 5000
          });
        }
      }

    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
    }
  };

  const getPointsForActivity = (activityType) => {
    const pointsMap = {
      'daily_checkin': 10,
      'water_intake': 5,
      'exercise': 20,
      'meditation': 15,
      'sleep_tracking': 10,
      'nutrition_log': 15,
      'weight_log': 10,
      'mood_tracking': 5,
      'goal_completion': 25,
      'referral': 50
    };

    return pointsMap[activityType] || 5;
  };

  const recordActivity = async (activityType, description = '') => {
    const points = getPointsForActivity(activityType);
    const success = await addPoints(points, activityType, description);
    
    if (success && activityType === 'daily_checkin') {
      await updateStreak();
    }
    
    return success;
  };

  const getLevelProgress = () => {
    if (!gamificationData) return 0;
    const totalPoints = gamificationData.total_points || 0;
    const currentLevel = gamificationData.current_level || 1;
    const pointsForCurrentLevel = (currentLevel - 1) * 100;
    const pointsForNextLevel = currentLevel * 100;
    const progressPoints = totalPoints - pointsForCurrentLevel;
    const levelRange = pointsForNextLevel - pointsForCurrentLevel;
    return Math.min((progressPoints / levelRange) * 100, 100);
  };

  const getNextLevelPoints = () => {
    if (!gamificationData) return 100;
    const currentLevel = gamificationData.current_level || 1;
    return currentLevel * 100;
  };

  return {
    gamificationData,
    loading,
    addPoints,
    recordActivity,
    updateStreak,
    checkAchievements,
    getLevelProgress,
    getNextLevelPoints,
    getPointsForActivity,
    fetchGamificationData
  };
};

