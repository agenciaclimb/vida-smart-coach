import React from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Trophy, Droplets, Dumbbell } from 'lucide-react';

const AchievementCard = ({ icon, title, description, unlocked }) => (
  <div className={`text-center p-4 rounded-xl ${unlocked ? 'bg-yellow-50' : 'bg-gray-100 opacity-50'}`}>
    {icon}
    <span className="font-semibold">{title}</span>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

const PointsSystemItem = ({ action, points, color }) => (
  <div className={`flex justify-between items-center p-3 bg-${color}-50 rounded-lg`}>
    <span>{action}</span>
    <span className={`font-semibold text-${color}-600`}>+{points} pts</span>
  </div>
);

const RewardsTab = () => {
  const achievements = [
    { icon: <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />, title: 'Primeiro Login', description: 'Bem-vindo ao Vida Smart!', unlocked: true },
    { icon: <Droplets className="w-12 h-12 text-gray-400 mx-auto mb-2" />, title: 'Hidratação Master', description: 'Beba 8 copos por 7 dias', unlocked: false },
    { icon: <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-2" />, title: 'Fitness Warrior', description: 'Complete 10 treinos', unlocked: false },
  ];

  const pointsSystem = [
    { action: 'Chat com IA Coach', points: 10, color: 'green' },
    { action: 'Registrar hábito diário', points: 5, color: 'blue' },
    { action: 'Completar treino', points: 20, color: 'purple' },
    { action: 'Atingir meta semanal', points: 50, color: 'yellow' },
  ];

  return (
    <TabsContent value="rewards">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="vida-smart-card p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold mb-6 flex items-center"><Trophy className="w-6 h-6 text-yellow-500 mr-2" />Suas Conquistas</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {achievements.map(ach => <AchievementCard key={ach.title} {...ach} />)}
          </div>
        </div>
        <div className="vida-smart-card p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold mb-6">Sistema de Pontos</h3>
          <div className="space-y-4">
            {pointsSystem.map(item => <PointsSystemItem key={item.action} {...item} />)}
          </div>
        </div>
      </motion.div>
    </TabsContent>
  );
};

export default RewardsTab;