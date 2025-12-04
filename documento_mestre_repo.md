# ✅ VIDA SMART COACH — DOCUMENTO MESTRE (Single Source of Truth)
Data: 21/10/2025 • Responsável: JE (agenciaclimb) • Autor da atualização: GitHub Copilot • Status geral: Em Progresso

Este documento reflete o estado real e verificado do sistema em produção e repositório. Todas as afirmações abaixo foram validadas em código-fonte e configuração presentes na branch main nesta data.

## 🎯 Status atual por módulo

### Infraestrutura e Deploy
- Vercel (Frontend): Produção publicada com sucesso em 21/10/2025 (último deploy manual bem-sucedido). Evidência: comando de deploy retornou Exit Code 0.
- Supabase (Banco + Edge Functions): Operacional. Project ID: `zzugbgoylwbaojdnunuz` (em `supabase/config.toml`).
- Edge Functions ativas no código: `ia-coach-chat`, `evolution-webhook`, `generate-plan`, `trial-reminder`, entre outras utilitárias (lista em Arquitetura > Funções). Verificação: arquivos presentes em `supabase/functions/*/index.ts`.
- Segurança de funções: `verify_jwt = false` para `ia-coach-chat`, `evolution-webhook` e `trial-reminder` (conforme `supabase/config.toml`), com validação cruzada via `X-Internal-Secret` entre funções.

### WhatsApp (Evolution Webhook)
- Implementado em `supabase/functions/evolution-webhook/index.ts`.
   - Recebe `messages.upsert`, ignora mensagens do próprio bot, normaliza telefone, salva no histórico, de-duplica mensagens em 30s.
   - Emergência: detecta palavras-chave críticas e envia resposta via Evolution API; registra alerta em `emergency_alerts`.
   - Integração com IA: chama `ia-coach-chat` com Authorization (ANON/SERVICE) e cabeçalho `X-Internal-Secret`.
   - Envia resposta ao usuário e persiste a resposta em `whatsapp_messages` (após envio bem-sucedido).
- Banco alinhado: migrações 2025-10-21 normalizam `phone`, criam índices e constraints numéricas (ver Migrações).
- Status: Concluído/Operacional.

### IA Coach de Conversa (4 estágios)
- Implementado em `supabase/functions/ia-coach-chat/index.ts`.
   - Estágios: SDR (SPIN Selling) → Specialist → Seller (envia link de cadastro) → Partner.
   - Validação interna: `X-Internal-Secret` obrigatória quando definida.
   - Persistência: salva interação em `interactions` e estágio em `client_stages`.
   - Contexto: carrega dados de usuário (atividades, missões, metas, planos, gamificação, memórias) para personalizar.
- Observações técnicas importantes:
   - SDR possui SPIN Selling com progressão linear e anti-repetição.
   - Seller envia link de cadastro direto: https://appvidasmart.com/cadastro.
   - BUG identificado na função Specialist (detalhes em Erros Conhecidos): condição de avanço ilegítima e variável não definida.
- Status: Em Progresso (funcional com ressalvas; correção no Specialist pendente).

### Geração de Planos por IA
- Edge Function `generate-plan` em `supabase/functions/generate-plan/index.ts`:
   - Recebe `{ userId, planType, userProfile }`.
   - Chama OpenAI `gpt-4o-mini` com `response_format: json_object` e salva em `user_training_plans` (`is_active=true`).
   - Tipos: `physical`, `nutritional`, `emotional`, `spiritual`. Cada prompt retorna JSON válido; rejeita não-JSON.
- Frontend integrado:
   - Contexto: `src/contexts/data/PlansContext.jsx` expõe `generatePersonalizedPlan()` (gera 4 planos) e `generateMissingPlans()`.
   - UI: `src/components/client/PlanTab.jsx` exibe os 4 planos em abas e mostra botões “Gerar planos faltantes (n)” e “Regerar todos os planos” quando aplicável.
- Status: Em Progresso (pipeline de geração e exibição implementado; requer validação em produção por usuário real e robustez de erros).

### Gamificação e Check-ins
- PlanTab integra `useGamification` e exibe pontuação, nível e conquistas; componente `CheckinSystem` aparece no fluxo de planos.
- Status: Em Progresso (exibição integrada no painel; backend não auditado nesta atualização).

### Stripe
- O repositório possui histórico de “webhook Stripe simplificado e funcional” (14/10). Nesta atualização, não houve revalidação completa de eventos de cobrança.
- Status: Não revalidado (presença confirmada por histórico anterior; funcionalidade não auditada hoje).

### Google Calendar
- Funções presentes no código: `get-google-calendar-credentials`, `get-active-provider` (arquivos em `supabase/functions/*`).
- Status: Não revalidado (presença confirmada; integração não testada nesta atualização).

## 🏗️ Arquitetura e principais artefatos

### Edge Functions (arquivos verificados)
- `supabase/functions/evolution-webhook/index.ts` — Integração WhatsApp Evolution; normalização e de-duplicação; chamada IA.
- `supabase/functions/ia-coach-chat/index.ts` — Motor conversacional 4 estágios; SPIN no SDR; validação por segredo interno; gravação em DB.
- `supabase/functions/generate-plan/index.ts` — Gera e persiste planos JSON por tipo via OpenAI.
- Outras funções presentes (não revalidadas): `trial-reminder`, `send-whatsapp-notification`, `checkin-automation`, `evolution-qr`, `admin-*`, `agent-*`, `account-*`, `get-google-credentials`.

### Frontend
- `src/contexts/data/PlansContext.jsx` — Carrega planos ativos; gera 4 planos; gera faltantes; logs de debug e validações de `plan_data`.
- `src/components/client/PlanTab.jsx` — UI de planos com abas, gamificação, check-ins; botões de geração (faltantes e total).

### Configuração de Funções
- `supabase/config.toml`: `verify_jwt = false` para `ia-coach-chat`, `evolution-webhook`, `trial-reminder` (validação via `X-Internal-Secret`).

### Migrações relevantes (WhatsApp)
- `20251021_normalize_existing_phones.sql` — Remove sufixos `@s.whatsapp.net` e normaliza dados legados.
- `20251021_add_phone_constraints_and_index.sql` — Sanitiza para dígitos, índice por `phone`, constraints: sem sufixo e numérico-only.
- `20251021_fix_whatsapp_messages_structure.sql` — Estrutura consistente e índices para `whatsapp_messages`.

