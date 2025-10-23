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
import { usePlanCompletions } from '@/hooks/usePlanCompletions';
import { CompletionCheckbox } from '@/components/client/CompletionCheckbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const plan = planData.plan_data;
  
  // 🎯 Hook de completions
  const { user } = useAuth();
  const { toggleCompletion, isItemCompleted, loading: completionsLoading } = usePlanCompletions(
    user?.id, 
    'physical'
  );

  if (!plan || !plan.weeks) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Plano físico não disponível.</p>
        </CardContent>
      </Card>
    );
  }

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
      toast.error('Por favor, escreva seu feedback');
      return;
    }
    try {
      const { error } = await supabase.from('plan_feedback').insert({
        user_id: user?.id,
        plan_type: 'physical',
        feedback_text: feedback.trim(),
        status: 'pending'
      });
      if (error) throw error;
      toast.success('Feedback enviado! Vamos revisar seu plano.');
    } catch (err) {
      console.error('Erro ao salvar feedback:', err);
      toast.error('Não foi possível salvar seu feedback agora. Tente novamente.');
      return;
    }
    setFeedback('');
    setFeedbackOpen(false);
  };
  
  // 🎯 Handler para toggle de exercícios
  const handleExerciseToggle = async (weekIndex, workoutIndex, exerciseIndex) => {
    const itemIdentifier = `week_${weekIndex}_workout_${workoutIndex}_exercise_${exerciseIndex}`;
    await toggleCompletion(itemIdentifier, 'exercise', 10); // 10 XP por exercício
  };

  return (
    <div className="space-y-6">
      {/* Header do Plano */}
      <Card className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Dumbbell className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                <CardDescription className="text-white/90 mt-1">{plan.description}</CardDescription>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setFeedbackOpen(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Dar Feedback
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Seletor de Semanas */}
      {plan.weeks && plan.weeks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecione a Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {plan.weeks.map((week, index) => (
                <Button
                  key={index}
                  variant={activeWeek === index ? 'default' : 'outline'}
                  onClick={() => setActiveWeek(index)}
                  className="flex-1 min-w-[100px]"
                >
                  Semana {week.week || index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Treinos da Semana */}
      {plan.weeks && plan.weeks[activeWeek] && (
        <Card>
          <CardHeader>
            <CardTitle>Semana {plan.weeks[activeWeek].week || activeWeek + 1}</CardTitle>
            <CardDescription>Foco: {plan.weeks[activeWeek].focus}</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-4">
              {plan.weeks[activeWeek].workouts?.map((workout, idx) => (
                <AccordionItem key={idx} value={`workout-${idx}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <p className="font-semibold">{workout.day}</p>
                        <p className="text-sm text-muted-foreground">{workout.name}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-4">
                      {workout.exercises?.map((ex, exIdx) => {
                        const itemIdentifier = `week_${activeWeek}_workout_${idx}_exercise_${exIdx}`;
                        const isCompleted = isItemCompleted(itemIdentifier);
                        
                        return (
                          <div key={exIdx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CompletionCheckbox
                              id={itemIdentifier}
                              checked={isCompleted}
                              onCheckedChange={() => handleExerciseToggle(activeWeek, idx, exIdx)}
                              disabled={completionsLoading}
                              points={10}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{ex.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {ex.sets} séries × {ex.reps} repetições
                                {ex.rest_seconds && ` • ${ex.rest_seconds}s descanso`}
                              </p>
                              {ex.notes && (
                                <p className="text-xs text-muted-foreground mt-1 italic">💡 {ex.notes}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Feedback */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback do Plano Físico</DialogTitle>
            <DialogDescription>
              Conte-nos o que você gostaria de ajustar no seu plano de treino
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ex: Gostaria de mais foco em pernas, menos exercícios de cardio..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFeedbackSubmit} className="vida-smart-gradient text-white">
              Enviar Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Display para o Plano Nutricional
const NutritionalPlanDisplay = ({ planData }) => {
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedback, setFeedback] = useState('');
    const plan = planData.plan_data;
    
    // 🎯 Hook de completions
    const { user } = useAuth();
    const { toggleCompletion, isItemCompleted, loading: completionsLoading } = usePlanCompletions(
      user?.id, 
      'nutritional'
    );
    
    if (!plan) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Leaf className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Plano nutricional não disponível.</p>
          </CardContent>
        </Card>
      );
    }

    const handleFeedbackSubmit = async () => {
      if (!feedback.trim()) {
        toast.error('Por favor, escreva seu feedback');
        return;
      }
      try {
        const { error } = await supabase.from('plan_feedback').insert({
          user_id: user?.id,
          plan_type: 'nutritional',
          feedback_text: feedback.trim(),
          status: 'pending'
        });
        if (error) throw error;
        toast.success('Feedback enviado! Vamos ajustar seu plano nutricional.');
      } catch (err) {
        console.error('Erro ao salvar feedback:', err);
        toast.error('Não foi possível salvar seu feedback agora. Tente novamente.');
        return;
      }
      setFeedback('');
      setFeedbackOpen(false);
    };
    
    // 🎯 Handler para toggle de refeições
    const handleMealToggle = async (mealIndex) => {
      const itemIdentifier = `meal_${mealIndex}`;
      await toggleCompletion(itemIdentifier, 'meal', 5); // 5 XP por refeição
    };

    return (
        <div className="space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Leaf className="w-8 h-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                    <CardDescription className="text-white/90 mt-1">{plan.description}</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setFeedbackOpen(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Dar Feedback
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-6 text-center">
                <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                <p className="text-3xl font-bold text-orange-700">{plan.daily_calories}</p>
                <p className="text-sm text-orange-600">kcal/dia</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6 text-center">
                <Droplets className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-3xl font-bold text-blue-700">{plan.water_intake_liters}L</p>
                <p className="text-sm text-blue-600">água/dia</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="text-xs font-semibold text-purple-700 mb-1">MACROS</p>
                <p className="text-sm text-purple-600">
                  P:{plan.macronutrients?.protein}g | C:{plan.macronutrients?.carbs}g | G:{plan.macronutrients?.fat}g
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Refeições */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Plano de Refeições
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible defaultValue="item-0" className="space-y-3">
                {plan.meals?.map((meal, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-1 text-left">
                          <p className="font-semibold">{meal.name}</p>
                          <p className="text-sm text-muted-foreground">{meal.time}</p>
                        </div>
                        <span className="text-sm font-medium text-orange-600">{meal.calories} kcal</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 pt-3">
                        {meal.items?.map((item, idx) => {
                          const itemIdentifier = `meal_${i}_item_${idx}`;
                          const isCompleted = isItemCompleted(itemIdentifier);
                          
                          return (
                            <li key={idx} className="flex items-start gap-2">
                              <CompletionCheckbox
                                id={itemIdentifier}
                                checked={isCompleted}
                                onCheckedChange={() => toggleCompletion(itemIdentifier, 'meal', 5)}
                                disabled={completionsLoading}
                                points={5}
                              />
                              <span className="text-sm flex-1">{item}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Tips */}
          {plan.tips && plan.tips.length > 0 && (
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Zap className="w-5 h-5" />
                  Dicas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                      <span className="text-amber-500">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Dialog de Feedback */}
          <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Feedback do Plano Nutricional</DialogTitle>
                <DialogDescription>
                  Conte-nos o que você gostaria de ajustar na sua alimentação
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Ex: Tenho alergia a frutos do mar, prefiro refeições vegetarianas..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setFeedbackOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleFeedbackSubmit} className="vida-smart-gradient text-white">
                  Enviar Feedback
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
    );
};

// Display para o Plano Emocional
const EmotionalPlanDisplay = ({ planData }) => {
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedback, setFeedback] = useState('');
    const plan = planData.plan_data;
    
    // 🎯 Hook de completions
    const { user } = useAuth();
    const { toggleCompletion, isItemCompleted, loading: completionsLoading } = usePlanCompletions(
      user?.id, 
      'emotional'
    );
    
    if (!plan) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Plano emocional não disponível.</p>
          </CardContent>
        </Card>
      );
    }

    const handleFeedbackSubmit = async () => {
      if (!feedback.trim()) {
        toast.error('Por favor, escreva seu feedback');
        return;
      }
      try {
        const { error } = await supabase.from('plan_feedback').insert({
          user_id: user?.id,
          plan_type: 'emotional',
          feedback_text: feedback.trim(),
          status: 'pending'
        });
        if (error) throw error;
        toast.success('Feedback enviado! Vamos ajustar seu plano de bem-estar emocional.');
      } catch (err) {
        console.error('Erro ao salvar feedback:', err);
        toast.error('Não foi possível salvar seu feedback agora. Tente novamente.');
        return;
      }
      setFeedback('');
      setFeedbackOpen(false);
    };

    return (
        <div className="space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 text-white border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Heart className="w-8 h-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                    <CardDescription className="text-white/90 mt-1">{plan.description}</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setFeedbackOpen(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Dar Feedback
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Áreas de Foco */}
          {plan.focus_areas && plan.focus_areas.length > 0 && (
            <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
              <CardHeader>
                <CardTitle className="text-rose-800 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Áreas de Foco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {plan.focus_areas.map((area, i) => (
                    <span key={i} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
                      {area}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rotinas Diárias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Rotinas Diárias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plan.daily_routines?.map((routine, i) => {
                  const itemIdentifier = `routine_${i}`;
                  const isCompleted = isItemCompleted(itemIdentifier);
                  
                  return (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-pink-700">{routine.duration_minutes || '10'}min</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-pink-900">{routine.time}</p>
                        <p className="text-sm text-pink-700 mt-1">{routine.activity}</p>
                      </div>
                      <CompletionCheckbox
                        id={itemIdentifier}
                        checked={isCompleted}
                        onCheckedChange={() => toggleCompletion(itemIdentifier, 'routine', 8)}
                        disabled={completionsLoading}
                        points={8}
                        className="flex-shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Técnicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                Técnicas Recomendadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-3">
                {plan.techniques?.map((tech, i) => (
                  <AccordionItem key={i} value={`tech-${i}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="font-semibold">{tech.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground pt-3">{tech.description}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Metas Semanais */}
          {plan.weekly_goals && plan.weekly_goals.length > 0 && (
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Metas Semanais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.weekly_goals.map((goal, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Award className="w-5 h-5 text-purple-500 mt-0.5" />
                      <span className="text-sm text-purple-900">{goal}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Dialog de Feedback */}
          <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Feedback do Plano Emocional</DialogTitle>
                <DialogDescription>
                  Conte-nos o que você gostaria de ajustar no seu bem-estar emocional
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Ex: Gostaria de mais técnicas para ansiedade, menos meditação guiada..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setFeedbackOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleFeedbackSubmit} className="vida-smart-gradient text-white">
                  Enviar Feedback
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
    );
};

// Display para o Plano Espiritual
const SpiritualPlanDisplay = ({ planData }) => {
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedback, setFeedback] = useState('');
    const plan = planData.plan_data;
    
    // 🎯 Hook de completions
    const { user } = useAuth();
    const { toggleCompletion, isItemCompleted, loading: completionsLoading } = usePlanCompletions(
      user?.id, 
      'spiritual'
    );
    
    if (!plan) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Wind className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Plano espiritual não disponível.</p>
          </CardContent>
        </Card>
      );
    }

    const handleFeedbackSubmit = async () => {
      if (!feedback.trim()) {
        toast.error('Por favor, escreva seu feedback');
        return;
      }
      try {
        const { error } = await supabase.from('plan_feedback').insert({
          user_id: user?.id,
          plan_type: 'spiritual',
          feedback_text: feedback.trim(),
          status: 'pending'
        });
        if (error) throw error;
        toast.success('Feedback enviado! Vamos ajustar seu plano espiritual.');
      } catch (err) {
        console.error('Erro ao salvar feedback:', err);
        toast.error('Não foi possível salvar seu feedback agora. Tente novamente.');
        return;
      }
      setFeedback('');
      setFeedbackOpen(false);
    };

    return (
        <div className="space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 text-white border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Wind className="w-8 h-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                    <CardDescription className="text-white/90 mt-1">{plan.description}</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setFeedbackOpen(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Dar Feedback
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Áreas de Foco */}
          {plan.focus_areas && plan.focus_areas.length > 0 && (
            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
              <CardHeader>
                <CardTitle className="text-violet-800 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Áreas de Foco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {plan.focus_areas.map((area, i) => (
                    <span key={i} className="px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                      {area}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Práticas Diárias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Práticas Diárias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plan.daily_practices?.map((practice, i) => {
                  const itemIdentifier = `practice_${i}`;
                  const isCompleted = isItemCompleted(itemIdentifier);
                  
                  return (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                          <Wind className="w-6 h-6 text-purple-700" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-purple-900">{practice.time}</p>
                        <p className="text-sm text-purple-700 mt-1">{practice.activity}</p>
                      </div>
                      <CompletionCheckbox
                        id={itemIdentifier}
                        checked={isCompleted}
                        onCheckedChange={() => toggleCompletion(itemIdentifier, 'practice', 8)}
                        disabled={completionsLoading}
                        points={8}
                        className="flex-shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Reflexões Semanais */}
          {plan.weekly_reflection_prompts && plan.weekly_reflection_prompts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-500" />
                  Reflexões Semanais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.weekly_reflection_prompts.map((prompt, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                      <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-indigo-900">{prompt}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Metas Mensais */}
          {plan.monthly_goals && plan.monthly_goals.length > 0 && (
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-800 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Metas Mensais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.monthly_goals.map((goal, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Award className="w-5 h-5 text-amber-500 mt-0.5" />
                      <span className="text-sm text-amber-900">{goal}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Dialog de Feedback */}
          <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Feedback do Plano Espiritual</DialogTitle>
                <DialogDescription>
                  Conte-nos o que você gostaria de ajustar no seu crescimento espiritual
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Ex: Gostaria de mais práticas de meditação, menos reflexões escritas..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setFeedbackOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleFeedbackSubmit} className="vida-smart-gradient text-white">
                  Enviar Feedback
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
