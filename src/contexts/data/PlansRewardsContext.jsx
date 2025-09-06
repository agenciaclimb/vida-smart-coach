
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../core/supabase';

const PlansRewardsContext = createContext(undefined);

export const PlansRewardsProvider = ({ children }) => {
    const [plans, setPlans] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasShownPlansError, setHasShownPlansError] = useState(false);
    const [hasShownRewardsError, setHasShownRewardsError] = useState(false);

    const fetchPlans = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('plans').select('*').order('price', { ascending: true });
            if (error) throw error;
            setPlans(data || []);
        } catch (error) {
            console.error("Plan fetch error:", error);
            if (!hasShownPlansError) {
                toast.error("Erro ao carregar os planos.");
                setHasShownPlansError(true);
            }
            setPlans([]);
        }
    }, [hasShownPlansError]);

    const fetchRewards = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('rewards').select('*').order('points', { ascending: true });
            if (error) throw error;
            setRewards(data || []);
        } catch (error) {
            console.error("Rewards fetch error:", error);
            if (!hasShownRewardsError) {
                toast.error("Erro ao carregar as recompensas.");
                setHasShownRewardsError(true);
            }
            setRewards([]);
        }
    }, [hasShownRewardsError]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        await Promise.all([fetchPlans(), fetchRewards()]);
        setLoading(false);
    }, [fetchPlans, fetchRewards]);

    const value = useMemo(() => ({
        plans,
        rewards,
        loading,
        fetchPlans,
        fetchRewards,
        fetchData
    }), [plans, rewards, loading, fetchPlans, fetchRewards, fetchData]);
    
    return <PlansRewardsContext.Provider value={value}>{children}</PlansRewardsContext.Provider>;
};

export const usePlansRewards = () => {
    const context = useContext(PlansRewardsContext);
    if (context === undefined) {
        throw new Error('usePlansRewards must be used within a PlansRewardsProvider');
    }
    return context;
};
