import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate('/login?tab=register');
  };

  return (
    <section className="relative bg-white pt-32 pb-20 lg:pt-48 lg:pb-32">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary/5 rounded-full filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[10%] right-[-10%] w-96 h-96 bg-lime-300/5 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block bg-lime-100 text-lime-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Sua Coach de Saúde 24h no WhatsApp
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight tracking-tighter">
            Sua saúde não precisa ser complicada.
            <br className="hidden lg:inline" />
            <span className="text-primary">Nós simplificamos para você.</span>
          </h1>
          <p className="max-w-2xl mx-auto mt-6 text-lg lg:text-xl text-gray-600">
            Receba um plano de ação diário direto no seu WhatsApp. Com uma IA coach, desafios e uma comunidade de apoio, sua jornada para uma vida mais saudável começa agora.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" className="btn-lime-accent text-lg px-8 py-6 w-full sm:w-auto" onClick={handleSignUp}>
              <Zap className="w-5 h-5 mr-2" />
              Começar minha transformação
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 w-full sm:w-auto" onClick={() => document.getElementById('comofunciona')?.scrollIntoView({ behavior: 'smooth' })}>
              Ver como funciona <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          <div className="mt-8 flex justify-center items-center gap-4 text-gray-500">
            <div className="flex -space-x-2 overflow-hidden">
                <img  class="inline-block h-8 w-8 rounded-full ring-2 ring-white" alt="Avatar de usuário feliz 1" src="https://images.unsplash.com/photo-1703198806037-d6af890d9b1d" />
                <img  class="inline-block h-8 w-8 rounded-full ring-2 ring-white" alt="Avatar de usuário feliz 2" src="https://images.unsplash.com/photo-1703198806037-d6af890d9b1d" />
                <img  class="inline-block h-8 w-8 rounded-full ring-2 ring-white" alt="Avatar de usuário feliz 3" src="https://images.unsplash.com/photo-1686593981963-c3e108260adb" />
            </div>
            <span>Junte-se a mais de <span className="font-semibold text-primary">10.000 pessoas</span></span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;