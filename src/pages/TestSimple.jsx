// src/pages/TestSimple.jsx
import React from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext_FINAL';

// ===============================================
// 🧪 PÁGINA DE TESTE ULTRA SIMPLES
// ===============================================

export const TestSimple = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">🛡️ Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🎯 Teste Simples - SafeGuard
          </h1>
          
          {user ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h2 className="text-xl font-semibold text-green-800 mb-2">
                  ✅ Autenticação Funcionando!
                </h2>
                <div className="text-green-700">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Status:</strong> Logado com sucesso</p>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  🛡️ Proteções Ativas
                </h3>
                <ul className="text-blue-700 space-y-1">
                  <li>✓ Singleton Supabase</li>
                  <li>✓ Context com timeout 8s</li>
                  <li>✓ RouteGuard anti-loop</li>
                  <li>✓ SW Cleanup automático</li>
                </ul>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => window.location.href = '/dashboard-final'}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Ir para Dashboard Final
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Reload Teste
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h2 className="text-xl font-semibold text-yellow-800 mb-2">
                  ⚠️ Não Autenticado
                </h2>
                <p className="text-yellow-700">
                  Você precisa fazer login para acessar o dashboard.
                </p>
              </div>
              
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Fazer Login
              </button>
            </div>
          )}
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Info:</h3>
            <pre className="text-xs text-gray-600">
{JSON.stringify({
  hasUser: !!user,
  loading,
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent.slice(0, 50) + '...'
}, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSimple;