import React from 'react';
import { Helmet } from 'react-helmet';

const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        <div className="text-2xl font-bold text-blue-600">Vida Smart Coach</div>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="/" className="text-gray-700 hover:text-blue-600">Início</a>
          <a href="#como-funciona" className="text-gray-700 hover:text-blue-600">Como Funciona</a>
          <a href="#beneficios" className="text-gray-700 hover:text-blue-600">Benefícios</a>
          <a href="#comissoes" className="text-gray-700 hover:text-blue-600">Comissões</a>
          <a href="#depoimentos" className="text-gray-700 hover:text-blue-600">Depoimentos</a>
        </nav>
        <div className="hidden md:flex items-center space-x-4">
          <button className="text-gray-700 hover:text-blue-600 px-4 py-2">Login Parceiro</button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            Quero Ser Parceiro
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
        Potencialize Seus Resultados com{' '}
        <span className="text-blue-600">IA Parceira</span>
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        Seja parceiro da primeira IA Coach que trabalha como extensão do seu trabalho profissional. 
        Aumente a retenção de clientes, melhore resultados e gere receita adicional.
      </p>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 max-w-4xl mx-auto mb-8">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
            <p className="text-gray-700">Aumento na retenção de clientes</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">3x</div>
            <p className="text-gray-700">Mais resultados para seus clientes</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">50%</div>
            <p className="text-gray-700">Receita adicional recorrente</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold">
          Quero Ser Parceiro
        </button>
        <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg text-lg font-semibold">
          Agendar Demonstração
        </button>
      </div>
    </div>
  </section>
);

