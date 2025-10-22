import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Aggregate plan completion stats by day and plan_type
 * range: '7d' | '30d'
 */
export const useCompletionStats = (userId, range = '7d') => {
  const [data, setData] = useState([]); // array of { date: 'YYYY-MM-DD', physical: n, nutritional: n, emotional: n, spiritual: n, total: n, xp: n }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fromDate = useMemo(() => {
    const days = range === '30d' ? 30 : 7;
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }, [range]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch within range (a bit of buffer)
      const { data: rows, error: err } = await supabase
        .from('plan_completions')
        .select('completed_at, plan_type, points_awarded')
        .eq('user_id', userId)
        .gte('completed_at', fromDate);
      if (err) throw err;

      // Build date map for each day in range initialized to zeros
      const days = range === '30d' ? 30 : 7;
      const map = new Map();
      const start = new Date(fromDate);
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        map.set(key, { date: key, physical: 0, nutritional: 0, emotional: 0, spiritual: 0, total: 0, xp: 0 });
      }

      // Aggregate
      for (const row of rows || []) {
        const key = new Date(row.completed_at).toISOString().slice(0, 10);
        const bucket = map.get(key);
        if (!bucket) continue; // outside range due to timezone
        const type = row.plan_type;
        if (bucket[type] !== undefined) bucket[type] += 1;
        bucket.total += 1;
        bucket.xp += row.points_awarded || 0;
      }

      setData(Array.from(map.values()));
    } catch (e) {
      console.error('useCompletionStats error', e);
      setError(e.message || 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  }, [userId, fromDate, range]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const totals = data.reduce((acc, d) => {
      acc.physical += d.physical;
      acc.nutritional += d.nutritional;
      acc.emotional += d.emotional;
      acc.spiritual += d.spiritual;
      acc.total += d.total;
      acc.xp += d.xp;
      return acc;
    }, { physical: 0, nutritional: 0, emotional: 0, spiritual: 0, total: 0, xp: 0 });

    const bestDay = data.reduce((best, cur) => cur.total > best.total ? cur : best, { date: null, total: -1 });
    return { totals, bestDay };
  }, [data]);

  return { data, loading, error, reload: load, summary };
};
