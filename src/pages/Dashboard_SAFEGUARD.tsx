import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext_FINAL';
import { useApiCallSafeGuard } from '../hooks/useApiCall-SafeGuard';
import { 
  fetchDadosComunidade, 
  fetchPlanos, 
  fetchRecompensas,
  checkAuth 
} from '../lib/apiHelper_FIXED';

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
  const [retryCount, setRetryCount] = useState(0);
  
  // 🛡️ PROTEÇÃO: Hook seguro para dados da comunidade
  const { call: comunidadeCall } = useApiCallSafeGuard();
  const comunidadeAPI = {
    loading: false,
    data: null,
    error: null,
    retryCount: 0,
    refetch: () => {},
    abort: () => {}
  };
    useCallback(async () => {
      console.log('🔄 Fetching comunidade data...');
      const result = await fetchDadosComunidade();
      if (result.error) {
        throw new Error(result.error.message || 'Erro ao carregar dados da comunidade');
      }
      return result.data;
    }, []),
    [user?.id], // Dependência: recarregar se usuário mudar
    {
      maxRetries: 2,
      retryDelay: 1000,
      timeout: 15000,
      enabled: !!user && !authLoading
    }
  );

  // 🛡️ PROTEÇÃO: Hook seguro para dados dos planos
  const { call: planosCall } = useApiCallSafeGuard();
  const planosAPI = {
    loading: false,
    data: null,
    error: null,
    retryCount: 0,
    refetch: () => {},
    abort: () => {}
  };
    useCallback(async () => {
      console.log('🔄 Fetching planos data...');
      const result = await fetchPlanos();
      if (result.error) {
        throw new Error(result.error.message || 'Erro ao carregar planos');
      }
      return result.data;
    }, []),
    [user?.id], // Dependência: recarregar se usuário mudar
    {
      maxRetries: 2,
      retryDelay: 1000,
      timeout: 15000,
      enabled: !!user && !authLoading
    }
  );

  // 🛡️ PROTEÇÃO: Hook seguro para dados das recompensas  
  const { call: recompensasCall } = useApiCallSafeGuard();
  const recompensasAPI = {
    loading: false,
    data: null,
    error: null,
    retryCount: 0,
    refetch: () => {},
    abort: () => {}
  };
    useCallback(async () => {
      console.log('🔄 Fetching recompensas data...');
      const result = await fetchRecompensas();
      if (result.error) {
        throw new Error(result.error.message || 'Erro ao carregar recompensas');
      }
      return result.data;
    }, []),
    [user?.id], // Dependência: recarregar se usuário mudar
    {
      maxRetries: 2,
      retryDelay: 1000,
      timeout: 15000,
      enabled: !!user && !authLoading
    }
  );

  // Função de retry que reinicia todos os API calls
  const handleRetryAll = useCallback(() => {
    console.log('🔄 Retry all requested by user');
    setRetryCount(prev => prev + 1);
    
    // Abortar calls atuais primeiro
    comunidadeAPI.abort();
    planosAPI.abort();
    recompensasAPI.abort();
    
    // Refetch todos
    setTimeout(() => {
      comunidadeAPI.refetch();
      planosAPI.refetch();
      recompensasAPI.refetch();
    }, 100);
  }, [comunidadeAPI, planosAPI, recompensasAPI]);

  // Computar estados agregados
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
    comunidadeAPI.loading, comunidadeAPI.error, comunidadeAPI.data, comunidadeAPI.retryCount,
    planosAPI.loading, planosAPI.error, planosAPI.data, planosAPI.retryCount,
    recompensasAPI.loading, recompensasAPI.error, recompensasAPI.data, recompensasAPI.retryCount
  ]);

  // Loading inicial
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

  // Se não há usuário, não renderizar nada (AuthGuard deve redirecionar)
  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container p-6 max-w-7xl mx-auto">
      {/* Header */}
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

      {/* Error Alerts */}
      {aggregatedState.hasAnyError && (
        <div className="mb-6 space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-red-800 font-medium">❌ Erros Detectados</h3>
                <div className="text-red-700 mt-2 space-y-1">
                  {comunidadeAPI.error && (
                    <p>• <strong>Comunidade:</strong> {comunidadeAPI.error}</p>
                  )}
                  {planosAPI.error && (
                    <p>• <strong>Planos:</strong> {planosAPI.error}</p>
                  )}
                  {recompensasAPI.error && (
                    <p>• <strong>Recompensas:</strong> {recompensasAPI.error}</p>
                  )}
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

      {/* Loading Indicators */}
      {aggregatedState.hasAnyLoading && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            Carregando dados do dashboard...
            <span className="ml-2 text-sm">
              ({[comunidadeAPI.loading && 'Comunidade', planosAPI.loading && 'Planos', recompensasAPI.loading && 'Recompensas'].filter(Boolean).join(', ')})
            </span>
          </p>
        </div>
      )}

      {/* Success Indicator */}
      {aggregatedState.allDataLoaded && !aggregatedState.hasAnyError && !aggregatedState.hasAnyLoading && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 flex items-center">
            <div className="h-4 w-4 bg-green-600 rounded-full mr-3"></div>
            ✅ Todos os dados carregados com sucesso!
          </p>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card Comunidade */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Comunidade</h2>
            <div className="flex items-center space-x-2">
              {comunidadeAPI.loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
              )}
              {comunidadeAPI.error && (
                <div className="text-red-500 text-xs">❌</div>
              )}
              {comunidadeAPI.data && !comunidadeAPI.error && !comunidadeAPI.loading && (
                <div className="text-green-500 text-xs">✅</div>
              )}
            </div>
          </div>
          
          {comunidadeAPI.loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : comunidadeAPI.error ? (
            <div className="text-red-600 text-sm">
              <p>Erro ao carregar dados</p>
              <button
                onClick={comunidadeAPI.refetch}
                className="mt-2 text-blue-600 hover:text-blue-800 text-xs underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : comunidadeAPI.data ? (
            <div>
              <p className="text-green-600 font-medium text-2xl">
                {Array.isArray(comunidadeAPI.data) ? comunidadeAPI.data.length : 0}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Membros ativos na comunidade
              </p>
              <div className="mt-3 text-xs text-gray-500">
                <p>Tentativas: {comunidadeAPI.retryCount}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Aguardando dados...</p>
          )}
        </div>

        {/* Card Planos */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Planos</h2>
            <div className="flex items-center space-x-2">
              {planosAPI.loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              )}
              {planosAPI.error && (
                <div className="text-red-500 text-xs">❌</div>
              )}
              {planosAPI.data && !planosAPI.error && !planosAPI.loading && (
                <div className="text-green-500 text-xs">✅</div>
              )}
            </div>
          </div>
          
          {planosAPI.loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : planosAPI.error ? (
            <div className="text-red-600 text-sm">
              <p>Erro ao carregar planos</p>
              <button
                onClick={planosAPI.refetch}
                className="mt-2 text-blue-600 hover:text-blue-800 text-xs underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : planosAPI.data ? (
            <div>
              <p className="text-blue-600 font-medium text-2xl">
                {Array.isArray(planosAPI.data) ? planosAPI.data.length : 0}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Planos disponíveis
              </p>
              <div className="mt-3 text-xs text-gray-500">
                <p>Tentativas: {planosAPI.retryCount}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Aguardando dados...</p>
          )}
        </div>

        {/* Card Recompensas */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recompensas</h2>
            <div className="flex items-center space-x-2">
              {recompensasAPI.loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
              )}
              {recompensasAPI.error && (
                <div className="text-red-500 text-xs">❌</div>
              )}
              {recompensasAPI.data && !recompensasAPI.error && !recompensasAPI.loading && (
                <div className="text-green-500 text-xs">✅</div>
              )}
            </div>
          </div>
          
          {recompensasAPI.loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : recompensasAPI.error ? (
            <div className="text-red-600 text-sm">
              <p>Erro ao carregar recompensas</p>
              <button
                onClick={recompensasAPI.refetch}
                className="mt-2 text-blue-600 hover:text-blue-800 text-xs underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : recompensasAPI.data ? (
            <div>
              <p className="text-purple-600 font-medium text-2xl">
                {Array.isArray(recompensasAPI.data) ? recompensasAPI.data.length : 0}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Recompensas ativas
              </p>
              <div className="mt-3 text-xs text-gray-500">
                <p>Tentativas: {recompensasAPI.retryCount}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Aguardando dados...</p>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🛡️ Painel de Controle</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleRetryAll}
            disabled={aggregatedState.hasAnyLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {aggregatedState.hasAnyLoading ? 'Carregando...' : '🔄 Recarregar Tudo'}
          </button>
          
          <button
            onClick={() => {
              comunidadeAPI.abort();
              planosAPI.abort();
              recompensasAPI.abort();
            }}
            disabled={!aggregatedState.hasAnyLoading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ⏹️ Parar Carregamentos
          </button>

          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            🔄 Reload Página
          </button>
        </div>
      </div>

      {/* Debug Info (desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">🔧 Debug Info:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <h4 className="font-medium text-green-600 mb-1">Comunidade</h4>
              <pre className="text-gray-600">
{JSON.stringify({
  loading: comunidadeAPI.loading,
  error: !!comunidadeAPI.error,
  dataCount: Array.isArray(comunidadeAPI.data) ? comunidadeAPI.data.length : 'null',
  retryCount: comunidadeAPI.retryCount
}, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium text-blue-600 mb-1">Planos</h4>
              <pre className="text-gray-600">
{JSON.stringify({
  loading: planosAPI.loading,
  error: !!planosAPI.error,
  dataCount: Array.isArray(planosAPI.data) ? planosAPI.data.length : 'null',
  retryCount: planosAPI.retryCount
}, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium text-purple-600 mb-1">Recompensas</h4>
              <pre className="text-gray-600">
{JSON.stringify({
  loading: recompensasAPI.loading,
  error: !!recompensasAPI.error,
  dataCount: Array.isArray(recompensasAPI.data) ? recompensasAPI.data.length : 'null',
  retryCount: recompensasAPI.retryCount
}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};