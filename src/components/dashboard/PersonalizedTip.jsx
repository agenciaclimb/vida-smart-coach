import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Lightbulb, TrendingUp, Clock, Target } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * PersonalizedTip - Dica personalizada da IA baseada no contexto do usuário
 * 
 * @param {Object} context - Contexto do usuário para personalização
 * @param {string} context.userName - Nome do usuário
 * @param {number} context.currentStreak - Sequência atual
 * @param {Array} context.recentActivities - Atividades recentes
 * @param {Object} context.preferredTime - Horário preferido de treino
 */
const PersonalizedTip = ({ context = {} }) => {
  const [tip, setTip] = useState(null);
  const [icon, setIcon] = useState(<Sparkles className="w-5 h-5 text-white" />);

  useEffect(() => {
    // Gerar dica personalizada baseada no contexto
    const generateTip = () => {
      const userName = context.userName || 'você';
      const hour = new Date().getHours();
      
      // Dicas baseadas em sequência
      if (context.currentStreak >= 7) {
        setIcon(<TrendingUp className="w-5 h-5 text-white" />);
        return {
          text: `${userName}, sua sequência de ${context.currentStreak} dias é impressionante! Continue mantendo essa consistência incrível! 🔥`,
          color: 'from-orange-400 to-red-500'
        };
      }
      
      if (context.currentStreak === 0 || context.currentStreak === 1) {
        setIcon(<Target className="w-5 h-5 text-white" />);
        return {
          text: `${userName}, comece uma sequência hoje! Cada pequeno passo conta para sua transformação. Você consegue! 💪`,
          color: 'from-blue-400 to-cyan-500'
        };
      }
      
      // Dicas baseadas em horário preferido
      if (context.preferredTime) {
        const preferred = context.preferredTime.hour;
        if (Math.abs(hour - preferred) <= 1) {
          setIcon(<Clock className="w-5 h-5 text-white" />);
          return {
            text: `${userName}, percebi que você treina melhor às ${preferred}h. Que tal aproveitar esse momento agora? ⏰`,
            color: 'from-purple-400 to-pink-500'
          };
        }
      }
      
      // Dicas baseadas no horário do dia
      if (hour < 12) {
        setIcon(<Lightbulb className="w-5 h-5 text-white" />);
        return {
          text: `${userName}, começar o dia com atividade física aumenta sua energia e foco! Que tal um treino rápido agora? ☀️`,
          color: 'from-amber-400 to-orange-500'
        };
      }
      
      if (hour >= 18 && hour < 21) {
        setIcon(<Lightbulb className="w-5 h-5 text-white" />);
        return {
          text: `${userName}, treinar no final do dia ajuda a liberar o estresse acumulado. Hora perfeita para cuidar de você! 🌙`,
          color: 'from-indigo-400 to-purple-500'
        };
      }
      
      // Dica padrão motivacional
      setIcon(<Sparkles className="w-5 h-5 text-white" />);
      return {
        text: `${userName}, cada dia é uma nova oportunidade de evoluir. Continue focado em seus objetivos! 🎯`,
        color: 'from-green-400 to-teal-500'
      };
    };

    setTip(generateTip());
  }, [context]);

  if (!tip) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className={`overflow-hidden bg-gradient-to-br ${tip.color} border-0 shadow-lg`}>
        <CardContent className="p-4">
          <div className="flex gap-3 items-start">
            {/* Ícone animado */}
            <motion.div
              className="flex-shrink-0"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {icon}
              </div>
            </motion.div>
            
            {/* Conteúdo */}
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-sm">💡 Dica Personalizada</span>
                <motion.span
                  className="text-xs text-white/70"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  da IA Coach
                </motion.span>
              </div>
              <motion.p 
                className="text-sm text-white leading-relaxed"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {tip.text}
              </motion.p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PersonalizedTip;
