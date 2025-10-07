// src/components/client/DashboardTab_FIXED_SIMPLE.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { useApiCallSafeGuard } from '@/hooks/useApiCall-SafeGuard';
import { getSupabase } from '@/lib/supabase-singleton';
import { Shield, Activity, Loader2, AlertTriangle } from 'lucide-react';

// ===============================================
// 🛡️ DASHBOARD SIMPLES - SAFEGUARD FUNCIONAL
// ===============================================

export const DashboardTabFixedSimple = () => {
  const { user, loading: authLoading } = useAuth();
  const { call, inflightCount } = useApiCallSafeGuard();
  const [data, setData] = useState({ plans: [], checkIn: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Função para testar API
  const testApiCall = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await call(async () => {
        const supabase = getSupabase();
        // Testar uma query simples primeiro
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return { user: data.user, timestamp: new Date().toISOString() };
      }, { maxRetries: 2, timeout: 8000 });

      setData(prev => ({ ...prev, testResult: result }));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com status SafeGuard */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-blue-500" />
            Dashboard SafeGuard (Simples)
          </h1>
          <p className="text-gray-600 mt-1">
            Bem-vindo, {user.email} | Requests ativos: {inflightCount}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Status da Aplicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">✅</div>
                <div className="text-sm text-green-700">Auth Funcionando</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{inflightCount}</div>
                <div className="text-sm text-blue-700">Requests Ativos</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">🛡️</div>
                <div className="text-sm text-purple-700">SafeGuard Ativo</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teste API */}
        <Card>
          <CardHeader>
            <CardTitle>Teste de API SafeGuard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={testApiCall}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando API...
                  </>
                ) : (
                  'Testar Chamada API'
                )}
              </Button>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-medium">⚠️ Erro:</p>
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {data.testResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium">✅ Sucesso!</p>
                  <pre className="text-xs text-green-600 mt-2 overflow-auto">
                    {JSON.stringify(data.testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Status:</strong> <span className="text-green-600">Autenticado</span></p>
              <p><strong>SafeGuard:</strong> <span className="text-blue-600">Ativo</span></p>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info (desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">🔧 Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-gray-500 overflow-auto">
{JSON.stringify({
  userId: user?.id,
  userEmail: user?.email,
  inflightCount,
  loading,
  error: !!error,
  dataKeys: Object.keys(data)
}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardTabFixedSimple;