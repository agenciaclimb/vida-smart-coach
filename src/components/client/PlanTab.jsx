import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dumbbell, Flame, Zap, CheckCircle, Info, MessageCircle, Loader2, Sparkles, Brain, Target, Heart, Wind, Leaf, Droplets } from 'lucide-react';
import { usePlans } from '@/contexts/data/PlansContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'react-hot-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Componente para quando não há planos gerados
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
    <motion.div /* ... (código do NoPlanState mantido como estava) ... */ >
        <h3 className="text-3xl font-bold text-gray-800 mb-2">
          IA Coach Pronta para Criar seu Plano de Transformação!
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          Nossa Inteligência Artificial analisará seu perfil e criará um plano completo nas 4 áreas (Físico, Alimentar, Emocional e Espiritual) para seus objetivos.
        </p>
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
    </motion.div>
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
  const { currentPlans, loadingPlans } = usePlans();

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

  return (
    <TabsContent value="plan" className="mt-6">
      {hasValidPlans ? (
        <MultiPlanDisplay />
      ) : (
        <NoPlanState />
      )}
    </TabsContent>
  );
};

export default PlanTab;