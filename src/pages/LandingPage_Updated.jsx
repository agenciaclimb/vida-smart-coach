import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';

// Componentes básicos sem dependências complexas
const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        <div className="text-2xl font-bold text-blue-600">Vida Smart Coach</div>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#como-funciona" className="text-gray-700 hover:text-blue-600">Como Funciona</a>
          <a href="#beneficios" className="text-gray-700 hover:text-blue-600">Benefícios</a>
          <a href="#planos" className="text-gray-700 hover:text-blue-600">Planos</a>
          <a href="#parceiros" className="text-gray-700 hover:text-blue-600">Seja Parceiro</a>
          <a href="#depoimentos" className="text-gray-700 hover:text-blue-600">Depoimentos</a>
        </nav>
        <div className="hidden md:flex items-center space-x-4">
          <button className="text-gray-700 hover:text-blue-600 px-4 py-2">Entrar</button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            Começar Agora
          </button>
        </div>
      </div>
    </div>
  </header>
);

const Hero = () => (
  <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="container mx-auto px-4 text-center">
      <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
        Potencialize Sua Transformação com{' '}
        <span className="text-blue-600">IA Coach 24/7</span>
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        A primeira IA Coach que trabalha em parceria com profissionais de saúde para 
        acelerar sua transformação nas 4 áreas da vida: física, alimentar, emocional e espiritual.
      </p>
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto mb-8">
        <p className="text-lg text-gray-700 mb-4">
          <strong>Não substituímos profissionais.</strong> Potencializamos seus resultados!
        </p>
        <p className="text-gray-600">
          Nossa IA trabalha como extensão do seu personal trainer, nutricionista, 
          psicólogo e coach, oferecendo suporte 24/7 entre as consultas.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold">
          Experimente 7 Dias Grátis
        </button>
        <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg text-lg font-semibold">
          Sou Profissional
        </button>
      </div>
    </div>
  </section>
);

