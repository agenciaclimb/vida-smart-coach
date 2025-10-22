# DOCUMENTO MESTRE - VIDA SMART COACH

## 1. Visão Geral do Projeto

### 1.1. Nome e Descrição do Sistema

*   **Nome do Sistema:** Vida Smart Coach
*   **Descrição:** O Vida Smart Coach é um sistema de coaching de vida baseado em inteligência artificial, focado em auxiliar usuários em pilares físico, alimentar, emocional e espiritual. Ele oferece uma experiência personalizada através de interações via web e WhatsApp, utilizando LLMs para fornecer orientação e suporte contínuos. O objetivo é promover a melhoria contínua e a aceleração de resultados para o usuário, com um processo de desenvolvimento e aprimoramento do sistema guiado por IAs autônomas.

### 1.2. Objetivos e Escopo

*   **Objetivos de Negócio:**
    *   Promover a saúde e bem-estar dos usuários através de coaching personalizado.
    *   Aumentar o engajamento e a retenção de usuários com funcionalidades interativas e gamificação.
    *   Oferecer um sistema escalável e eficiente, capaz de atender a uma base crescente de usuários.
    *   Garantir a entrega contínua de valor e aprimoramento do produto através de um ciclo de desenvolvimento ágil e automatizado.
*   **Objetivos Técnicos:**
    *   Manter uma arquitetura serverless e baseada em microsserviços para alta disponibilidade e escalabilidade.
    *   Assegurar a integração fluida e eficiente entre diferentes LLMs e serviços externos (WhatsApp, pagamentos).
    *   Garantir a segurança e privacidade dos dados dos usuários.
    *   Otimizar o processo de desenvolvimento por IA, tornando-o transparente e rastreável.
*   **Escopo:** O sistema inclui funcionalidades de interação com IA via web e WhatsApp, gerenciamento de planos de coaching, gamificação (pontos, recompensas, progressão), autenticação de usuários e processamento de pagamentos. Exclui a gestão de conteúdo humano direto e suporte técnico de primeiro nível.

### 1.3. Stakeholders Principais

*   **Product Owner:** Define a visão do produto e prioriza o backlog.
*   **Equipe de Desenvolvimento (IAs e Humanos):** Responsável pela implementação técnica e manutenção do sistema.
*   **Especialistas em IA/ML:** Responsáveis pela concepção, treinamento e otimização dos modelos de IA.
*   **Usuários Finais:** Indivíduos buscando coaching e melhoria de vida.
*   **Equipe de Negócios/Marketing:** Responsável pela aquisição e engajamento de usuários.

### 1.3.1. Estado Atual do Sistema (Outubro 2025)

**Funcionalidades em Produção:**
*   ✅ **IA Coach Conversacional (4 estágios):** SDR → Specialist → Seller → Partner
*   ✅ **Integração WhatsApp:** Via Evolution API com detecção de emergências e anti-duplicação
*   ✅ **Geração de Planos Personalizados:** 4 pilares (Físico, Nutricional, Emocional, Espiritual)
*   ✅ **Sistema de Gamificação:** Pontos, níveis, conquistas, daily activities
*   ✅ **Autenticação de Usuários:** Supabase Auth com RLS
*   ✅ **Dashboard do Cliente:** Visualização de planos, progresso e gamificação
*   ✅ **Processamento de Pagamentos:** Integração Stripe (webhook simplificado)

**Últimas Melhorias Implementadas (22/10/2025):**
*   Visual melhorado dos planos com gradientes e accordions
*   Sistema de feedback do usuário nos planos
*   Activity Key enforcement para evitar duplicatas de gamificação
*   Correção de bugs críticos na IA Coach (Specialist stage)

**Próximas Prioridades (Sprint 1 - 23/10 a 06/11):**
*   P0: Checkboxes de conclusão para exercícios/refeições/práticas
*   P0: Progress tracking visual (% completado)
*   P0: Loop de feedback → IA (integração completa)
*   P0: IA proativa sugerindo itens específicos dos planos

---

**REGISTRO DE CICLO DE TRABALHO - 22/10/2025**

**✅ TAREFA P0 CONCLUÍDA:** Implementação de Checkboxes de Conclusão para Exercícios/Refeições/Práticas  
**Objetivo:** Criar sistema de checkboxes interativos nos planos (Físico, Nutricional, Emocional, Espiritual) para permitir que usuários marquem itens como concluídos, integrando com sistema de gamificação (+5 a +10 XP por item).  
**Status:** ✅ CONCLUÍDO  
**Hora de Início:** 22/10/2025 - Ciclo 1  
**Hora de Conclusão:** 22/10/2025 - Ciclo 1

**IMPLEMENTAÇÃO REALIZADA:**

1. ✅ **Migration SQL Criada e Aplicada:**
   - Arquivo: `supabase/migrations/20251023_create_plan_completions.sql`
   - Tabela: `plan_completions` com RLS policies
   - Campos: user_id, plan_type, item_type, item_identifier, completed_at, points_awarded
   - Unique constraint: (user_id, plan_type, item_identifier)
   - Executada via `node scripts/run_sql_file.js`

2. ✅ **Hook Customizado:**
   - Arquivo: `src/hooks/usePlanCompletions.js`
   - Funções: toggleCompletion, isItemCompleted, getStats, reload
   - Integração automática com Supabase
   - Estado gerenciado via Map para performance O(1)

