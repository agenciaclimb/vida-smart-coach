
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useAuth } from '@/components/auth/AuthProvider';
import { useData } from '@/contexts/DataContext';

import ClientHeader from '@/components/client/ClientHeader';
import MobileBottomNav from '@/components/client/MobileBottomNav';
import DashboardTab from '@/components/client/DashboardTab';
import PlanTab from '@/components/client/PlanTab';
import ChatTab from '@/components/client/ChatTab';
import GamificationTab from '@/components/client/GamificationTab';
import CommunityTab from '@/components/client/CommunityTab';
import ProfileTab from '@/components/client/ProfileTab';
import ReferralTab from '@/components/client/ReferralTab';
import IntegrationsTab from '@/components/client/IntegrationsTab';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
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

  // Estado do tour guiado
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    // Verificar se é a primeira vez do usuário (localStorage)
    const hasSeenTour = localStorage.getItem('vida_has_seen_tour');
    if (!hasSeenTour && user) {
      // Aguarda 2 segundos para garantir que a UI carregou
      setTimeout(() => {
        setRunTour(true);
      }, 2000);
    }
  }, [user]);

  const handleTourFinish = () => {
    setRunTour(false);
    localStorage.setItem('vida_has_seen_tour', 'true');
  };

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
      <OnboardingTour run={runTour} onFinish={handleTourFinish} />
      <div className="flex flex-col min-h-screen bg-gray-50">
        <ClientHeader user={user} onLogout={signOut} />
        <main className="flex-grow pb-20 md:pb-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="container mx-auto py-8 px-4 md:px-6">
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <TabsList className="grid-cols-none hidden md:inline-grid">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="plan" data-tour="generate-plan">Meu Plano</TabsTrigger>
                <TabsTrigger value="chat" data-tour="chat-ia">IA Coach</TabsTrigger>
                <TabsTrigger value="gamification">Gamificação</TabsTrigger>
                <TabsTrigger value="community">Comunidade</TabsTrigger>
                <TabsTrigger value="profile">Perfil & Configurações</TabsTrigger>
                <TabsTrigger value="referral">Indique e Ganhe</TabsTrigger>
                <TabsTrigger value="integrations" data-tour="whatsapp-button">Integrações</TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            
            {renderTabContent()}
          </Tabs>
        </main>
        <MobileBottomNav activeTab={activeTab} onChange={handleTabChange} />
      </div>
    </>
  );
};

export default ClientDashboard;
