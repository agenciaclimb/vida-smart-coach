import { useState, useEffect } from 'react';
import { supabase } from '@/core/supabase';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * Hook para acessar dados consolidados de XP do usuário
 * Usa a view v_user_xp_totals que unifica pontuação de todas as fontes
 */
export function useUserXP() {
  const { user } = useAuth();
  const [xpData, setXpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setXpData(null);
      setLoading(false);
      return;
    }

    loadXPData();

    // Subscription para atualizar em tempo real
    const subscription = supabase
      .channel('user-xp-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gamification',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadXPData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_activities',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadXPData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadXPData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('v_user_xp_totals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (queryError) throw queryError;

      setXpData(data);
      setError(null);
    } catch (err) {
      console.error('Error loading XP data:', err);
      setError(err);
      // Fallback para dados zerados
      setXpData({
        user_id: user.id,
        xp_fisico: 0,
        xp_nutri: 0,
        xp_emocional: 0,
        xp_espiritual: 0,
        xp_total: 0,
        xp_7d: 0,
        xp_30d: 0,
        level: 0,
        progress_pct: 0,
        current_streak: 0,
        longest_streak: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    xpData,
    loading,
    error,
    reload: loadXPData,
  };
}
