import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';

/**
 * Hook para gerenciar conclusões de itens dos planos
 * Integrado com sistema de gamificação
 * 
 * @param {string} userId - ID do usuário autenticado
 * @param {string} planType - Tipo do plano: 'physical' | 'nutritional' | 'emotional' | 'spiritual'
 * @returns {object} - Estado e funções para gerenciar completions
 */
export const usePlanCompletions = (userId, planType) => {
  const [completions, setCompletions] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Carrega conclusões do Supabase para o plano atual
   */
  const loadCompletions = useCallback(async () => {
    if (!userId || !planType) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('plan_completions')
        .select('item_identifier, completed_at, points_awarded')
        .eq('user_id', userId)
        .eq('plan_type', planType);

      if (fetchError) throw fetchError;

      // Criar Map para acesso O(1)
      const completionsMap = new Map(
        (data || []).map(item => [item.item_identifier, item])
      );

      setCompletions(completionsMap);
    } catch (err) {
      console.error('Erro ao carregar conclusões:', err);
      setError(err.message);
      toast.error('Erro ao carregar progresso');
    } finally {
      setLoading(false);
    }
  }, [userId, planType]);

  /**
   * Toggle (marca/desmarca) conclusão de um item
   * 
   * @param {string} itemIdentifier - ID único do item (ex: "week_1_workout_0_exercise_2")
   * @param {string} itemType - Tipo do item: 'exercise' | 'workout' | 'meal' | 'routine' | 'practice' | 'goal' | 'technique'
   * @param {number} points - Pontos XP a serem concedidos (default: 5)
   * @returns {Promise<boolean>} - true se operação foi bem-sucedida
   */
  const toggleCompletion = useCallback(async (itemIdentifier, itemType, points = 5) => {
    if (!userId || !planType) {
      toast.error('Usuário ou plano não identificado');
      return false;
    }

    const isCompleted = completions.has(itemIdentifier);

    try {
      if (isCompleted) {
        // DESMARCAR - deletar do banco
        const { error: deleteError } = await supabase
          .from('plan_completions')
          .delete()
          .eq('user_id', userId)
          .eq('plan_type', planType)
          .eq('item_identifier', itemIdentifier);

        if (deleteError) throw deleteError;

        // Atualizar estado local
        const newCompletions = new Map(completions);
        newCompletions.delete(itemIdentifier);
        setCompletions(newCompletions);

        toast.success('Item desmarcado');
        return true;

      } else {
        // MARCAR - inserir no banco
        const { error: insertError } = await supabase
          .from('plan_completions')
          .insert({
            user_id: userId,
            plan_type: planType,
            item_type: itemType,
            item_identifier: itemIdentifier,
            points_awarded: points
          });

        if (insertError) throw insertError;

        // Atualizar estado local
        const newCompletions = new Map(completions);
        newCompletions.set(itemIdentifier, {
          item_identifier: itemIdentifier,
          completed_at: new Date().toISOString(),
          points_awarded: points
        });
        setCompletions(newCompletions);

        // Feedback visual
        toast.success(`+${points} XP! 🎉`, {
          icon: '✅',
          duration: 2000
        });

        return true;
      }
    } catch (err) {
      console.error('Erro ao alternar conclusão:', err);
      toast.error('Erro ao salvar progresso');
      return false;
    }
  }, [userId, planType, completions]);

  /**
   * Verifica se um item está concluído
   * 
   * @param {string} itemIdentifier - ID único do item
   * @returns {boolean}
   */
  const isItemCompleted = useCallback((itemIdentifier) => {
    return completions.has(itemIdentifier);
  }, [completions]);

  /**
   * Obtém estatísticas de conclusão
   * 
   * @returns {object} - { total: number, totalPoints: number }
   */
  const getStats = useCallback(() => {
    const items = Array.from(completions.values());
    return {
      total: items.length,
      totalPoints: items.reduce((sum, item) => sum + (item.points_awarded || 0), 0)
    };
  }, [completions]);

  // Carregar conclusões na montagem e quando userId/planType mudarem
  useEffect(() => {
    loadCompletions();
  }, [loadCompletions]);

  return {
    completions: completions,
    loading,
    error,
    toggleCompletion,
    isItemCompleted,
    getStats,
    reload: loadCompletions
  };
};
