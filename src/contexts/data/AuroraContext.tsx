import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '@/lib/supabase';
import { featureFlags } from '@/config/featureFlags';

type AuroraRecord = Record<string, unknown>;

type AuroraState = {
  enabled: boolean;
  loading: boolean;
  error: string | null;
  values: AuroraRecord[];
  goals: AuroraRecord[];
  milestones: AuroraRecord[];
  actions: AuroraRecord[];
  reviews: AuroraRecord[];
  refresh: () => Promise<void>;
};

const defaultState: AuroraState = {
  enabled: featureFlags.auroraV1,
  loading: false,
  error: null,
  values: [],
  goals: [],
  milestones: [],
  actions: [],
  reviews: [],
  refresh: async () => {},
};

const AuroraContext = createContext<AuroraState>(defaultState);

async function fetchTable(name: string) {
  const { data, error } = await supabase.from(name).select('*').order('created_at', { ascending: false });
  if (error) {
    if (error.message?.includes('does not exist')) {
      console.warn(`[aurora] tabela '${name}' ainda não existe.`, error);
      return [];
    }
    console.error(`[aurora] erro ao buscar ${name}:`, error);
    throw new Error(error.message);
  }
  return data ?? [];
}

export const AuroraProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<AuroraRecord[]>([]);
  const [goals, setGoals] = useState<AuroraRecord[]>([]);
  const [milestones, setMilestones] = useState<AuroraRecord[]>([]);
  const [actions, setActions] = useState<AuroraRecord[]>([]);
  const [reviews, setReviews] = useState<AuroraRecord[]>([]);

  const loadData = useCallback(async () => {
    if (!featureFlags.auroraV1) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [
        valueRows,
        goalRows,
        milestoneRows,
        actionRows,
        reviewRows,
      ] = await Promise.all([
        fetchTable('life_values'),
        fetchTable('life_goals'),
        fetchTable('life_milestones'),
        fetchTable('life_actions'),
        fetchTable('life_reviews'),
      ]);

      setValues(valueRows);
      setGoals(goalRows);
      setMilestones(milestoneRows);
      setActions(actionRows);
      setReviews(reviewRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados do Aurora.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (featureFlags.auroraV1) {
      loadData();
    }
  }, [loadData]);

  const value = useMemo<AuroraState>(
    () => ({
      enabled: featureFlags.auroraV1,
      loading,
      error,
      values,
      goals,
      milestones,
      actions,
      reviews,
      refresh: loadData,
    }),
    [loading, error, values, goals, milestones, actions, reviews, loadData],
  );

  return (
    <AuroraContext.Provider value={value}>
      {children}
    </AuroraContext.Provider>
  );
};

export const useAurora = () => useContext(AuroraContext);
