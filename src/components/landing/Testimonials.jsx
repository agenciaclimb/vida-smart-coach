import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Juliana R.',
      role: '-12kg em 90 dias',
      content: 'Eu odiava academia. O Vida Smart me fez ver que o importante é a constância, não a intensidade. Os desafios diários no WhatsApp me mantiveram no jogo. Mudei meu corpo e minha mente.',
      rating: 5,
      avatar: 'avatar de juliana r'
    },
    {
      name: 'Marcos P.',
      role: 'Mais energia e foco',
      content: 'Não era só sobre peso. Eu vivia cansado. A IA me ajudou a ajustar meu sono e alimentação. Hoje, produzo mais no trabalho e ainda tenho energia pra brincar com meus filhos.',
      rating: 5,
      avatar: 'avatar de marcos p'
    },
    {
      name: 'Carla F.',
      role: 'Venceu a procrastinação',
      content: 'Sempre começava e parava. O sistema de pontos e a comunidade me deram o empurrão que faltava. É incrível comemorar cada pequena vitória com outras pessoas.',
      rating: 5,
      avatar: 'avatar de carla f'
    }
  ];

  return (
    <section id="depoimentos" className="py-20 lg:py-24 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            A virada de chave na vida de pessoas reais
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Histórias que nos inspiram a continuar. Veja como o Vida Smart está mudando vidas.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl shadow-sm flex flex-col h-full"
            >
                <div className="flex-grow">
                    <div className="flex items-center mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                        ))}
                    </div>
                    <p className="text-gray-700 italic">"{testimonial.content}"</p>
                </div>
              <div className="mt-6 flex items-center">
                <img  class="h-12 w-12 rounded-full mr-4 object-cover" alt={testimonial.avatar} src="https://images.unsplash.com/photo-1680049113650-4a1c24f61d71" />
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-primary">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;