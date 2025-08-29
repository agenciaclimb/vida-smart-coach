
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from 'react-hot-toast';

export const useAdminAutomations = () => {
  const [automations, setAutomations] = useState([]);
  const [loadingAutomations, setLoadingAutomations] = useState(true);

  const fetchAutomations = useCallback(async () => {
    setLoadingAutomations(true);
    try {
      const { data, error } = await supabase.from('automations').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      setAutomations(data);
    } catch (error) {
      toast.error('Erro ao buscar automações.');
      console.error(error);
    } finally {
      setLoadingAutomations(false);
    }
  }, []);
  
  const updateAutomationStatus = useCallback(async (id, isActive) => {
    try {
      const { error } = await supabase
        .from('automations')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Automação ${isActive ? 'ativada' : 'desativada'} com sucesso.`);
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: isActive } : a));
    } catch (error) {
      toast.error('Falha ao atualizar automação.');
      console.error(error);
    }
  }, []);

  const saveAutomation = useCallback(async (automationData) => {
    const toastId = toast.loading(automationData.id ? 'Atualizando automação...' : 'Criando automação...');
    try {
      const { error } = await supabase
        .from('automations')
        .upsert({ ...automationData, is_active: automationData.is_active ?? true }, { onConflict: 'id' });
      
      if (error) throw error;
      
      toast.success(automationData.id ? 'Automação atualizada com sucesso!' : 'Automação criada com sucesso!', { id: toastId });
      await fetchAutomations();
    } catch (error) {
      toast.error(`Erro ao salvar automação: ${error.message}`, { id: toastId });
      throw error;
    }
  }, [fetchAutomations]);

  return {
    automations,
    loadingAutomations,
    fetchAutomations,
    updateAutomationStatus,
    saveAutomation,
  };
};
