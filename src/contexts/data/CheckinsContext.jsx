/** DO NOT import legacy modules. See src/legacy/ for deprecated variants. */

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth/AuthProvider';

// Demo mode flag - should match AuthProvider
const DEMO_MODE = false; // Disabled to test real database

const CheckinsContext = createContext(undefined);

export const CheckinsProvider = ({ children }) => {
    const { user } = useAuth();
    const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
    const [loadingCheckin, setLoadingCheckin] = useState(false);
    const [checkinHistory, setCheckinHistory] = useState([]);

    // Verifica se já fez check-in hoje
    const checkTodaysStatus = useCallback(async () => {
        if (!user?.id) return false;
        
        if (DEMO_MODE) {
            console.log('🧪 DEMO MODE: Checking today status');
            // Demo: start with no check-in
            return false;
        }
        
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const { data, error } = await supabase
                .from('daily_checkins')
                .select('id')
                .eq('user_id', user.id)
                .eq('date', today)
                .limit(1);
                
            if (error && error.code !== 'PGRST116') throw error;
            
            const hasChecked = data && data.length > 0;
            setHasCheckedInToday(hasChecked);
            return hasChecked;
        } catch (error) {
            console.error('Check today status error:', error);
            return false;
        }
    }, [user?.id]);

    // Busca histórico de check-ins
    const fetchHistory = useCallback(async () => {
        if (!user?.id) return;
        
        if (DEMO_MODE) {
            console.log('🧪 DEMO MODE: Fetching history');
            // Demo: provide sample history
            const sampleHistory = [
                {
                    id: 'demo-1',
                    user_id: user.id,
                    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                    mood: 4,
                    energy_level: 4,
                    sleep_hours: 7.5
                }
            ];
            setCheckinHistory(sampleHistory);
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('daily_checkins')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(30);
                
            if (error) throw error;
            
            setCheckinHistory(data || []);
        } catch (error) {
            console.error('Fetch history error:', error);
        }
    }, [user?.id]);

    // Adiciona métrica diária (check-in reativo)
    const addDailyMetric = useCallback(async (metric) => {
        if (!user?.id) {
            toast.error('Usuário não autenticado');
            return { success: false };
        }

        setLoadingCheckin(true);
        
        try {
            if (DEMO_MODE) {
                // Demo mode: simulate checkin creation
                console.log('🧪 DEMO MODE: Simulating checkin creation');
                console.log('Checkin data:', metric);
                
                // Simulate a small delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check for duplicate (demo logic)
                if (hasCheckedInToday) {
                    toast.error('Você já fez seu check-in hoje!');
                    return { success: false, isDuplicate: true };
                }
                
                // Simulate success
                setHasCheckedInToday(true);
                toast.success('Check-in registrado com sucesso! 🎉 (DEMO)');
                return { success: true, data: { id: 'demo-checkin-123', ...metric } };
            }

            const today = new Date().toISOString().split('T')[0];
            
            // Try to include weight field if it exists after migration
            const basePayload = {
                user_id: user.id,
                date: today,
                mood: metric.mood_score || null,
                energy_level: metric.mood_score || null, 
                sleep_hours: metric.sleep_hours || null,
                created_at: new Date().toISOString()
            };
            
            // Try with weight field first (if migration was applied)
            let payload = { ...basePayload };
            if (metric.weight) {
                payload.weight = parseFloat(metric.weight);
                payload.mood_score = metric.mood_score; // Also try the mood_score field
            }

            const { data, error } = await supabase
                .from('daily_checkins')
                .insert([payload])
                .select();
                
            if (error) {
                // Verifica se é erro de duplicata (constraint UNIQUE)
                if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('already exists')) {
                    toast.error('Você já fez seu check-in hoje!');
                    setHasCheckedInToday(true);
                    return { success: false, isDuplicate: true };
                }
                throw error;
            }
            
            // Sucesso - atualiza estado imediatamente
            setHasCheckedInToday(true);
            await fetchHistory(); // Atualiza histórico
            
            toast.success('Check-in registrado com sucesso! 🎉');
            return { success: true, data };
            
        } catch (error) {
            console.error('Add daily metric error:', error);
            toast.error(`Erro ao registrar check-in: ${error.message}`);
            return { success: false, error };
        } finally {
            setLoadingCheckin(false);
        }
    }, [user?.id, fetchHistory, hasCheckedInToday]);

    // Refresh status
    const refreshStatus = useCallback(async () => {
        await Promise.all([checkTodaysStatus(), fetchHistory()]);
    }, [checkTodaysStatus, fetchHistory]);

    // Effect para carregar dados iniciais
    useEffect(() => {
        if (user?.id) {
            refreshStatus();
        }
    }, [user?.id, refreshStatus]);

    const value = useMemo(() => ({
        hasCheckedInToday,
        loadingCheckin,
        checkinHistory,
        addDailyMetric,
        refreshStatus,
        checkTodaysStatus
    }), [
        hasCheckedInToday,
        loadingCheckin,
        checkinHistory,
        addDailyMetric,
        refreshStatus,
        checkTodaysStatus
    ]);
    
    return <CheckinsContext.Provider value={value}>{children}</CheckinsContext.Provider>;
};

export function useCheckins() {
    const context = useContext(CheckinsContext);
    if (context === undefined) {
        throw new Error('useCheckins must be used within a CheckinsProvider');
    }
    return context;
}