3. ✅ **Componente de UI com Animação:**
   - Arquivo: `src/components/client/CompletionCheckbox.jsx`
   - Animações com framer-motion (scale, fade, spring)
   - Visual feedback: CheckCircle2 icon + "+X XP" badge
   - Estados: checked, disabled, hover, tap

4. ✅ **Integração nos 4 Planos:**
   - **PhysicalPlanDisplay:** Checkboxes em exercícios (10 XP cada)
   - **NutritionalPlanDisplay:** Checkboxes em itens de refeições (5 XP cada)
   - **EmotionalPlanDisplay:** Checkboxes em rotinas diárias (8 XP cada)
   - **SpiritualPlanDisplay:** Checkboxes em práticas diárias (8 XP cada)

5. ✅ **Sistema de Pontuação:**
   - Exercícios físicos: 10 XP
   - Itens nutricionais: 5 XP
   - Rotinas emocionais: 8 XP
   - Práticas espirituais: 8 XP
   - Toast notification: "+X XP! 🎉" ao completar

6. ✅ **Validação:**
   - TypeScript: ✅ Sem erros (pnpm exec tsc --noEmit)
   - Migration: ✅ Executada com sucesso
   - Imports: ✅ Todos os componentes integrados
   - RLS: ✅ Usuários veem apenas suas completions

**ARQUITETURA IMPLEMENTADA:**

```
Frontend (PlanTab.jsx)
    ↓
usePlanCompletions Hook
    ↓
CompletionCheckbox Component
    ↓
Supabase (plan_completions table)
    ↓
RLS Policies (security)
```

**DESCOBERTAS DURANTE IMPLEMENTAÇÃO:**
- ✅ PlanTab.jsx usa Accordion pattern (shadcn/ui) para todos os planos
- ✅ useAuth já disponível para pegar user.id
- ✅ toast (react-hot-toast) já configurado
- ✅ framer-motion já instalado e importado
- ✅ Estrutura de dados dos planos: weeks → workouts → exercises (Physical)
- ✅ Estrutura: meals → items (Nutritional)
- ✅ Estrutura: daily_routines, techniques (Emotional)
- ✅ Estrutura: daily_practices, reflection_prompts (Spiritual)

**PRÓXIMOS PASSOS (Sprint 1 - P0):**
- 🔄 **Próxima Tarefa P0:** Visualização de progresso semanal/mensal com gráficos
- ⏭️ **Pendente:** Sistema de conquistas visuais (badges)
- ⏭️ **Pendente:** Notificações de check-ins diários

**REGISTRO DE CICLO DE TRABALHO - 23/10/2025**

**✅ TAREFA P0 CONCLUÍDA (Parte de Progresso):** Visualização semanal/mensal de conclusões e XP
**Objetivo:** Exibir gráficos com contagem diária de itens concluídos por pilar e XP acumulado, com seleção de período (7d/30d).
**Status:** ✅ CONCLUÍDO
**Hora de Início:** 23/10/2025 - Ciclo 1
**Hora de Conclusão:** 23/10/2025 - Ciclo 1

**IMPLEMENTAÇÃO REALIZADA:**

1. ✅ Hook de agregação
    - Arquivo: `src/hooks/useCompletionStats.js`
    - Consulta `plan_completions` e agrega por dia e tipo (physical, nutritional, emotional, spiritual) + soma de XP
    - Suporte a intervalos `7d` e `30d`

2. ✅ Componente de gráficos
    - Arquivo: `src/components/client/CompletionProgress.jsx`
    - Gráfico de barras empilhadas (itens/dia por pilar) e área (XP/dia)
    - KPIs: total de itens, XP no período, melhor dia
    - Alternador de período (Tabs 7d/30d)

3. ✅ Integração no Dashboard
    - Arquivo: `src/components/client/DashboardTab.jsx`
    - Seção adicionada abaixo de "Seu Progresso" (métricas de peso/humor/sono)

**Validações:**
- Build: PASS (pnpm build)
- Tipos/Lint: sem erros relacionados às alterações

**Observações:**
- Fonte de dados: `plan_completions` (completions criadas pelos checkboxes dos planos)
- O componente é auto-contido (possui Card próprio) e pode ser reutilizado na aba de Gamificação, se desejado

**APRENDIZADOS:**
- Sistema modular facilita integração em múltiplos displays
- Map() em useState oferece performance superior a arrays para lookups
- framer-motion spring animations criam feedback tátil satisfatório
- RLS policies garantem segurança sem lógica frontend adicional

