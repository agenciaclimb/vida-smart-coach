
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/core/supabase';

const ClientContext = createContext(undefined);

export const ClientProvider = ({ children }) => {
    const { user } = useAuth();
    const [clientData, setClientData] = useState({
        userMetrics: [],
        trainingPlan: null,
    });
    const [loading, setLoading] = useState(true);
    const abortControllerRef = useRef(null);

    const fetchClientData = useCallback(async (userId) => {
        if (!userId) {
            setLoading(false);
            return;
        }
        
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        setLoading(true);
        try {
            const [metricsRes, planRes] = await Promise.all([
                supabase.from('user_metrics').select('*').eq('user_id', userId).order('date', { ascending: false }).abortSignal(abortControllerRef.current.signal),
                supabase.from('training_plans').select('*').eq('user_id', userId).maybeSingle().abortSignal(abortControllerRef.current.signal)
            ]);

            if (metricsRes.error) throw metricsRes.error;
            if (planRes.error) throw planRes.error;

            setClientData({
                userMetrics: metricsRes.data || [],
                trainingPlan: planRes.data || null,
            });

        } catch (error) {
            if (error.name !== 'AbortError') {
                toast.error("Erro ao carregar seus dados.");
                console.error("Client data fetch error:", error);
            }
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
      
      return () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
      };
    }, [user?.id, user?.profile?.role, fetchClientData]);

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