const HowItWorks = () => (
  <section id="como-funciona" className="py-16 bg-white">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
        Como Funciona a Parceria
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤝</span>
          </div>
          <h3 className="text-xl font-semibold mb-3">1. Complementa Profissionais</h3>
          <p className="text-gray-600">
            Nossa IA trabalha como extensão do seu personal trainer, nutricionista, 
            psicólogo ou coach, oferecendo suporte contínuo entre as consultas.
          </p>
        </div>
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📱</span>
          </div>
          <h3 className="text-xl font-semibold mb-3">2. Acompanhamento 24/7</h3>
          <p className="text-gray-600">
            Suporte inteligente via WhatsApp para manter você motivado e no caminho certo, 
            reportando progresso para seus profissionais.
          </p>
        </div>
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-xl font-semibold mb-3">3. Potencializa Resultados</h3>
          <p className="text-gray-600">
            Acelera sua transformação com acompanhamento contínuo, insights personalizados 
            e motivação constante, maximizando o trabalho dos profissionais.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const Benefits = () => (
  <section id="beneficios" className="py-16 bg-gray-50">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
        Transformação Integral com Suporte Profissional
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="text-center p-6 bg-white rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            💪
          </div>
          <h3 className="text-xl font-semibold mb-3">Área Física</h3>
          <p className="text-gray-600">
            Extensão do seu personal trainer com acompanhamento de treinos, 
            correção de exercícios e motivação diária.
          </p>
        </div>
        <div className="text-center p-6 bg-white rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            🥗
          </div>
          <h3 className="text-xl font-semibold mb-3">Área Alimentar</h3>
          <p className="text-gray-600">
            Suporte ao seu nutricionista com análise de refeições, 
            educação nutricional e acompanhamento de hábitos.
          </p>
        </div>
        <div className="text-center p-6 bg-white rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            🧠
          </div>
          <h3 className="text-xl font-semibold mb-3">Área Emocional</h3>
          <p className="text-gray-600">
            Complementa seu psicólogo com check-ins diários, 
            técnicas de regulação emocional e suporte motivacional.
          </p>
        </div>
        <div className="text-center p-6 bg-white rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            ✨
          </div>
          <h3 className="text-xl font-semibold mb-3">Área Espiritual</h3>
          <p className="text-gray-600">
            Apoio ao seu coach com práticas de autoconhecimento, 
            reflexões diárias e desenvolvimento de propósito.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const Pricing = () => (
  <section id="planos" className="py-16 bg-white">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
        Planos que Potencializam Seus Profissionais
      </h2>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Escolha o plano ideal para complementar o trabalho dos seus profissionais de saúde 
        e acelerar sua transformação pessoal.
      </p>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg border">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Plano Essencial</h3>
          <div className="text-4xl font-bold text-blue-600 mb-6">
            R$ 47,90<span className="text-lg text-gray-500">/mês</span>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              IA Coach básica 24/7
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Suporte entre consultas
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Acompanhamento de 2 áreas
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Relatórios para profissionais
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Comunidade de apoio
            </li>
          </ul>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
            Começar Agora
          </button>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-blue-500 relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Mais Completo
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Plano Transformação</h3>
          <div className="text-4xl font-bold text-blue-600 mb-6">
            R$ 97,90<span className="text-lg text-gray-500">/mês</span>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              IA Coach avançada 24/7
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Integração com profissionais
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Transformação nas 4 áreas
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Dashboard para profissionais
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Análise de fotos e progresso
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Acesso a especialistas
            </li>
          </ul>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
            Começar Agora
          </button>
        </div>
      </div>
      
      <div className="text-center mt-12">
        <p className="text-gray-600 mb-4">
          <strong>Garantia de 30 dias</strong> ou seu dinheiro de volta
        </p>
        <p className="text-sm text-gray-500">
          * Nossos planos complementam, não substituem, o acompanhamento profissional
        </p>
      </div>
    </div>
  </section>
);

const PartnersSection = () => (
  <section id="parceiros" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
        Seja Nosso Parceiro Profissional
      </h2>
      <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
        Potencialize seus resultados com clientes usando nossa IA como extensão do seu trabalho. 
        Aumente a retenção, melhore os resultados e gere receita adicional.
      </p>
      
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            🏋️
          </div>
          <h3 className="text-xl font-semibold mb-3">Personal Trainers</h3>
          <p className="text-gray-600 mb-4">
            Acompanhe seus alunos 24/7, aumente a aderência aos treinos e 
            receba relatórios detalhados de progresso.
          </p>
          <p className="text-blue-600 font-semibold">30% de comissão recorrente</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            🥗
          </div>
          <h3 className="text-xl font-semibold mb-3">Nutricionistas</h3>
          <p className="text-gray-600 mb-4">
            Monitore a alimentação dos pacientes entre consultas com análise 
            de fotos e educação nutricional contínua.
          </p>
          <p className="text-blue-600 font-semibold">25% de comissão recorrente</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            🧠
          </div>
          <h3 className="text-xl font-semibold mb-3">Psicólogos</h3>
          <p className="text-gray-600 mb-4">
            Ofereça suporte emocional contínuo entre sessões com check-ins 
            diários e técnicas de regulação emocional.
          </p>
          <p className="text-blue-600 font-semibold">35% de comissão recorrente</p>
        </div>
      </div>
      
      <div className="text-center">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold mr-4">
          Quero Ser Parceiro
        </button>
        <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg text-lg font-semibold">
          Saiba Mais
        </button>
      </div>
    </div>
  </section>
);

const Testimonials = () => (
  <section id="depoimentos" className="py-16 bg-white">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
        Profissionais e Clientes Aprovam
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-gray-50 p-6 rounded-xl">
          <div className="flex mb-4">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400">⭐</span>
            ))}
          </div>
          <p className="text-gray-600 mb-4">
            "A IA potencializou meu trabalho como personal trainer. Meus alunos 
            ficam mais motivados e aderentes aos treinos!"
          </p>
          <div className="font-semibold">Carlos Silva</div>
          <div className="text-sm text-gray-500">Personal Trainer</div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-xl">
          <div className="flex mb-4">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400">⭐</span>
            ))}
          </div>
          <p className="text-gray-600 mb-4">
            "Perdi 12kg com o suporte da IA complementando minha nutricionista. 
            O acompanhamento 24/7 fez toda a diferença!"
          </p>
          <div className="font-semibold">Maria Santos</div>
          <div className="text-sm text-gray-500">Cliente</div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-xl">
          <div className="flex mb-4">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400">⭐</span>
            ))}
          </div>
          <p className="text-gray-600 mb-4">
            "Meus pacientes chegam às sessões mais conscientes e engajados. 
            A IA é uma extensão perfeita do meu trabalho."
          </p>
          <div className="font-semibold">Dra. Ana Costa</div>
          <div className="text-sm text-gray-500">Psicóloga</div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-gray-900 text-white py-12">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">Vida Smart Coach</h3>
          <p className="text-gray-400">
            Potencializando profissionais de saúde e transformando vidas através 
            da inteligência artificial.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Para Clientes</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Como Funciona</li>
            <li>Planos</li>
            <li>Depoimentos</li>
            <li>Suporte</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Para Profissionais</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Seja Parceiro</li>
            <li>Dashboard</li>
            <li>Comissões</li>
            <li>Treinamentos</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Legal</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Termos de Uso</li>
            <li>Política de Privacidade</li>
            <li>LGPD</li>
            <li>Contato</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; 2024 Vida Smart Coach. Potencializando profissionais, transformando vidas.</p>
        <p className="text-sm mt-2">
          * Nossa IA complementa, não substitui, o acompanhamento profissional de saúde.
        </p>
      </div>
    </div>
  </footer>
);

const LandingPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash && location.state?.scrollToSection) {
      setTimeout(() => {
        const element = document.getElementById(location.hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

  return (
    <>
      <Helmet>
        <title>Vida Smart Coach - IA que Potencializa Profissionais de Saúde</title>
        <meta name="description" content="A primeira IA Coach que trabalha em parceria com profissionais de saúde para acelerar sua transformação nas 4 áreas da vida. Não substituímos, potencializamos!" />
        <meta name="keywords" content="IA coach, personal trainer, nutricionista, psicólogo, transformação pessoal, parceria profissional" />
      </Helmet>
      <div className="bg-white">
        <Header />
        <main>
          <Hero />
          <HowItWorks />
          <Benefits />
          <Pricing />
          <PartnersSection />
          <Testimonials />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default LandingPage;

