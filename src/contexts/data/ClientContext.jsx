
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext_FINAL';
import { supabase } from '@/core/supabase';

const ClientContext = createContext(undefined);

export const ClientProvider = ({ children }) => {
    const { user } = useAuth();
    const [clientData, setClientData] = useState({
        userMetrics: [],
        trainingPlan: null,
    });
    const [loading, setLoading] = useState(true);

    const fetchClientData = useCallback(async (userId) => {
        if (!userId) return;
        setLoading(true);
        try {
            const [metricsRes, planRes] = await Promise.all([
                supabase.from('user_metrics').select('*').eq('user_id', userId).order('date', { ascending: false }),
                supabase.from('training_plans').select('*').eq('user_id', userId).maybeSingle()
            ]);

            if (metricsRes.error) throw metricsRes.error;
            if (planRes.error) throw planRes.error;

            setClientData({
                userMetrics: metricsRes.data || [],
                trainingPlan: planRes.data || null,
            });

        } catch (error) {
            toast.error("Erro ao carregar seus dados.");
            console.error("Client data fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetchData = useCallback((userId) => {
      if (userId) {
        fetchClientData(userId);
      }
    }, [fetchClientData]);
    
    useEffect(() => {
      if (user?.id && user.profile?.role === 'client') {
          fetchClientData(user.id);
      }
    }, [user, fetchClientData]);

    const value = useMemo(() => ({
        ...clientData,
        loading,
        refetchData,
        fetchClientData
    }), [clientData, loading, refetchData, fetchClientData]);

    return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
};

export const useClient = () => {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error('useClient must be used within a ClientProvider');
    }
    return context;
};
