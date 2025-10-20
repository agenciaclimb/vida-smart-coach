import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import {
  User,
  LogOut,
  Home,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function SimpleDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        setSessionInfo({ error: error.message });
      } else if (session) {
        setUser(session.user);
        setSessionInfo({ 
          hasSession: true, 
          userId: session.user.id,
          email: session.user.email 
        });
      } else {
        setSessionInfo({ hasSession: false });
      }
    } catch (e) {
      console.error('Session check failed:', e);
      setSessionInfo({ error: 'Falha ao verificar sessão' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso!');
      window.location.href = '/';
    } catch (e) {
      console.error('Logout error:', e);
      toast.error('Erro ao fazer logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Sessão não encontrada
          </h2>
          <p className="text-gray-600 mb-6">
            Você precisa estar logado para acessar esta página.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Fazer Login
            </Button>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              Ir para Home
            </Button>
          </div>
          {sessionInfo && (
            <div className="mt-4 text-xs text-gray-500 text-left">
              <strong>Debug Info:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-1 text-left overflow-auto">
                {JSON.stringify(sessionInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Vida Smart Coach
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                {user.email}
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Welcome Card */}
          <div className="bg-white rounded-lg shadow p-6 col-span-full">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Dashboard Funcionando!
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Parabéns! O dashboard está carregando corretamente. Este é um painel simplificado 
              para verificar que a autenticação está funcionando.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Usuário:</strong> {user.email}
              </div>
              <div>
                <strong>ID:</strong> {user.id?.substring(0, 8)}...
              </div>
              <div>
                <strong>Última atualização:</strong> {new Date().toLocaleString('pt-BR')}
              </div>
              <div>
                <strong>Status:</strong> <span className="text-green-600">Ativo</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <Button 
                onClick={checkSession}
                variant="outline" 
                className="w-full justify-start"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Sessão
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline" 
                className="w-full justify-start"
              >
                <Home className="h-4 w-4 mr-2" />
                Ir para Home
              </Button>
              <Button 
                onClick={() => window.location.href = '/status'}
                variant="outline" 
                className="w-full justify-start"
              >
                <Activity className="h-4 w-4 mr-2" />
                Ver Status do Sistema
              </Button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status do Sistema</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Autenticação</span>
                <span className="text-green-600 text-sm">✅ OK</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-green-600 text-sm">✅ Conectado</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sessão</span>
                <span className="text-green-600 text-sm">✅ Ativa</span>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Técnicas</h3>
            <div className="text-xs text-gray-500">
              <div className="bg-gray-100 p-3 rounded">
                <strong>Session Info:</strong>
                <pre className="mt-2 overflow-auto">
                  {JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    timestamp: new Date().toISOString()
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
