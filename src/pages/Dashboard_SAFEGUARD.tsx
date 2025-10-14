
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useApiCallSafeGuard } from '../hooks/useApiCall-SafeGuard';
import { supabase } from '@/lib/supabaseClient';

// ===============================================
// 🛡️ DASHBOARD COM PROTEÇÃO ANTI-LOOP INFINITO
// ===============================================

interface DashboardData {
  comunidade: any[] | null;
  planos: any[] | null;
  recompensas: any[] | null;
}

export const DashboardSafeGuard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  
  // 🛡️ PROTEÇÃO: Hook seguro para dados da comunidade
  const { call: comunidadeCall, abortAll: abortComunidade } = useApiCallSafeGuard();
  const [comunidadeState, setComunidadeState] = useState({
    loading: true,
    data: null,
    error: null,
    retryCount: 0
  });

  const fetchComunidade = useCallback(async () => {
    if (!userId || authLoading) {
      setComunidadeState(prev => ({ ...prev, loading: false }));
      return;
    }

    setComunidadeState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await comunidadeCall(async () => {
        console.log('[SafeGuard] Fetching comunidade data...');
        const { data, error } = await supabase.from('comunidade').select('*');
        if (error) throw new Error(error.message || 'Erro ao carregar dados da comunidade');
        return data ?? [];
      }, { maxRetries: 2, timeout: 15000, enabled: true });

      setComunidadeState({ loading: false, data, error: null, retryCount: 0 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar dados da comunidade';
      if (message === 'API call too frequent') {
        setTimeout(() => fetchComunidade(), 600);
        return;
      }
      console.error('Erro ao carregar dados da comunidade:', error);
      setComunidadeState(prev => ({ ...prev, loading: false, error: message, retryCount: prev.retryCount + 1 }));
    }
  }, [comunidadeCall, authLoading, userId]);

  const comunidadeAPI = useMemo(() => ({
    ...comunidadeState,
    refetch: fetchComunidade,
    abort: abortComunidade
  }), [comunidadeState, fetchComunidade, abortComunidade]);

  // 🛡️ PROTEÇÃO: Hook seguro para dados dos planos
  const { call: planosCall, abortAll: abortPlanos } = useApiCallSafeGuard();
  const [planosState, setPlanosState] = useState({
    loading: true,
    data: null,
    error: null,
    retryCount: 0
  });

  const fetchPlanosSafe = useCallback(async () => {
    if (!userId || authLoading) {
      setPlanosState(prev => ({ ...prev, loading: false }));
      return;
    }

    setPlanosState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await planosCall(async () => {
        console.log('[SafeGuard] Fetching planos data...');
        const { data, error } = await supabase.from('planos').select('*');
        if (error) throw new Error(error.message || 'Erro ao carregar planos');
        return data ?? [];
      }, { maxRetries: 2, timeout: 15000, enabled: true });

      setPlanosState({ loading: false, data, error: null, retryCount: 0 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar planos';
      if (message === 'API call too frequent') {
        setTimeout(() => fetchPlanosSafe(), 600);
        return;
      }
      console.error('Erro ao carregar planos:', error);
      setPlanosState(prev => ({ ...prev, loading: false, error: message, retryCount: prev.retryCount + 1 }));
    }
  }, [planosCall, authLoading, userId]);

  const planosAPI = useMemo(() => ({
    ...planosState,
    refetch: fetchPlanosSafe,
    abort: abortPlanos
  }), [planosState, fetchPlanosSafe, abortPlanos]);

  // 🛡️ PROTEÇÃO: Hook seguro para dados das recompensas  
  const { call: recompensasCall, abortAll: abortRecompensas } = useApiCallSafeGuard();
  const [recompensasState, setRecompensasState] = useState({
    loading: true,
    data: null,
    error: null,
    retryCount: 0
  });

  const fetchRecompensasSafe = useCallback(async () => {
    if (!userId || authLoading) {
      setRecompensasState(prev => ({ ...prev, loading: false }));
      return;
    }

    setRecompensasState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await recompensasCall(async () => {
        console.log('[SafeGuard] Fetching recompensas data...');
        const { data, error } = await supabase.from('recompensas').select('*');
        if (error) throw new Error(error.message || 'Erro ao carregar recompensas');
        return data ?? [];
      }, { maxRetries: 2, timeout: 15000, enabled: true });

      setRecompensasState({ loading: false, data, error: null, retryCount: 0 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar recompensas';
      if (message === 'API call too frequent') {
        setTimeout(() => fetchRecompensasSafe(), 600);
        return;
      }
      console.error('Erro ao carregar recompensas:', error);
      setRecompensasState(prev => ({ ...prev, loading: false, error: message, retryCount: prev.retryCount + 1 }));
    }
  }, [recompensasCall, authLoading, userId]);

  const recompensasAPI = useMemo(() => ({
    ...recompensasState,
    refetch: fetchRecompensasSafe,
    abort: abortRecompensas
  }), [recompensasState, fetchRecompensasSafe, abortRecompensas]);

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setComunidadeState(prev => ({ ...prev, loading: false, data: null, error: null, retryCount: 0 }));
      setPlanosState(prev => ({ ...prev, loading: false, data: null, error: null, retryCount: 0 }));
      setRecompensasState(prev => ({ ...prev, loading: false, data: null, error: null, retryCount: 0 }));
      return;
    }

    fetchComunidade();
    fetchPlanosSafe();
    fetchRecompensasSafe();

    return () => {
      abortComunidade();
      abortPlanos();
      abortRecompensas();
    };
  }, [
    authLoading,
    userId,
    fetchComunidade,
    fetchPlanosSafe,
    fetchRecompensasSafe,
    abortComunidade,
    abortPlanos,
    abortRecompensas
  ]);

  const handleRetryAll = useCallback(() => {
    console.log('[SafeGuard] Retry all requested by user');
    abortComunidade();
    abortPlanos();
    abortRecompensas();
    setTimeout(() => {
      fetchComunidade();
      fetchPlanosSafe();
      fetchRecompensasSafe();
    }, 200);
  }, [abortComunidade, abortPlanos, abortRecompensas, fetchComunidade, fetchPlanosSafe, fetchRecompensasSafe]);

  const aggregatedState = useMemo(() => {
    const hasAnyLoading = comunidadeAPI.loading || planosAPI.loading || recompensasAPI.loading;
    const hasAnyError = comunidadeAPI.error || planosAPI.error || recompensasAPI.error;
    const allDataLoaded = comunidadeAPI.data !== null && planosAPI.data !== null && recompensasAPI.data !== null;
    
    return {
      hasAnyLoading,
      hasAnyError,
      allDataLoaded,
      totalRetries: comunidadeAPI.retryCount + planosAPI.retryCount + recompensasAPI.retryCount
    };
  }, [
    comunidadeAPI,
    planosAPI,
    recompensasAPI
  ]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard - Vida Smart Coach
        </h1>
        <p className="text-gray-600">
          Bem-vindo, {user.email}!
        </p>
        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
          <span>🛡️ Proteção Anti-Loop Ativa</span>
          {aggregatedState.totalRetries > 0 && (
            <span className="text-yellow-600">
              ⚠️ Total de tentativas: {aggregatedState.totalRetries}
            </span>
          )}
        </div>
      </div>

      {aggregatedState.hasAnyError && (
        <div className="mb-6 space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-red-800 font-medium">❌ Erros Detectados</h3>
                <div className="text-red-700 mt-2 space-y-1">
                  {comunidadeAPI.error && <p>• <strong>Comunidade:</strong> {comunidadeAPI.error}</p>}
                  {planosAPI.error && <p>• <strong>Planos:</strong> {planosAPI.error}</p>}
                  {recompensasAPI.error && <p>• <strong>Recompensas:</strong> {recompensasAPI.error}</p>}
                </div>
              </div>
              <button
                onClick={handleRetryAll}
                disabled={aggregatedState.hasAnyLoading}
                className="bg-red-100 hover:bg-red-200 disabled:bg-gray-100 text-red-800 disabled:text-gray-400 px-3 py-1 rounded text-sm transition-colors"
              >
                {aggregatedState.hasAnyLoading ? 'Carregando...' : 'Tentar Novamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {aggregatedState.hasAnyLoading && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            Carregando dados do dashboard...
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Comunidade */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900">Comunidade</h2>
          {comunidadeAPI.loading ? <p>Carregando...</p> : comunidadeAPI.error ? <p className="text-red-500">{comunidadeAPI.error}</p> : <p>{comunidadeAPI.data?.length ?? 0} membros</p>}
        </div>
        {/* Card Planos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900">Planos</h2>
          {planosAPI.loading ? <p>Carregando...</p> : planosAPI.error ? <p className="text-red-500">{planosAPI.error}</p> : <p>{planosAPI.data?.length ?? 0} planos</p>}
        </div>
        {/* Card Recompensas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900">Recompensas</h2>
          {recompensasAPI.loading ? <p>Carregando...</p> : recompensasAPI.error ? <p className="text-red-500">{recompensasAPI.error}</p> : <p>{recompensasAPI.data?.length ?? 0} recompensas</p>}
        </div>
      </div>
    </div>
  );
};
