// src/pages/Dashboard_PATCH_FINAL.tsx
import React, { useState } from 'react';
import { useApiCallSafeGuard } from '../hooks/useApiCall-SafeGuard';
import { useAuth } from '../contexts/SupabaseAuthContext_FINAL';
import { getSupabase } from '../lib/supabase-singleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Activity, Users, Award, Loader2, AlertTriangle } from 'lucide-react';

// ===============================================
// 🎯 DASHBOARD PATCH FINAL - TODOS OS SAFEGUARDS
// ===============================================

interface DashboardData {
  plans: any[];
  community: any[];
  stats: {
    totalPlans: number;
    totalCommunity: number;
  };
}

export const DashboardPatchFinal: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { call, inflightCount, abortAll } = useApiCallSafeGuard();
  const [data, setData] = useState<DashboardData>({
    plans: [],
    community: [],
    stats: { totalPlans: 0, totalCommunity: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🛡️ FUNÇÃO PROTEGIDA PARA CARREGAR PLANOS
  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await call(async () => {
        const supabase = getSupabase();
        const { data: plansData, error } = await supabase
          .from('public_app_plans')
          .select('*')
          .limit(10);
        
        if (error) throw error;
        return plansData || [];
      }, { maxRetries: 2, timeout: 10000 });

      setData(prev => ({ 
        ...prev, 
        plans: result,
        stats: { ...prev.stats, totalPlans: result.length }
      }));
      
    } catch (err: any) {
      setError(`Erro ao carregar planos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ FUNÇÃO PROTEGIDA PARA CARREGAR COMUNIDADE  
  const loadCommunity = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await call(async () => {
        const supabase = getSupabase();
        const { data: communityData, error } = await supabase
          .from('public_community')
          .select('*')
          .limit(5);
        
        if (error) {
          // Se public_community não existe, retornar array vazio
          if (error.code === '42P01') return [];
          throw error;
        }
        return communityData || [];
      }, { maxRetries: 1, timeout: 8000 });

      setData(prev => ({ 
        ...prev, 
        community: result,
        stats: { ...prev.stats, totalCommunity: result.length }
      }));
      
    } catch (err: any) {
      console.log('ℹ️ Community não disponível:', err.message);
      setData(prev => ({ 
        ...prev, 
        community: [],
        stats: { ...prev.stats, totalCommunity: 0 }
      }));
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ CARREGAR TODOS OS DADOS
  const loadAllData = async () => {
    try {
      await Promise.allSettled([
        loadPlans(),
        loadCommunity()
      ]);
    } catch (err) {
      console.error('Erro geral:', err);
    }
  };

  // Loading inicial de auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">🛡️ Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não tem usuário
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">Você precisa estar logado para acessar o dashboard.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com status SafeGuard */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-blue-500" />
                Dashboard Patch Final
              </h1>
              <p className="text-gray-600 mt-1">
                Bem-vindo, {user.email} | SafeGuard Ativo
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {inflightCount > 0 && (
                <div className="flex items-center text-blue-600">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="text-sm">{inflightCount} requests</span>
                </div>
              )}
              <Button
                onClick={abortAll}
                variant="outline"
                size="sm"
                disabled={inflightCount === 0}
              >
                Abort All
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Planos
              </CardTitle>
              <Activity className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalPlans}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Comunidade
              </CardTitle>
              <Users className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalCommunity}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Requests Ativos
              </CardTitle>
              <Award className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inflightCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Controles SafeGuard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={loadPlans}
                disabled={loading}
                variant="outline"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Carregar Planos
              </Button>
              
              <Button 
                onClick={loadCommunity}
                disabled={loading}
                variant="outline"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Carregar Comunidade
              </Button>
              
              <Button 
                onClick={loadAllData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Carregar Tudo
              </Button>

              <Button 
                onClick={() => {
                  setData({ plans: [], community: [], stats: { totalPlans: 0, totalCommunity: 0 } });
                  setError(null);
                }}
                variant="outline"
              >
                Limpar Dados
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">⚠️ Erro:</p>
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dados dos Planos */}
        <Card>
          <CardHeader>
            <CardTitle>Planos Carregados ({data.plans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.plans.length > 0 ? (
              <div className="space-y-2">
                {data.plans.slice(0, 5).map((plan, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{plan.title || 'Sem título'}</p>
                        <p className="text-sm text-gray-600">Tipo: {plan.type}</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {plan.owner_id?.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                ))}
                {data.plans.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    + {data.plans.length - 5} planos adicionais
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Nenhum plano carregado. Clique em "Carregar Planos" para testar.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Debug SafeGuard (desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">🔧 Debug SafeGuard</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-gray-500 overflow-auto">
{JSON.stringify({
  userId: user?.id,
  userEmail: user?.email,
  inflightCount,
  dataLoaded: {
    plans: data.plans.length,
    community: data.community.length
  },
  error: !!error
}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};