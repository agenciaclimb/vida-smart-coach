import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, BarChart3, Dumbbell, Zap, MessageSquare, Users, Edit, Loader2, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCheckins } from '@/contexts/data/CheckinsContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ProgressChart from '@/components/client/ProgressChart';
import CompletionProgress from '@/components/client/CompletionProgress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import WelcomeCard from '@/components/client/WelcomeCard';
import { debugLog, validateCheckinData, trackError } from '@/utils/debugHelpers';
import { supabase } from '@/lib/supabase';
import { usePlans } from '@/contexts/data/PlansContext';
import GuidedTour from '@/components/onboarding/GuidedTour';
import WhatsAppOnboardingPrompt from '@/components/onboarding/WhatsAppOnboardingPrompt';
import CheckinSystem from '@/components/checkin/CheckinSystem';
import StreakCounter from '@/components/client/StreakCounter';
import { useGamification } from '@/contexts/data/GamificationContext';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

const StatCard = ({ icon, title, value, gradient, onClick, animated = false }) => (
  <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
    <Card className="overflow-hidden" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <CardHeader className={`p-4 flex flex-row items-center justify-between space-y-0 pb-2 ${gradient}`}>
        <div className="flex items-center">
          <div className="p-2 bg-white/20 rounded-md mr-4">
            {icon}
          </div>
          <CardTitle className="text-sm font-medium text-white">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {animated ? (
          <div className="text-2xl font-bold">
            <AnimatedCounter value={parseFloat(value) || 0} />
          </div>
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

const DailyCheckInCard = () => {
  const { user } = useAuth();
  const { addDailyMetric, hasCheckedInToday, loadingCheckin } = useCheckins();
  const [weight, setWeight] = useState(user?.profile?.current_weight || '');
  const [mood, setMood] = useState('');
  const [sleep, setSleep] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const metric = {
        weight: weight && parseFloat(weight) > 0 ? parseFloat(weight) : null,
        mood_score: mood ? parseInt(mood) : null,
        sleep_hours: sleep ? parseFloat(sleep) : null
      };
      
      // Enhanced validation
      const validation = validateCheckinData(metric);
      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error));
        debugLog('Check-in Validation Failed', { metric, errors: validation.errors });
        return;
      }
      
      debugLog('Check-in Submission Started', { user: user?.id, metric });
      
      const result = await addDailyMetric(metric);
      
      if (result?.success) {
        debugLog('Check-in Success', { result });
        toast.success('Check-in registrado com sucesso! 🎉');
        
        // Clear form on success
        setMood('');
        setSleep('');
        // Keep weight as it doesn't change daily
      } else if (result?.isDuplicate) {
        debugLog('Check-in Duplicate Detected', { result });
        // Toast already shown by addDailyMetric
      } else {
        debugLog('Check-in Failed', { result });
        throw new Error(result?.error?.message || 'Falha desconhecida no check-in');
      }
    } catch (error) {
      debugLog('Check-in Error', { user: user?.id, formData: { mood, sleep, weight } }, error);
      trackError('DashboardTab.handleSubmit', error, { 
        userId: user?.id, 
        formData: { mood, sleep, weight } 
      });
      toast.error(`Erro ao registrar check-in: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasCheckedInToday) {
    return (
      <Card className="bg-lime-50 border border-lime-200">
        <CardHeader>
          <CardTitle className="text-lime-800">Check-in do Dia Completo! ✅</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lime-700">Ótimo trabalho por registrar seu progresso hoje. Continue assim e até amanhã!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check-in Rápido (Métricas)</CardTitle>
        <CardDescription>Peso, humor e sono — registre em 30 segundos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="weight" className="text-sm font-medium text-gray-700 mb-1 block">Peso (kg)</label>
              <Input 
                id="weight" 
                type="number" 
                step="0.1" 
                placeholder="Ex: 75.5" 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)} 
              />
            </div>
            <div>
              <label htmlFor="mood" className="text-sm font-medium text-gray-700 mb-1 block">Humor hoje</label>
              <Select onValueChange={setMood} value={mood}>
                <SelectTrigger id="mood">
                  <SelectValue placeholder="Como se sente?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">😁 Excelente</SelectItem>
                  <SelectItem value="4">🙂 Bom</SelectItem>
                  <SelectItem value="3">😐 Normal</SelectItem>
                  <SelectItem value="2">😟 Ruim</SelectItem>
                  <SelectItem value="1">😩 Péssimo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="sleep" className="text-sm font-medium text-gray-700 mb-1 block">Sono (horas)</label>
              <Input id="sleep" type="number" step="0.5" placeholder="Ex: 8" value={sleep} onChange={(e) => setSleep(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full vida-smart-gradient" disabled={isSubmitting || loadingCheckin}>
            {isSubmitting || loadingCheckin ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Check-in'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};


const DashboardTab = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { currentPlans } = usePlans?.() || { currentPlans: null };
  const { gamificationData, loading: gamLoading } = useGamification();

  const [completionsCount, setCompletionsCount] = useState(null);
  const [interactionsCount, setInteractionsCount] = useState(null);
  const [runTour, setRunTour] = useState(false);
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);
  const [lastActivityDate, setLastActivityDate] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCounts() {
      try {
        if (!user?.id) return;

        const [{ count: compCount }, { count: interCount }, { data: recentActivity }] = await Promise.all([
          supabase
            .from('plan_completions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('interactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('daily_activities')
            .select('created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ]);
        if (!cancelled) {
          setCompletionsCount(compCount ?? 0);
          setInteractionsCount(interCount ?? 0);
          setLastActivityDate(recentActivity?.created_at || null);

          // Show WhatsApp prompt after first plan is generated
          const hasPlans = currentPlans && Object.keys(currentPlans).length > 0;
          if (hasPlans) {
            setShowWhatsAppPrompt(true);
          }
        }
      } catch (e) {
        // Silencioso: não quebra a UI
        if (!cancelled) {
          setCompletionsCount(0);
          setInteractionsCount(0);
        }
      }
    }
    loadCounts();
    return () => { cancelled = true; };
  }, [user?.id, currentPlans]);

  // Exibe loading apenas enquanto a autenticação está carregando.
  // Se o perfil ainda não existir no banco, seguimos com valores padrão.
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
  const hasPlans = !!(currentPlans && Object.keys(currentPlans).length > 0);
  const hasFirstCompletion = (completionsCount ?? 0) > 0;
  const hasFirstInteraction = (interactionsCount ?? 0) > 0;

  const checklist = [
    {
      key: 'profile',
      title: 'Complete seu perfil',
      done: !!hasCompleteProfile,
      action: () => navigate('/dashboard?tab=profile'),
      cta: hasCompleteProfile ? 'Concluído' : 'Completar perfil'
    },
    {
      key: 'plan',
      title: 'Gere seu primeiro plano',
      done: hasPlans,
      action: () => navigate('/dashboard?tab=plan'),
      cta: hasPlans ? 'Concluído' : 'Gerar plano'
    },
    {
      key: 'tour',
      title: 'Faça o tour guiado',
      done: !!localStorage.getItem('vida_smart_tour_completed'),
      action: () => {
        navigate('/dashboard?tab=plan');
        setTimeout(() => setRunTour(true), 500);
      },
      cta: localStorage.getItem('vida_smart_tour_completed') ? 'Concluído' : 'Iniciar tour'
    },
    {
      key: 'complete_one',
      title: 'Conclua 1 item do plano',
      done: hasFirstCompletion,
      action: () => navigate('/dashboard?tab=plan'),
      cta: hasFirstCompletion ? 'Concluído' : 'Ir para o plano'
    },
    {
      key: 'talk_ai',
      title: 'Fale com a IA Coach',
      done: hasFirstInteraction,
      action: () => navigate('/dashboard?tab=chat'),
      cta: hasFirstInteraction ? 'Concluído' : 'Abrir chat'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 pb-8 md:pb-0"
    >
      <GuidedTour run={runTour} onComplete={() => setRunTour(false)} />

      {/* Onboarding (mobile-first) */}
      <div className="md:hidden">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Comece por aqui</CardTitle>
            <CardDescription>Cinco passos para começar sua transformação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklist.map(step => (
              <div key={step.key} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                <div className="flex items-center gap-3">
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                  <span className={`text-sm ${step.done ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{step.title}</span>
                </div>
                <Button size="sm" variant={step.done ? 'outline' : 'default'} className={step.done ? '' : 'vida-smart-gradient text-white'} onClick={step.action}>
                  <span className="hidden xs:inline">{step.cta}</span>
                  {!step.done && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      {/* WhatsApp Onboarding Prompt */}
      {showWhatsAppPrompt && <WhatsAppOnboardingPrompt onDismiss={() => setShowWhatsAppPrompt(false)} />}

      {/* Check-in Reflexivo (IA Coach) - Promove engajamento diário */}
      <CheckinSystem />

      {/* Streak Counter - Incentiva consistência diária */}
      {!gamLoading && gamificationData && (
        <StreakCounter 
          currentStreak={gamificationData.current_streak || 0}
          longestStreak={gamificationData.longest_streak || 0}
          lastActivityDate={lastActivityDate}
        />
      )}

      {/* Show WelcomeCard if profile is incomplete */}
      {!hasCompleteProfile && <WelcomeCard />}
      
      {/* Show greeting if profile is complete */}
      {hasCompleteProfile && (
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Olá, {profile.name || profile.full_name || 'Cliente'}!</h1>
            <p className="text-gray-500 mt-1">Bem-vindo(a) de volta. Pronto para evoluir hoje?</p>
          </div>
          <Button onClick={() => navigate('/dashboard?tab=profile')}>
            <Edit className="w-4 h-4 mr-2" />
            Editar Perfil
          </Button>
        </div>
      )}

      <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={<Dumbbell className="text-white" />} 
          title="Plano Atual" 
          value={hasCompleteProfile ? (profile.plan || 'N/A') : 'Pendente'} 
          gradient={hasCompleteProfile ? "bg-gradient-to-tr from-blue-500 to-blue-400" : "bg-gradient-to-tr from-gray-400 to-gray-300"} 
          onClick={() => navigate('/dashboard?tab=plan')} 
        />
        <StatCard 
          icon={<Award className="text-white" />} 
          title="Nível" 
          value={profile.level || '1'} 
          gradient="bg-gradient-to-tr from-amber-500 to-amber-400" 
          animated={true}
        />
        <StatCard 
          icon={<Zap className="text-white" />} 
          title="Pontos" 
          value={profile.points || '0'} 
          gradient="bg-gradient-to-tr from-lime-500 to-lime-400" 
          onClick={() => navigate('/dashboard?tab=gamification')} 
          animated={true}
        />
        <StatCard icon={<BarChart3 className="text-white" />} title="Peso Atual" value={`${profile.current_weight || '--'} kg`} gradient="bg-gradient-to-tr from-violet-500 to-violet-400" />
      </div>

      {/* Always show DailyCheckInCard */}
      <DailyCheckInCard />

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Seu Progresso</CardTitle>
            <CardDescription>Acompanhe sua evolução nas últimas semanas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressChart />
          </CardContent>
        </Card>
      </div>

      {/* Completion and XP progress charts */}
      <div>
        <CompletionProgress />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard?tab=plan')}>
          <CardHeader className="flex-row items-center gap-4">
            <Dumbbell className="w-8 h-8 text-primary" />
            <div>
              <CardTitle>Meu Plano</CardTitle>
              <CardDescription>Treinos e hábitos</CardDescription>
            </div>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard?tab=chat')}>
          <CardHeader className="flex-row items-center gap-4">
            <MessageSquare className="w-8 h-8 text-primary" />
            <div>
              <CardTitle>Falar com a IA</CardTitle>
              <CardDescription>Seu coach 24/7</CardDescription>
            </div>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard?tab=community')}>
          <CardHeader className="flex-row items-center gap-4">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <CardTitle>Comunidade</CardTitle>
              <CardDescription>Interaja e motive-se</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
      {/* Spacer extra para a bottom nav no mobile */}
      <div className="h-6 md:hidden" />
    </motion.div>
  );
};

export default DashboardTab;