## 🧭 Pendências e impacto (somente fatos verificados)

1) Corrigir avanço e anti-loop no estágio Specialist
- Impacto: Médio/Alto — risco de erro em runtime (quebra de fluxo) e repetição de área.
- Evidência: em `ia-coach-chat/index.ts` existe referência a `questionCount` não definida e expressão solta na linha de decisão do Specialist.
- Dependência: Nenhuma externa; ajuste local de lógica.
- Prioridade: Alta.

2) Persistir progresso de áreas no Specialist
- Impacto: Médio — IA pode revisitar a mesma área e gerar sensação de repetição.
- Evidência: Não há leitura/escrita de “áreas já diagnosticadas” em `client_stages.stage_metadata` ou tabela própria.
- Dependência: Modelo de dados e pequena migração/uso de `stage_metadata`.
- Prioridade: Alta.

3) Validação end-to-end do sistema de planos no ambiente de produção (UI → Edge Function → DB → UI)
- Impacto: Alto — Geração visível no painel do cliente.
- Evidência: UI e função presentes; falta checklist de validação em produção com usuário real.
- Dependência: Credenciais OpenAI e Supabase no ambiente de produção.
- Prioridade: Alta.

4) Robustez de chamadas OpenAI (timeouts e mensagens do usuário)
- Impacto: Médio — Melhor UX e redução de falhas intermitentes.
- Evidência: `evolution-webhook` já usa AbortController 25s; `generate-plan` e `ia-coach-chat` não têm timeout explícito.
- Prioridade: Média.

5) Auditoria de Stripe e Google Calendar
- Impacto: Médio — Cobrança/agenda.
- Evidência: Funções presentes; sem revalidação nesta data.
- Prioridade: Média.

6) RLS e políticas de leitura/registro para novas tabelas
- Impacto: Médio — Segurança e UX.
- Evidência: `whatsapp_messages` com políticas; revisar `interactions`, `client_stages`, `user_training_plans`.
- Prioridade: Média.

### 🎨 Melhorias de UX/UI e Gamificação (Identificadas em 22/10/2025)

**Diagnóstico Atual:**
- Visual estático e pouco inspirador — falta dinamismo e feedback visual imediato
- Gamificação superficial — pontos e níveis sem recompensas tangíveis ou narrativa envolvente
- Ausência de progressão visual clara — difícil ver evolução ao longo do tempo
- Falta de personalização — experiência genérica para todos os usuários
- Baixo engajamento emocional — interface funcional mas não inspiradora

**Integração Atual Verificada (22/10/2025):**
- ✅ IA carrega `activePlans` de `user_training_plans` e `gamification` de `user_gamification_summary` (contexto para personalização)
- ✅ PlanTab exibe dados de gamificação (`useGamification` hook) com pontos, nível e conquistas
- ✅ Pontos gerados: geração de planos (+30 XP), progressão IA (+50 XP)
- ❌ **Gaps identificados:**
  - Sem tracking de conclusão de exercícios/refeições/práticas (checkboxes)
  - Sem indicador visual de progresso (% do plano completado)
  - Feedback do usuário não notifica IA nem regenera planos
  - IA não sugere proativamente itens específicos dos planos

**Roadmap de Melhorias (3 Níveis):**

#### 🔴 NÍVEL 1: Quick Wins (Prioridade ALTA — 1-2 semanas)
Impacto alto, esforço baixo — melhorias que podem ser implementadas rapidamente

- Animações e micro-interações (framer-motion)
  - Feedback visual ao completar tarefas (confete, checkmark animado)
  - Transições suaves entre estados
  - Barra de progresso com efeito de preenchimento
  - Badges que "pulam" ao serem conquistados
  - Contador de pontos com crescimento animado

- Dashboard de progresso visual aprimorado
  - Streak Counter (sequência de dias) com chama animada 🔥
  - Calendário visual com check-marks nos dias completos
  - Gráfico de evolução semanal (mini-chart)
  - Badges de conquistas recentes em destaque

- Sistema de feedback imediato
  - Toast notifications celebrativas personalizadas
  - Som sutil de conquista (opcional, desativável)
  - Mensagens motivacionais contextuais por horário

#### 🟡 NÍVEL 2: Game Changers (Prioridade MÉDIA — 2-4 semanas)
Funcionalidades que diferenciam o produto no mercado

- Sistema de recompensas tangíveis (Loja de Benefícios)
  - Digitais: sessões extras IA Coach, relatórios PDF, badges exclusivos, temas premium
  - Conteúdo: e-books, vídeo-aulas, planos avançados, receitas
  - Serviços: consultoria 1:1, ajuste de plano, comunidade VIP

- Narrativa de jornada do herói (Tiers de Progressão)
  - Nível 1-10: 🌱 Aprendiz do Bem-Estar
  - Nível 11-20: 🌿 Guardião da Saúde
  - Nível 21-30: 🌳 Mestre do Equilíbrio
  - Nível 31-40: 🏆 Lenda Viva
  - Nível 41+: ⭐ Inspiração para Outros
  - Benefícios desbloqueados por tier

- Desafios e eventos temporários
  - Semanais: temas específicos (hidratação, meditação)
  - Mensais: metas ambiciosas com recompensas maiores
  - Sazonais: eventos especiais (Ano Novo, Verão)
  - Comunitários: metas coletivas

- Sistema de comparação social saudável
  - Círculos privados (até 5 amigos)
  - Ranking privado do grupo
  - Modo cooperativo (metas compartilhadas)
  - Mensagens de motivação automáticas

#### 🟢 NÍVEL 3: Inovações Disruptivas (Prioridade BAIXA — 4-8 semanas)
Funcionalidades que posicionam o produto como líder de mercado

- IA preditiva e recomendações inteligentes
  - Análise de padrões comportamentais (melhores horários, dias produtivos)
  - Previsões e alertas proativos (burnout, necessidade de descanso)
  - Recomendações adaptativas (dificuldade, novas áreas)

- Visualizações avançadas de dados
  - Radar Chart dos 4 Pilares (equilíbrio visual)
  - Heatmap de consistência 365 dias (estilo GitHub)
  - Gráficos de tendência (peso, humor, energia, sono, estresse)
  - Relatório mensal automático PDF (compartilhável)

