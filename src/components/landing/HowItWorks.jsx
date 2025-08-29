import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Target, Award, ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <Bot className="w-8 h-8 text-primary" />,
      title: 'Converse com sua IA',
      description: 'Responda a algumas perguntas no WhatsApp. Nossa IA entende seus objetivos e cria seu plano inicial.',
    },
    {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: 'Receba seu Plano Diário',
      description: 'Todos os dias, uma nova missão: o que comer, qual exercício fazer e um desafio para manter a mente sã.',
    },
    {
      icon: <Award className="w-8 h-8 text-primary" />,
      title: 'Evolua e Conquiste',
      description: 'A cada tarefa cumprida, você ganha pontos, sobe de nível e desbloqueia recompensas. A transformação é um jogo!',
    },
  ];

  return (
    <section id="comofunciona" className="py-20 lg:py-24 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">A transformação em 3 passos simples</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Esqueça dietas restritivas e treinos chatos. Nós criamos um sistema que se adapta a você.
          </p>
        </div>
        <div className="relative grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px -translate-y-1/2 mt-[-2rem]">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 1">
                    <path d="M 0,0.5 L 100,0.5" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="8 8" />
                </svg>
            </div>
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100 z-10 text-center md:text-left"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6 mx-auto md:mx-0">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;