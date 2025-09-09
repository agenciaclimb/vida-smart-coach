
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/core/supabase';

const PlansRewardsContext = createContext(undefined);

export const PlansRewardsProvider = ({ children }) => {
    const [plans, setPlans] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchedRef = useRef(false);

    const fetchPlans = useCallback(async () => {
        try {
            const { data, error: err } = await supabase
              .from('plans')
              .select('*')
              .order('sort_order');
            if (err) throw err;
            const sanitized = (data || []).map(plan => ({
                ...plan,
                features: Array.isArray(plan.features) ? plan.features : [],
            }));
            setPlans(sanitized);
        } catch (error) {
            console.error("Plan fetch error:", error);
            setError('Não consegui carregar planos e recompensas. Por favor, tente de novo.');
            setPlans([]);
        }
    }, []);

    const fetchRewards = useCallback(async () => {
        try {
            const { data, error: err } = await supabase
              .from('rewards')
              .select('*')
              .order('points_required');
            if (err) throw err;
            const sanitized = (data || []).map(reward => ({
                ...reward,
                points_required: Number(reward.points_required ?? 0),
            }));
            setRewards(sanitized);
        } catch (error) {
            console.error("Rewards fetch error:", error);
            setError('Não consegui carregar planos e recompensas. Por favor, tente de novo.');
            setRewards([]);
        }
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        await Promise.all([fetchPlans(), fetchRewards()]);
        setLoading(false);
    }, [fetchPlans, fetchRewards]);

    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        fetchData();
    }, []);

    const value = useMemo(() => ({
        plans,
        rewards,
        loading,
        error,
        fetchPlans,
        fetchRewards,
        fetchData
    }), [plans, rewards, loading, error, fetchPlans, fetchRewards, fetchData]);
    
    return <PlansRewardsContext.Provider value={value}>{children}</PlansRewardsContext.Provider>;
};

export const usePlansRewards = () => {
    const context = useContext(PlansRewardsContext);
    if (context === undefined) {
        throw new Error('usePlansRewards must be used within a PlansRewardsProvider');
    }
    return context;
};