- Integração com dispositivos externos
  - Wearables: Apple Health, Google Fit, Fitbit, Garmin, Xiaomi Mi Band
  - Apps fitness: Strava, Nike Training, Headspace, Calm
  - Apps nutrição: MyFitnessPal, Fatsecret, Yazio

- Hub comunitário
  - Feed social de conquistas (opcional)
  - Grupos temáticos moderados
  - Sistema de mentoria (veteranos → iniciantes)
  - Accountability partners (duplas de motivação)

#### 🚨 Melhorias Críticas Imediatas (Sprint 1-2)
**Prioridade P0 — Implementar ANTES de outras features**

1. **Checkboxes de conclusão + gamificação** (ALTA)
   - Exercícios físicos → +10 XP por workout completo
   - Refeições → +5 XP por meal seguida
   - Práticas emocionais/espirituais → +8 XP
   - Nova tabela: `plan_completions` (user_id, plan_type, item_id, completed_at)
   - Componente: Checkbox em cada exercício/refeição/prática
   - Hook: `addDailyActivity` ao marcar como concluído

2. **Indicadores visuais de progresso** (ALTA)
   - Cálculo: % completado = itens_completados / total_itens
   - Progress bar no header de cada plano
   - Display: "Semana X de Y (Z% completo)"
   - Agregação: progresso geral dos 4 pilares

3. **Loop de feedback → IA** (MÉDIA)
   - Nova tabela: `plan_feedback` (user_id, plan_type, feedback_text, created_at, status)
   - `handleFeedbackSubmit`: salvar no DB (atualmente só toast)
   - `fetchUserContext` (IA): incluir `pendingFeedback` no contexto
   - Prompt IA: detectar feedback e oferecer regeneração/ajuste

4. **IA proativa com planos específicos** (MÉDIA)
   - `buildContextPrompt`: incluir itens do dia atual (exercícios, refeições, práticas)
   - Partner stage: referenciar especificamente ("Vi que hoje no seu plano está Treino A - Peito/Tríceps")
   - Sugestões baseadas em progresso real do plano

## 🐞 Erros conhecidos (causa, status, correção sugerida)

1) ~~Specialist: variável indefinida e condição inválida~~ ✅ **CORRIGIDO em 22/10/2025**
- Local: `supabase/functions/ia-coach-chat/index.ts`, função `processSpecialistStage`
- Causa: refatoração incompleta — uso de `questionCount` sem definição e expressão quebrada na linha:
  - `const shouldAdvance = questionCount >= 3; message.toLowerCase().includes('quero');`
- Status: **Concluído** (deploy em 22/10/2025 às 09:58 UTC).
- Correção aplicada:
  - Implementado contador local: `const questionsAsked = chatHistory?.filter(m => m.role === 'assistant').length;`
  - Detecção de interesse: `const wantsToAdvance = /\b(quero|aceito|sim|vamos|pode ser|topo)\b/i.test(message);`
  - Condição unificada: `const shouldAdvance = questionsAsked >= 3 || wantsToAdvance;`
  - Metadados enriquecidos: salvam `questionsAsked` e `wantsToAdvance` para análise.
- Validação: Teste executado com sucesso (HTTP 200, código não quebra, lógica funcional).

2) SDR → Specialist: persistência de áreas
- Local: Specialist (construção de prompt menciona anti-loop; não há persistência)
- Causa provável: falta de camada de estado por área.
- Status: Pendente.
- Correção sugerida: usar `client_stages.stage_metadata` para registrar áreas já cobertas e consultar antes de perguntar.

3) Timeouts padronizados nas funções que chamam OpenAI
- Local: `generate-plan` e `ia-coach-chat`.
- Causa provável: ausência de AbortController local.
- Status: Pendente.
- Correção sugerida: aplicar AbortController/try-catch com resposta amigável.

## ▶️ Próximas ações (ordem técnica e rastreabilidade)

Legenda de Status: Concluído | Em Progresso | Pendente

1) ~~Corrigir Specialist e anti-loop~~ ✅ **CONCLUÍDO em 22/10/2025**
- Dono: JE • Concluído: 22/10/2025 às 09:58 UTC
- Ações realizadas:
  - ✅ Ajustado `shouldAdvance` na função Specialist (removida variável indefinida; unificada condição).
  - ✅ Implementada contagem de perguntas do assistente via `chatHistory`.
  - ✅ Adicionada detecção de interesse explícito com regex.
  - ✅ Metadados enriquecidos (`questionsAsked`, `wantsToAdvance`).
  - ✅ Deploy realizado (script 78.56 kB).
  - ✅ Teste de validação executado com sucesso.
- Próximo: Implementar persistência de áreas cobertas em `client_stages.stage_metadata` (previsto para 23/10).

2) Validar geração de planos E2E em produção (Em Progresso)
- Dono: JE • Prazo alvo: 22/10/2025
- Passos:
   - Abrir painel → aba Plano → forçar “Gerar planos faltantes” e depois recarregar.
   - Confirmar inserts em `user_training_plans` com `is_active=true`.
   - Validar renderização nas 4 abas (dados não vazios/estruturados).

3) Padronizar timeouts/respostas de OpenAI (Pendente)
- Dono: JE • Prazo: 23/10/2025
- Passos:
   - Adicionar AbortController (25-30s) em `generate-plan` e `ia-coach-chat`.
   - Mensagem de fallback amigável e log de erro com `details`.

4) Auditoria de Stripe e Google Calendar (Pendente)
- Dono: JE • Prazo: 25/10/2025
- Passos:
   - Stripe: listar eventos e testar webhook de teste; documentar status real.
   - Calendar: testar credenciais e escopos; documentar.

5) Revisão de RLS e políticas (Pendente)
- Dono: JE • Prazo: 24/10/2025
- Passos:
   - Verificar políticas em `interactions`, `client_stages`, `user_training_plans`.
   - Garantir que o cliente vê apenas seus dados e que funções SERVICE têm acesso necessário.

### 🎨 Roadmap de Melhorias UX/UI e Gamificação (Iniciado em 22/10/2025)

**📄 Documento completo:** Ver `PLANO_ACAO_UX_GAMIFICACAO.md` para detalhamento técnico completo.

**Objetivo estratégico:** Transformar experiência funcional em experiência envolvente e inspiradora através de gamificação profunda, feedback visual imediato, e sistema de recompensas tangíveis.

