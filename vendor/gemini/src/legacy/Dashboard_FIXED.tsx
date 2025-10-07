import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider_FIXED';
import { 
  fetchDadosComunidade, 
  fetchPlanos, 
  fetchRecompensas,
  checkAuth 
} from '../lib/apiHelper_FIXED';

interface DashboardData {
  comunidade: any[] | null;
  planos: any[] | null;
  recompensas: any[] | null;
}

interface LoadingState {
  comunidade: boolean;
  planos: boolean;
  recompensas: boolean;
  general: boolean;
}

interface ErrorState {
  comunidade: string | null;
  planos: string | null;
  recompensas: string | null;
  general: string | null;
}

export const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  
  const [data, setData] = useState<DashboardData>({
    comunidade: null,
    planos: null,
    recompensas: null
  });

  const [loading, setLoading] = useState<LoadingState>({
    comunidade: true,
    planos: true,
    recompensas: true,
    general: true
  });

  const [errors, setErrors] = useState<ErrorState>({
    comunidade: null,
    planos: null,
    recompensas: null,
    general: null
  });

  const [retryCount, setRetryCount] = useState(0);

  // Função para carregar dados específicos
  const loadData = async (
    type: keyof DashboardData,
    fetchFunction: () => Promise<{ data: any; error: any }>
  ) => {
    try {
      setLoading(prev => ({ ...prev, [type]: true }));
      setErrors(prev => ({ ...prev, [type]: null }));

      console.log(`📊 Carregando dados de ${type}...`);
      
      const result = await fetchFunction();
      
      if (result.error) {
        const errorMsg = result.error.message || `Erro ao carregar ${type}`;
        console.error(`❌ Erro em ${type}:`, errorMsg);
        setErrors(prev => ({ ...prev, [type]: errorMsg }));
      } else {
        console.log(`✅ Dados de ${type} carregados:`, result.data?.length || 0, 'itens');
        setData(prev => ({ ...prev, [type]: result.data }));
        setErrors(prev => ({ ...prev, [type]: null }));
      }
    } catch (error) {
      const errorMsg = `Erro inesperado ao carregar ${type}`;
      console.error(`❌ Erro crítico em ${type}:`, error);
      setErrors(prev => ({ ...prev, [type]: errorMsg }));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  // Função para carregar todos os dados
  const loadAllData = async () => {
    try {
      console.log('🚀 Iniciando carregamento do dashboard...');
      
      setLoading(prev => ({ ...prev, general: true }));
      setErrors(prev => ({ ...prev, general: null }));

      // Verificar autenticação primeiro
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        console.log('❌ Usuário não autenticado, redirecionando...');
        window.location.href = '/login';
        return;
      }

      // Carregar dados em paralelo
      await Promise.all([
        loadData('comunidade', fetchDadosComunidade),
        loadData('planos', fetchPlanos),
        loadData('recompensas', fetchRecompensas)
      ]);

      console.log('✅ Carregamento do dashboard concluído');
      
    } catch (error) {
      console.error('❌ Erro geral no dashboard:', error);
      setErrors(prev => ({ 
        ...prev, 
        general: 'Erro ao carregar dashboard. Tente novamente.' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, general: false }));
    }
  };

  // Função de retry
  const handleRetry = async () => {
    console.log('🔄 Tentando recarregar dados...');
    setRetryCount(prev => prev + 1);
    await loadAllData();
  };

  // Carregar dados quando componente montar ou usuário mudar
  useEffect(() => {
    if (!authLoading && user) {
      loadAllData();
    }
  }, [user, authLoading]);

  // Loading inicial
  if (authLoading || loading.general) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seu painel...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Tentativa {retryCount + 1}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Se não há usuário, não renderizar nada (AuthGuard deve redirecionar)
  if (!user) {
    return null;
  }

  const hasAnyError = errors.comunidade || errors.planos || errors.recompensas || errors.general;
  const hasAnyLoading = loading.comunidade || loading.planos || loading.recompensas;

  return (
    <div className="dashboard-container p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard - Vida Smart
        </h1>
        <p className="text-gray-600">
          Bem-vindo, {user.email}!
        </p>
      </div>

      {/* Error Alerts */}
      {hasAnyError && (
        <div className="mb-6 space-y-3">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-red-800 font-medium">Erro Geral</h3>
                  <p className="text-red-700 mt-1">{errors.general}</p>
                </div>
                <button
                  onClick={handleRetry}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          )}

          {errors.comunidade && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800">
                <strong>Comunidade:</strong> {errors.comunidade}
              </p>
            </div>
          )}

          {errors.planos && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800">
                <strong>Planos:</strong> {errors.planos}
              </p>
            </div>
          )}

          {errors.recompensas && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800">
                <strong>Recompensas:</strong> {errors.recompensas}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loading Indicators */}
      {hasAnyLoading && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            Carregando dados...
          </p>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card Comunidade */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Comunidade</h2>
          {loading.comunidade ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : errors.comunidade ? (
            <div className="text-red-600 text-sm">
              Erro ao carregar dados da comunidade
            </div>
          ) : data.comunidade ? (
            <div>
              <p className="text-green-600 font-medium">
                {data.comunidade.length} membros ativos
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Dados carregados com sucesso
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Nenhum dado disponível</p>
          )}
        </div>

        {/* Card Planos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Planos</h2>
          {loading.planos ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : errors.planos ? (
            <div className="text-red-600 text-sm">
              Erro ao carregar os planos
            </div>
          ) : data.planos ? (
            <div>
              <p className="text-blue-600 font-medium">
                {data.planos.length} planos disponíveis
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Dados carregados com sucesso
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Nenhum plano disponível</p>
          )}
        </div>

        {/* Card Recompensas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recompensas</h2>
          {loading.recompensas ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : errors.recompensas ? (
            <div className="text-red-600 text-sm">
              Erro ao carregar as recompensas
            </div>
          ) : data.recompensas ? (
            <div>
              <p className="text-purple-600 font-medium">
                {data.recompensas.length} recompensas ativas
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Dados carregados com sucesso
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Nenhuma recompensa disponível</p>
          )}
        </div>
      </div>

      {/* Retry Button */}
      {hasAnyError && (
        <div className="mt-6 text-center">
          <button
            onClick={handleRetry}
            disabled={hasAnyLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {hasAnyLoading ? 'Carregando...' : 'Recarregar Dados'}
          </button>
        </div>
      )}

      {/* Debug Info (remover em produção) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <pre className="text-xs text-gray-600">
            {JSON.stringify({ 
              user: user?.id, 
              loading, 
              errors, 
              retryCount,
              dataLoaded: {
                comunidade: !!data.comunidade,
                planos: !!data.planos,
                recompensas: !!data.recompensas
              }
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};