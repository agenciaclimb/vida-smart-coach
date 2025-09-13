import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

const CTA = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate('/login?tab=register');
  };

  return (
    <section className="py-20 lg:py-24 bg-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Sua virada de chave começa agora.
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Você não precisa fazer isso sozinho. Junte-se a uma comunidade que entende sua jornada e tenha as ferramentas certas para vencer.
          </p>
          <Button 
            size="lg" 
            className="btn-lime-accent text-xl px-8 sm:px-12 py-6 sm:py-8 rounded-full shadow-lg w-full sm:w-auto"
            onClick={handleSignUp}
          >
            <Zap className="w-6 h-6 mr-3" />
            Começar meus 7 Dias Grátis
          </Button>
          <p className="text-sm text-slate-400 mt-4">
            Sem cartão de crédito • Cancele quando quiser
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;