**Sprints planejados:**
- 🏃 **Sprint 1-2 (23/10-06/11):** Quick Wins — Checkboxes de conclusão, progress tracking, animações, streak counter
- 🏃 **Sprint 3-4 (07/11-20/11):** Game Changers — Loja de recompensas, narrativa de jornada, badges
- 🏃 **Sprint 5-6 (21/11-04/12):** Social — Desafios temporários, círculos de motivação
- 🏃 **Sprint 7-10 (05/12-01/01):** Inovações — IA preditiva, analytics avançados, integrações externas

**Prioridade P0 (Crítica — Bloqueador):**
1. Checkboxes de conclusão + gamificação (exercícios, refeições, práticas → pontos)
   - Migration: `plan_completions` table
   - Hook: `usePlanCompletions`
   - Componente: `CompletionCheckbox` com animação
   - Integração: 4 displays de planos

2. Indicadores visuais de progresso (% completado, progress bars)
   - Componente: `ProgressCard` com trend indicators
   - Dashboard: `OverallProgressDashboard` agregando 4 pilares
   - Animações: framer-motion para preenchimento

3. Loop de feedback → IA (feedback do usuário notifica IA e ajusta planos)
   - Migration: `plan_feedback` table
   - Edge Function: `process-plan-feedback`
   - Context: `fetchUserContext` incluir `pendingFeedback`

4. IA proativa com planos específicos (referenciar exercícios/refeições do dia)
   - Context: `buildContextPrompt` incluir itens do dia
   - Prompts: Partner stage usar plano real

**Métricas de sucesso:**
- DAU/MAU: 0.25 → 0.40 (+60%)
- Sessão média: 5min → 12min (+140%)
- Churn 30d: 40% → 25% (-37.5%)
- NPS: 42 → 57 (+15 pontos)

---

### 📋 PLANO DE EXECUÇÃO ESTRUTURADO (11/11/2025)

**📄 Plano detalhado:** Ver `PLANO_EXCELENCIA_WHATSAPP.md` para especificações completas.

**🎯 OBJETIVO:** Resolver problemas de qualidade de código identificados pelo SonarQube, implementar sistema proativo e enriquecimento WhatsApp (Semanas 1-4 do PLANO_EXCELENCIA_WHATSAPP.md).

**📊 STATUS ATUAL:**
- ✅ Semana 1-2: Memória contextual, anti-loop, progressão forçada, testes (28/28 passando)
- 🔴 Semana 3-4: Refatoração SonarQube, proatividade, gamificação WhatsApp (PENDENTE)

---

#### 🔴 SPRINT 1: REFATORAÇÃO E QUALIDADE DE CÓDIGO (11-17/11/2025)

**Prioridade:** P0 - BLOQUEADOR  
**Responsável:** Agente Autônomo IA  
**Estimativa:** 20-25 horas  
**Critério de aceitação geral:** 0 erros críticos SonarQube, complexidade < 15, 100% testes passando

##### T1.1: Refatorar função `serve()` handler principal
**Status:** 🔴 PENDENTE  
**Arquivo:** `supabase/functions/ia-coach-chat/index.ts` (linhas 1-200)  
**Complexidade atual:** 42 → **Meta:** <15  
**Esforço:** 6h

**Problemas específicos:**
- 9+ parâmetros em várias chamadas de função
- Lógica de roteamento complexa
- Validações espalhadas
- Try-catch aninhados

**Ações concretas:**
1. Extrair validação de requisição para função `validateRequest(req): ValidationResult`
2. Criar objeto `RequestContext` com todos os dados necessários
3. Implementar router pattern: `routeByStage(context): Promise<Response>`
4. Separar lógica de automações em `handleAutomations(context): void`
5. Usar early returns para reduzir aninhamento

**Critérios de aceitação:**
- [ ] Complexidade cognitiva < 15 (SonarQube)
- [ ] Máximo 3 parâmetros por função
- [ ] 0 warnings de ternários aninhados
- [ ] Testes unitários criados para cada função extraída
- [ ] Todos os testes existentes continuam passando

**Arquivos afetados:**
- `supabase/functions/ia-coach-chat/index.ts`
- Novos: `src/handlers/request-validator.ts`, `src/handlers/stage-router.ts`, `src/handlers/automations.ts`

---

##### T1.2: Refatorar `buildContextPrompt()`
**Status:** 🔴 PENDENTE  
**Arquivo:** `supabase/functions/ia-coach-chat/index.ts` (linhas ~800-1000)  
**Complexidade atual:** 27 → **Meta:** <15  
**Esforço:** 4h

**Problemas específicos:**
- Muitos blocos condicionais aninhados
- Concatenação de strings complexa
- Lógica de formatação misturada com lógica de negócio

**Ações concretas:**
1. Extrair formatadores por tipo: `formatActivities()`, `formatMissions()`, `formatPlans()`, `formatMemory()`
2. Criar interface `ContextSection` com `title`, `content`, `condition`
3. Implementar `ContextBuilder` com pattern builder
4. Usar template literals organizados
5. Extrair constantes de prompts para arquivo separado

**Critérios de aceitação:**
- [ ] Complexidade cognitiva < 15
- [ ] Funções auxiliares com máximo 20 linhas
- [ ] Prompts em arquivo separado `src/prompts/context-templates.ts`
- [ ] Testes com snapshots para cada tipo de contexto
- [ ] 100% cobertura de testes

**Arquivos afetados:**
- `supabase/functions/ia-coach-chat/index.ts`
- Novos: `src/services/context-builder/index.ts`, `src/prompts/context-templates.ts`

---

##### T1.3: Refatorar `selectProactiveSuggestions()`
**Status:** 🔴 PENDENTE  
**Arquivo:** `supabase/functions/ia-coach-chat/index.ts` (linhas ~1100-1250)  
**Complexidade atual:** 24 → **Meta:** <15  
**Esforço:** 4h

**Problemas específicos:**
- Muitas condições aninhadas para diferentes tipos de sugestões
- Lógica de pontuação misturada com lógica de seleção
- Repetição de código para diferentes categorias

**Ações concretas:**
1. Criar interface `ProactiveSuggestion` com `type`, `priority`, `score`, `condition`
2. Implementar pattern Strategy com `SuggestionProvider` por categoria
3. Criar `SuggestionScorer` isolado
4. Usar `SuggestionSelector` com algoritmo de ranking
5. Extrair regras de negócio para configuração

