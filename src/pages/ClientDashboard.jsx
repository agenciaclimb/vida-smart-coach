
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';

import ClientHeader from '@/components/client/ClientHeader';
import DashboardTab from '@/components/client/DashboardTab';
import PlanTab from '@/components/client/PlanTab';
import ChatTab from '@/components/client/ChatTab';
import GamificationTab from '@/components/client/GamificationTab';
import CommunityTab from '@/components/client/CommunityTab';
import ProfileTab from '@/components/client/ProfileTab';
import ReferralTab from '@/components/client/ReferralTab';
import IntegrationsTab from '@/components/client/IntegrationsTab';
import SettingsTab from '@/components/client/SettingsTab';
import { Loader2 } from 'lucide-react';

const LoadingScreen = () => (
  <div className="flex justify-center items-center h-screen bg-slate-50">
    <div className="text-center">
      <Loader2 className="animate-spin rounded-full h-12 w-12 text-primary mx-auto"/>
      <p className="mt-4 text-lg text-gray-700">Carregando seu painel...</p>
    </div>
  </div>
);

const ClientDashboard = ({ defaultTab = 'dashboard' }) => {
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Sessão não encontrada
          </h2>
          <p className="text-gray-600 mb-6">
            Você precisa fazer login para acessar o dashboard.
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
        return <DashboardTab />;
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
        return <DashboardTab />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Painel do Cliente - Vida Smart</title>
        <meta name="description" content="Acompanhe seu progresso, converse com a IA Coach, gerencie seu plano e muito mais." />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <ClientHeader user={user} onLogout={signOut} />
        <main className="flex-grow">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="container mx-auto py-8 px-4 md:px-6">
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <TabsList className="grid-cols-none">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
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
      </div>
    </>
  );
};

export default ClientDashboard;
