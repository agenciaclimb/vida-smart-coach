import React from 'react';
import { AlertTriangle, Home, Settings, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmergencyDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vida Smart Coach</h1>
              <p className="text-gray-600 mt-2">Dashboard Temporário - Modo de Recuperação</p>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-yellow-600">Sistema em manutenção</span>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Problema Técnico Detectado
              </h3>
              <p className="text-yellow-700 mb-4">
                Estamos enfrentando alguns problemas técnicos com a autenticação. 
                Nossa equipe está trabalhando para resolver isso o mais rápido possível.
              </p>
              <div className="text-sm text-yellow-600">
                <p><strong>Status:</strong> Investigando problemas de conexão</p>
                <p><strong>ETA:</strong> Resolução em andamento</p>
                <p><strong>Última atualização:</strong> {new Date().toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <Home className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Página Principal</h3>
            <p className="text-gray-600 mb-4">Voltar para a página inicial do site</p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
              variant="outline"
            >
              Ir para Home
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <Users className="h-8 w-8 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fazer Login</h3>
            <p className="text-gray-600 mb-4">Tentar fazer login novamente</p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="w-full"
              variant="default"
            >
              Tentar Login
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <Settings className="h-8 w-8 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Limpar Cache</h3>
            <p className="text-gray-600 mb-4">Limpar dados locais e recarregar</p>
            <Button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="w-full"
              variant="outline"
            >
              Limpar e Recarregar
            </Button>
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold mb-6">Status dos Serviços</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span>Website Principal</span>
              </div>
              <span className="text-green-600 font-medium">Operacional</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span>Sistema de Autenticação</span>
              </div>
              <span className="text-yellow-600 font-medium">Instável</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span>Base de Dados</span>
              </div>
              <span className="text-green-600 font-medium">Operacional</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span>Dashboard de Usuário</span>
              </div>
              <span className="text-yellow-600 font-medium">Manutenção</span>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Precisa de Ajuda?</h3>
          <p className="text-gray-600 mb-4">
            Se você continuar enfrentando problemas, entre em contato com nossa equipe de suporte.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => window.location.href = '/contato'}
              variant="default"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Entrar em Contato
            </Button>
            <Button 
              onClick={() => window.location.href = 'mailto:suporte@appvidasmart.com'}
              variant="outline"
            >
              Enviar Email
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Vida Smart Coach v1.0 - Dashboard de Emergência</p>
          <p>Última verificação: {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
}