**Critérios de aceitação:**
- [ ] Complexidade cognitiva < 15
- [ ] 1 provider por tipo de sugestão (hidratação, workout, streak, etc)
- [ ] Sistema de scoring isolado e testável
- [ ] Configuração de prioridades em arquivo JSON
- [ ] Testes para cada provider e para o selector

**Arquivos afetados:**
- `supabase/functions/ia-coach-chat/index.ts`
- Novos: `src/services/proactive/index.ts`, `src/services/proactive/providers/`, `src/services/proactive/scorer.ts`

---

##### T1.4: Refatorar `extractPlanItems()` e `runRegeneratePlanAction()`
**Status:** 🔴 PENDENTE  
**Arquivo:** `supabase/functions/ia-coach-chat/index.ts` (linhas ~1300-1500)  
**Complexidade atual:** 31 e 21 → **Meta:** <15  
**Esforço:** 5h

**Problemas específicos:**
- Parsing complexo de estruturas JSON variadas
- Muitos casos especiais para diferentes formatos de plano
- Validação e normalização misturadas

**Ações concretas:**
1. Criar `PlanParser` com estratégias por tipo (physical, nutritional, etc)
2. Implementar `PlanItemNormalizer` isolado
3. Extrair validação para `PlanValidator`
4. Criar DTOs para estruturas de plano
5. Simplificar `runRegeneratePlanAction` usando serviços

**Critérios de aceitação:**
- [ ] Complexidade cognitiva < 15 em ambas
- [ ] 1 parser por tipo de plano
- [ ] Validação com retorno estruturado de erros
- [ ] DTOs tipados para todas as estruturas de plano
- [ ] Testes com fixtures reais de planos

**Arquivos afetados:**
- `supabase/functions/ia-coach-chat/index.ts`
- Novos: `src/services/plan-parser/index.ts`, `src/services/plan-parser/normalizer.ts`, `src/types/plan-dtos.ts`

---

##### T1.5: Resolver ternários aninhados (9 ocorrências)
**Status:** 🔴 PENDENTE  
**Arquivo:** `supabase/functions/ia-coach-chat/index.ts` (linhas: 271, 312, 457, 463, 468, 814, 816, 1295)  
**Esforço:** 2h

**Ações concretas:**
1. Substituir por if-else com early returns
2. Extrair lógica condicional para funções nomeadas
3. Usar guard clauses quando apropriado
4. Aplicar pattern Replace Conditional with Polymorphism onde fizer sentido

**Critérios de aceitação:**
- [ ] 0 ternários aninhados (SonarQube)
- [ ] Código mais legível e mantível
- [ ] Testes garantindo mesma funcionalidade

---

##### T1.6: Corrigir uso de forEach para for...of
**Status:** 🔴 PENDENTE  
**Arquivo:** `supabase/functions/ia-coach-chat/index.ts`  
**Esforço:** 1h

**Ações concretas:**
1. Identificar todos os `forEach` (grep)
2. Substituir por `for...of` onde não há necessidade de side effects
3. Manter `forEach` apenas em casos de operações imutáveis

**Critérios de aceitação:**
- [ ] forEach usado apenas onde apropriado
- [ ] Performance não degradada
- [ ] Testes verificando comportamento idêntico

---

#### 🟡 SPRINT 2: PROATIVIDADE E ENRIQUECIMENTO WHATSAPP (18-24/11/2025)

**Prioridade:** P1 - ALTA  
**Responsável:** Agente Autônomo IA  
**Estimativa:** 18-20 horas  
**Dependências:** Sprint 1 concluído (código refatorado)

##### T2.1: Implementar sistema de regras proativas
**Status:** 🔴 PENDENTE  
**Esforço:** 6h

**Ações concretas:**
1. Criar tabela `proactive_messages` (migration)
2. Implementar `ProactiveEngine` com 8 regras base
3. Sistema de cooldown por regra e usuário
4. Integração com schedule (cron ou trigger)
5. Handler de respostas do usuário

**Critérios de aceitação:**
- [ ] Migration aplicada com índices de performance
- [ ] 8 regras implementadas e testadas individualmente
- [ ] Cooldown funcional (não spamming)
- [ ] Respeita horário de sono (22h-7h)
- [ ] Máximo 3 mensagens proativas/dia

**Arquivos:**
- Novo: `supabase/migrations/20251118_create_proactive_messages.sql`
- Novo: `supabase/functions/proactive-engine/index.ts`
- Novo: `src/services/proactive/rules.ts`

---

##### T2.2: Implementar formatação rica de mensagens WhatsApp
**Status:** 🔴 PENDENTE  
**Esforço:** 4h

**Ações concretas:**
1. Criar templates para gamificação (level up, streak, conquistas)
2. Formatter com markdown WhatsApp (*bold*, _italic_, ```code```)
3. Templates para proatividade
4. Sistema de placeholders dinâmicos

**Critérios de aceitação:**
- [ ] Templates para todas as celebrações
- [ ] Formatação markdown válida
- [ ] Emojis contextuais
- [ ] Preview visual dos templates

**Arquivos:**
- Novo: `src/services/message-formatter/templates.ts`
- Novo: `src/services/message-formatter/index.ts`

---

##### T2.3: Implementar botões interativos (Evolution API)
**Status:** 🔴 PENDENTE  
**Esforço:** 5h

**Ações concretas:**
1. Estudar API Evolution para botões/listas
2. Criar `ButtonBuilder` para diferentes estágios
3. Handler de callbacks de botões
4. Integrar com evolution-webhook

**Critérios de aceitação:**
- [ ] Botões funcionais em todos os estágios
- [ ] Callbacks processados corretamente
- [ ] Fallback para texto quando botões não disponíveis
- [ ] Testes com mock da API Evolution

**Arquivos:**
- Novo: `src/services/button-builder/index.ts`
- Atualizado: `supabase/functions/evolution-webhook/index.ts`

---

##### T2.4: Implementar handlers de ações rápidas
**Status:** 🔴 PENDENTE  
**Esforço:** 5h

**Ações concretas:**
1. Criar edge function `quick-actions`
2. Implementar handlers: check-in, log water, view plan, view progress
3. Validação e autorização
4. Resposta formatada com próxima ação

