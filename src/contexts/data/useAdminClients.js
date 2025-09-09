
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, invokeFn } from '@/core/supabase';
import { toast } from 'react-hot-toast';

export const useAdminClients = (
  supabaseClient = supabase,
  parentSetLoading,
  onDataChange
) => {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const fetchedRef = useRef(false);

  const fetchClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      const { data, error } = await supabaseClient
        .from('user_profiles')
        .select(`
          id,
          user_id,
          name,
          email:users(email),
          phone,
          plan,
          created_at,
          onboarding_stage,
          gamification:gamification(total_points)
        `)
        .in('role', ['client']);

      if (error) throw error;
      
      const formattedData = data.map(c => ({
        ...c,
        full_name: c.name,
        points: c.gamification?.total_points || 0,
        user_id: c.user_id,
        email: c.users?.email || 'N/A'
      }));
      setClients(formattedData || []);

    } catch (error) {
      toast.error('Falha ao carregar clientes.');
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  }, [supabaseClient]);

  const saveClient = useCallback(async (clientData, clientId) => {
    parentSetLoading(true);
    const toastId = toast.loading(clientId ? 'Atualizando cliente...' : 'Criando cliente...');
    try {
      await invokeFn(clientId ? 'admin-update-client' : 'admin-create-client', { clientData, clientId });
      
      await fetchClients();
      if(onDataChange) onDataChange();
      toast.success(clientId ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!', { id: toastId });
      return true;
    } catch (error) {
      toast.error(`Erro: ${error.message}`, { id: toastId });
      return false;
    } finally {
      parentSetLoading(false);
    }
  }, [fetchClients, onDataChange, parentSetLoading]);

  const deleteClient = useCallback(async (clientId) => {
    parentSetLoading(true);
    const toastId = toast.loading('Excluindo cliente...');
    try {
      await invokeFn('admin-delete-client', { clientId });

      await fetchClients();
      if(onDataChange) onDataChange();
      toast.success('Cliente excluído com sucesso!', { id: toastId });
      return true;
    } catch (error) {
      toast.error(`Erro ao excluir: ${error.message}`, { id: toastId });
      return false;
    } finally {
      parentSetLoading(false);
    }
  }, [fetchClients, onDataChange, parentSetLoading]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loadingClients,
    fetchClients,
    saveClient,
    deleteClient,
  };
};
