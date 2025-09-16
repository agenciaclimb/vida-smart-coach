import React from 'react';
import { Helmet } from 'react-helmet';

const SimpleLandingPage = () => {
  return (
    <>
      <Helmet>
        <title>Vida Smart Coach - Transforme Sua Saúde com Inteligência Artificial</title>
        <meta name="description" content="Sua jornada para uma vida mais saudável começa aqui." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <header className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">
              Vida Smart Coach
            </h1>
            <p className="text-xl opacity-90">
              Transforme Sua Saúde com Inteligência Artificial
            </p>
          </header>

          {/* Hero Section */}
          <section className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-6">
              Sua jornada para uma vida mais saudável começa aqui
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Planos de treino e alimentação personalizados, acompanhamento 24/7 com IA Coach 
              e uma comunidade motivadora para transformar sua vida.
            </p>
            <div className="space-x-4">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Começar Agora
              </button>
              <button className="border border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                Saiba Mais
              </button>
            </div>
          </section>

          {/* Benefits */}
          <section className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3">🤖 IA Coach 24/7</h3>
              <p>Acompanhamento inteligente e personalizado a qualquer hora do dia.</p>
            </div>
            <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3">🏋️ Treinos Personalizados</h3>
              <p>Exercícios adaptados ao seu nível e objetivos específicos.</p>
            </div>
            <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3">🥗 Nutrição Inteligente</h3>
              <p>Planos alimentares baseados em suas preferências e necessidades.</p>
            </div>
          </section>

          {/* Pricing */}
          <section className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-8">Escolha Seu Plano</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/10 p-8 rounded-lg backdrop-blur-sm">
                <h3 className="text-2xl font-semibold mb-4">Plano Básico</h3>
                <p className="text-3xl font-bold mb-4">R$ 29,90<span className="text-lg">/mês</span></p>
                <ul className="text-left space-y-2 mb-6">
                  <li>✓ IA Coach básico</li>
                  <li>✓ Treinos personalizados</li>
                  <li>✓ Acompanhamento semanal</li>
                </ul>
                <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                  Escolher Plano
                </button>
              </div>
              <div className="bg-white/20 p-8 rounded-lg backdrop-blur-sm border-2 border-yellow-400">
                <h3 className="text-2xl font-semibold mb-4">Plano Premium</h3>
                <p className="text-3xl font-bold mb-4">R$ 49,90<span className="text-lg">/mês</span></p>
                <ul className="text-left space-y-2 mb-6">
                  <li>✓ IA Coach avançado 24/7</li>
                  <li>✓ Treinos + Nutrição</li>
                  <li>✓ Acompanhamento diário</li>
                  <li>✓ Comunidade exclusiva</li>
                </ul>
                <button className="w-full bg-yellow-400 text-blue-900 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors">
                  Escolher Plano
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center">
            <p className="opacity-75">
              © 2024 Vida Smart Coach. Transformando vidas através da tecnologia.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default SimpleLandingPage;