const HowItWorks = () => (
  <section id="como-funciona" className="py-16 bg-white">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
        Como Funciona a Parceria
      </h2>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Nossa IA não compete com você. Ela potencializa seu trabalho, criando uma experiência 
        completa e contínua para seus clientes.
      </p>
      
      <div className="grid md:grid-cols-4 gap-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">1️⃣</span>
          </div>
          <h3 className="text-xl font-semibold mb-3">Você Atende</h3>
          <p className="text-gray-600">
            Continue fazendo seu trabalho profissional normalmente - consultas, 
            avaliações, prescrições e acompanhamentos.
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">2️⃣</span>
          </div>
          <h3 className="text-xl font-semibold mb-3">IA Complementa</h3>
          <p className="text-gray-600">
            Nossa IA oferece suporte 24/7 entre suas consultas, mantendo 
            seus clientes motivados e aderentes ao tratamento.
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">3️⃣</span>
          </div>
          <h3 className="text-xl font-semibold mb-3">Você Recebe Dados</h3>
          <p className="text-gray-600">
            Acesse relatórios detalhados do progresso dos seus clientes 
            para otimizar suas próximas consultas.
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">4️⃣</span>
          </div>
          <h3 className="text-xl font-semibold mb-3">Todos Ganham</h3>
          <p className="text-gray-600">
            Clientes têm melhores resultados, você aumenta retenção 
            e ainda ganha comissão recorrente.
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
        Benefícios para Cada Profissional
      </h2>
      
      <div className="space-y-12">
        {/* Personal Trainers */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mr-4">
              🏋️
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Personal Trainers & Academias</h3>
              <p className="text-blue-600 font-semibold">30% de comissão recorrente</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Para Você:</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Aumento de 95% na retenção de alunos</li>
                <li>• Relatórios automáticos de progresso</li>
                <li>• Diferenciação competitiva no mercado</li>
                <li>• Receita adicional sem trabalho extra</li>
                <li>• Dashboard para acompanhar todos os alunos</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Para Seus Alunos:</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Motivação e lembretes diários</li>
                <li>• Correção de exercícios via descrição</li>
                <li>• Acompanhamento entre treinos</li>
                <li>• Ajustes automáticos de intensidade</li>
                <li>• Suporte emocional para consistência</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Nutricionistas */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mr-4">
              🥗
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Nutricionistas & Clínicas</h3>
              <p className="text-blue-600 font-semibold">25% de comissão recorrente</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Para Você:</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Pacientes mais aderentes ao plano alimentar</li>
                <li>• Análise automática de fotos de refeições</li>
                <li>• Educação nutricional contínua</li>
                <li>• Integração com seu prontuário</li>
                <li>• Escala de atendimento ampliada</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Para Seus Pacientes:</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Feedback imediato sobre refeições</li>
                <li>• Receitas personalizadas</li>
                <li>• Lista de compras automática</li>
                <li>• Controle de sintomas e humor</li>
                <li>• Suporte para compulsões alimentares</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Psicólogos */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              🧠
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Psicólogos & Terapeutas</h3>
              <p className="text-blue-600 font-semibold">35% de comissão recorrente</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Para Você:</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Continuidade terapêutica entre sessões</li>
                <li>• Insights sobre estado emocional diário</li>
                <li>• Prevenção e detecção precoce de crises</li>
                <li>• Relatórios de humor e padrões</li>
                <li>• Maior efetividade do tratamento</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Para Seus Pacientes:</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Check-ins diários de humor</li>
                <li>• Técnicas de respiração e mindfulness</li>
                <li>• Diário emocional inteligente</li>
                <li>• Suporte em momentos de ansiedade</li>
                <li>• Exercícios de autoconhecimento</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Coaches */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              ✨
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Coaches & Mentores</h3>
              <p className="text-blue-600 font-semibold">50% de comissão recorrente</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Para Você:</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Escala de atendimento exponencial</li>
                <li>• Acompanhamento 24/7 automatizado</li>
                <li>• Insights sobre progresso dos clientes</li>
                <li>• Ferramentas exclusivas de coaching</li>
                <li>• Versão white-label disponível</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Para Seus Clientes:</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Reflexões diárias personalizadas</li>
                <li>• Práticas de gratidão e propósito</li>
                <li>• Acompanhamento de metas</li>
                <li>• Desenvolvimento de autoestima</li>
                <li>• Conexão com valores pessoais</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const CommissionStructure = () => (
  <section id="comissoes" className="py-16 bg-white">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
        Estrutura de Comissões
      </h2>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Ganhe receita recorrente mensal indicando nossos serviços para seus clientes. 
        Quanto mais você indica, mais você ganha.
      </p>
      
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <div className="bg-gradient-to-br from-bronze-100 to-bronze-200 p-6 rounded-xl text-center">
          <div className="text-2xl mb-2">🥉</div>
          <h3 className="font-bold text-lg mb-2">Bronze</h3>
          <div className="text-2xl font-bold text-bronze-600 mb-2">15%</div>
          <p className="text-sm text-gray-600">1-10 clientes ativos</p>
        </div>
        
        <div className="bg-gradient-to-br from-gray-200 to-gray-300 p-6 rounded-xl text-center">
          <div className="text-2xl mb-2">🥈</div>
          <h3 className="font-bold text-lg mb-2">Prata</h3>
          <div className="text-2xl font-bold text-gray-600 mb-2">25%</div>
          <p className="text-sm text-gray-600">11-25 clientes ativos</p>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-200 to-yellow-300 p-6 rounded-xl text-center">
          <div className="text-2xl mb-2">🥇</div>
          <h3 className="font-bold text-lg mb-2">Ouro</h3>
          <div className="text-2xl font-bold text-yellow-600 mb-2">35%</div>
          <p className="text-sm text-gray-600">26-50 clientes ativos</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-200 to-blue-300 p-6 rounded-xl text-center">
          <div className="text-2xl mb-2">💎</div>
          <h3 className="font-bold text-lg mb-2">Diamante</h3>
          <div className="text-2xl font-bold text-blue-600 mb-2">50%</div>
          <p className="text-sm text-gray-600">51+ clientes ativos</p>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-center mb-6">Exemplo de Ganhos Mensais</h3>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">R$ 2.450</div>
            <p className="text-gray-700">10 clientes × R$ 97 × 25%</p>
            <p className="text-sm text-gray-500">Nível Prata</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">R$ 8.505</div>
            <p className="text-gray-700">25 clientes × R$ 97 × 35%</p>
            <p className="text-sm text-gray-500">Nível Ouro</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">R$ 24.250</div>
            <p className="text-gray-700">50 clientes × R$ 97 × 50%</p>
            <p className="text-sm text-gray-500">Nível Diamante</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Testimonials = () => (
  <section id="depoimentos" className="py-16 bg-gray-50">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
        O Que Nossos Parceiros Dizem
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex mb-4">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400">⭐</span>
            ))}
          </div>
          <p className="text-gray-600 mb-4">
            "Minha retenção de alunos aumentou 90% desde que comecei a usar a IA. 
            Eles ficam mais motivados e eu ganho uma renda extra significativa!"
          </p>
          <div className="font-semibold">Carlos Mendes</div>
          <div className="text-sm text-gray-500">Personal Trainer - São Paulo</div>
          <div className="text-sm text-blue-600 mt-1">R$ 3.200/mês em comissões</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex mb-4">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400">⭐</span>
            ))}
          </div>
          <p className="text-gray-600 mb-4">
            "Meus pacientes chegam às consultas mais conscientes e engajados. 
            A IA é realmente uma extensão do meu trabalho, não uma concorrente."
          </p>
          <div className="font-semibold">Dra. Marina Silva</div>
          <div className="text-sm text-gray-500">Nutricionista - Rio de Janeiro</div>
          <div className="text-sm text-blue-600 mt-1">R$ 1.800/mês em comissões</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex mb-4">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400">⭐</span>
            ))}
          </div>
          <p className="text-gray-600 mb-4">
            "Consegui escalar meu atendimento sem perder qualidade. A IA cuida 
            do acompanhamento diário e eu foco nas sessões estratégicas."
          </p>
          <div className="font-semibold">Roberto Costa</div>
          <div className="text-sm text-gray-500">Coach de Vida - Belo Horizonte</div>
          <div className="text-sm text-blue-600 mt-1">R$ 5.600/mês em comissões</div>
        </div>
      </div>
    </div>
  </section>
);

