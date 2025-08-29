
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from 'react-hot-toast';

export const useAdminFinancials = () => {
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [loadingPayouts, setLoadingPayouts] = useState(true);

  const fetchPayoutRequests = useCallback(async () => {
    setLoadingPayouts(true);
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select(`*, partner:profiles(full_name)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPayoutRequests(data || []);
    } catch (error) {
      toast.error('Erro ao buscar solicitações de saque.');
      console.error(error);
    } finally {
      setLoadingPayouts(false);
    }
  }, []);
  
  const updatePayoutStatus = useCallback(async (id, status, notes) => {
    try {
      const { error } = await supabase
        .from('payout_requests')
        .update({ status, notes, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Solicitação de saque atualizada para "${status}".`);
      await fetchPayoutRequests();
    } catch (error) {
      toast.error('Falha ao atualizar status do saque.');
      console.error(error);
      throw error;
    }
  }, [fetchPayoutRequests]);

  return {
    payoutRequests,
    loadingPayouts,
    fetchPayoutRequests,
    updatePayoutStatus,
  };
};
