import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext_FINAL';
import { toast } from 'react-hot-toast';
import { useAdminGeneral } from '@/contexts/data/useAdminGeneral';
import { useAdminClients } from '@/contexts/data/useAdminClients';
import useAdminAffiliates from '@/contexts/data/useAdminAffiliates';
import { useAdminFinancials } from '@/contexts/data/useAdminFinancials';
import useAdminSettings from '@/contexts/data/useAdminSettings';
import { useAdminAutomations } from '@/contexts/data/useAdminAutomations';
import { invokeFn } from '@/core/supabase';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const { supabase, user } = useAuth();
  const [loading, setLoading] = useState(true);

  const generalData = useAdminGeneral(supabase, setLoading);
  const clientsData = useAdminClients(supabase, setLoading, generalData.refetchData);
  const affiliatesData = useAdminAffiliates(invokeFn, setLoading);
  const financialsData = useAdminFinancials(supabase, setLoading);
  const settingsData = useAdminSettings(supabase, invokeFn, setLoading);
  const automationsData = useAdminAutomations();

  const fetchData = useCallback(() => {
    if (user?.profile?.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      generalData.fetchData(),
      clientsData.fetchClients(),
      affiliatesData.fetchAffiliates(),
      financialsData.fetchFinancials(),
      settingsData.fetchSettings(),
      automationsData.fetchAutomations(),
    ]).catch(error => {
      toast.error(`Erro ao carregar dados do admin: ${error.message}`);
      console.error("Admin data fetch error:", error);
    }).finally(() => {
      setLoading(false);
    });
  }, [user, generalData, clientsData, affiliatesData, financialsData, settingsData, automationsData]);

  const value = useMemo(() => ({
    loading,
    fetchData,
    ...generalData,
    ...clientsData,
    ...affiliatesData,
    ...financialsData,
    ...settingsData,
    ...automationsData,
  }), [loading, fetchData, generalData, clientsData, affiliatesData, financialsData, settingsData, automationsData]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => useContext(AdminContext);