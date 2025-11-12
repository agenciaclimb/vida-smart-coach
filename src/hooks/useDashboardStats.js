import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * useDashboardStats - Hook customizado para consolidar estatísticas do dashboard
 * 
 * Busca e calcula:
 * - Resumo semanal (treinos, nutrição, bem-estar, hidratação)
 * - Contadores (completions, interações)
 * - Última atividade
 * - Status de onboarding
 * 
 * @returns {Object} stats - Todas as estatísticas do dashboard
 */
export const useDashboardStats = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    weeklyData: {
      workouts: { current: 0, goal: 5 },
      nutrition: { current: 0, goal: 7 },
      wellbeing: { current: 0, goal: 3 },
      hydration: { current: 0, goal: 14, unit: 'L' }
    },
    completionsCount: 0,
    interactionsCount: 0,
    lastActivityDate: null,
    hasPlans: false
  });

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    loadDashboardStats();
  }, [user?.id]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Data dos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      // Buscar todas as atividades da última semana
      const { data: weeklyActivities, error: activitiesError } = await supabase
        .from('daily_activities')
        // xp_gained não existe em produção; não é usado no cálculo -> removido
        .select('activity_key, created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgoISO)
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;

      // Categorizar atividades por pilar
  const workoutKeys = ['treino', 'workout', 'exercise', 'caminhada', 'corrida', 'academia'];
  // Removido 'agua'/'water' daqui para não conflitar com hidratação
  const nutritionKeys = ['refeicao', 'meal', 'comida', 'dieta', 'nutrition'];
      const wellbeingKeys = ['meditacao', 'meditation', 'sono', 'sleep', 'relaxamento', 'yoga'];
      const hydrationKeys = ['agua', 'water', 'hidratacao', 'hydration'];

      const categorizeActivity = (activityKey) => {
        const key = activityKey.toLowerCase();
        if (workoutKeys.some(k => key.includes(k))) return 'workouts';
        if (nutritionKeys.some(k => key.includes(k))) return 'nutrition';
        if (wellbeingKeys.some(k => key.includes(k))) return 'wellbeing';
        if (hydrationKeys.some(k => key.includes(k))) return 'hydration';
        return null;
      };

      const weeklyCounts = {
        workouts: 0,
        nutrition: 0,
        wellbeing: 0,
        hydration: 0
      };

      const hoursHistogram = {};
      for (const activity of weeklyActivities || []) {
        const category = categorizeActivity(activity.activity_key);
        if (category) {
          weeklyCounts[category]++;
          // Extrair hora preferida a partir de atividades (prioridade para treinos)
          const hour = new Date(activity.created_at).getHours();
          const bucket = `${category}:${hour}`;
          hoursHistogram[bucket] = (hoursHistogram[bucket] || 0) + 1;
        }
      }

      // Buscar contadores gerais
      const [
        { count: completionsCount },
        { count: interactionsCount },
        { data: recentActivity }
      ] = await Promise.all([
        supabase
          .from('plan_completions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('interactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('daily_activities')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      // Buscar planos ativos
      const { data: plansData } = await supabase
        .from('user_plans')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Determinar horário preferido: prioriza treinos; fallback para geral
      const hourFrom = (cat) => {
        const entries = Object.entries(hoursHistogram)
          .filter(([key]) => key.startsWith(`${cat}:`))
          .map(([key, count]) => ({ hour: Number.parseInt(key.split(':')[1], 10), count }))
          .sort((a, b) => b.count - a.count);
        return entries[0]?.hour;
      };

      const preferredWorkoutHour = hourFrom('workouts');
      const preferredAnyHour = Object.entries(hoursHistogram)
        .map(([key, count]) => ({ hour: Number.parseInt(key.split(':')[1], 10), count }))
        .sort((a, b) => b.count - a.count)[0]?.hour;

      const preferredTime = preferredWorkoutHour ?? preferredAnyHour ?? null;

      setStats({
        weeklyData: {
          workouts: { current: weeklyCounts.workouts, goal: 5 },
          nutrition: { current: weeklyCounts.nutrition, goal: 7 },
          wellbeing: { current: weeklyCounts.wellbeing, goal: 3 },
          hydration: { current: weeklyCounts.hydration, goal: 14, unit: 'L' }
        },
        completionsCount: completionsCount ?? 0,
        interactionsCount: interactionsCount ?? 0,
        lastActivityDate: recentActivity?.created_at || null,
        hasPlans: plansData && plansData.length > 0,
        preferredTime: preferredTime === null ? null : { hour: preferredTime }
      });

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Manter valores padrão em caso de erro
    } finally {
      setLoading(false);
    }
  };

  return {
    ...stats,
    loading,
    reload: loadDashboardStats
  };
};