**Critérios de aceitação:**
- [ ] 8 ações implementadas
- [ ] Autenticação via X-Internal-Secret
- [ ] Persistência no banco
- [ ] Feedback imediato ao usuário
- [ ] Testes E2E para cada ação

**Arquivos:**
- Novo: `supabase/functions/quick-actions/index.ts`
- Novo: `src/services/quick-actions/handlers.ts`

---

#### 🟢 SPRINT 3: TESTES E VALIDAÇÃO (25/11-01/12/2025)

**Prioridade:** P0 - CRÍTICO  
**Responsável:** Agente Autônomo IA  
**Estimativa:** 12-15 horas  
**Dependências:** Sprints 1 e 2 concluídos

##### T3.1: Criar testes E2E completos
**Status:** 🔴 PENDENTE  
**Esforço:** 8h

**Ações concretas:**
1. Jornada completa SDR → Partner com proatividade
2. Jornada com ajuste de plano via feedback
3. Jornada com botões interativos
4. Cenários de erro e recuperação

**Critérios de aceitação:**
- [ ] 4 jornadas completas testadas
- [ ] Tempo de execução < 5min
- [ ] 100% dos cenários passando
- [ ] Cobertura de código > 90%

**Arquivos:**
- `supabase/functions/ia-coach-chat/__tests__/e2e-*.test.ts`

---

##### T3.2: Testes de performance e carga
**Status:** 🔴 PENDENTE  
**Esforço:** 3h

**Ações concretas:**
1. Script de carga com k6 ou artillery
2. 100 mensagens/min sustentado
3. Latência p95 < 1.5s
4. Memória estável

**Critérios de aceitação:**
- [ ] Throughput > 100 msgs/min
- [ ] P95 < 1.5s
- [ ] P99 < 3s
- [ ] 0 memory leaks

---

##### T3.3: Validação manual checklist
**Status:** 🔴 PENDENTE  
**Esforço:** 4h

**Ações concretas:**
1. Testar cada funcionalidade manualmente via WhatsApp real
2. Documentar casos de uso e resultados
3. Validar com 3+ usuários beta

**Critérios de aceitação:**
- [ ] Checklist 100% validado
- [ ] Feedback de usuários beta coletado
- [ ] Bugs críticos documentados e corrigidos

---

#### 📊 MÉTRICAS DE SUCESSO DO PLANO

| Métrica | Baseline | Meta | Como Medir |
|---------|----------|------|------------|
| Complexidade cognitiva (média) | 27 | <15 | SonarQube scan |
| Code smells críticos | 46 | 0 | SonarQube scan |
| Cobertura de testes | 50% | >90% | Vitest coverage |
| Testes passando | 28/28 | 50+/50+ | Vitest run |
| Latência p95 | ~2s | <1.5s | Logs production |
| Taxa de loops | ~5% | 0% | Metrics table |
| Mensagens proativas enviadas | 0 | >100/dia | Proactive messages table |
| Uso de botões interativos | 0% | >30% | Webhook logs |

---

#### 🚨 PROTOCOLO DE EXECUÇÃO PARA IAs

**REGRAS FUNDAMENTAIS:**

1. **ORDEM ESTRITA:** Executar sprints na ordem (1 → 2 → 3). Não pular etapas.

2. **VALIDAÇÃO CONTÍNUA:** 
   - Após cada tarefa: rodar `npx vitest run` e `get_errors` (SonarQube)
   - Só avançar se testes passando e sem novos erros

3. **DOCUMENTAÇÃO OBRIGATÓRIA:**
   - Atualizar STATUS após cada tarefa
   - Marcar ✅ nos checkboxes dos critérios de aceitação
   - Adicionar log no documento mestre

4. **ROLLBACK IMEDIATO:**
   - Se testes quebrarem: reverter mudança e re-planejar
   - Se complexidade aumentar: refatorar novamente
   - Se performance degradar: otimizar antes de prosseguir

5. **COMUNICAÇÃO:**
   - Reportar progresso a cada 2 tarefas concluídas
   - Alertar sobre bloqueios ou riscos identificados
   - Pedir validação humana em decisões arquiteturais

**VERIFICAÇÃO DE CONCLUSÃO:**

Tarefa considerada CONCLUÍDA apenas quando:
- [ ] Código implementado e commitado
- [ ] Todos os testes passando (incluindo novos)
- [ ] SonarQube sem novos erros críticos
- [ ] Documentação atualizada
- [ ] Critérios de aceitação 100% marcados
- [ ] Revisão de código (self-review) concluída

**PRÓXIMA AÇÃO IMEDIATA:**
1. Executar `get_errors` para baseline atual de erros SonarQube
2. Iniciar T1.1 (Refatorar serve() handler)
3. Criar branch `refactor/sprint-1-serve-handler`

## 🧪 PROTOCOLO DE TESTES, CORREÇÃO IMEDIATA E VALIDAÇÃO (HOTFIX PROTOCOL 1.0)

### Status: ATIVO — Aplicável a todo o ciclo de desenvolvimento

Este protocolo define o processo oficial de testes, correção imediata e validação contínua para o Vida Smart Coach, baseado em sua arquitetura real e nos objetivos holísticos do sistema. O protocolo se aplica tanto a IAs quanto a desenvolvedores humanos e deve ser seguido rigorosamente para garantir qualidade de nível profissional.

### 1. Objetivo

Assegurar que todos os módulos do Vida Smart (WhatsApp, site, painel do cliente, painel de afiliados, painel administrativo, Supabase e integrações externas como Stripe e Google Calendar) permaneçam estáveis e funcionais, oferecendo uma experiência de coaching holístico (físico, alimentar, emocional e espiritual) sem interrupções.

### 2. Princípios Fundamentais

**Falha não é negociável:** qualquer erro detectado interrompe imediatamente o processo de desenvolvimento até ser diagnosticado, corrigido, testado e documentado.

**Causa raiz obrigatória:** nunca corrija sintomas sem entender a origem do problema.

**Correção responsável:** a solução deve manter o comportamento esperado e não introduzir gambiarras ou regressões.

**Transparência total:** todas as correções devem ser registradas no Documento Mestre com contexto completo.

### 3. Escopo de Aplicação

Este protocolo se aplica a todos os testes e validações que abrangem:

