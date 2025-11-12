import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, Users, Calendar, ClipboardList, Loader2, Edit } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCheckins } from '@/contexts/data/CheckinsContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ProgressChart from '@/components/client/ProgressChart';
import CompletionProgress from '@/components/client/CompletionProgress';
import toast from 'react-hot-toast';
import WelcomeCard from '@/components/client/WelcomeCard';
import { debugLog } from '@/utils/debugHelpers';
import GuidedTour from '@/components/onboarding/GuidedTour';
import WhatsAppOnboardingPrompt from '@/components/onboarding/WhatsAppOnboardingPrompt';
import { useGamification } from '@/contexts/data/GamificationContext';

// Novos componentes do dashboard redesenhado
import HeroGamification from '@/components/dashboard/HeroGamification';
import CheckinCTA from '@/components/dashboard/CheckinCTA';
import WeeklySummary from '@/components/dashboard/WeeklySummary';
import ActionCard from '@/components/dashboard/ActionCard';
import PersonalizedTip from '@/components/dashboard/PersonalizedTip';

// Hook customizado para estatísticas
import { useDashboardStats } from '@/hooks/useDashboardStats';

const DashboardTab = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { gamificationData, loading: gamLoading } = useGamification();
  const { addDailyMetric, hasCheckedInToday, loadingCheckin } = useCheckins();
  const { weeklyData, completionsCount, interactionsCount, hasPlans, loading: statsLoading } = useDashboardStats();

  const [runTour, setRunTour] = useState(false);
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);

  useEffect(() => {
    // Show WhatsApp prompt after first plan is generated
    if (hasPlans && !localStorage.getItem('whatsapp_prompt_dismissed')) {
      setShowWhatsAppPrompt(true);
    }
  }, [hasPlans]);

  // Exibe loading apenas enquanto a autenticação está carregando
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const profile = user?.profile || {};

  // Check if profile is complete for conditional WelcomeCard display
  const hasCompleteProfile = profile?.name || profile?.full_name;

  // Contexto para dica personalizada
  const tipContext = {
    userName: profile.name || profile.full_name || 'você',
    currentStreak: gamificationData?.current_streak || 0,
    preferredTime: { hour: 18 } // TODO: Extrair de dados reais de atividades
  };

  // Handler para check-in
  const handleCheckinSubmit = async (metric) => {
    try {
      const result = await addDailyMetric(metric);

      if (result?.success) {
        debugLog('Check-in Success', { result });
        toast.success('Check-in registrado com sucesso! 🎉 +10 XP');
        return true;
      } else if (result?.isDuplicate) {
        debugLog('Check-in Duplicate Detected', { result });
        return false;
      } else {
        debugLog('Check-in Failed', { result });
        throw new Error(result?.error?.message || 'Falha desconhecida no check-in');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(`Erro ao registrar check-in: ${error.message}`);
      throw error;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 pb-8 md:pb-0"
    >
      <GuidedTour run={runTour} onComplete={() => setRunTour(false)} />

      {/* WhatsApp Onboarding Prompt */}
      {showWhatsAppPrompt && (
        <WhatsAppOnboardingPrompt
          onDismiss={() => {
            setShowWhatsAppPrompt(false);
            localStorage.setItem('whatsapp_prompt_dismissed', 'true');
          }}
        />
      )}

      {/* Show WelcomeCard if profile is incomplete */}
      {!hasCompleteProfile && <WelcomeCard />}

      {/* Greeting se profile completo */}
      {hasCompleteProfile && (
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Olá, {profile.name || profile.full_name || 'Cliente'}! 👋
            </h1>
            <p className="text-gray-500 mt-1">
              {new Date().getHours() < 12
                ? 'Bom dia! Pronto para começar o dia com energia?'
                : new Date().getHours() < 18
                ? 'Boa tarde! Vamos continuar sua jornada de evolução?'
                : 'Boa noite! Como foi seu dia?'}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard?tab=profile')}>
            <Edit className="w-4 h-4 mr-2" />
            Editar Perfil
          </Button>
        </div>
      )}

      {/* 1. HERO GAMIFICAÇÃO - Destaque principal */}
      {!gamLoading && gamificationData && (
        <HeroGamification gamificationData={gamificationData} />
      )}

      {/* 2. CALL-TO-ACTION - Check-in Diário */}
      <CheckinCTA
        hasCheckedInToday={hasCheckedInToday}
        onSubmit={handleCheckinSubmit}
        isSubmitting={loadingCheckin}
        defaultValues={{
          weight: user?.profile?.current_weight || ''
        }}
      />

      {/* 3. DICA PERSONALIZADA - IA Coach */}
      <PersonalizedTip context={tipContext} />

      {/* 4. RESUMO SEMANAL - Progresso */}
      {!statsLoading && <WeeklySummary weeklyData={weeklyData} />}

      {/* 5. AÇÕES RÁPIDAS - Grid de Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ActionCard
          icon={<MessageSquare />}
          title="IA Coach"
          description="Tire dúvidas"
          gradient="from-blue-500 to-cyan-500"
          badge="Online 24/7"
          onClick={() => navigate('/dashboard?tab=chat')}
        />
        <ActionCard
          icon={<ClipboardList />}
          title="Meu Plano"
          description="Ver treinos"
          gradient="from-purple-500 to-pink-500"
          badge={hasPlans ? 'Ativo' : 'Criar'}
          onClick={() => navigate('/dashboard?tab=plan')}
        />
        <ActionCard
          icon={<Calendar />}
          title="Calendário"
          description="Agendar"
          gradient="from-orange-500 to-red-500"
          onClick={() => navigate('/dashboard?tab=calendar')}
        />
        <ActionCard
          icon={<Users />}
          title="Comunidade"
          description="Conectar"
          gradient="from-green-500 to-teal-500"
          onClick={() => navigate('/dashboard?tab=community')}
        />
      </div>

      {/* 6. GRÁFICOS DE PROGRESSO - Seção Avançada */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução Detalhada</CardTitle>
            <CardDescription>
              Acompanhe suas métricas nas últimas semanas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressChart />
          </CardContent>
        </Card>

        <CompletionProgress />
      </div>

      {/* Spacer extra para a bottom nav no mobile */}
      <div className="h-6 md:hidden" />
    </motion.div>
  );
};

export default DashboardTab;
