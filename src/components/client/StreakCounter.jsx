import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Award, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { celebrateMilestone } from '@/utils/confetti';

/**
 * StreakCounter - Componente visual de streak com animações e milestones
 * @param {number} currentStreak - Streak atual em dias
 * @param {number} longestStreak - Maior streak já alcançado
 * @param {string} lastActivityDate - Data da última atividade (ISO)
 * @param {boolean} compact - Modo compacto para header (opcional)
 */
export default function StreakCounter({ 
  currentStreak = 0, 
  longestStreak = 0, 
  lastActivityDate = null,
  compact = false 
}) {
  const [streakStatus, setStreakStatus] = useState('active'); // active, risk, broken
  const [nextMilestone, setNextMilestone] = useState(null);
  const [achievedMilestones, setAchievedMilestones] = useState([]);
  const [celebratedMilestones, setCelebratedMilestones] = useState(new Set());

  const milestones = [
    { days: 7, label: 'Semana', icon: '🔥', color: 'orange' },
    { days: 14, label: 'Quinzena', icon: '⭐', color: 'yellow' },
    { days: 30, label: 'Mês', icon: '💪', color: 'blue' },
    { days: 90, label: 'Trimestre', icon: '👑', color: 'purple' },
    { days: 180, label: 'Semestre', icon: '🏆', color: 'amber' },
    { days: 365, label: 'Ano', icon: '🎯', color: 'green' }
  ];

  useEffect(() => {
    // Calcular status do streak
    if (currentStreak === 0) {
      setStreakStatus('broken');
    } else if (lastActivityDate) {
      const hoursSinceActivity = (Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60);
      if (hoursSinceActivity > 24) {
        setStreakStatus('risk');
      } else {
        setStreakStatus('active');
      }
    } else {
      setStreakStatus('active');
    }

    // Calcular milestones alcançados e próximo
    const achieved = milestones.filter(m => currentStreak >= m.days);
    const next = milestones.find(m => currentStreak < m.days);
    
    setAchievedMilestones(achieved);
    setNextMilestone(next);

    // Celebrar novo milestone se não foi celebrado antes
    achieved.forEach(milestone => {
      if (!celebratedMilestones.has(milestone.days)) {
        celebrateMilestone(milestone.days);
        setCelebratedMilestones(prev => new Set([...prev, milestone.days]));
      }
    });
  }, [currentStreak, lastActivityDate, celebratedMilestones]);

  const getFlameColor = () => {
    if (streakStatus === 'broken') return 'text-gray-400';
    if (streakStatus === 'risk') return 'text-yellow-500';
    if (currentStreak >= 90) return 'text-purple-500';
    if (currentStreak >= 30) return 'text-blue-500';
    if (currentStreak >= 7) return 'text-orange-500';
    return 'text-orange-400';
  };

  const getFlameSize = () => {
    if (compact) return 'h-6 w-6';
    if (currentStreak >= 90) return 'h-20 w-20';
    if (currentStreak >= 30) return 'h-16 w-16';
    if (currentStreak >= 7) return 'h-12 w-12';
    return 'h-10 w-10';
  };

  const getStatusMessage = () => {
    if (streakStatus === 'broken') {
      return {
        text: 'Comece hoje uma nova sequência!',
        icon: <TrendingUp className="h-4 w-4" />,
        variant: 'secondary'
      };
    }
    if (streakStatus === 'risk') {
      return {
        text: '⚠️ Risco de quebra! Complete uma atividade hoje.',
        icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
        variant: 'destructive'
      };
    }
    return {
      text: `🔥 Sequência ativa! Continue assim!`,
      icon: <Flame className="h-4 w-4 text-orange-500" />,
      variant: 'default'
    };
  };

  const status = getStatusMessage();

  // Modo compacto (para header)
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{
                  scale: streakStatus === 'active' ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: 'reverse'
                }}
              >
                <Flame className={`${getFlameColor()} ${getFlameSize()}`} />
              </motion.div>
              <div>
                <p className="text-sm font-semibold">{currentStreak}</p>
                <p className="text-xs text-muted-foreground">dias</p>
              </div>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{status.text}</p>
            {nextMilestone && (
              <p className="text-xs text-muted-foreground mt-1">
                Próximo: {nextMilestone.label} em {nextMilestone.days - currentStreak} dias
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Modo completo (card)
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                scale: streakStatus === 'active' ? [1, 1.1, 1] : 1,
                rotate: streakStatus === 'active' ? [0, 5, -5, 0] : 0
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            >
              <Flame className={`${getFlameColor()} ${getFlameSize()}`} />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold">{currentStreak}</h3>
              <p className="text-sm text-muted-foreground">dias consecutivos</p>
            </div>
          </div>
          
          {longestStreak > currentStreak && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Recorde: {longestStreak}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Seu maior streak foi de {longestStreak} dias!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Status do streak */}
        <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
          streakStatus === 'broken' ? 'bg-gray-100 dark:bg-gray-800' :
          streakStatus === 'risk' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
          'bg-green-100 dark:bg-green-900/20'
        }`}>
          {status.icon}
          <p className="text-sm font-medium">{status.text}</p>
        </div>

        {/* Milestones alcançados */}
        {achievedMilestones.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Conquistas desbloqueadas:</p>
            <div className="flex flex-wrap gap-2">
              {achievedMilestones.map((milestone) => (
                <motion.div
                  key={milestone.days}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge 
                          variant="secondary" 
                          className={`bg-${milestone.color}-100 text-${milestone.color}-800 dark:bg-${milestone.color}-900/30`}
                        >
                          {milestone.icon} {milestone.label}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{milestone.days} dias consecutivos!</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Próximo milestone */}
        {nextMilestone && (
          <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Próxima conquista: {nextMilestone.label}
              </p>
              <Badge variant="outline" className="text-xs">
                {nextMilestone.days - currentStreak} dias restantes
              </Badge>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className={`bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${(currentStreak / nextMilestone.days) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Dica motivacional */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground italic">
            💡 Dica: Complete pelo menos uma atividade por dia para manter sua sequência!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
