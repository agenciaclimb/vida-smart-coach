import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PartnersPageCorrigida() {
  const [activeTab, setActiveTab] = useState('influencers');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">Vida Smart Coach</Link>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600">Início</Link>
              <a href="#como-funciona" className="text-gray-700 hover:text-blue-600">Como Funciona</a>
              <a href="#tipos-parceiros" className="text-gray-700 hover:text-blue-600">Tipos de Parceiros</a>
              <a href="#comissoes" className="text-gray-700 hover:text-blue-600">Comissões</a>
              <a href="#depoimentos" className="text-gray-700 hover:text-blue-600">Depoimentos</a>
            </nav>

            <div className="flex items-center space-x-4">
              <button className="text-gray-700 hover:text-blue-600">Login Parceiro</button>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Quero Ser Parceiro
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Seja Nosso <span className="text-blue-600">Parceiro</span> e
            <br />Gere Renda Recorrente
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Junte-se ao programa de parceiros do Vida Smart Coach e ganhe comissões recorrentes indicando nossa IA Coach para seus seguidores ou clientes.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
              <p className="text-gray-600">Taxa de satisfação dos parceiros</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">R$ 5.000+</div>
              <p className="text-gray-600">Média mensal dos top parceiros</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">50%</div>
              <p className="text-gray-600">Comissão máxima recorrente</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              Quero Ser Parceiro
            </button>
            <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
              Agendar Demonstração
            </button>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Como Funciona a Parceria
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Cadastre-se</h3>
              <p className="text-gray-600">
                Faça seu cadastro gratuito e escolha seu tipo de parceria.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Receba Materiais</h3>
              <p className="text-gray-600">
                Acesse materiais de marketing e seu link exclusivo de indicação.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Indique e Ganhe</h3>
              <p className="text-gray-600">
                Compartilhe com sua audiência e ganhe comissão por cada cliente.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">4️⃣</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Receba Pagamentos</h3>
              <p className="text-gray-600">
                Receba suas comissões mensalmente de forma automática.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tipos de Parceiros */}
      <section id="tipos-parceiros" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Dois Tipos de Parceria
          </h2>

          {/* Tabs */}
          <div className="flex justify-center mb-12">
            <div className="bg-white rounded-lg p-1 shadow-lg">
              <button
                onClick={() => setActiveTab('influencers')}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === 'influencers'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Influencers & Afiliados
              </button>
              <button
                onClick={() => setActiveTab('profissionais')}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === 'profissionais'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Profissionais da Área
              </button>
            </div>
          </div>

          {/* Conteúdo Influencers */}
          {activeTab === 'influencers' && (
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6">
                  🌟 Parceiro Influencer
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  Ideal para influenciadores, criadores de conteúdo e pessoas com audiência que querem monetizar suas indicações.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-4">
                      <span className="text-green-600">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Comissão Recorrente</h4>
                      <p className="text-gray-600">Ganhe de 15% a 40% sobre cada cliente indicado, todo mês.</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-4">
                      <span className="text-green-600">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Materiais Prontos</h4>
                      <p className="text-gray-600">Posts, stories, vídeos e textos prontos para usar.</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-4">
                      <span className="text-green-600">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Dashboard Completo</h4>
                      <p className="text-gray-600">Acompanhe suas indicações e ganhos em tempo real.</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-4">
                      <span className="text-green-600">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Suporte Dedicado</h4>
                      <p className="text-gray-600">Equipe exclusiva para apoiar suas vendas.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h4 className="text-2xl font-bold mb-6 text-center">Estrutura de Comissões</h4>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold">Bronze</div>
                      <div className="text-sm text-gray-600">1-10 clientes</div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">15%</div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold">Prata</div>
                      <div className="text-sm text-gray-600">11-25 clientes</div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">25%</div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div>
                      <div className="font-semibold">Ouro</div>
                      <div className="text-sm text-gray-600">26-50 clientes</div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">35%</div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <div>
                      <div className="font-semibold">Diamante</div>
                      <div className="text-sm text-gray-600">51+ clientes</div>
                    </div>
                    <div className="text-xl font-bold text-purple-600">40%</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">R$ 19.600</div>
                    <div className="text-sm text-gray-600">Potencial mensal com 50 clientes</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conteúdo Profissionais */}
          {activeTab === 'profissionais' && (
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6">
                  👨‍⚕️ Parceiro Profissional
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  Para profissionais da saúde e bem-estar que querem usar nossa IA como ferramenta auxiliar e ainda ganhar comissões recorrentes.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-4">
                      <span className="text-blue-600">🎯</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Painel Profissional Exclusivo</h4>
                      <p className="text-gray-600">Acesso completo aos dados e progresso dos seus clientes indicados.</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-4">
                      <span className="text-blue-600">⚙️</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Personalização Avançada</h4>
                      <p className="text-gray-600">Configure informações específicas e metas personalizadas para cada cliente.</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-4">
                      <span className="text-blue-600">📊</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Relatórios Profissionais</h4>
                      <p className="text-gray-600">Relatórios detalhados em tempo real para otimizar suas consultas.</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-4">
                      <span className="text-blue-600">🔧</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Ferramenta Auxiliar</h4>
                      <p className="text-gray-600">IA trabalha como extensão do seu trabalho profissional.</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-4">
                      <span className="text-green-600">💰</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Mesmo Sistema de Comissões</h4>
                      <p className="text-gray-600">Ranking justo baseado em performance, não em área de atuação.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h4 className="text-2xl font-bold mb-6 text-center">Estrutura de Comissões</h4>
                <p className="text-center text-gray-600 mb-6">Sistema de ranking justo para todos os profissionais</p>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold">Bronze</div>
                      <div className="text-sm text-gray-600">1-10 clientes</div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">15%</div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold">Prata</div>
                      <div className="text-sm text-gray-600">11-25 clientes</div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">25%</div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div>
                      <div className="font-semibold">Ouro</div>
                      <div className="text-sm text-gray-600">26-50 clientes</div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">35%</div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <div>
                      <div className="font-semibold">Diamante</div>
                      <div className="text-sm text-gray-600">51+ clientes</div>
                    </div>
                    <div className="text-xl font-bold text-purple-600">40%</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">R$ 19.600</div>
                    <div className="text-sm text-gray-600">Potencial mensal com 50 clientes</div>
                    <div className="text-xs text-blue-600 mt-1">+ Acesso ao painel profissional</div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-yellow-800">🎯 Diferencial Exclusivo</div>
                    <div className="text-xs text-yellow-700">Painel profissional + personalização avançada</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Exemplos de Ganhos */}
      <section id="comissoes" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Exemplos Reais de Ganhos
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl">
              <h3 className="text-xl font-bold mb-4">Influencer Iniciante</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>15 clientes ativos</span>
                  <span className="font-semibold">Nível Prata</span>
                </div>
                <div className="flex justify-between">
                  <span>Comissão:</span>
                  <span className="font-semibold">25%</span>
                </div>
                <div className="flex justify-between">
                  <span>Ticket médio:</span>
                  <span className="font-semibold">R$ 72,90</span>
                </div>
                <hr className="border-blue-200" />
                <div className="flex justify-between text-lg font-bold text-blue-600">
                  <span>Ganho mensal:</span>
                  <span>R$ 2.734</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl">
              <h3 className="text-xl font-bold mb-4">Nutricionista</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>20 clientes ativos</span>
                  <span className="font-semibold">Profissional</span>
                </div>
                <div className="flex justify-between">
                  <span>Comissão:</span>
                  <span className="font-semibold">35%</span>
                </div>
                <div className="flex justify-between">
                  <span>Ticket médio:</span>
                  <span className="font-semibold">R$ 72,90</span>
                </div>
                <hr className="border-green-200" />
                <div className="flex justify-between text-lg font-bold text-green-600">
                  <span>Ganho mensal:</span>
                  <span>R$ 5.103</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-xl">
              <h3 className="text-xl font-bold mb-4">Coach Experiente</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>50 clientes ativos</span>
                  <span className="font-semibold">Diamante</span>
                </div>
                <div className="flex justify-between">
                  <span>Comissão:</span>
                  <span className="font-semibold">50%</span>
                </div>
                <div className="flex justify-between">
                  <span>Ticket médio:</span>
                  <span className="font-semibold">R$ 72,90</span>
                </div>
                <hr className="border-purple-200" />
                <div className="flex justify-between text-lg font-bold text-purple-600">
                  <span>Ganho mensal:</span>
                  <span>R$ 18.225</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            O Que Nossos Parceiros Dizem
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400">⭐⭐⭐⭐⭐</div>
              </div>
              <p className="text-gray-600 mb-6">
                "Como influencer fitness, sempre busquei formas de monetizar minha audiência de forma ética. Com o Vida Smart Coach, consigo oferecer valor real aos meus seguidores e ainda ganho uma renda extra de R$ 4.200/mês!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                  C
                </div>
                <div className="ml-4">
                  <p className="font-semibold">Carla Fitness</p>
                  <p className="text-sm text-gray-500">Influencer • 85k seguidores</p>
                  <p className="text-sm text-green-600 font-semibold">R$ 4.200/mês</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400">⭐⭐⭐⭐⭐</div>
              </div>
              <p className="text-gray-600 mb-6">
                "Sou nutricionista e a IA se tornou uma extensão do meu trabalho. Meus pacientes têm resultados melhores e eu ainda ganho uma renda adicional significativa. É um win-win perfeito!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                  D
                </div>
                <div className="ml-4">
                  <p className="font-semibold">Dra. Marina Oliveira</p>
                  <p className="text-sm text-gray-500">Nutricionista • CRN 12345</p>
                  <p className="text-sm text-green-600 font-semibold">R$ 6.800/mês</p>
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
            Pronto para Começar a Ganhar?
          </h2>
          
          <p className="text-xl mb-8">
            Junte-se a centenas de parceiros que já estão gerando renda recorrente com o Vida Smart Coach.
          </p>

          <div className="bg-white/10 p-6 rounded-xl mb-8">
            <h3 className="text-xl font-semibold mb-4">Comece Hoje Mesmo:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Cadastro gratuito em 2 minutos
              </div>
              <div className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Materiais de marketing prontos
              </div>
              <div className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Treinamento completo incluído
              </div>
              <div className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Suporte dedicado para parceiros
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
              Quero Ser Parceiro Agora
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-colors">
              Agendar Demonstração
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Vida Smart Coach</h3>
              <p className="text-gray-400">
                Programa de parceiros com as melhores comissões do mercado.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Parceiros</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#como-funciona" className="hover:text-white">Como Funciona</a></li>
                <li><a href="#tipos-parceiros" className="hover:text-white">Tipos de Parceiros</a></li>
                <li><a href="#comissoes" className="hover:text-white">Comissões</a></li>
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
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white">Política de Privacidade</a></li>
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

