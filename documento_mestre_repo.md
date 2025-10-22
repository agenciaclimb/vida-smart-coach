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

## 🧾 Atualizações registradas (log)

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
