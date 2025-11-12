import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Star, Trophy, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const LEVEL_INFO = {
  1: { name: 'Iniciante', badge: '🔰', color: 'from-gray-500 to-gray-600' },
  2: { name: 'Aprendiz', badge: '✨', color: 'from-blue-500 to-blue-600' },
  3: { name: 'Praticante', badge: '🌟', color: 'from-green-500 to-green-600' },
  4: { name: 'Avançado', badge: '⭐', color: 'from-purple-500 to-purple-600' },
  5: { name: 'Expert', badge: '💎', color: 'from-pink-500 to-pink-600' },
  6: { name: 'Mestre', badge: '👑', color: 'from-amber-500 to-amber-600' },
};

const getLevelInfo = (level) => {
  if (level >= 50) return { name: 'Lenda', badge: '🏆', color: 'from-gradient-to-br from-yellow-400 via-orange-500 to-red-600' };
  if (level >= 30) return LEVEL_INFO[6];
  if (level >= 20) return LEVEL_INFO[5];
  if (level >= 10) return LEVEL_INFO[4];
  if (level >= 5) return LEVEL_INFO[3];
  if (level >= 3) return LEVEL_INFO[2];
  return LEVEL_INFO[1];
};

/**
 * HeroGamification - Hero section com destaque total para gamificação
 * 
 * @param {Object} gamificationData - Dados do contexto de gamificação
 * @param {number} gamificationData.level - Nível atual do usuário
 * @param {number} gamificationData.total_points - Pontos totais
 * @param {number} gamificationData.current_streak - Sequência atual
 * @param {number} gamificationData.longest_streak - Maior sequência
 */
const HeroGamification = ({ gamificationData }) => {
  const level = gamificationData?.level || 1;
  const totalPoints = gamificationData?.total_points || 0;
  const currentStreak = gamificationData?.current_streak || 0;
  const longestStreak = gamificationData?.longest_streak || 0;

  const levelInfo = getLevelInfo(level);
  const pointsInCurrentLevel = totalPoints % 1000;
  const pointsForNextLevel = 1000;
  const progressPercentage = (pointsInCurrentLevel / pointsForNextLevel) * 100;
  const pointsNeeded = pointsForNextLevel - pointsInCurrentLevel;

  // Mensagens motivacionais baseadas em progresso
  const getMotivationalMessage = () => {
    if (currentStreak >= 7) return "Sequência incrível! Você é imparável! 🔥";
    if (currentStreak >= 3) return "Continue assim! A consistência é tudo! 💪";
    if (progressPercentage >= 80) return "Falta pouco para o próximo nível! 🚀";
    if (progressPercentage >= 50) return "Você já está na metade! Continue! ⭐";
    return "Todo progresso conta. Vamos nessa! 🌟";
  };

  return (
    <Card className={`overflow-hidden bg-gradient-to-br ${levelInfo.color} shadow-xl`}>
      <CardContent className="p-6 text-white">
        {/* Header - Nível e Badge */}
        <div className="flex justify-between items-start mb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold flex items-center gap-2">
              Nível {level} {levelInfo.badge}
            </h2>
            <p className="text-white/80 text-lg mt-1">{levelInfo.name}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Badge className="bg-white/20 text-white border-0 text-lg px-4 py-2 flex items-center gap-2">
              <Star className="w-5 h-5" />
              {totalPoints} pts
            </Badge>
          </motion.div>
        </div>
        
        {/* Barra de Progresso */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Progresso para Nível {level + 1}</span>
            <span className="font-semibold">{pointsInCurrentLevel}/{pointsForNextLevel} pts</span>
          </div>
          <div className="h-4 bg-white/20 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              className="h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            >
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </motion.div>
          </div>
          <p className="text-xs text-white/70 mt-1">
            Faltam apenas {pointsNeeded} pontos para subir de nível! 🎯
          </p>
        </motion.div>

        {/* Streak e Stats */}
        <div className="grid grid-cols-2 gap-3">
          {/* Sequência Atual */}
          <motion.div 
            className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="p-2 bg-orange-500/30 rounded-full">
              <Flame className="w-6 h-6 text-orange-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentStreak}</p>
              <p className="text-xs text-white/70">
                {currentStreak === 0 ? 'Comece hoje!' : currentStreak === 1 ? 'dia' : 'dias seguidos'}
              </p>
            </div>
          </motion.div>

          {/* Maior Sequência */}
          <motion.div 
            className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="p-2 bg-amber-500/30 rounded-full">
              <Trophy className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{longestStreak}</p>
              <p className="text-xs text-white/70">Recorde pessoal</p>
            </div>
          </motion.div>
        </div>

        {/* Mensagem Motivacional */}
        <motion.div 
          className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <TrendingUp className="w-5 h-5 text-green-300 flex-shrink-0" />
          <p className="text-sm font-medium">
            {getMotivationalMessage()}
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default HeroGamification;
