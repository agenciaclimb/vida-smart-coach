import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/core/supabase';
import { toast } from 'react-hot-toast';

const CheckinsContext = createContext(undefined);

export const CheckinsProvider = ({ children }) => {
  const { user } = useAuth();
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(true);

  const todayStr = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const refreshStatus = useCallback(async () => {
    if (!user?.id) { setHasCheckedInToday(false); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', todayStr())
        .limit(1);
      if (error) throw error;
      setHasCheckedInToday((data?.length ?? 0) > 0);
    } catch (e) {
      console.warn('checkin status error:', e.message);
      setHasCheckedInToday(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  const addDailyMetric = useCallback(async (metric) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    // Normaliza campos vindos do formulário do Dashboard
    const mood = Number(metric.mood_score ?? metric.mood ?? 3);
    const sleep_hours = Number(metric.sleep_hours ?? metric.sleep ?? 0);
    const energy_level = Number(metric.energy_level ?? metric.mood_score ?? 3);
    const water_intake = Number(metric.water_intake ?? 0);
    const exercise_minutes = Number(metric.exercise_minutes ?? 0);

    try {
      const payload = {
        user_id: user.id,
        date: todayStr(),
        mood,
        energy_level,
        sleep_hours,
        water_intake,
        exercise_minutes,
        notes: metric.notes ?? null,
      };
      const { error } = await supabase.from('daily_checkins').insert(payload);
      if (error) throw error;
      setHasCheckedInToday(true);
      toast.success('Check-in registrado!');
    } catch (e) {
      // Política UNIQUE(user_id, date) pode disparar; tratar de forma amigável
      if (String(e?.message || '').includes('duplicate')) {
        setHasCheckedInToday(true);
        toast.success('Você já registrou o check-in de hoje.');
        return;
      }
      console.error('addDailyMetric error:', e);
      throw e;
    }
  }, [user?.id]);

  const value = useMemo(() => ({ hasCheckedInToday, loadingCheckin: loading, refreshStatus, addDailyMetric }), [hasCheckedInToday, loading]);

  return <CheckinsContext.Provider value={value}>{children}</CheckinsContext.Provider>;
};

export const useCheckins = () => {
  const ctx = useContext(CheckinsContext);
  if (ctx === undefined) throw new Error('useCheckins must be used within a CheckinsProvider');
  return ctx;
};

