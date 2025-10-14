import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPageClienteFinal() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Vida Smart Coach</h1>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#como-funciona" className="text-gray-700 hover:text-blue-600">Como Funciona</a>
              <a href="#beneficios" className="text-gray-700 hover:text-blue-600">Benefícios</a>
              <a href="#planos" className="text-gray-700 hover:text-blue-600">Planos</a>
              <a href="#depoimentos" className="text-gray-700 hover:text-blue-600">Depoimentos</a>
              <Link to="/parceiros" className="text-gray-700 hover:text-blue-600">Seja Parceiro</Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-blue-600">Entrar</Link>
              <Link
                to="/login?tab=register"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Teste 7 Dias Grátis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Transforme Sua Vida com Seu
            <span className="text-blue-600"> Coach de IA 24/7</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Tenha um coach pessoal de inteligência artificial no seu WhatsApp que te acompanha 24 horas por dia nas 4 áreas da vida: física, alimentar, emocional e espiritual.
          </p>

          <div className="bg-white p-6 rounded-xl shadow-lg mb-8 max-w-2xl mx-auto">
            <p className="text-lg font-semibold text-gray-800 mb-2">
              ✅ Tudo pelo WhatsApp - Sem apps complicados
            </p>
            <p className="text-lg font-semibold text-gray-800 mb-2">
              ✅ Acompanhamento 24/7 personalizado
            </p>
            <p className="text-lg font-semibold text-gray-800">
              ✅ Resultados reais em 30 dias
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login?tab=register"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              🚀 Começar Teste Gratuito de 7 Dias
            </Link>
            <Link
              to="/login?tab=register"
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              📱 Ver Como Funciona
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Sem cartão de crédito • Cancele quando quiser • Suporte 24/7
          </p>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Como Funciona no Seu WhatsApp
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">1. Converse no WhatsApp</h3>
              <p className="text-gray-600">
                Adicione nosso número e comece a conversar com sua IA Coach. É como ter um amigo especialista sempre disponível.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">2. Receba Orientações</h3>
              <p className="text-gray-600">
                Sua IA analisa suas informações e cria um plano personalizado para as 4 áreas da sua vida.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Acompanhe Evolução</h3>
              <p className="text-gray-600">
                Veja seu progresso no painel exclusivo e ganhe pontos que podem ser trocados por prêmios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Transformação Completa nas 4 Áreas da Vida
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">💪</div>
              <h3 className="text-xl font-semibold mb-3">Área Física</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Treinos personalizados</li>
                <li>• Correção de exercícios</li>
                <li>• Motivação diária</li>
                <li>• Acompanhamento de peso</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🥗</div>
              <h3 className="text-xl font-semibold mb-3">Área Alimentar</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Análise de refeições por foto</li>
                <li>• Receitas personalizadas</li>
                <li>• Lista de compras inteligente</li>
                <li>• Educação nutricional</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold mb-3">Área Emocional</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Check-ins de humor diários</li>
                <li>• Técnicas de respiração</li>
                <li>• Suporte em crises</li>
                <li>• Diário emocional</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-semibold mb-3">Área Espiritual</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Reflexões diárias</li>
                <li>• Práticas de gratidão</li>
                <li>• Desenvolvimento pessoal</li>
                <li>• Conexão com propósito</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Gamificação */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8">
            🎮 Sistema de Recompensas e Gamificação
          </h2>
          
          <p className="text-xl mb-12">
            Ganhe pontos por cada meta alcançada e troque por prêmios incríveis!
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 p-6 rounded-xl">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold mb-3">Conquiste Metas</h3>
              <p>Ganhe pontos por cada objetivo alcançado nas 4 áreas da vida.</p>
            </div>

            <div className="bg-white/10 p-6 rounded-xl">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-3">Indique Amigos</h3>
              <p>Ganhe pontos extras indicando amigos e familiares.</p>
            </div>

            <div className="bg-white/10 p-6 rounded-xl">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-semibold mb-3">Troque por Prêmios</h3>
              <p>Use seus pontos para ganhar produtos, serviços ou cashback.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Escolha Seu Plano de Transformação
          </h2>
          
          <div className="grid gap-8 max-w-6xl mx-auto md:grid-cols-3">
            <div className="border-2 border-gray-200 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Plano Básico</h3>
              <div className="text-4xl font-bold text-blue-600 mb-6">
                R$ 19,90<span className="text-lg text-gray-500">/mês</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  IA Coach 24/7 no WhatsApp
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Acompanhamento físico e alimentar
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Gamificação básica e pontos
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Suporte humano via WhatsApp
                </li>
              </ul>

              <Link to="/login?tab=register" className="w-full inline-flex justify-center bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors">
                Começar Teste Grátis
              </Link>
            </div>

            <div className="border-2 border-blue-500 rounded-xl p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
                Mais Popular
              </div>

              <h3 className="text-2xl font-bold mb-4">Plano Premium</h3>
              <div className="text-4xl font-bold text-blue-600 mb-6">
                R$ 29,90<span className="text-lg text-gray-500">/mês</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Tudo do Básico + 4 áreas completas
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Gamificação avançada e desafios semanais
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Comunidade exclusiva com eventos
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Relatórios semanais e plano integrado
                </li>
              </ul>

              <Link to="/login?tab=register" className="w-full inline-flex justify-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Começar Teste Grátis
              </Link>
            </div>

            <div className="border-2 border-indigo-500 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Plano Avançado</h3>
              <div className="text-4xl font-bold text-blue-600 mb-6">
                R$ 49,90<span className="text-lg text-gray-500">/mês</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Tudo do Premium + relatórios especiais
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Conteúdos exclusivos e experiências VIP
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Consultoria individual com especialistas
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Suporte prioritário multiplataforma
                </li>
              </ul>

              <Link to="/login?tab=register" className="w-full inline-flex justify-center bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                Começar Teste Grátis
              </Link>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              <strong>Garantia de 30 dias</strong> ou seu dinheiro de volta
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Teste grátis por 7 dias • Sem compromisso • Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Veja os Resultados dos Nossos Clientes
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400">⭐⭐⭐⭐⭐</div>
              </div>
              <p className="text-gray-600 mb-4">
                "Perdi 8kg em 2 meses! A IA me ajudou a manter a disciplina e me motivou todos os dias. Melhor investimento que já fiz!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  M
                </div>
                <div className="ml-3">
                  <p className="font-semibold">Maria Silva</p>
                  <p className="text-sm text-gray-500">Empresária - São Paulo</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400">⭐⭐⭐⭐⭐</div>
              </div>
              <p className="text-gray-600 mb-4">
                "Minha ansiedade diminuiu muito! As técnicas de respiração e o suporte emocional 24/7 mudaram minha vida."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                  J
                </div>
                <div className="ml-3">
                  <p className="font-semibold">João Santos</p>
                  <p className="text-sm text-gray-500">Designer - Rio de Janeiro</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400">⭐⭐⭐⭐⭐</div>
              </div>
              <p className="text-gray-600 mb-4">
                "Nunca consegui manter uma rotina de exercícios. Com a IA, já são 4 meses treinando consistentemente!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <div className="ml-3">
                  <p className="font-semibold">Ana Costa</p>
                  <p className="text-sm text-gray-500">Professora - Belo Horizonte</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para Transformar Sua Vida?
          </h2>
          
          <p className="text-xl mb-8">
            Junte-se a milhares de pessoas que já estão transformando suas vidas com nosso Coach de IA 24/7.
          </p>

          <Link
            to="/login?tab=register"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors mb-4 inline-block"
          >
            🚀 Começar Teste Gratuito de 7 Dias
          </Link>

          <p className="text-sm opacity-90">
            Sem cartão de crédito • Cancele quando quiser • Suporte 24/7
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Vida Smart Coach</h3>
              <p className="text-gray-400">
                Seu coach de IA 24/7 para transformação completa nas 4 áreas da vida.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#como-funciona" className="hover:text-white">Como Funciona</a></li>
                <li><a href="#beneficios" className="hover:text-white">Benefícios</a></li>
                <li><a href="#planos" className="hover:text-white">Planos</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Parceiros</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/parceiros" className="hover:text-white">Seja Parceiro</Link></li>
                <li><a href="#" className="hover:text-white">Programa de Afiliados</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
                <li><a href="#" className="hover:text-white">WhatsApp</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Vida Smart Coach. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
