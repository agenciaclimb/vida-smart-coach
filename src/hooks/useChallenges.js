// useChallenges.js - Hook customizado para gerenciar desafios
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export const useChallenges = (userId) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Carregar desafios ativos
  const loadChallenges = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Usar a view que já calcula hours_remaining
      const { data, error } = await supabase
        .from('user_active_challenges')
        .select('*')
        .eq('user_id', userId)
        .order('end_date', { ascending: true });

      if (error) throw error;

      setChallenges(data || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
      toast.error('Erro ao carregar desafios');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Atualizar progresso de um desafio específico
  const updateProgress = useCallback(async (eventId) => {
    if (!userId) return;

    try {
      setUpdating(true);

      // Chamar Edge Function para calcular progresso
      const { data, error } = await supabase.functions.invoke('challenge-manager', {
        body: {
          action: 'check_progress',
          user_id: userId,
          event_id: eventId
        }
      });

      if (error) throw error;

      // Recarregar desafios se houve mudança no progresso
      if (data?.updated) {
        await loadChallenges();
        
        // Se o desafio foi completado, mostrar notificação
        if (data.completed) {
          toast.success(`🎉 Desafio completado! +${data.points_earned} XP`, {
            duration: 5000,
            icon: '🏆'
          });
        }
      }

      return data;
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Erro ao atualizar progresso');
      return null;
    } finally {
      setUpdating(false);
    }
  }, [userId, loadChallenges]);

  // Atualizar progresso de todos os desafios ativos
  const updateAllProgress = useCallback(async () => {
    if (!challenges.length) return;

    const activeChallenges = challenges.filter(
      c => c.is_participating && !c.is_completed
    );

    for (const challenge of activeChallenges) {
      await updateProgress(challenge.id);
    }
  }, [challenges, updateProgress]);

  // Participar de um desafio
  const joinChallenge = useCallback(async (eventId) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('user_event_participation')
        .insert({
          user_id: userId,
          event_id: eventId,
          current_progress: {}
        });

      if (error) throw error;

      toast.success('🎉 Você entrou no desafio!');
      await loadChallenges();
      return true;
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error('Erro ao participar do desafio');
      return false;
    }
  }, [userId, loadChallenges]);

  // Gerar novos desafios (admin action)
  const generateChallenge = useCallback(async (type = 'weekly') => {
    try {
      const action = type === 'weekly' ? 'generate_weekly' : 'generate_monthly';
      
      const { data, error } = await supabase.functions.invoke('challenge-manager', {
        body: { action }
      });

      if (error) throw error;

      toast.success(`Novo desafio ${type === 'weekly' ? 'semanal' : 'mensal'} criado!`);
      await loadChallenges();
      return data;
    } catch (error) {
      console.error('Error generating challenge:', error);
      toast.error('Erro ao gerar desafio');
      return null;
    }
  }, [loadChallenges]);

  // Carregar desafios ao montar e configurar polling
  useEffect(() => {
    loadChallenges();

    // Atualizar progresso a cada 5 minutos
    const interval = setInterval(() => {
      updateAllProgress();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId, loadChallenges, updateAllProgress]);

  // Subscription para mudanças em tempo real
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('challenges-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gamification_events'
        },
        () => {
          loadChallenges();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_event_participation',
          filter: `user_id=eq.${userId}`
        },
        () => {
          loadChallenges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadChallenges]);

  return {
    challenges,
    loading,
    updating,
    loadChallenges,
    updateProgress,
    updateAllProgress,
    joinChallenge,
    generateChallenge
  };
};
