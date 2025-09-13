
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dumbbell, Flame, Zap, CheckCircle, Info, MessageCircle, Loader2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const NoPlanState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center p-8 bg-gray-50 rounded-lg"
  >
    <Dumbbell className="mx-auto h-16 w-16 text-gray-400" />
    <h3 className="mt-4 text-2xl font-bold text-gray-800">Seu plano de treino aparecerá aqui!</h3>
    <p className="mt-2 text-gray-600 max-w-md mx-auto">
      Parece que você ainda não tem um plano de treino. Não se preocupe, sua IA Coach está pronta para criar um para você!
    </p>
    <div className="mt-6 bg-green-100 p-4 rounded-lg inline-block">
      <p className="text-green-800 font-semibold flex items-center">
        <MessageCircle className="w-5 h-5 mr-2" />
        Envie no WhatsApp: <span className="italic ml-1">"Quero meu plano de treino"</span>
      </p>
    </div>
  </motion.div>
);

const PlanDisplay = ({ planData }) => {
  const [activeWeek, setActiveWeek] = useState(0);
  const plan = planData.plan;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary to-green-400 text-white">
        <CardHeader>
          <CardTitle>{plan.title || 'Seu Plano de Treino'}</CardTitle>
          <CardDescription className="text-green-100">
            Um plano de 4 semanas para te ajudar a alcançar seus objetivos.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        {plan.weeks.map((week, index) => (
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

      <AnimatePresence mode="wait">
        <motion.div
          key={activeWeek}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Semana {plan.weeks[activeWeek].week}</CardTitle>
              <CardDescription>{plan.weeks[activeWeek].summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                {plan.weeks[activeWeek].days.map((day, dayIndex) => (
                  <AccordionItem key={dayIndex} value={`item-${dayIndex}`}>
                    <AccordionTrigger className="font-semibold">
                      Dia {day.day}: {day.focus}
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-4 pl-4">
                        {day.exercises.map((ex, exIndex) => (
                          <li key={exIndex} className="flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="font-medium">{ex.name}</p>
                              <div className="text-sm text-gray-600 flex space-x-4">
                                <span><Zap className="w-3 h-3 inline mr-1" /> {ex.sets} séries</span>
                                <span><Dumbbell className="w-3 h-3 inline mr-1" /> {ex.reps} reps</span>
                                <span><Flame className="w-3 h-3 inline mr-1" /> {ex.rest_seconds}s descanso</span>
                              </div>
                              {ex.observation && (
                                <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md mt-2 flex items-start">
                                  <Info className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                                  {ex.observation}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const PlanTab = () => {
  const { trainingPlan, loading } = useData();

  if (loading) {
    return (
      <TabsContent value="plan" className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </TabsContent>
    );
  }

  return (
    <TabsContent value="plan" className="mt-6">
      {trainingPlan && trainingPlan.plan ? (
        <PlanDisplay planData={trainingPlan} />
      ) : (
        <NoPlanState />
      )}
    </TabsContent>
  );
};

export default PlanTab;
