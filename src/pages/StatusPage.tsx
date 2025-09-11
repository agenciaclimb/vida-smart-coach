import React from 'react';

const StatusPage: React.FC = () => {
  const getGitCommit = () => {
    // Placeholder - será substituído pelo commit real durante build
    return process.env.VITE_GIT_COMMIT || 'unknown';
  };

  const getAppVersion = () => {
    return '1.0.0';
  };

  const performHealthCheck = () => {
    try {
      // Verificações básicas do app
      const checks = {
        'React Router': !!window.location,
        'Environment Variables': !!(
          process.env.VITE_SUPABASE_URL && 
          process.env.VITE_SUPABASE_ANON_KEY
        ),
        'Local Storage': !!window.localStorage,
        'Session Storage': !!window.sessionStorage,
      };

      return {
        status: Object.values(checks).every(Boolean) ? 'healthy' : 'degraded',
        checks,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  };

  const healthCheck = performHealthCheck();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Status do Sistema - Vida Smart Coach
            </h1>

            {/* Health Check Status */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    healthCheck.status === 'healthy'
                      ? 'bg-green-500'
                      : healthCheck.status === 'degraded'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-lg font-medium">
                  Status: {healthCheck.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Última verificação: {new Date(healthCheck.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>

            {/* System Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Informações do Sistema
                </h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Versão:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {getAppVersion()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Commit:</dt>
                    <dd className="text-sm font-mono text-gray-900">
                      {getGitCommit()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Ambiente:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {process.env.VITE_APP_ENV || 'development'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Debug Mode:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {process.env.VITE_DEBUG_MODE === 'true' ? 'Ativo' : 'Inativo'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Configurações
                </h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Supabase:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {process.env.VITE_SUPABASE_URL ? '✅ Conectado' : '❌ Não configurado'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Stripe:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {process.env.VITE_STRIPE_PUBLIC_KEY ? '✅ Configurado' : '❌ Não configurado'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Functions:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {process.env.VITE_FUNCTIONS_ENABLED === 'true' ? '✅ Ativas' : '❌ Inativas'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Health Checks Detail */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Verificações de Saúde
              </h3>
              {healthCheck.status !== 'error' ? (
                <dl className="space-y-2">
                  {Object.entries(healthCheck.checks).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <dt className="text-sm text-gray-600">{key}:</dt>
                      <dd className="text-sm font-medium">
                        {value ? (
                          <span className="text-green-600">✅ OK</span>
                        ) : (
                          <span className="text-red-600">❌ Falhou</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="text-red-600">
                  <p className="font-medium">Erro durante verificação:</p>
                  <p className="text-sm mt-1">{healthCheck.error}</p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ← Voltar ao Início
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPage;