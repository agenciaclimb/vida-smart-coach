import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dumbbell, Apple, Heart, Droplet, Target, TrendingUp, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { PILLAR_COLORS } from '@/constants/designTokens';

/**
 * ProgressItem - Item de progresso reutilizável com ícone, barra e percentual
 */
const ProgressItem = ({ icon, label, current, goal, unit = '', color = 'blue' }) => {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const colors = PILLAR_COLORS[color] || PILLAR_COLORS.blue;

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 ${colors.bg} rounded-md`}>
            {icon}
          </div>
          <span className="font-medium text-gray-800">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${colors.text}`}>
            {current}/{goal}{unit}
          </span>
          <span className="text-xs text-gray-500">
            ({Math.round(percentage)}%)
          </span>
        </div>
      </div>
      
      <div
        className="relative h-2 bg-gray-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentage)}
        aria-label={`${label}: ${Math.round(percentage)}%`}
      >
        <motion.div
          className={`h-full ${colors.progress} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
};

/**
 * WeeklySummary - Resumo visual do progresso dos últimos 7 dias
 * 
 * @param {Object} weeklyData - Dados da semana
 * @param {Object} weeklyData.workouts - { current, goal }
 * @param {Object} weeklyData.nutrition - { current, goal }
 * @param {Object} weeklyData.wellbeing - { current, goal }
 * @param {Object} weeklyData.hydration - { current, goal, unit: 'L' }
 */
const WeeklySummary = ({ weeklyData }) => {
  const workouts = weeklyData?.workouts || { current: 0, goal: 5 };
  const nutrition = weeklyData?.nutrition || { current: 0, goal: 7 };
  const wellbeing = weeklyData?.wellbeing || { current: 0, goal: 3 };
  const hydration = weeklyData?.hydration || { current: 0, goal: 14, unit: 'L' };

  // Calcular meta global
  const totalGoal = workouts.goal + nutrition.goal + wellbeing.goal + hydration.goal;
  const totalCurrent = workouts.current + nutrition.current + wellbeing.current + hydration.current;
  const globalPercentage = totalGoal > 0 ? Math.min((totalCurrent / totalGoal) * 100, 100) : 0;

  // Mensagem de feedback baseada no progresso
  const getFeedbackMessage = () => {
    if (globalPercentage >= 90) return { text: "Incrível! 🎉", color: "text-green-600" };
    if (globalPercentage >= 75) return { text: "Excelente! 🌟", color: "text-blue-600" };
    if (globalPercentage >= 50) return { text: "Bom progresso! 💪", color: "text-purple-600" };
    if (globalPercentage >= 25) return { text: "Continue assim! 🚀", color: "text-amber-600" };
    return { text: "Vamos lá! Você consegue! 💙", color: "text-gray-600" };
  };

  const feedback = getFeedbackMessage();

  // Empty state para quando não há dados
  if (totalCurrent === 0) {
    return (
      <Card className="shadow-md border-2 border-dashed border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Resumo Semanal
          </CardTitle>
          <CardDescription className="text-base">
            Sua evolução nos últimos 7 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="flex flex-col items-center gap-4 p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="p-4 bg-white rounded-full shadow-sm">
              <Inbox className="w-10 h-10 text-blue-500" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-gray-800">Pronto para começar?</h3>
              <p className="text-sm text-gray-600 max-w-md">
                Sua jornada começa com o primeiro passo! Complete seu check-in diário acima 
                e veja seu progresso aparecer aqui. 🚀
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Aguardando primeira atividade</span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="w-6 h-6 text-green-600" />
          Resumo Semanal
        </CardTitle>
        <CardDescription className="text-base">
          Sua evolução nos últimos 7 dias
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress bars com cores específicas por pilar */}
        <ProgressItem 
          icon={<Dumbbell className="w-5 h-5" />}
          label="Treinos"
          current={workouts.current}
          goal={workouts.goal}
          color="blue"
        />
        
        <ProgressItem 
          icon={<Apple className="w-5 h-5" />}
          label="Nutrição"
          current={nutrition.current}
          goal={nutrition.goal}
          color="green"
        />
        
        <ProgressItem 
          icon={<Heart className="w-5 h-5" />}
          label="Bem-estar"
          current={wellbeing.current}
          goal={wellbeing.goal}
          color="pink"
        />
        
        <ProgressItem 
          icon={<Droplet className="w-5 h-5" />}
          label="Hidratação"
          current={hydration.current}
          goal={hydration.goal}
          unit={hydration.unit}
          color="cyan"
        />
        
        {/* Meta global */}
        <div className="pt-4 border-t mt-4" aria-live="polite">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-800">Meta Semanal</span>
            </div>
            <motion.span 
              className={`text-2xl font-bold ${feedback.color}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
              {Math.round(globalPercentage)}%
            </motion.span>
          </div>
          
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${globalPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </motion.div>
          </div>
          
          <motion.p 
            className={`text-sm ${feedback.color} font-medium`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {totalCurrent} de {totalGoal} atividades concluídas - {feedback.text}
          </motion.p>
        </div>
      </CardContent>
    </Card>
  );
};

WeeklySummary.propTypes = {
  weeklyData: PropTypes.shape({
    workouts: PropTypes.shape({
      current: PropTypes.number,
      goal: PropTypes.number
    }),
    nutrition: PropTypes.shape({
      current: PropTypes.number,
      goal: PropTypes.number
    }),
    wellbeing: PropTypes.shape({
      current: PropTypes.number,
      goal: PropTypes.number
    }),
    hydration: PropTypes.shape({
      current: PropTypes.number,
      goal: PropTypes.number,
      unit: PropTypes.string
    })
  })
};

export default WeeklySummary;
