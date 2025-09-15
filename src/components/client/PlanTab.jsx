import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dumbbell, Flame, Zap, CheckCircle, Info, MessageCircle, Loader2, Sparkles, Brain, Target } from 'lucide-react';
import { usePlans } from '@/contexts/data/PlansContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'react-hot-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const NoPlanState = () => {
  const { generatePersonalizedPlan, generatingPlan } = usePlans();
  const { user } = useAuth();
  
  const handleGeneratePlan = async () => {
    if (!user?.profile?.name || !user?.profile?.goal_type) {
      toast.error('Complete seu perfil primeiro para gerar um plano personalizado!');
      return;
    }
    
    await generatePersonalizedPlan();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center p-8 space-y-6"
    >
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
        <div className="relative">
          <Brain className="mx-auto h-20 w-20 text-blue-500 mb-4" />
          <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-purple-500 animate-pulse" />
        </div>
        
        <h3 className="text-3xl font-bold text-gray-800 mb-2">
          IA Coach Pronta para Criar seu Plano!
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          Nossa Inteligência Artificial analisará seu perfil e criará um plano de treino 
          <span className="font-semibold text-blue-600"> cientificamente personalizado</span> para seus objetivos específicos.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-800">Personalizado</h4>
            <p className="text-sm text-gray-600">Baseado no seu perfil, objetivos e nível</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <Brain className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-800">Científico</h4>
            <p className="text-sm text-gray-600">Fundamentado em evidências científicas</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-800">Adaptativo</h4>
            <p className="text-sm text-gray-600">Evolui com seu progresso</p>
          </div>
        </div>

        <Button 
          onClick={handleGeneratePlan}
          disabled={generatingPlan}
          size="lg"
          className="vida-smart-gradient text-white px-8 py-3 text-lg font-semibold mb-4"
        >
          {generatingPlan ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Gerando Plano Personalizado...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Gerar Meu Plano Personalizado
            </>
          )}
        </Button>

        {generatingPlan && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 text-sm">
              <Brain className="inline h-4 w-4 mr-1" />
              Nossa IA está analisando seu perfil e criando um plano científico personalizado...
            </p>
          </div>
        )}
      </div>

      <div className="bg-green-50 p-6 rounded-lg">
        <h4 className="font-semibold text-green-800 mb-2">Alternativa via WhatsApp</h4>
        <p className="text-green-700 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          Envie: <span className="italic ml-1 font-medium">"Quero meu plano de treino"</span>
        </p>
      </div>
    </motion.div>
  );
};

const PlanDisplay = ({ planData }) => {
  const [activeWeek, setActiveWeek] = useState(0);
  const plan = planData.plan_data;

  return (
    <div className="space-y-6">
      {/* Header do Plano */}
      <Card className="bg-gradient-to-br from-primary to-green-400 text-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-6 h-6 mr-2" />
            {plan.title || 'Seu Plano de Treino Personalizado'}
          </CardTitle>
          <CardDescription className="text-green-100">
            {plan.description || 'Plano científico de 4 semanas personalizado para seus objetivos'}
          </CardDescription>
          {plan.scientific_basis && (
            <div className="mt-3 bg-white/10 p-3 rounded-lg">
              <p className="text-sm text-white/90">
                <Info className="inline w-4 h-4 mr-1" />
                <strong>Base Científica:</strong> {plan.scientific_basis}
              </p>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Navegação das Semanas */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {plan.weeks?.map((week, index) => (
          <Button
            key={week.week}
            variant={activeWeek === index ? 'default' : 'outline'}
            onClick={() => setActiveWeek(index)}
            className="flex-shrink-0"
          >
            Semana {week.week}
          </Button>
        ))}
      </div>

      {/* Conteúdo da Semana Ativa */}
      <AnimatePresence mode="wait">
        {plan.weeks && plan.weeks[activeWeek] && (
          <motion.div
            key={activeWeek}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-primary" />
                  Semana {plan.weeks[activeWeek].week}
                </CardTitle>
                <CardDescription>
                  <strong>Foco:</strong> {plan.weeks[activeWeek].focus}
                  <br />
                  {plan.weeks[activeWeek].summary}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                  {plan.weeks[activeWeek].days?.map((day, dayIndex) => (
                    <AccordionItem key={dayIndex} value={`item-${dayIndex}`}>
                      <AccordionTrigger className="font-semibold">
                        <div className="flex items-center">
                          <Dumbbell className="w-4 h-4 mr-2" />
                          Dia {day.day}: {day.focus}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pl-4">
                          {day.exercises?.map((ex, exIndex) => (
                            <div key={exIndex} className="border-l-4 border-primary/20 pl-4 py-2">
                              <div className="flex items-start space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{ex.name}</h4>
                                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                    <span className="flex items-center">
                                      <Zap className="w-3 h-3 mr-1" /> 
                                      {ex.sets} séries
                                    </span>
                                    <span className="flex items-center">
                                      <Dumbbell className="w-3 h-3 mr-1" /> 
                                      {ex.reps} reps
                                    </span>
                                    <span className="flex items-center">
                                      <Flame className="w-3 h-3 mr-1" /> 
                                      {ex.rest_seconds}s descanso
                                    </span>
                                    {ex.intensity && (
                                      <span className="flex items-center">
                                        <Target className="w-3 h-3 mr-1" /> 
                                        {ex.intensity}
                                      </span>
                                    )}
                                  </div>
                                  {ex.observation && (
                                    <div className="mt-3 bg-blue-50 p-3 rounded-md">
                                      <p className="text-xs text-blue-800 flex items-start">
                                        <Info className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                                        <strong>Dica Técnica:</strong> {ex.observation}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ações do Plano */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Novo Plano
            </Button>
            <Button variant="outline" className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-2" />
              Falar com IA Coach
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PlanTab = () => {
  const { currentPlan, loadingPlan } = usePlans();

  if (loadingPlan) {
    return (
      <TabsContent value="plan" className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </TabsContent>
    );
  }

  return (
    <TabsContent value="plan" className="mt-6">
      {currentPlan && currentPlan.plan_data ? (
        <PlanDisplay planData={currentPlan} />
      ) : (
        <NoPlanState />
      )}
    </TabsContent>
  );
};

export default PlanTab;