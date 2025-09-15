import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Sparkles, Target, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const WelcomeCard = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: <Target className="w-5 h-5 text-blue-500" />,
      title: "Planos Personalizados",
      description: "Treinos adaptados ao seu perfil e objetivos"
    },
    {
      icon: <Trophy className="w-5 h-5 text-amber-500" />,
      title: "Sistema de Pontos",
      description: "Ganhe recompensas por cada conquista"
    },
    {
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      title: "IA Coach 24/7",
      description: "Suporte inteligente quando precisar"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="mx-auto mb-4 p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center"
          >
            <UserPlus className="w-8 h-8 text-white" />
          </motion.div>
          <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
            Bem-vindo(a) ao Vida Smart! 🎉
          </CardTitle>
          <p className="text-gray-600 text-lg">
            Complete seu perfil para desbloquear todo o potencial da plataforma
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm"
              >
                <div className="flex-shrink-0 mt-1">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 text-xs">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">
                  Complete seu cadastro agora
                </h3>
                <p className="text-gray-600 text-sm">
                  Leva menos de 2 minutos e você terá acesso a tudo!
                </p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => navigate('/dashboard?tab=profile')}
                  className="vida-smart-gradient px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-shadow"
                >
                  Completar Perfil
                  <UserPlus className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm">
              ✨ Milhares de pessoas já transformaram suas vidas com o Vida Smart
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WelcomeCard;