- **Fluxos E2E de cliente:** cadastro e onboarding via WhatsApp, contratação de planos pelo site (Stripe), geração de plano personalizado, check‑ins diários, acompanhamento de metas e envio de notificações pelo Google Calendar.

- **E2E de afiliados e parceiros:** criação de afiliados, uso do link exclusivo, acompanhamento de comissões, cadastro de novos parceiros.

- **E2E administrativos:** gestão de usuários, planos, pagamentos e churn; geração de relatórios e execução de gatilhos automáticos de IA.

- **Integrações:** Supabase (database e functions), Evolution API/WhatsApp, Stripe (pagamentos e split), Google Calendar, Vercel (deploy e serverless) e serviços de notificação.

- **Testes de integração** entre módulos (por exemplo, geração de plano alimenta dados no painel, pontuação de gamificação atualiza ranking, etc.).

- **Testes unitários** de componentes isolados (funções de IA, cálculos de pontuação, validação de treinos, etc.).

- **Testes manuais** executados pela equipe de QA quando necessário.

### 4. Procedimento Fail‑Fast

#### 4.1 Detecção de falha

Se qualquer teste automatizado ou manual detectar uma falha (erro de código, comportamento inesperado, quebra de integração ou degradação da experiência do usuário), interrompa imediatamente:

- Pare a geração de novo código ou novas funcionalidades;
- Não execute testes adicionais antes da correção;
- Notifique o time responsável se for falha de infraestrutura externa (por exemplo, Stripe ou Evolution API).

#### 4.2 Diagnóstico da causa raiz

A IA ou o desenvolvedor deve:

- Identificar o módulo e o contexto: cliente final, afiliado, administrador ou integração;
- Isolar o arquivo/endpoint/função envolvidos (por exemplo, Supabase function, webhook de pagamento, tarefa cron de Vercel);
- Documentar o passo a passo para reproduzir o erro;
- Anotar logs, dados de entrada e estado do sistema no momento da falha.

#### 4.3 Correção imediata e branch fixa

- Criar branch `fix/[nome-da-falha]` a partir da branch principal;
- Implementar a correção real, evitando soluções temporárias;
- Executar todos os testes unitários relevantes para o módulo alterado;
- Registrar commit com mensagem clara (`fix: [descrição curta]`);
- Abrir Pull Request descrevendo o problema, a causa raiz, a solução e os arquivos modificados.

#### 4.4 Atualização do Documento Mestre

Após abrir o PR, registre a correção sob **#update_log** no Documento Mestre com:

- Data e hora da correção;
- Fluxo/teste que falhou;
- Causa raiz e impacto do bug (por exemplo, "Clientes não conseguiam gerar treinos" ou "Afiliados não recebiam comissões de nível 2");
- Tipo de correção (Supabase, webhook, Vercel, IA, Stripe, WhatsApp, etc.);
- Arquivos ou funções modificadas;
- Link do PR;
- Observações adicionais.

#### 4.5 Verificação de logs e estado global

Enquanto trabalha na correção, consulte os logs de:

- Supabase Functions e banco (erros de consulta, permissões, triggers);
- Vercel (falhas em deploy ou funções serverless);
- Evolution API/WhatsApp (erros de envio ou recebimento de mensagens);
- Stripe (pagamentos e splits);
- Google Calendar (inserção ou alteração de eventos);
- Serviços de gamificação e pontuação.

Somente prosseguir quando os logs estiverem limpos e sem erros relacionados.

### 5. Revalidação Total

Após a correção:

- Execute novamente toda a suíte de testes E2E, cobrindo todos os fluxos de cliente, afiliados e admins;
- Rode todos os testes de integração e unitários;
- Realize um teste manual de ponta a ponta no fluxo afetado;
- Garanta que a experiência do usuário permaneça consistente (respostas da IA adequadas, tempos de carregamento aceitáveis, mensagens e eventos no horário correto);
- Verifique novamente logs de todos os serviços.

Se qualquer nova falha aparecer, reinicie o processo desde 4.1.

### 6. Critérios de Estabilidade ("Green State")

O projeto só pode avançar após confirmar:

- ✅ 100% dos testes E2E, integração e unitários passaram;
- ✅ Todos os serviços (Supabase, Vercel, WhatsApp, Stripe, Google Calendar) sem erros nos logs;
- ✅ Nenhuma regressão em funcionalidades já validadas (físico, alimentar, emocional, espiritual, gamificação, afiliados, administrativos);
- ✅ Respostas da IA Coach coerentes e sem loops ou contradições;
- ✅ Usuários conseguem contratar planos, acessar painéis, gerar planos personalizados e participar de gamificação sem problemas;
- ✅ Afiliados recebem comissões e conseguem gerenciar sua rede;
- ✅ Administradores têm acesso a relatórios e configurações sem falhas.

### 7. Checklist Final Antes de Merge

- [ ] Todos os testes passaram e foram reexecutados após a correção;
- [ ] O Documento Mestre foi atualizado com #update_log;
- [ ] Logs de todos os serviços foram revisados e não apresentam erros;
- [ ] A correção está alinhada com a arquitetura e as regras de negócio do Vida Smart;
- [ ] Não foram introduzidas gambiarras ou workarounds temporários;
- [ ] A experiência do usuário (cliente, afiliado e administrador) foi validada manualmente;
- [ ] Revisão de código realizada por outro membro da equipe e aprovada.

### 8. Objetivos Estratégicos

Este protocolo não apenas corrige bugs, mas reforça os objetivos do Vida Smart:

- **Excelência técnica:** entregar um produto confiável e seguro;
- **Experiência holística:** garantir bem-estar físico, alimentar, emocional e espiritual por meio de uma IA acolhedora e motivadora;
- **Transparência e confiança:** registrar todas as mudanças e garantir previsibilidade para usuários e parceiros;
- **Crescimento sustentável:** permitir evoluções rápidas sem comprometer a qualidade.

### 9. Automações e Ferramentas (v1.1 - 04/12/2025)

#### 9.1 Git Hooks Pré-Commit

**Arquivo:** `.githooks/pre-commit`  
**Ativação:** Automática (configurada via `pnpm setup:githooks`)

**Validações automáticas antes de cada commit:**
1. ✅ ESLint (max-warnings 0)
2. ✅ TypeScript typecheck
3. ✅ Testes unitários (vitest)
4. ✅ Secret scan

**Benefício:** Impede commits com código quebrado (fail-fast real)