**Documentação de Histórico e Logs Detalhados:**
Para acessar o histórico completo de desenvolvimento, bugs corrigidos e logs operacionais, consulte:
*   [`docs/documento_mestre_vida_smart_coach_HISTORICO.md`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/docs/documento_mestre_vida_smart_coach_HISTORICO.md) - Logs detalhados de 2024-2025
*   [Commits do GitHub](https://github.com/agenciaclimb/vida-smart-coach/commits/main) - Histórico completo de alterações

### 1.4. Glossário de Termos Técnicos e de Negócio

*   **P0 (Crítico):** Item que bloqueia operação ou causa risco direto ao produto. Exige ação imediata; pode permanecer em estado BLOQUEADO quando depende de terceiros (ex.: rotação de segredos).
*   **P1 (Alto):** Necessário para estabilidade ou entrega no curto prazo. Normalmente aborda melhorias estruturais, documentação e testes complementares.
*   **P2 (Moderado):** Otimizações, tarefas de longo prazo ou melhorias que não impedem a operação atual.
*   **BANT:** Metodologia comercial utilizada para qualificar leads avaliando Budget, Authority, Need e Timing.
*   **SPIN:** Abordagem consultiva baseada em Situation, Problem, Implication e Need-Payoff. Usada para direcionar perguntas das etapas SDR e Especialista.
*   **Estágios da IA Coach:**
    *   `sdr` (Sales Development Representative) foca em acolher e entender o problema principal.
    *   `specialist` aprofunda diagnóstico em pilares físico, alimentar, emocional e espiritual.
    *   `seller` conduz para oferta do teste grátis de 7 dias.
    *   `partner` acompanha check-ins diários e consolidação de resultados.
*   **LLM (Large Language Model):** Modelo de linguagem grande, como GPT-4o, Gemini, etc.
*   **Prompt Engineering:** A arte e a ciência de projetar entradas para modelos de linguagem para obter os resultados desejados.
*   **Fine-tuning:** Processo de adaptar um modelo de IA pré-treinado para uma tarefa específica com um novo conjunto de dados.

## 2. Ferramentas e Ambiente de Desenvolvimento

Esta seção detalha o ecossistema de ferramentas e plataformas utilizadas no desenvolvimento do sistema Vida Smart Coach, com foco na integração de inteligências artificiais e automação.

### 2.1. Plataformas de Gerenciamento de Projeto e Planejamento

*   **Manus:** Utilizado para planejamento estratégico de alto nível, definição de objetivos, criação de planos de ação detalhados e acompanhamento do progresso das fases do projeto. O Manus atua como o **Agente de Planejamento Mestre**, traduzindo requisitos de alto nível em tarefas acionáveis para os agentes de desenvolvimento.

### 2.2. Controle de Versão e Repositórios

*   **GitHub:** Plataforma central para controle de versão do código-fonte, colaboração entre desenvolvedores, gerenciamento de Pull Requests (PRs), issues e CI/CD. Todos os artefatos de código, incluindo prompts de IA e modelos, são versionados aqui.

### 2.3. Infraestrutura de Backend e Banco de Dados

*   **Supabase:** Backend-as-a-Service (BaaS) que oferece um banco de dados PostgreSQL, autenticação, armazenamento de arquivos e funções *serverless* (Edge Functions). É a espinha dorsal para o armazenamento de dados do sistema e a execução de lógica de backend, ideal para prototipagem rápida e escalabilidade.

### 2.4. Plataformas de Deployment e Hosting

*   **Vercel:** Utilizado para o deployment contínuo (CI/CD) de aplicações frontend e funções *serverless* (Edge Functions). Proporciona alta performance, escalabilidade global e integração simplificada com o GitHub para deployments automáticos a cada commit na branch principal.

### 2.5. Ambiente de Desenvolvimento Integrado (IDE) e Ferramentas de IA

*   **VS Code:** O IDE principal para o desenvolvimento. Configurado com extensões para TypeScript/JavaScript, React, Tailwind CSS, e integrações diretas com as ferramentas de IA.
*   **Codex (Função Role no VS Code):** Atua como um Agente de Software Sênior Autônomo para tarefas de desenvolvimento, utilizando o Documento Mestre como sua "fonte única de verdade" e log de operações. Ele segue um ciclo operacional de "Analisar -> Registrar Intenção -> Executar -> Registrar Resultado" para garantir a execução sistemática das tarefas.
*   **Gemini (Função Role no VS Code):** Utilizado para tarefas que exigem maior raciocínio, compreensão de contexto complexo, geração de código mais criativo ou refatoração inteligente. Pode ser invocado para revisar o código gerado pelo GitHub Copilot ou para auxiliar na arquitetura de soluções.
*   **GitHub Copilot (Função Role no VS Code):** Atua como um assistente de codificação em tempo real, gerando sugestões de código, completando linhas e blocos de código com base no contexto. Aumenta a produtividade do desenvolvedor e acelera a implementação de funcionalidades.

### 2.6. APIs e Serviços Externos

*   **OpenAI / Gemini (LLMs):** Plataformas que fornecem acesso a modelos de linguagem grandes (LLMs) para as funcionalidades centrais do sistema, como processamento de linguagem natural, geração de texto, sumarização, tradução, etc. A escolha entre OpenAI e Gemini é baseada nas necessidades específicas de cada módulo do sistema (custo, performance, capacidade).
*   **Evolution API (WhatsApp):** Uma API para integração com o WhatsApp, permitindo que o sistema envie e receba mensagens, gerencie conversas e automatize interações com usuários através do canal WhatsApp. Essencial para sistemas que requerem comunicação multi-canal.
*   **Stripe (Pagamentos):** Plataforma de processamento de pagamentos para gerenciar transações financeiras, assinaturas e faturamento dentro do sistema. Fornece ferramentas robustas e seguras para lidar com a lógica de pagamentos.

## 3. Arquitetura e Componentes de IA

Esta seção descreve a arquitetura geral do sistema Vida Smart Coach, com foco nos componentes de Inteligência Artificial e como eles se integram para entregar as funcionalidades do produto.

### 3.1. Visão Geral da Arquitetura do Sistema

O sistema Vida Smart Coach adota uma arquitetura **serverless e baseada em microsserviços**, aproveitando as capacidades do Supabase e Vercel para escalabilidade, resiliência e baixo custo operacional. A interação com os LLMs é central, e a arquitetura é projetada para ser flexível, acomodando diferentes modelos e provedores.

**Componentes Principais:**

*   **Frontend (Vercel):** Interface do usuário desenvolvida em React/Next.js, hospedada na Vercel. Responsável por interagir com o backend via APIs e exibir as informações processadas pela IA.
*   **Backend (Supabase Edge Functions / APIs):** Lógica de negócio, autenticação, gerenciamento de dados e orquestração das chamadas aos LLMs. Implementado via Supabase Edge Functions (Deno) para latência mínima e escalabilidade. Exemplos incluem `ia-coach-chat` e `evolution-webhook`.
*   **Banco de Dados (Supabase PostgreSQL):** Armazenamento de dados estruturados, incluindo perfis de usuário, históricos de interação com a IA, configurações e outros dados relevantes para o sistema. Utiliza as capacidades do PostgreSQL para garantir integridade e performance.
*   **Serviços de IA (OpenAI/Gemini):** Os modelos de linguagem grandes (LLMs) são consumidos via APIs. A arquitetura prevê um *layer* de abstração para facilitar a troca entre diferentes provedores (OpenAI, Gemini) e modelos (gpt-4o-mini, gpt-4o, etc.) conforme a necessidade e otimização de custo/performance.
*   **Serviços de Mensageria (Evolution API):** Integração com WhatsApp para comunicação multi-canal. A Evolution API atua como um gateway, roteando mensagens de entrada para o backend e enviando respostas geradas pela IA.
*   **Serviços de Pagamento (Stripe):** Gerenciamento de assinaturas, pagamentos e faturamento. Integrado ao backend para processar transações de forma segura.

### 3.2. Componentes de Inteligência Artificial (LLMs, Modelos Específicos)

O sistema Vida Smart Coach faz uso estratégico de diferentes modelos de LLM, selecionados com base na tarefa específica, custo e requisitos de performance. A flexibilidade para alternar ou combinar modelos é crucial.

| Estágio/Tarefa | Modelo OpenAI/Gemini Recomendado | Justificativa |
| :------------- | :------------------------------- | :------------ |
| **Geração de Conteúdo Criativo / Respostas Complexas** | `gpt-4o` / `gemini-1.5-pro` | Modelos mais avançados para tarefas que exigem raciocínio complexo, criatividade, compreensão profunda de contexto e geração de textos longos e de alta qualidade. Ideal para funcionalidades centrais do sistema que demandam inteligência superior. |
| **Sumarização / Extração de Informações / Classificação** | `gpt-4o-mini` / `gemini-1.5-flash` | Modelos otimizados para velocidade e custo, adequados para tarefas de processamento de texto mais diretas e de menor complexidade. Ideal para pré-processamento de entradas, filtragem ou respostas rápidas. |
| **Interações Conversacionais de Baixa Latência** | `gpt-4o-mini` / `gemini-1.5-flash` | Priorizam a velocidade de resposta para manter a fluidez da conversa, onde a profundidade da resposta pode ser ligeiramente sacrificada em prol da agilidade. Atualmente, `gpt-4o-mini` é o modelo padrão para todas as etapas do IA Coach. |
| **Expansões de Modelo** | `Claude 3 Haiku` (em avaliação) | Modelos adicionais estão em avaliação para complementar as capacidades existentes, oferecendo alternativas e otimizações futuras. |

### 3.3. Fluxo de Dados e Interações entre Componentes

1.  **Entrada do Usuário:** O usuário interage com o Frontend (Web) ou via Evolution API (WhatsApp).
2.  **Roteamento:** As requisições são roteadas para a Supabase Edge Function apropriada (ex: `ia-coach-chat`).
3.  **Processamento no Backend:** A função de backend recupera o histórico da conversa e o perfil do usuário do banco de dados (Supabase PostgreSQL).
4.  **Orquestração da IA:** Com base no estágio da conversa, o backend seleciona o modelo de LLM apropriado e constrói o prompt, combinando o histórico da conversa, o perfil do usuário e as diretrizes de Prompt Engineering.
5.  **Geração da Resposta:** A resposta do LLM é recebida, processada (se necessário) e armazenada no banco de dados.
6.  **Entrega ao Usuário:** A resposta é enviada de volta ao usuário via Frontend ou Evolution API.

### 3.4. Prompt Engineering e Personalidade da IA

A personalidade do Agente IA Vida Smart Coach é definida por um conjunto de valores e diretrizes que são incorporados aos prompts de sistema. Isso garante que a IA se comporte de maneira consistente, empática e alinhada com os objetivos do produto.

*   **Valores Core do Agente:** Empatia, autenticidade, expertise, inspiração, segurança.
*   **Técnicas de Prompt Engineering:**
    *   **Persona Definition:** Definir claramente a persona que o LLM deve adotar (ex: "Você é um coach de vida experiente e empático") para garantir a consistência do tom e estilo.
    *   **Restrições e Guardrails:** Incluir instruções explícitas sobre o que o LLM *não* deve fazer ou quais tópicos evitar, para garantir segurança e conformidade.
    *   **Iteração e Otimização:** Prompts serão continuamente testados, avaliados e otimizados com base no feedback dos usuários e métricas de desempenho. Ferramentas de versionamento de prompts serão utilizadas para gerenciar as iterações.

**Exemplos de Estrutura de Prompts por Estágio:**

**SDR (Sales Development Representative):**
```
Sistema: Você é um coach de saúde empático e experiente. Use SPIN Selling (Situation, Problem, Implication, Need-Payoff) para entender a situação do usuário. Seja acolhedor, faça perguntas abertas, mostre empatia genuína. NUNCA ofereça soluções prematuras.

Objetivo: Identificar dor principal e área de foco inicial.
Tom: Conversacional, empático, curioso.
```

**Specialist:**
```
Sistema: Você é um especialista em bem-estar holístico. Diagnostique profundamente nos 4 pilares: físico, nutricional, emocional e espiritual. Use perguntas específicas e técnicas. Identifique padrões e causas raízes.

Objetivo: Diagnóstico completo e priorização de áreas.
Tom: Profissional, técnico mas acessível, analítico.
```

**Seller:**
```
Sistema: Você é um consultor de saúde que oferece soluções personalizadas. Apresente o teste gratuito de 7 dias como solução para as dores identificadas. Seja persuasivo mas respeitoso.

Objetivo: Conversão para teste gratuito.
Tom: Confiante, orientado a solução, não-pushy.
```

**Partner:**
```
Sistema: Você é o parceiro de accountability do usuário na jornada de transformação. Acompanhe check-ins diários, celebre conquistas, ofereça suporte em dificuldades. Seja motivacional mas realista.

Objetivo: Engajamento diário e consolidação de hábitos.
Tom: Encorajador, pessoal, celebrativo, accountability.
```

**JSON Schema para Geração de Planos:**
```json
{
  "type": "object",
  "properties": {
    "planType": { "type": "string", "enum": ["physical", "nutritional", "emotional", "spiritual"] },
    "duration": { "type": "number" },
    "weeks": { "type": "array" },
    "goals": { "type": "array" },
    "recommendations": { "type": "array" }
  },
  "required": ["planType", "duration", "weeks"]
}
```

## 4. Fluxo de Trabalho e Metodologia com IAs

### 4.1. Modelos de Prompts e Prompt Engineering

Para garantir a consistência e a eficácia das interações com os LLMs, todos os prompts de sistema e de usuário são versionados e gerenciados diretamente no código-fonte das Edge Functions.

*   **Localização dos Prompts:**
    *   **IA Coach (4 estágios):** [`supabase/functions/ia-coach-chat/index.ts`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/functions/ia-coach-chat/index.ts)
        *   **SDR (Sales Development Representative):** Prompts com metodologia SPIN Selling para identificar dores e necessidades
        *   **Specialist:** Prompts focados em diagnóstico profundo nos 4 pilares (físico, nutricional, emocional, espiritual)
        *   **Seller:** Prompts para conduzir à oferta de teste gratuito de 7 dias
        *   **Partner:** Prompts para acompanhamento diário, check-ins e consolidação de resultados
    *   **Geração de Planos:** [`supabase/functions/generate-plan/index.ts`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/functions/generate-plan/index.ts)
    *   **Webhook WhatsApp:** [`supabase/functions/evolution-webhook/index.ts`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/functions/evolution-webhook/index.ts)

*   **Diretrizes de Prompt Engineering:**
    *   **Clareza e Contexto:** Os prompts devem ser claros, concisos e fornecer todo o contexto necessário para a IA executar a tarefa.
    *   **Role-Playing:** Utilizar a técnica de role-playing (ex: "Você é um especialista em nutrição...") para guiar o comportamento da IA.
    *   **Exemplos (Few-shot):** Fornecer exemplos de entrada e saída esperada para tarefas complexas.
    *   **JSON Schema:** Para funcionalidades que exigem saída estruturada (ex: geração de planos), utilizar `response_format: { type: "json_object" }` e especificar schema no prompt.
    *   **Testes e Validação:** Todos os prompts devem ser testados e validados antes de serem implantados em produção.
    *   **Scripts de Teste:** [`scripts/test_ia_coach_real.mjs`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/scripts/test_ia_coach_real.mjs), [`scripts/debug_ia_coach.js`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/scripts/debug_ia_coach.js)

### 4.2. Padrões de Código e Diretrizes para IAs

Para garantir a consistência, qualidade e manutenibilidade do código gerado pelos agentes de IA, bem como a facilidade de colaboração com desenvolvedores humanos, os seguintes padrões e diretrizes devem ser seguidos:

*   **Convenções de Nomenclatura:** Adotar padrões claros para variáveis, funções, classes e arquivos (ex: `camelCase` para variáveis, `PascalCase` para classes, `kebab-case` para arquivos).
*   **Estrutura de Arquivos e Pastas:** Manter uma organização lógica e consistente do projeto, facilitando a localização de componentes e a compreensão da arquitetura.
*   **Documentação Inline:** O código deve ser auto-documentado sempre que possível, com comentários claros para lógica complexa, APIs e interfaces.
*   **Testes Unitários e de Integração:** Priorizar a escrita de testes automatizados para garantir a funcionalidade e prevenir regressões. Agentes de IA devem ser instruídos a gerar testes junto com o código.
*   **Princípios SOLID:** Aplicar princípios de design de software (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion) para promover código modular e extensível.
*   **Segurança:** Implementar práticas de codificação segura, evitando vulnerabilidades comuns (ex: injeção SQL, XSS, exposição de segredos).

**Gerenciamento de Tarefas e Issues:**

*   **GitHub Issues e Projects:** Todas as tarefas granulares são gerenciadas como *issues* no GitHub, organizadas em projetos para facilitar o acompanhamento do progresso.
*   **Quadro de Issues Ativo:** [https://github.com/agenciaclimb/vida-smart-coach/issues](https://github.com/agenciaclimb/vida-smart-coach/issues)
*   **Projetos do GitHub:** [https://github.com/agenciaclimb/vida-smart-coach/projects](https://github.com/agenciaclimb/vida-smart-coach/projects)
*   **Critérios de Aceitação:** Cada *issue* deve conter critérios de aceitação claros, dependências identificadas e estimativa de esforço.
*   **Labels e Priorização:** Utilizar labels para categorizar issues (P0/P1/P2, bug, feature, documentation) e facilitar a priorização.

### 4.3. Ciclo de Desenvolvimento Iterativo com Agentes de IA

O desenvolvimento do Vida Smart Coach segue um ciclo contínuo e iterativo, onde o **Documento Mestre** atua como a fonte única de verdade e o registro central de todas as operações e decisões. Este ciclo é impulsionado por agentes de IA que colaboram para analisar, planejar, executar e validar tarefas.

**Ciclo Operacional Básico:**

1.  **Análise (Manus):** O Agente de Planejamento Mestre (Manus) analisa os requisitos de alto nível e as metas do projeto.
2.  **Planejamento (Manus):** O Manus cria um plano de ação detalhado, quebrando os requisitos em tarefas acionáveis para os agentes de desenvolvimento.
3.  **Execução (VS Code - Codex, Gemini, GitHub Copilot):** Os agentes de desenvolvimento no VS Code executam as tarefas, gerando código, testes e documentação, seguindo os padrões e diretrizes estabelecidos.
4.  **Registro (GitHub):** Todas as alterações de código são versionadas no GitHub através de commits e Pull Requests.
5.  **Validação (CI/CD - Vercel):** O Vercel realiza o deployment contínuo, executando testes automatizados e disponibilizando o ambiente de validação.
6.  **Feedback:** O feedback dos testes e da validação é usado para refinar o planejamento e as próximas iterações.

## 5. Implantação, Operação e Segurança

### 5.1. Estratégia de CI/CD

*   **Integração Contínua (CI):** A cada commit na branch principal, o GitHub Actions executa testes automatizados (unitários, de integração) para garantir a qualidade do código.
*   **Deployment Contínuo (CD):** Após a aprovação dos testes, o Vercel realiza o deployment automático da aplicação para o ambiente de produção.

### 5.2. Monitoramento e Logs

*   **Monitoramento de Performance:** Utilização das ferramentas de monitoramento da Vercel e do Supabase para acompanhar a performance da aplicação, o uso de recursos e a latência das APIs.
*   **Logs de Erro:** Centralização dos logs de erro em uma plataforma de observabilidade (ex: Sentry, Logtail) para facilitar a depuração e a identificação de problemas.

### 5.3. Gerenciamento de Segredos e Credenciais

*   **Armazenamento Seguro:** Todas as chaves de API, senhas e outras credenciais são armazenadas de forma segura como segredos no Supabase e no Vercel, e nunca são hard-coded no código-fonte.
*   **Rotação de Segredos:** A rotação de segredos foi realizada e está em conformidade com as melhores práticas de segurança.

### 5.4. Segurança da Aplicação

*   **Autenticação e Autorização:** Utilização do sistema de autenticação do Supabase para gerenciar o acesso dos usuários e proteger os dados.
*   **Validação de Entrada:** Todas as entradas do usuário são validadas no backend para prevenir ataques de injeção e outras vulnerabilidades.
*   **Políticas de Segurança:** Implementação de políticas de segurança, como CSP (Content Security Policy) e CORS (Cross-Origin Resource Sharing), para proteger a aplicação contra ataques comuns.

## 6. Roadmap de Desenvolvimento

### 6.1. Especificações Técnicas Detalhadas

Para o detalhamento técnico das funcionalidades de gamificação e IA preditiva, consulte os documentos e arquivos específicos no repositório:

*   **Roadmap UX/UI e Gamificação:**
    *   [`PLANO_ACAO_UX_GAMIFICACAO.md`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/PLANO_ACAO_UX_GAMIFICACAO.md) - Plano técnico completo com sprints, código e migrations
    *   [`RESUMO_EXECUTIVO_ROADMAP.md`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/RESUMO_EXECUTIVO_ROADMAP.md) - Visão executiva e estratégia
    *   [`CHECKLIST_ROADMAP.md`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/CHECKLIST_ROADMAP.md) - Tracking operacional de sprints
    *   [`TEMPLATES_CODIGO.md`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/TEMPLATES_CODIGO.md) - Código pronto para implementação

*   **Migrations e Schema do Banco de Dados:**
    *   **Gamificação:** [`supabase/migrations/20240916000001_enhance_gamification_system.sql`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/migrations/20240916000001_enhance_gamification_system.sql)
    *   **IA Coach:** [`supabase/migrations/20251015020000_create_ia_coach_strategic_system_final.sql`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/migrations/20251015020000_create_ia_coach_strategic_system_final.sql)
    *   **Planos:** [`supabase/migrations/20250915200000_create_user_training_plans.sql`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/migrations/20250915200000_create_user_training_plans.sql)
    *   **Activity Key Enforcement:** [`supabase/migrations/20251019180500_add_activity_key_enforcement.sql`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/migrations/20251019180500_add_activity_key_enforcement.sql)

*   **Componentes React Principais:**
    *   **Planos:** [`src/components/client/PlanTab.jsx`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/src/components/client/PlanTab.jsx)
    *   **Gamificação:** [`src/components/client/GamificationTab.jsx`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/src/components/client/GamificationTab.jsx)
    *   **Dashboard:** [`src/components/client/Dashboard.jsx`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/src/components/client/Dashboard.jsx)

*   **Contexts (State Management):**
    *   **Planos:** [`src/contexts/data/PlansContext.jsx`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/src/contexts/data/PlansContext.jsx)
    *   **Gamificação:** [`src/contexts/data/GamificationContext.jsx`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/src/contexts/data/GamificationContext.jsx)
    *   **Autenticação:** [`src/contexts/AuthContext.jsx`](https://github.com/agenciaclimb/vida-smart-coach/blob/main/src/contexts/AuthContext.jsx)

*   **Especificações Futuras (Roadmap):**
    *   **Loja de Recompensas:** Modelos de dados, lógica de resgate e integração com pagamentos (Sprint 3-4)
    *   **Sistema de Narrativa e Jornada do Herói:** Modelos de dados, lógica de progressão e gatilhos (Sprint 3-4)
    *   **Desafios e Eventos Temporários:** Modelos de dados, lógica de participação e gerenciamento (Sprint 5-6)
    *   **Sistema de Comparação Social:** Formação de grupos, ranking e mensagens motivacionais (Sprint 5-6)
    *   **IA Preditiva e Visualizações Avançadas:** Modelos de ML, fontes de dados e requisitos (Sprint 7-10)

### 6.2. Fases do Projeto e Marcos Principais

O roadmap de desenvolvimento está dividido em fases estratégicas, com marcos claros para guiar o progresso:

1.  **Harmonização e Limpeza do Documento Mestre:**
    *   **Marcos:**
        *   Remoção de logs detalhados e informações de depuração do corpo principal do documento.
        *   Padronização da nomenclatura e formatação.
        *   Criação de um glossário de termos técnicos e de negócio.
    *   **Resultados Esperados:** Documento Mestre conciso, claro, de fácil leitura e manutenção, servindo como fonte de verdade de alto nível.

2.  **Implementação de Melhorias UX/UI e Gamificação (Roadmap UX/UI e Gamificação):**
    *   **Marcos:**
        *   **NÍVEL 1: Quick Wins (1-2 semanas):** Implementação de *checkboxes* de conclusão, *progress tracking* visual, animações e micro-interações, *streak counter* e *toast notifications*.
        *   **NÍVEL 2: Game Changers (2-4 semanas):** Desenvolvimento de loja de recompensas, narrativa de jornada (5 *tiers*), desafios temporários e círculos sociais saudáveis.
        *   **NÍVEL 3: Inovações (4-8 semanas):** Implementação de IA proativa, *feedback loop* com IA, personalização avançada e sistema de reputação.
    *   **Resultados Esperados:** Aumento do engajamento e retenção de usuários, com uma experiência mais interativa e recompensadora.

3.  **Aprimoramento da Inteligência do Agente de IA:**
    *   **Marcos:**
        *   Implementação de um sistema de gerenciamento de prompts versionado.
        *   Desenvolvimento de um framework para A/B testing de diferentes prompts e modelos de LLM.
        *   Integração de um sistema de feedback do usuário para refinar as respostas da IA.
    *   **Resultados Esperados:** Melhoria contínua da qualidade das interações da IA, com respostas mais precisas, personalizadas e eficazes.

4.  **Expansão e Escalabilidade:**
    *   **Marcos:**
        *   Otimização da performance das Supabase Edge Functions e consultas ao banco de dados.
        *   Implementação de caching para respostas frequentes da IA.
        *   Avaliação e integração de novos modelos de LLM para otimização de custo e performance.
    *   **Resultados Esperados:** Sistema mais robusto, escalável e eficiente, capaz de suportar um número crescente de usuários com alta performance.

## 7. Referências e Anexos

*   **Repositório Principal do Projeto:** [https://github.com/agenciaclimb/vida-smart-coach](https://github.com/agenciaclimb/vida-smart-coach)

*   **Documentação Estratégica:**
    *   [Plano de Ação UX/UI e Gamificação](https://github.com/agenciaclimb/vida-smart-coach/blob/main/PLANO_ACAO_UX_GAMIFICACAO.md)
    *   [Resumo Executivo do Roadmap](https://github.com/agenciaclimb/vida-smart-coach/blob/main/RESUMO_EXECUTIVO_ROADMAP.md)
    *   [Checklist de Roadmap](https://github.com/agenciaclimb/vida-smart-coach/blob/main/CHECKLIST_ROADMAP.md)
    *   [Templates de Código](https://github.com/agenciaclimb/vida-smart-coach/blob/main/TEMPLATES_CODIGO.md)

*   **Edge Functions (Supabase):**
    *   [IA Coach Chat - Função Principal](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/functions/ia-coach-chat/index.ts)
    *   [Evolution Webhook - Integração WhatsApp](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/functions/evolution-webhook/index.ts)
    *   [Generate Plan - Geração de Planos](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/functions/generate-plan/index.ts)
    *   [Todas as Edge Functions](https://github.com/agenciaclimb/vida-smart-coach/tree/main/supabase/functions)

*   **Schema e Migrations do Banco de Dados:**
    *   [Diretório de Migrations](https://github.com/agenciaclimb/vida-smart-coach/tree/main/supabase/migrations)
    *   [Gamificação - Sistema Completo](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/migrations/20240916000001_enhance_gamification_system.sql)
    *   [IA Coach - Sistema Estratégico](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/migrations/20251015020000_create_ia_coach_strategic_system_final.sql)
    *   [Planos Personalizados](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/migrations/20250915200000_create_user_training_plans.sql)
    *   [Activity Key Enforcement](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/migrations/20251019180500_add_activity_key_enforcement.sql)

*   **Componentes React e Frontend:**
    *   [Diretório de Componentes](https://github.com/agenciaclimb/vida-smart-coach/tree/main/src/components)
    *   [PlanTab - Visualização de Planos](https://github.com/agenciaclimb/vida-smart-coach/blob/main/src/components/client/PlanTab.jsx)
    *   [GamificationTab - Sistema de Pontos](https://github.com/agenciaclimb/vida-smart-coach/blob/main/src/components/client/GamificationTab.jsx)
    *   [Dashboard - Painel Principal](https://github.com/agenciaclimb/vida-smart-coach/blob/main/src/components/client/Dashboard.jsx)

*   **State Management (Contexts):**
    *   [PlansContext - Gestão de Planos](https://github.com/agenciaclimb/vida-smart-coach/blob/main/src/contexts/data/PlansContext.jsx)
    *   [GamificationContext - Gestão de Gamificação](https://github.com/agenciaclimb/vida-smart-coach/blob/main/src/contexts/data/GamificationContext.jsx)
    *   [AuthContext - Autenticação](https://github.com/agenciaclimb/vida-smart-coach/blob/main/src/contexts/AuthContext.jsx)

*   **Configuração e Setup do Projeto:**
    *   [Supabase Config](https://github.com/agenciaclimb/vida-smart-coach/blob/main/supabase/config.toml)
    *   [TypeScript Config](https://github.com/agenciaclimb/vida-smart-coach/blob/main/tsconfig.json)
    *   [Package.json - Dependências](https://github.com/agenciaclimb/vida-smart-coach/blob/main/package.json)
    *   [Vercel Config](https://github.com/agenciaclimb/vida-smart-coach/blob/main/vercel.json)

*   **Scripts e Ferramentas de Teste:**
    *   [test_ia_coach_real.mjs - Teste Completo da IA](https://github.com/agenciaclimb/vida-smart-coach/blob/main/scripts/test_ia_coach_real.mjs)
    *   [debug_ia_coach.js - Debug da IA](https://github.com/agenciaclimb/vida-smart-coach/blob/main/scripts/debug_ia_coach.js)
    *   [run_sql_file.js - Executor de Migrations](https://github.com/agenciaclimb/vida-smart-coach/blob/main/scripts/run_sql_file.js)

*   **Documentação Complementar e Histórico:**
    *   [README Principal](https://github.com/agenciaclimb/vida-smart-coach/blob/main/README.md)
    *   [Sistema de Gamificação Completo](https://github.com/agenciaclimb/vida-smart-coach/blob/main/GAMIFICATION_SYSTEM_COMPLETE.md)
    *   [Guia de Deploy para Produção](https://github.com/agenciaclimb/vida-smart-coach/blob/main/PRODUCTION_DEPLOYMENT_GUIDE.md)
    *   [Histórico de Otimizações da IA Coach](https://github.com/agenciaclimb/vida-smart-coach/blob/main/OTIMIZACAO_IA_COACH_V8_HISTORICO_FINAL.md)

*   **Gerenciamento de Issues e Projetos:**
    *   [Quadro de Issues Ativo](https://github.com/agenciaclimb/vida-smart-coach/issues)
    *   [Projetos do GitHub](https://github.com/agenciaclimb/vida-smart-coach/projects)
    *   [Pull Requests](https://github.com/agenciaclimb/vida-smart-coach/pulls)
    *   [Histórico de Commits](https://github.com/agenciaclimb/vida-smart-coach/commits/main)

---

## Nota sobre o Propósito deste Documento

Este **Documento Mestre** serve como a **fonte única de verdade estratégica e arquitetural** do projeto Vida Smart Coach. Ele fornece uma visão de alto nível do sistema, sua arquitetura, ferramentas, metodologias e roadmap de desenvolvimento.

**Detalhes de implementação e execução** (código específico, logs operacionais, issues detalhadas, histórico de commits) são **delegados e referenciados em sistemas externos**:
- **Código-fonte:** GitHub Repository
- **Tarefas e Issues:** GitHub Issues e Projects
- **Logs e Monitoramento:** Vercel, Supabase Dashboard
- **Prompts e Configurações:** Arquivos versionados no repositório

Esta separação garante que o Documento Mestre permaneça conciso, focado e de fácil manutenção, enquanto os agentes de IA podem acessar os detalhes técnicos necessários através dos links diretos fornecidos.

**Para Agentes de IA:**
Todos os links neste documento são diretos e clicáveis. Ao processar tarefas:
1. Consulte este documento para contexto estratégico e arquitetural
2. Acesse os links específicos para detalhes de implementação
3. Verifique os Issues do GitHub para tarefas em andamento
4. Use os scripts de teste para validação
5. Siga os padrões de código definidos na seção 4.2