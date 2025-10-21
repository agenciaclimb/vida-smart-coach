import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dumbbell, Flame, Zap, CheckCircle, Info, MessageCircle, Loader2, Sparkles, Brain, Target, Heart, Wind, Leaf, Droplets, Bot, Cpu, Activity, Trophy, Star, Award } from 'lucide-react';
import { usePlans } from '@/contexts/data/PlansContext';
import { useAuth } from '@/components/auth/AuthProvider';
// Use the real Gamification context (not the lightweight demo hook)
import { useGamification } from '@/contexts/data/GamificationContext';
import CheckinSystem from '@/components/checkin/CheckinSystem';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// 🎮 COMPONENTE DE GAMIFICAÇÃO INTEGRADO
const GamificationDisplay = () => {
  // Pull enriched data from the Gamification context
  const { gamificationData, userAchievements, loading } = useGamification();

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-purple-500 mr-2" />
          <span className="text-sm">Carregando gamificação...</span>
        </CardContent>
      </Card>
    );
  }

  const totalPoints = gamificationData?.total_points ?? gamificationData?.totalPoints ?? 0;
  const level = gamificationData?.level ?? 1;
  const streakDays = gamificationData?.streak_days ?? gamificationData?.streakDays ?? 0;
  const progressPercentage = ((totalPoints % 100) / 100) * 100;

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Trophy className="w-5 h-5 mr-2 text-purple-600" />
          Sistema de Gamificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pontos e Nível */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{totalPoints}</p>
              <p className="text-xs text-gray-600">Pontos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-pink-600">Nv {level}</p>
              <p className="text-xs text-gray-600">Nível</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{streakDays}</p>
              <p className="text-xs text-gray-600">Sequência</p>
            </div>
          </div>
        </div>

        {/* Barra de Progresso para próximo nível */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progresso para Nível {gamificationData.level + 1}</span>
            <span>{gamificationData.totalPoints % 100}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Badges / Conquistas do usuário */}
        {Array.isArray(userAchievements) && userAchievements.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Conquistas Recentes:</p>
            <div className="flex flex-wrap gap-1">
              {userAchievements.slice(0, 6).map((ua) => (
                <span
                  key={ua.id}
                  className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                  title={ua.achievements?.description || 'Conquista'}
                >
                  {ua.achievements?.name || ua.achievements?.code || '🏆 Conquista'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Últimos Achievements (detalhes) */}
        {Array.isArray(userAchievements) && userAchievements.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Últimas Conquistas:</p>
            <div className="space-y-1">
              {userAchievements.slice(0, 3).map((ua) => (
                <div
                  key={ua.id}
                  className="flex items-center space-x-2 text-sm"
                >
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700">{ua.achievements?.name || ua.achievements?.code || 'Conquista'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 🤖 COMPONENTE IA COACH INTEGRADO - SISTEMA 4 ESTÁGIOS
const IACoachIntegration = () => {
  const { user: authUser } = useAuth();
  const { addDailyActivity } = useGamification();
  const [clientStage, setClientStage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);

  // Buscar estágio atual do usuário no sistema IA Coach
  useEffect(() => {
    const fetchClientStage = async () => {
      if (!authUser?.id) return;

      try {
        const { data, error } = await supabase
          .from('client_stages')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar client_stage:', error);
        } else {
          // Se não existe registro, considerar estágio inicial SDR (auto)
          setClientStage(data || { current_stage: 'sdr', bant_score: { budget: 0, authority: 0, need: 0, timeline: 0 }, stage_metadata: { inferred: true } });
        }
      } catch (err) {
        console.error('Erro na consulta client_stages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientStage();
  }, [authUser?.id]);

  // Inicialização manual desativada: IA é automática e inicia em SDR no primeiro contato
  // Mantemos placeholder para futura automação via WhatsApp se necessário
  const initializeIACoach = async () => {
    toast('A IA é automática e já está ativa para você.');
    return true;
  };

  // Progredir estágio do cliente (SDR → Specialist → Seller → Partner)
  const progressStage = async () => {
    if (!clientStage) return;

    const stageProgression = {
      'sdr': 'specialist',
      'specialist': 'seller', 
      'seller': 'partner',
      'partner': 'partner' // Já no último estágio
    };

    const nextStage = stageProgression[clientStage.current_stage];
    if (nextStage === clientStage.current_stage) {
      toast.success('🏆 Você já está no estágio máximo (Partner)!');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('client_stages')
        .update({
          current_stage: nextStage,
          stage_metadata: {
            ...clientStage.stage_metadata,
            progressed_at: new Date().toISOString(),
            previous_stage: clientStage.current_stage
          }
        })
        .eq('id', clientStage.id)
        .select()
        .single();

      if (error) throw error;

      setClientStage(data);
      toast.success(`🚀 Parabéns! Você progrediu para ${nextStage.toUpperCase()}!`);
      
      // 🎮 Registrar atividade por progressão de estágio
      await addDailyActivity({
        type: 'mission',
        name: `Progressão para ${nextStage}`,
        key: `ia-coach-stage-${nextStage}`,
        points: 50,
        description: `Estágio avançado de ${clientStage.current_stage} para ${nextStage}`,
        metadata: {
          stage: nextStage,
          previous_stage: clientStage.current_stage,
          progression_date: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao progredir estágio:', error);
      toast.error('Erro ao progredir estágio');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <span>Verificando sistema IA Coach...</span>
        </CardContent>
      </Card>
    );
  }

  const stageConfig = {
    sdr: { name: 'SDR', icon: Bot, color: 'blue', description: 'Identificando necessidades' },
    specialist: { name: 'Especialista', icon: Brain, color: 'green', description: 'Analisando suas áreas' },
    seller: { name: 'Vendedor', icon: Target, color: 'orange', description: 'Propondo soluções' },
    partner: { name: 'Parceiro', icon: Heart, color: 'purple', description: 'Jornada de transformação' }
  };

  const currentStageConfig = clientStage ? stageConfig[clientStage.current_stage] : null;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Cpu className="w-6 h-6 mr-2 text-blue-600" />
          Sistema IA Coach Estratégico
        </CardTitle>
        <CardDescription>
          {clientStage ? 
            `Estágio atual: ${currentStageConfig?.name} - ${currentStageConfig?.description}` :
            'Ative o sistema inteligente de 4 estágios para planos personalizados'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {clientStage ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {React.createElement(currentStageConfig.icon, { 
                  className: `w-8 h-8 text-${currentStageConfig.color}-500` 
                })}
                <div>
                  <p className="font-semibold">{currentStageConfig.name}</p>
                  <p className="text-sm text-gray-600">{currentStageConfig.description}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  BANT: {JSON.stringify(clientStage.bant_score)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-gray-700">
              🤖 A IA Coach funciona automaticamente e se adapta ao seu momento. 
              Quando você conversar pelo WhatsApp ou aqui no chat, ela começa no estágio SDR e evolui sozinha.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente para quando não há planos gerados
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const PLAN_AREAS = [
  { key: 'physical', label: 'Físico' },
  { key: 'nutritional', label: 'Alimentar' },
  { key: 'emotional', label: 'Emocional' },
  { key: 'spiritual', label: 'Espiritual' },
];

const areaQuestions = {
  physical: [
    { name: 'goal', label: 'Qual seu objetivo físico principal?', type: 'text' },
    { name: 'routine', label: 'Descreva sua rotina de exercícios atual', type: 'textarea' },
    { name: 'time', label: 'Quanto tempo por semana pode dedicar?', type: 'text' },
  ],
  nutritional: [
    { name: 'goal', label: 'Qual seu objetivo alimentar?', type: 'text' },
    { name: 'restrictions', label: 'Possui restrições/alergias?', type: 'text' },
    { name: 'meals', label: 'Quantas refeições faz por dia?', type: 'text' },
  ],
  emotional: [
    { name: 'goal', label: 'Qual seu objetivo emocional?', type: 'text' },
    { name: 'stress', label: 'Nível de estresse atual (1-10)', type: 'text' },
    { name: 'habits', label: 'Práticas de autocuidado?', type: 'text' },
  ],
  spiritual: [
    { name: 'goal', label: 'Qual seu objetivo espiritual?', type: 'text' },
    { name: 'practices', label: 'Práticas espirituais atuais?', type: 'text' },
    { name: 'frequency', label: 'Com que frequência pratica?', type: 'text' },
  ],
};

const NoPlanState = () => {
  const { generatePersonalizedPlan, generatingPlan } = usePlans();
  const { user: authUser } = useAuth();
  const { addDailyActivity } = useGamification();
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState('physical');
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleGeneratePlan = async () => {
    if (!authUser?.profile?.name || !authUser?.profile?.goal_type) {
      toast.error('Complete seu perfil primeiro para gerar um plano personalizado!');
      return;
    }
    const success = await generatePersonalizedPlan();
    if (success) {
      await addDailyActivity({
        type: 'mission',
        name: 'Plano personalizado gerado',
        key: 'plan-generated',
        points: 30,
        description: 'Planos de transformação criados pela IA',
        metadata: {
          goal_type: authUser.profile?.goal_type,
          generation_date: new Date().toISOString()
        }
      });
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Chamada para endpoint de geração manual (mock: usa generatePersonalizedPlan)
      // Aqui você pode customizar para enviar apenas a área e respostas
      await generatePersonalizedPlan();
      toast.success('Plano gerado manualmente!');
      setManualDialogOpen(false);
    } catch (err) {
      toast.error('Erro ao gerar plano manual');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <GamificationDisplay />
      <CheckinSystem />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 py-12 px-6 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 rounded-xl border border-gray-200"
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-gradient-to-br from-primary to-green-400 rounded-full">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-gray-800 mb-2">
          IA Coach Pronta para Criar seu Plano de Transformação!
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          Nossa Inteligência Artificial analisará seu perfil e criará um plano completo nas 4 áreas (Físico, Alimentar, Emocional e Espiritual) para seus objetivos.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button 
            onClick={handleGeneratePlan}
            disabled={generatingPlan}
            size="lg"
            className="vida-smart-gradient text-white px-8 py-3 text-lg font-semibold mb-4"
          >
            {generatingPlan ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Gerando Planos...</>
            ) : (
              <><Sparkles className="mr-2 h-5 w-5" />Gerar Meus Planos de Transformação</>
            )}
          </Button>
          <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg font-semibold mb-4">
                Gerar Plano Manualmente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar Plano Manual</DialogTitle>
                <DialogDescription>
                  Escolha a área e preencha as informações para gerar um plano personalizado.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Área do Plano</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={selectedArea}
                    onChange={e => setSelectedArea(e.target.value)}
                  >
                    {PLAN_AREAS.map(area => (
                      <option key={area.key} value={area.key}>{area.label}</option>
                    ))}
                  </select>
                </div>
                {areaQuestions[selectedArea].map(q => (
                  <div key={q.name}>
                    <label className="block mb-1 font-medium">{q.label}</label>
                    {q.type === 'textarea' ? (
                      <Textarea
                        value={form[q.name] || ''}
                        onChange={e => setForm(f => ({ ...f, [q.name]: e.target.value }))}
                        required
                      />
                    ) : (
                      <Input
                        value={form[q.name] || ''}
                        onChange={e => setForm(f => ({ ...f, [q.name]: e.target.value }))}
                        required
                      />
                    )}
                  </div>
                ))}
                <DialogFooter>
                  <Button type="submit" disabled={submitting} className="vida-smart-gradient text-white">
                    {submitting ? 'Gerando...' : 'Gerar Plano'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>
    </div>
  );
};

// Display para o Plano Físico (antigo PlanDisplay)
const PhysicalPlanDisplay = ({ planData }) => {
  const [activeWeek, setActiveWeek] = useState(0);
  const plan = planData.plan_data;

  if (!plan || !plan.weeks) return <Card><CardContent>Plano físico indisponível.</CardContent></Card>;

  return (
    <div className="space-y-6">
        <Card className="bg-gradient-to-br from-primary to-green-400 text-white">
            <CardHeader>
                <CardTitle className="flex items-center"><Brain className="w-6 h-6 mr-2" />{plan.title}</CardTitle>
                <CardDescription className="text-green-100">{plan.description}</CardDescription>
            </CardHeader>
        </Card>
        {/* ... (resto da lógica de exibição do plano físico com Accordion, etc.) ... */}
    </div>
  );
};

// Display para o Plano Nutricional
const NutritionalPlanDisplay = ({ planData }) => {
    const plan = planData.plan_data;
    if (!plan) return <Card><CardContent>Plano nutricional indisponível.</CardContent></Card>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Leaf className="w-6 h-6 mr-2 text-green-500" />{plan.title}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-around text-center">
                    <div><p className="font-bold text-lg">{plan.daily_calories} kcal</p><p className="text-sm text-muted-foreground">Calorias Diárias</p></div>
                    <div><p className="font-bold text-lg">{plan.water_intake_liters}L</p><p className="text-sm text-muted-foreground">Água</p></div>
                </div>
                <Accordion type="single" collapsible defaultValue="item-0">
                    {plan.meals.map((meal, i) => (
                        <AccordionItem key={i} value={`item-${i}`}>
                            <AccordionTrigger>{meal.name} ({meal.calories} kcal)</AccordionTrigger>
                            <AccordionContent><ul>{meal.items.map(item => <li key={item}>{item}</li>)}</ul></AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
};

// Display para o Plano Emocional
const EmotionalPlanDisplay = ({ planData }) => {
    const plan = planData.plan_data;
    if (!plan) return <Card><CardContent>Plano emocional indisponível.</CardContent></Card>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Heart className="w-6 h-6 mr-2 text-red-500" />{plan.title}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <h4 className="font-semibold">Rotinas Diárias</h4>
                {plan.daily_routines.map((routine, i) => <p key={i}><strong>{routine.time}:</strong> {routine.activity}</p>)}
                <h4 className="font-semibold mt-4">Técnicas Recomendadas</h4>
                {plan.techniques.map((tech, i) => <p key={i}><strong>{tech.name}:</strong> {tech.description}</p>)}
            </CardContent>
        </Card>
    );
};

// Display para o Plano Espiritual
const SpiritualPlanDisplay = ({ planData }) => {
    const plan = planData.plan_data;
    if (!plan) return <Card><CardContent>Plano espiritual indisponível.</CardContent></Card>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Wind className="w-6 h-6 mr-2 text-purple-500" />{plan.title}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <h4 className="font-semibold">Práticas Diárias</h4>
                {plan.daily_practices.map((practice, i) => <p key={i}><strong>{practice.time}:</strong> {practice.activity}</p>)}
                <h4 className="font-semibold mt-4">Reflexões Semanais</h4>
                <ul className="list-disc pl-5">{plan.weekly_reflection_prompts.map((prompt, i) => <li key={i}>{prompt}</li>)}</ul>
            </CardContent>
        </Card>
    );
};

// Novo componente que organiza os 4 planos em abas
const MultiPlanDisplay = () => {
    const { currentPlans } = usePlans();

    return (
        <Tabs defaultValue="physical" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="physical"><Dumbbell className="w-4 h-4 mr-2"/>Físico</TabsTrigger>
                <TabsTrigger value="nutritional"><Leaf className="w-4 h-4 mr-2"/>Alimentar</TabsTrigger>
                <TabsTrigger value="emotional"><Heart className="w-4 h-4 mr-2"/>Emocional</TabsTrigger>
                <TabsTrigger value="spiritual"><Wind className="w-4 h-4 mr-2"/>Espiritual</TabsTrigger>
            </TabsList>
            <TabsContent value="physical">
                {currentPlans.physical ? <PhysicalPlanDisplay planData={currentPlans.physical} /> : <p>Plano físico não disponível.</p>}
            </TabsContent>
            <TabsContent value="nutritional">
                {currentPlans.nutritional ? <NutritionalPlanDisplay planData={currentPlans.nutritional} /> : <p>Plano alimentar não disponível.</p>}
            </TabsContent>
            <TabsContent value="emotional">
                {currentPlans.emotional ? <EmotionalPlanDisplay planData={currentPlans.emotional} /> : <p>Plano emocional não disponível.</p>}
            </TabsContent>
            <TabsContent value="spiritual">
                {currentPlans.spiritual ? <SpiritualPlanDisplay planData={currentPlans.spiritual} /> : <p>Plano espiritual não disponível.</p>}
            </TabsContent>
        </Tabs>
    );
}

const PlanTab = () => {
  const { currentPlans, loadingPlans, generatePersonalizedPlan, generateMissingPlans, generatingPlan } = usePlans();
  const { user: authUser } = useAuth();

  if (loadingPlans) {
    return (
      <TabsContent value="plan" className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </TabsContent>
    );
  }

  const hasValidPlans = currentPlans && Object.keys(currentPlans).length > 0 && 
    Object.values(currentPlans).some(plan => 
      plan && plan.plan_data && typeof plan.plan_data === 'object'
    );

  // DEBUG TEMPORÁRIO - Adicionar logs detalhados
  console.log('🔍 [PlanTab DEBUG] Estado atual:', {
    currentPlans,
    hasCurrentPlans: !!currentPlans,
    currentPlansKeys: currentPlans ? Object.keys(currentPlans) : [],
    currentPlansValues: currentPlans ? Object.values(currentPlans) : [],
    hasValidPlans,
    loadingPlans,
    user: authUser?.id
  });

  // Log detalhado de cada plano
  if (currentPlans) {
    Object.entries(currentPlans).forEach(([key, plan]) => {
      console.log(`🔍 [PlanTab DEBUG] Plano ${key}:`, {
        plan_id: plan?.id,
        plan_type: plan?.plan_type,
        is_active: plan?.is_active,
        has_plan_data: !!plan?.plan_data,
        plan_data_type: typeof plan?.plan_data,
        plan_data_preview: plan?.plan_data ? JSON.stringify(plan.plan_data).substring(0, 200) : 'NULL'
      });
    });
  }

  const missingTypes = ['physical','nutritional','emotional','spiritual'].filter(
    (t) => !currentPlans?.[t] || !currentPlans?.[t]?.plan_data
  );

  const showGenerateButtons = missingTypes.length > 0;

  return (
    <TabsContent value="plan" className="mt-6">
      {hasValidPlans ? (
        <div className="space-y-6">
          {/* IA Coach Estratégico removido - interface administrativa não deve aparecer para cliente */}
          {/* <IACoachIntegration /> */}
          {/* Gamification sempre visível quando há planos */}
          <GamificationDisplay />
          {/* Check-in System sempre visível quando há planos */}
          <CheckinSystem />

          {showGenerateButtons && (
            <div className="flex flex-col md:flex-row gap-3">
              <Button onClick={generateMissingPlans} disabled={generatingPlan} className="vida-smart-gradient text-white">
                {generatingPlan ? 'Gerando planos faltantes...' : `Gerar planos faltantes (${missingTypes.length})`}
              </Button>
              <Button variant="outline" onClick={generatePersonalizedPlan} disabled={generatingPlan}>
                {generatingPlan ? 'Gerando...' : 'Regerar todos os planos'}
              </Button>
            </div>
          )}
          <MultiPlanDisplay />
        </div>
      ) : (
        <NoPlanState />
      )}
    </TabsContent>
  );
};

export default PlanTab;
