import { useState, useCallback } from 'react';
import { supabase } from '@/core/supabase';
import { toast } from 'react-hot-toast';

export const useAdminGeneral = () => {
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [userMetrics, setUserMetrics] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const fetchRedemptionHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('redemption_history')
        .select('*, profile:profiles(full_name)')
        .order('redeemed_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setRedemptionHistory(data || []);
    } catch (error) {
      toast.error('Erro ao buscar histórico de resgates.');
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const fetchUserMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
        const { data, error } = await supabase
            .from('user_metrics')
            .select('date, weight, mood_score, sleep_hours');
        if (error) throw error;
        setUserMetrics(data || []);
    } catch (error) {
        toast.error("Erro ao carregar métricas de usuário.");
        console.error(error);
    } finally {
        setLoadingMetrics(false);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          content,
          created_at,
          role,
          user_id,
          profile:profiles (
            id, full_name, phone, plan
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const latestConversations = data.reduce((acc, curr) => {
          if (curr.profile && (!acc[curr.user_id] || new Date(curr.created_at) > new Date(acc[curr.user_id].lastMessageTime))) {
              acc[curr.user_id] = {
                  ...curr.profile,
                  lastMessage: curr.content,
                  lastMessageTime: curr.created_at,
                  tags: curr.profile.plan === 'vip' ? ['VIP'] : curr.profile.plan === 'trial' ? ['Lead', 'Em Teste'] : ['Ativo']
              };
          }
          return acc;
      }, {});

      setConversations(Object.values(latestConversations));
    } catch (error) {
      toast.error("Erro ao carregar conversas.");
      console.error(error);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    await Promise.all([
        fetchRedemptionHistory(),
        fetchUserMetrics(),
        fetchConversations()
    ]);
  }, [fetchRedemptionHistory, fetchUserMetrics, fetchConversations]);

  return {
    redemptionHistory, loadingHistory, fetchRedemptionHistory,
    userMetrics, loadingMetrics, fetchUserMetrics,
    conversations, loadingConversations, fetchConversations,
    fetchData,
  };
};