
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Loader2 } from 'lucide-react';

const Pricing = () => {
  const { plans, loading } = useData();
  const navigate = useNavigate();

  const handleChoosePlan = (plan) => {
    navigate(`/register?plan=${plan.name}`);
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const planOrder = ['Basic', 'Premium', 'VIP'];
  const activePlans = plans && plans.length > 0 
    ? plans
        .filter(p => p.is_active && planOrder.includes(p.name))
        .sort((a, b) => planOrder.indexOf(a.name) - planOrder.indexOf(b.name))
    : [];

  return (
    <section id="planos" className="py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <span className="text-primary font-semibold">PLANOS FLEXÍVEIS</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-6">
            Escolha o plano perfeito para sua jornada.
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
            Todos os planos começam com 7 dias de teste grátis. Cancele quando quiser, sem burocracia.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {activePlans.map((plan) => (
              <motion.div
                key={plan.id}
                variants={itemVariants}
                className={`bg-white rounded-2xl shadow-lg border flex flex-col p-8 transition-all duration-300 ${plan.name === 'Premium' ? 'border-primary shadow-primary/20 scale-105' : 'border-gray-200 hover:shadow-xl'}`}
              >
                {plan.name === 'Premium' && (
                  <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1"><Star className="w-4 h-4"/> Mais Popular</span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                
                <div className="mb-8 mt-4">
                  <span className="text-5xl font-extrabold text-gray-900">R${(plan.price || 0).toFixed(2).replace('.',',')}</span>
                  <span className="text-gray-500">/mês</span>
                </div>

                <ul className="space-y-4 text-left text-gray-600 mb-10 flex-grow">
                  {(plan.benefits || []).map((benefit, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-lime-500 mr-3 mt-1 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  onClick={() => handleChoosePlan(plan)}
                  className={`w-full text-lg py-6 rounded-lg ${plan.name === 'Premium' ? 'vida-smart-gradient text-white' : 'bg-lime-100 text-lime-800 hover:bg-lime-200'}`}
                >
                  Começar Agora
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Pricing;