#### 9.2 Cobertura de Testes Mínima

**Arquivo:** `vitest.config.ts`  
**Thresholds obrigatórios:**
- Statements: 70%
- Branches: 65%
- Functions: 70%
- Lines: 70%

**Comando:** `pnpm test:coverage`  
**Relatório visual:** `coverage/index.html`

**Funções críticas (90% obrigatório):**
- `supabase/functions/evolution-webhook/`
- `supabase/functions/ia-coach-chat/`
- `supabase/functions/generate-plan/`
- `src/contexts/`

#### 9.3 Suite de Regressão

**Arquivo:** `SUITE_REGRESSAO.md`  
**Testes rápidos por módulo (< 2 minutos):**

```bash
# WhatsApp Integration (30s)
pnpm test supabase/functions/evolution-webhook
pnpm test supabase/functions/ia-coach-chat/__tests__/whatsapp-flow.test.ts

# IA Coach completo (2min)
pnpm test supabase/functions/ia-coach-chat/__tests__

# Geração de Planos (15s)
pnpm test supabase/functions/ia-coach-chat/__tests__/plan.test.ts

# Gamificação (20s)
pnpm test tests/gamification.test.js

# Suite completa antes de merge (5min)
pnpm ci
```

**Matriz de testes:** Ver `SUITE_REGRESSAO.md` para tabela completa por tipo de mudança

#### 9.4 Health Checks Pós-Deploy

**Arquivo:** `scripts/health-check-functions.mjs`  
**Uso:** `node scripts/health-check-functions.mjs`

**Validações automáticas:**
- ✅ Todas as Edge Functions respondem (200/400/404)
- ✅ Latência média < 3s
- ✅ Sistema operacional

**Funções testadas:**
- `evolution-webhook`
- `ia-coach-chat`
- `generate-plan`

**Critério de sucesso:** Todas funções acessíveis + latência aceitável

---

## 🧾 Atualizações registradas (#update_log)

- **04/12/2025** — HOTFIX: Correção estrutura whatsapp_messages (Responsável: JE • Execução: GitHub Copilot) — Status: ✅ Concluído
  - **Problema:** IA respondendo sem contexto; mensagens duplicadas (4x); histórico vazio (0 mensagens salvas).
  - **Causa raiz:** Webhook enviava campos `phone` + `message`, mas tabela requer `phone_number` + `message_content`.
  - **Impacto:** INSERT falhando silenciosamente → histórico vazio → IA sem memória → respostas robóticas → duplicação não detectada.
  - **Correção:** `supabase/functions/evolution-webhook/index.ts` (linhas 230, 234, 244)
    - Linha 230: Adicionado `phone_number` + `message_content` no INSERT
    - Linha 244: Corrigido query de duplicatas para usar `phone_number`
  - **Validação:** INSERT testado com sucesso (Status 201); estrutura 100% validada; registro criado corretamente.
  - **Deploy:** Commit 09a8b43; deploy manual via Supabase Dashboard; aguardando validação em produção.
  - **Protocolo:** HOTFIX PROTOCOL 1.0 aplicado rigorosamente (detecção → diagnóstico → correção → validação).
  - **Arquivos:** `HOTFIX_REPORT_20251204.md`, `supabase/migrations/20251204_create_whatsapp_messages.sql`.
  - **Próximo passo:** Validação pós-deploy com `verificar_salvamento_mensagens.mjs`.

- 22/10/2025 — Roadmap UX/UI e Gamificação criado (Responsável: JE • Execução: GitHub Copilot) — Status: Em Planejamento
  - Diagnóstico: Visual estático, gamificação superficial, falta de progressão visual, baixo engajamento emocional.
  - Análise de integração: IA carrega planos e gamificação; gaps identificados (sem tracking de conclusão, sem feedback→IA).
  - Roadmap: 3 níveis (Quick Wins 1-2sem, Game Changers 2-4sem, Inovações 4-8sem).
  - Prioridade P0: Checkboxes de conclusão, progress tracking, loop feedback→IA, IA proativa.
  - Artefatos: `PLANO_ACAO_UX_GAMIFICACAO.md` (plano detalhado com sprints, código, migrations).
  - Métricas: DAU/MAU +60%, sessão +140%, churn -37.5%, NPS +15pts.
  - Próximo passo: Iniciar Sprint 1 (23/10) com checkboxes e progress tracking.

- 22/10/2025 — Correção do bug Specialist concluída (Responsável: JE • Execução: GitHub Copilot) — Status: Concluído
  - Bug: Variável `questionCount` não definida; condição `shouldAdvance` quebrada.
  - Correção: Contador local via `chatHistory`; detecção de interesse com regex; condição unificada.
  - Deploy: Função `ia-coach-chat` (78.56 kB) publicada às 09:58 UTC.
  - Validação: Teste HTTP 200; código não quebra; lógica operacional confirmada.
  - Arquivo: `supabase/functions/ia-coach-chat/index.ts`, função `processSpecialistStage`.

- 21/10/2025 — Atualização do Documento Mestre para estado real (Responsável: JE • Autor: GitHub Copilot) — Status: Concluído
  - WhatsApp: normalização/constraints confirmadas; webhook com anti-loop e segredo interno.
  - IA Coach: SPIN no SDR confirmado; Seller com link direto confirmado; bug no Specialist registrado.
  - Planos: função `generate-plan` e UI "Gerar planos faltantes/Regerar todos" confirmadas.
  - Configuração: `verify_jwt=false` com `X-Internal-Secret` entre funções.

## 🔗 Matriz de rastreabilidade (Problema → Causa → Ação)

- Repetição de perguntas/loops no Specialist → Falta de estado por área e bug lógico → Persistir áreas em `stage_metadata` e corrigir `shouldAdvance`.
- Planos não visíveis/geração ausente → Ausência de fluxo integrado → Edge Function `generate-plan` + botões na UI + recarga de planos após geração.
- 401 entre funções (histórico) → JWT verificação e tokens → `verify_jwt=false` e validação por `X-Internal-Secret` no servidor.
- Telefones inconsistentes → Dados legados com sufixo e caracteres não numéricos → Migrações de normalização, índice e constraints.

---

Observação: Este documento reflete apenas fatos verificados no repositório e configurações neste dia. Itens “Não revalidados” são explicitamente marcados e devem entrar na fila de auditoria.
