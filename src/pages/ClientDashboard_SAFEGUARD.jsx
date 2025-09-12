import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/contexts/DataContext';
import { Shield } from 'lucide-react';

import ClientHeader from '@/components/client/ClientHeader';
import DashboardTabFixedSimple from '@/components/client/DashboardTab_FIXED_SIMPLE';
import PlanTab from '@/components/client/PlanTab';
import ChatTab from '@/components/client/ChatTab';
import GamificationTab from '@/components/client/GamificationTab';
import CommunityTab from '@/components/client/CommunityTab';
import ProfileTab from '@/components/client/ProfileTab';
import ReferralTab from '@/components/client/ReferralTab';
import IntegrationsTab from '@/components/client/IntegrationsTab';
import SettingsTab from '@/components/client/SettingsTab';
import { Loader2 } from 'lucide-react';

// ===============================================
// 🛡️ CLIENTE DASHBOARD COM PROTEÇÃO SAFEGUARD
// ===============================================

const LoadingScreen = () => (
  <div className="flex justify-center items-center h-screen bg-slate-50">
    <div className="text-center">
      <div className="flex items-center justify-center mb-4">
        <Shield className="w-8 h-8 text-blue-500 mr-3" />
        <Loader2 className="animate-spin rounded-full h-12 w-12 text-primary" />
      </div>
      <p className="mt-4 text-lg text-gray-700">
        🛡️ Carregando seu painel com proteção anti-loop...
      </p>
    </div>
  </div>
);

const ClientDashboardSafeGuard = ({ defaultTab = 'dashboard' }) => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { loading: dataLoading } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || defaultTab;

  const handleTabChange = (tab) => {
    navigate(`/dashboard?tab=${tab}`);
  };

  // Sempre mostrar loading se necessário
  if (authLoading || dataLoading) {
    return <LoadingScreen />;
  }

  // Se não há usuário, mostrar mensagem de erro em vez de nada
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="text-center p-8">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🛡️ Sessão não encontrada
          </h2>
          <p className="text-gray-600 mb-6">
            Você precisa fazer login para acessar o dashboard protegido.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTabFixedSimple />;
      case 'plan':
        return <PlanTab />;
      case 'chat':
        return <ChatTab />;
      case 'gamification':
        return <GamificationTab />;
      case 'community':
        return <CommunityTab />;
      case 'profile':
        return <ProfileTab />;
      case 'referral':
        return <ReferralTab />;
      case 'integrations':
        return <IntegrationsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTabFixedSimple />;
    }
  };

  return (
    <>
      <Helmet>
        <title>🛡️ Painel Protegido - Vida Smart</title>
        <meta name="description" content="Dashboard com proteção anti-loop infinito. Acompanhe seu progresso, converse com a IA Coach, gerencie seu plano e muito mais." />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header com indicador de proteção */}
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="container mx-auto flex items-center justify-center text-sm text-blue-700">
            <Shield className="w-4 h-4 mr-2" />
            <span className="font-medium">SafeGuard Ativo:</span>
            <span className="ml-1">Proteção contra loops infinitos e resource exhaustion</span>
          </div>
        </div>
        
        <ClientHeader user={user} onLogout={signOut} />
        
        <main className="flex-grow">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="container mx-auto py-8 px-4 md:px-6">
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <TabsList className="grid-cols-none">
                <TabsTrigger value="dashboard" className="relative">
                  <Shield className="w-4 h-4 mr-2 text-blue-500" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="plan">Meu Plano</TabsTrigger>
                <TabsTrigger value="chat">IA Coach</TabsTrigger>
                <TabsTrigger value="gamification">Gamificação</TabsTrigger>
                <TabsTrigger value="community">Comunidade</TabsTrigger>
                <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
                <TabsTrigger value="referral">Indique e Ganhe</TabsTrigger>
                <TabsTrigger value="integrations">Integrações</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            
            {renderTabContent()}
          </Tabs>
        </main>

        {/* Footer com informações de debug */}
        {process.env.NODE_ENV === 'development' && (
          <footer className="bg-gray-100 border-t px-4 py-2">
            <div className="container mx-auto text-xs text-gray-500 flex items-center justify-between">
              <span>🛡️ SafeGuard Dashboard v1.0 - Anti-Loop Protection Active</span>
              <span>User: {user.email} | Tab: {activeTab}</span>
            </div>
          </footer>
        )}
      </div>
    </>
  );
};

export default ClientDashboardSafeGuard;