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
          <a href="#beneficios" className="text-gray-700 hover:text-blue-600">Benefícios</a>
          <a href="#planos" className="text-gray-700 hover:text-blue-600">Planos</a>
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
        Transforme Sua Saúde com{' '}
        <span className="text-blue-600">Inteligência Artificial</span>
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        Sua jornada para uma vida mais saudável começa aqui. Planos de treino e alimentação 
        personalizados, acompanhamento 24/7 com IA Coach e uma comunidade motivadora.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold">
          Começar Agora
        </button>
        <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg text-lg font-semibold">
          Saiba Mais
        </button>
      </div>
    </div>
  </section>
);

const Benefits = () => (
  <section id="beneficios" className="py-16 bg-white">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
        Por que escolher o Vida Smart Coach?
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            🤖
          </div>
          <h3 className="text-xl font-semibold mb-3">IA Coach 24/7</h3>
          <p className="text-gray-600">
            Acompanhamento inteligente e personalizado a qualquer hora do dia, 
            adaptando-se às suas necessidades e progresso.
          </p>
        </div>
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            🏋️
          </div>
          <h3 className="text-xl font-semibold mb-3">Treinos Personalizados</h3>
          <p className="text-gray-600">
            Exercícios adaptados ao seu nível, objetivos e preferências, 
            com progressão inteligente e segura.
          </p>
        </div>
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            🥗
          </div>
          <h3 className="text-xl font-semibold mb-3">Nutrição Inteligente</h3>
          <p className="text-gray-600">
            Planos alimentares baseados em suas preferências, restrições 
            e objetivos de saúde específicos.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const Pricing = () => (
  <section id="planos" className="py-16 bg-gray-50">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
        Escolha o plano ideal para você
      </h2>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Plano Básico</h3>
          <div className="text-4xl font-bold text-blue-600 mb-6">
            R$ 29,90<span className="text-lg text-gray-500">/mês</span>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              IA Coach básico
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Treinos personalizados
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Acompanhamento semanal
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Planos de alimentação básicos
            </li>
          </ul>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
            Escolher Plano
          </button>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-blue-500 relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Mais Popular
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Plano Premium</h3>
          <div className="text-4xl font-bold text-blue-600 mb-6">
            R$ 49,90<span className="text-lg text-gray-500">/mês</span>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              IA Coach avançado 24/7
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Treinos + Nutrição completos
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Acompanhamento diário
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Comunidade exclusiva
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              Relatórios detalhados
            </li>
          </ul>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
            Escolher Plano
          </button>
        </div>
      </div>
    </div>
  </section>
);

const Testimonials = () => (
  <section id="depoimentos" className="py-16 bg-white">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
        O que nossos usuários dizem
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-gray-50 p-6 rounded-xl">
          <div className="flex mb-4">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400">⭐</span>
            ))}
          </div>
          <p className="text-gray-600 mb-4">
            "O Vida Smart Coach transformou completamente minha rotina. 
            Perdi 15kg em 6 meses de forma saudável e sustentável!"
          </p>
          <div className="font-semibold">Maria Silva</div>
          <div className="text-sm text-gray-500">Empresária, 34 anos</div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-xl">
          <div className="flex mb-4">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400">⭐</span>
            ))}
          </div>
          <p className="text-gray-600 mb-4">
            "A IA realmente entende minhas necessidades. Os treinos são 
            desafiadores mas sempre respeitam meus limites."
          </p>
          <div className="font-semibold">João Santos</div>
          <div className="text-sm text-gray-500">Engenheiro, 28 anos</div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-xl">
          <div className="flex mb-4">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400">⭐</span>
            ))}
          </div>
          <p className="text-gray-600 mb-4">
            "Nunca pensei que seria possível ter um coach pessoal 24/7. 
            O suporte é incrível e os resultados falam por si só."
          </p>
          <div className="font-semibold">Ana Costa</div>
          <div className="text-sm text-gray-500">Professora, 41 anos</div>
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
            Transformando vidas através da tecnologia e inteligência artificial.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Produto</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Funcionalidades</li>
            <li>Planos</li>
            <li>Depoimentos</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Suporte</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Central de Ajuda</li>
            <li>Contato</li>
            <li>FAQ</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Legal</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Termos de Uso</li>
            <li>Política de Privacidade</li>
            <li>Cookies</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; 2024 Vida Smart Coach. Todos os direitos reservados.</p>
      </div>
    </div>
  </footer>
);

const LandingPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#planos' && location.state?.scrollToPlans) {
      setTimeout(() => {
        const element = document.getElementById('planos');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

  return (
    <>
      <Helmet>
        <title>Vida Smart Coach - Transforme Sua Saúde com Inteligência Artificial</title>
        <meta name="description" content="Sua jornada para uma vida mais saudável começa aqui. Planos de treino e alimentação personalizados, acompanhamento 24/7 com IA Coach e uma comunidade motivadora." />
      </Helmet>
      <div className="bg-white">
        <Header />
        <main>
          <Hero />
          <Benefits />
          <Pricing />
          <Testimonials />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default LandingPage;

