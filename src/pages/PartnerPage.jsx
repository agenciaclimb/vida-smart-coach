import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import { DollarSign, Zap, Users, Gift, ArrowRight, TrendingUp } from 'lucide-react';

const BenefitCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    viewport={{ once: true }}
    className="bg-white p-8 rounded-2xl shadow-sm text-center border border-slate-100"
  >
    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

const PartnerPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Seja um Parceiro Vida Smart | Renda Recorrente com Saúde</title>
        <meta name="description" content="Transforme vidas e crie uma fonte de renda recorrente. Junte-se ao programa de parceiros Vida Smart e ganhe comissões ajudando pessoas a alcançarem seus objetivos." />
      </Helmet>
      
      <Header />

      <main className="pt-20 bg-white">
        <section className="py-20 lg:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="container mx-auto px-4 sm:px-6 lg:px-8"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Transforme vidas. <span className="text-primary">Gere renda.</span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mt-6 mb-8">
              O programa de parceiros Vida Smart é para quem acredita no poder da transformação e quer construir uma fonte de renda recorrente ajudando pessoas a serem mais saudáveis.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="btn-lime-accent text-lg px-8 py-6" onClick={() => navigate('/login?role=partner&tab=register')}>
                <Zap className="w-5 h-5 mr-2" /> Quero ser parceiro agora
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => navigate('/login')}>
                Já sou cliente e quero indicar
              </Button>
            </div>
          </motion.div>
        </section>

        <section className="py-20 lg:py-24 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16 text-gray-900">Benefícios que impulsionam seu sucesso</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <BenefitCard icon={<DollarSign size={32} />} title="Comissão Recorrente" description="Enquanto seu indicado for um cliente ativo, você ganha. Uma venda, múltiplos pagamentos." delay={0.1} />
              <BenefitCard icon={<TrendingUp size={32} />} title="Plano de Carreira" description="Suba de nível e aumente suas comissões. Seu crescimento é o nosso crescimento." delay={0.2} />
              <BenefitCard icon={<Users size={32} />} title="Ganhos por Indicação" description="Ganhe também sobre as vendas dos parceiros que você indicar. É o poder da rede." delay={0.3} />
              <BenefitCard icon={<Gift size={32} />} title="Materiais e Suporte" description="Tenha acesso a um painel completo, materiais de marketing e suporte dedicado." delay={0.4} />
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-24 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-primary font-semibold">COMO FUNCIONA</span>
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-6">
                            Você indica. Nós cuidamos do resto.
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Nosso sistema foi desenhado para ser simples e poderoso. Você foca em compartilhar a oportunidade, e nossa tecnologia cuida da conversão e do acompanhamento.
                        </p>
                        <ol className="space-y-4">
                            <li className="flex items-start"><span className="font-bold text-primary mr-3">1.</span><p><span className="font-semibold">Cadastre-se e pegue seu link.</span> É rápido, fácil e gratuito.</p></li>
                            <li className="flex items-start"><span className="font-bold text-primary mr-3">2.</span><p><span className="font-semibold">Compartilhe com sua rede.</span> Use nossos materiais para ajudar na divulgação.</p></li>
                            <li className="flex items-start"><span className="font-bold text-primary mr-3">3.</span><p><span className="font-semibold">Acompanhe seus ganhos.</span> Veja suas comissões em tempo real no seu painel.</p></li>
                        </ol>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <img  class="w-full h-auto rounded-2xl shadow-xl" alt="Painel do parceiro Vida Smart mostrando gráficos de comissões" src="https://images.unsplash.com/photo-1702469224157-327a08d6061a" />
                    </motion.div>
                </div>
            </div>
        </section>

        <section className="bg-slate-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 text-center">
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">Pronto para construir sua renda extra?</h2>
                <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                    Faça parte de um movimento que leva saúde para as pessoas e prosperidade para nossos parceiros.
                </p>
                <Button size="lg" className="btn-lime-accent text-xl px-12 py-8 rounded-full shadow-lg" onClick={() => navigate('/login?role=partner&tab=register')}>
                    Começar a indicar agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default PartnerPage;