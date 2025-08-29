
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AdminHeader from '@/components/admin/AdminHeader';
import OverviewTab from '@/components/admin/OverviewTab';
import ClientsTab from '@/components/admin/ClientsTab';
import PlansTab from '@/components/admin/PlansTab';
import RewardsTab from '@/components/admin/RewardsTab';
import FinancialTab from '@/components/admin/FinancialTab';
import AffiliatesTab from '@/components/admin/AffiliatesTab';
import ConversationsTab from '@/components/admin/ConversationsTab';
import AutomationsTab from '@/components/admin/AutomationsTab';
import IntegrationsTab from '@/components/admin/IntegrationsTab';
import AiConfigTab from '@/components/admin/AiConfigTab';
import WhiteLabelTab from '@/components/admin/WhiteLabelTab';
import LogsTab from '@/components/admin/LogsTab';
import { Loader2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const LoadingScreen = () => (
  <div className="flex justify-center items-center h-screen bg-slate-50">
    <div className="text-center">
      <Loader2 className="animate-spin h-12 w-12 text-primary" />
      <p className="mt-4 text-lg text-gray-700">Carregando painel de controle...</p>
    </div>
  </div>
);

const tabs = [
  { value: 'overview', label: 'Visão Geral', component: <OverviewTab /> },
  { value: 'clients', label: 'Clientes', component: <ClientsTab /> },
  { value: 'conversations', label: 'Conversas', component: <ConversationsTab /> },
  { value: 'plans', label: 'Planos', component: <PlansTab /> },
  { value: 'rewards', label: 'Recompensas', component: <RewardsTab /> },
  { value: 'financial', label: 'Financeiro', component: <FinancialTab /> },
  { value: 'affiliates', label: 'Afiliados', component: <AffiliatesTab /> },
  { value: 'automations', label: 'Automações', component: <AutomationsTab /> },
  { value: 'integrations', label: 'Integrações', component: <IntegrationsTab /> },
  { value: 'ai-config', label: 'IA Config', component: <AiConfigTab /> },
  { value: 'whitelabel', label: 'White Label', component: <WhiteLabelTab /> },
  { value: 'logs', label: 'Logs', component: <LogsTab /> },
];

const AdminDashboard = () => {
  const { loading: authLoading } = useAuth();
  const { loading: dataLoading } = useData();
  const navigate = useNavigate();
  const { tab: activeTabParam } = useParams();
  
  const activeTab = activeTabParam || 'overview';
  const activeComponent = tabs.find(t => t.value === activeTab)?.component || <OverviewTab />;

  if (authLoading || dataLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <>
      <Helmet>
        <title>Painel do Admin - Vida Smart</title>
        <meta name="description" content="Gerencie clientes, planos, finanças e muito mais." />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <AdminHeader />
        <main className="flex-grow">
          <div className="container mx-auto py-8 px-4 md:px-6">
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={(tab) => navigate(`/admin/${tab}`)}>
              <ScrollArea className="w-full whitespace-nowrap rounded-md">
                <TabsList className="grid-cols-none">
                  {tabs.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              
              <div className="mt-6">
                 {activeComponent}
              </div>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
