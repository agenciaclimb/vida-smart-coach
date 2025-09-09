
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/core/supabase';

const IntegrationsContext = createContext(undefined);

export const IntegrationsProvider = ({ children }) => {
    const { user } = useAuth();
    const [userIntegrations, setUserIntegrations] = useState([]);
    const [adminIntegrations, setAdminIntegrations] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchUserIntegrations = useCallback(async (userId) => {
        if (!userId) return;
        try {
            const { data, error } = await supabase
                .from('user_integrations')
                .select('*')
                .eq('user_id', userId);
            if (error) throw error;
            setUserIntegrations(data || []);
        } catch (error) {
            toast.error("Erro ao buscar suas integrações.");
        }
    }, []);

    const fetchAdminIntegrations = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('integrations').select('*');
            if (error) throw error;
            const integrationsMap = (data || []).reduce((acc, curr) => {
                acc[curr.service] = curr;
                return acc;
            }, {});
            setAdminIntegrations(integrationsMap);
        } catch (error) {
            toast.error("Erro ao buscar configurações de integração.");
        }
    }, []);

    const refetchIntegrations = useCallback(() => {
        if (user?.id) {
            if (user.profile?.role === 'admin') {
                fetchAdminIntegrations();
            } else {
                fetchUserIntegrations(user.id);
            }
        }
    }, [user, fetchUserIntegrations, fetchAdminIntegrations]);

    useEffect(() => {
        if (user?.id) {
            setLoading(true);
            refetchIntegrations();
            setLoading(false);
        }
    }, [user, refetchIntegrations]);
    

    const value = useMemo(() => ({
        userIntegrations,
        adminIntegrations,
        loading,
        refetchIntegrations,
        fetchUserIntegrations,
        fetchAdminIntegrations,
    }), [userIntegrations, adminIntegrations, loading, refetchIntegrations, fetchUserIntegrations, fetchAdminIntegrations]);

    return <IntegrationsContext.Provider value={value}>{children}</IntegrationsContext.Provider>;
};

export const useIntegrations = () => {
    const context = useContext(IntegrationsContext);
    if (context === undefined) {
        throw new Error('useIntegrations must be used within an IntegrationsProvider');
    }
    return context;
};
