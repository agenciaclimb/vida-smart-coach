import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Dumbbell, ShieldCheck, TrendingUp, Users, HeartPulse } from 'lucide-react';

const Benefits = () => {
  const benefits = [
    { icon: <Dumbbell className="w-5 h-5 mr-3 text-primary" />, text: 'Planos de treino que funcionam para você' },
    { icon: <BrainCircuit className="w-5 h-5 mr-3 text-primary" />, text: 'Hábitos saudáveis sem esforço, com reforço positivo' },
    { icon: <TrendingUp className="w-5 h-5 mr-3 text-primary" />, text: 'Acompanhamento de progresso que motiva de verdade' },
    { icon: <Users className="w-5 h-5 mr-3 text-primary" />, text: 'Uma comunidade para compartilhar vitórias e desafios' },
    { icon: <ShieldCheck className="w-5 h-5 mr-3 text-primary" />, text: 'Metodologia baseada em ciência e dados' },
    { icon: <HeartPulse className="w-5 h-5 mr-3 text-primary" />, text: 'Bem-estar completo: físico, mental e emocional.' },
  ];

  return (
    <section id="beneficios" className="py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <span className="text-primary font-semibold">TUDO O QUE VOCÊ PRECISA</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-6">
              Mais que um app, um ecossistema de bem-estar.
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Vida Smart integra tudo o que você precisa para uma transformação real e duradoura. Não é só sobre perder peso, é sobre ganhar uma nova vida, com mais energia, disposição e autoconfiança.
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center text-gray-700 font-medium">
                  {benefit.icon}
                  {benefit.text}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative order-1 lg:order-2"
          >
            <div className="absolute -bottom-4 -right-4 md:-bottom-8 md:-right-8 w-40 h-40 bg-blue-100 rounded-full -z-10"></div>
            <img  class="w-full h-auto rounded-2xl shadow-xl" alt="Interface do aplicativo Vida Smart no celular, mostrando uma conversa com a IA Coach" src="https://images.unsplash.com/photo-1695596687757-d11e6cccb679" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;