const CTA = () => (
  <section className="py-16 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-4xl font-bold mb-4">
        Pronto para Potencializar Seus Resultados?
      </h2>
      <p className="text-xl mb-8 max-w-2xl mx-auto">
        Junte-se a centenas de profissionais que já estão transformando suas práticas 
        e gerando receita adicional com nossa IA parceira.
      </p>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto mb-8">
        <h3 className="text-lg font-semibold mb-4">Comece Hoje Mesmo:</h3>
        <ul className="text-left space-y-2">
          <li>✓ Cadastro gratuito em 2 minutos</li>
          <li>✓ Treinamento completo incluído</li>
          <li>✓ Suporte dedicado para parceiros</li>
          <li>✓ Materiais de marketing prontos</li>
          <li>✓ Dashboard profissional</li>
        </ul>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100">
          Quero Ser Parceiro Agora
        </button>
        <button className="border border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10">
          Agendar Demonstração
        </button>
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
            A IA que potencializa profissionais de saúde e transforma vidas.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Para Parceiros</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Como Funciona</li>
            <li>Comissões</li>
            <li>Dashboard</li>
            <li>Materiais de Marketing</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Suporte</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Central de Ajuda</li>
            <li>Treinamentos</li>
            <li>Contato</li>
            <li>FAQ Parceiros</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Legal</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Termos de Parceria</li>
            <li>Política de Privacidade</li>
            <li>LGPD</li>
            <li>Código de Ética</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; 2024 Vida Smart Coach. Potencializando profissionais, transformando vidas.</p>
        <p className="text-sm mt-2">
          Programa de Parceria - Juntos somos mais fortes!
        </p>
      </div>
    </div>
  </footer>
);

const PartnersPage = () => {
  return (
    <>
      <Helmet>
        <title>Seja Parceiro - Vida Smart Coach | Potencialize Seus Resultados com IA</title>
        <meta name="description" content="Seja parceiro da primeira IA Coach que potencializa profissionais de saúde. Aumente retenção, melhore resultados e ganhe até 50% de comissão recorrente." />
        <meta name="keywords" content="parceria profissional, IA coach, personal trainer, nutricionista, psicólogo, comissão recorrente" />
      </Helmet>
      <div className="bg-white">
        <Header />
        <main>
          <Hero />
          <HowItWorks />
          <Benefits />
          <CommissionStructure />
          <Testimonials />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default PartnersPage;

