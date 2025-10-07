
/** DO NOT import legacy modules. See src/legacy/ for deprecated variants. */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/core/supabase';

const PlansRewardsContext = createContext(undefined);

export const PlansRewardsProvider = ({ children }) => {
    const [plans, setPlans] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasShownPlansError, setHasShownPlansError] = useState(false);
    const [hasShownRewardsError, setHasShownRewardsError] = useState(false);
    const inFlightRef = React.useRef(false);
    const lastFetchRef = React.useRef(0);

    const fetchPlans = useCallback(async () => {
        try {
            // Leitura da view normalizada - schema padronizado
            const { data, error } = await supabase
                .from('plans_normalized')
                .select('*')
                .order('price', { ascending: true });
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
            // Leitura da view normalizada - sem necessidade de mapear colunas
            const { data, error } = await supabase
                .from('rewards_normalized')
                .select('*')
                .order('points', { ascending: true });
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
        // Evita tempestade de requisições: dedupe em memória + debounce simples.
        if (inFlightRef.current) return;
        const now = Date.now();
        if (now - lastFetchRef.current < 3000) return; // no mínimo 3s entre rodadas
        inFlightRef.current = true;
        lastFetchRef.current = now;
        try {
            setLoading(true);
            await Promise.all([fetchPlans(), fetchRewards()]);
        } finally {
            setLoading(false);
            inFlightRef.current = false;
        }
    }, [fetchPlans, fetchRewards]);

    const value = useMemo(() => ({
        plans,
        rewards,
        loading,
        fetchPlans,
        fetchRewards,
        fetchData
        upsertReward
    }), [plans, rewards, loading, fetchPlans, fetchRewards, fetchData, upsertReward]);
    
    return <PlansRewardsContext.Provider value={value}>{children}</PlansRewardsContext.Provider>;
};

export const usePlansRewards = () => {
    const context = useContext(PlansRewardsContext);
    if (context === undefined) {
        throw new Error('usePlansRewards must be used within a PlansRewardsProvider');
    }
    return context;
};
