
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '../../core/supabase';

const PartnerContext = createContext(undefined);

export const PartnerProvider = ({ children }) => {
    const { user } = useAuth();
    const [partnerData, setPartnerData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPartnerData = useCallback(async (partnerId) => {
        if (!partnerId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_partner_dashboard_data', {
                partner_user_id: partnerId
            });

            if (error) throw error;
            setPartnerData(data);
        } catch (error) {
            toast.error("Erro ao carregar dados do parceiro.");
            console.error("Partner data fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetchPartnerData = useCallback(() => {
        if (user?.id) {
            fetchPartnerData(user.id);
        }
    }, [user, fetchPartnerData]);
    
    useEffect(() => {
      if(user?.id && user.profile?.role === 'partner') {
        fetchPartnerData(user.id);
      }
    }, [user, fetchPartnerData]);

    const value = useMemo(() => ({
        ...partnerData,
        loading,
        refetchPartnerData,
        fetchPartnerData
    }), [partnerData, loading, refetchPartnerData, fetchPartnerData]);

    return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>;
};

export const usePartner = () => {
    const context = useContext(PartnerContext);
    if (context === undefined) {
        throw new Error('usePartner must be used within a PartnerProvider');
    }
    return context;
};
