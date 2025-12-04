# 🧪 SUITE DE REGRESSÃO - HOTFIX PROTOCOL 1.0

## Testes Críticos por Módulo (< 2 minutos)

Execute estes testes após qualquer correção para garantir que não houve regressão.

---

## 🔴 TESTES OBRIGATÓRIOS POR MÓDULO

### 1. WhatsApp Integration (30 segundos)

```bash
# Evolution Webhook - Testes principais
pnpm test supabase/functions/evolution-webhook

# IA Coach WhatsApp Flow
pnpm test supabase/functions/ia-coach-chat/__tests__/whatsapp-flow.test.ts

# Sistema Proativo E2E
pnpm test tests/e2e/proactive-system.test.ts
```

**Quando executar:**
- Alterações em `supabase/functions/evolution-webhook/`
- Alterações em normalização de telefone
- Mudanças em detecção de duplicatas
- Correções em salvamento de histórico

---

### 2. IA Coach (2 minutos)

```bash
# Todos os testes da IA Coach
pnpm test supabase/functions/ia-coach-chat/__tests__

# Testes específicos:
pnpm test supabase/functions/ia-coach-chat/__tests__/auth.test.ts           # Autenticação
pnpm test supabase/functions/ia-coach-chat/__tests__/progression.test.ts    # Estágios
pnpm test supabase/functions/ia-coach-chat/__tests__/memory.test.ts         # Contexto
pnpm test supabase/functions/ia-coach-chat/__tests__/feedback.test.ts       # Respostas
```

**Quando executar:**
- Alterações em `supabase/functions/ia-coach-chat/`
- Mudanças em lógica de estágios (SDR, Specialist, Seller, Partner)
- Correções em contexto/memória
- Ajustes em prompts

---

### 3. Geração de Planos (15 segundos)

```bash
# Testes de geração de planos
pnpm test supabase/functions/ia-coach-chat/__tests__/plan.test.ts
```

**Quando executar:**
- Alterações em `supabase/functions/generate-plan/`
- Mudanças em prompts de geração
- Correções em salvamento de planos

---

### 4. Gamificação (20 segundos)

```bash
# Frontend - Sistema de gamificação
pnpm test tests/gamification.test.js

# Backend - Lógica de pontuação
pnpm test supabase/functions/ia-coach-chat/__tests__/gamification.test.ts
```

**Quando executar:**
- Alterações em sistema de pontos/XP
- Mudanças em níveis/badges
- Correções em ranking

---

### 5. Dashboard & UI (45 segundos)

```bash
# Dashboard V2
pnpm test tests/dashboard-v2.test.jsx

# Planos Espirituais
pnpm test tests/plan-spiritual-display.test.jsx

# Planos Emocionais
pnpm test tests/plan-emotional-display.test.jsx

# Componentes UI
pnpm test src/components/ui/AnimatedCounter.test.jsx
```

**Quando executar:**
- Alterações em componentes React
- Mudanças em contexts (`src/contexts/`)
- Correções em UI/UX

---

### 6. Database Migrations (Manual)

```bash
# Aplicar migrations em staging PRIMEIRO
pnpm migrate

# Validar estrutura
node scripts/validate-database-state.mjs  # (criar este script)

# Testar rollback se necessário
```

**Quando executar:**
- Qualquer alteração em `supabase/migrations/`
- Mudanças em estrutura de tabelas
- Criação de triggers/functions SQL

---

## ⚡ SUITE COMPLETA (Antes de Merge)

```bash
# Executa TUDO: lint + typecheck + tests + secret-scan
pnpm ci
```

**Tempo estimado:** ~3-5 minutos  
**Quando executar:** Antes de abrir Pull Request

---

## 📊 COBERTURA DE TESTES

```bash
# Gerar relatório de cobertura
pnpm test:coverage

# Abrir relatório visual
start coverage/index.html  # Windows
open coverage/index.html   # macOS/Linux
```

**Thresholds mínimos (HOTFIX PROTOCOL 1.0):**
- Statements: 70%
- Branches: 65%
- Functions: 70%
- Lines: 70%

**Funções críticas (90% obrigatório):**
- `supabase/functions/evolution-webhook/`
- `supabase/functions/ia-coach-chat/`
- `supabase/functions/generate-plan/`
- `src/contexts/`

---

## 🎯 MATRIZ DE TESTES POR TIPO DE MUDANÇA

| Mudança | Testes Obrigatórios | Tempo |
|---------|---------------------|-------|
| **WhatsApp/Webhook** | Suite #1 + auth.test.ts | 45s |
| **IA Coach Logic** | Suite #2 completa | 2min |
| **Geração de Planos** | Suite #3 + journey.test.ts | 30s |
| **Gamificação** | Suite #4 | 20s |
| **Frontend/UI** | Suite #5 | 45s |
| **Database** | Suite #6 + testes de integração | Manual |
| **Hotfix Crítico** | pnpm ci (suite completa) | 5min |
| **Antes de Merge** | pnpm ci + validação manual | 10min |

---

## 🚨 TROUBLESHOOTING

### Testes falhando sem motivo aparente?

```bash
# 1. Limpar cache
rm -rf node_modules/.vite
rm -rf coverage

# 2. Reinstalar dependências
pnpm install --frozen-lockfile

# 3. Rodar testes isoladamente
pnpm test --run --reporter=verbose

# 4. Verificar se há conflitos de porta
lsof -ti:5173 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5173   # Windows
```

### Testes passando localmente mas falhando no CI?

```bash
# Verificar diferenças de ambiente
node --version  # Deve ser v20+
pnpm --version  # Deve ser 9+

# Rodar em modo CI localmente
CI=true pnpm test
```

---

## 📝 CHECKLIST COMPLETO (HOTFIX PROTOCOL 1.0)

Antes de considerar uma correção completa:

- [ ] Testes específicos do módulo passaram
- [ ] Suite de regressão passou (sem novos erros)
- [ ] Cobertura mantida/aumentada (≥70%)
- [ ] `pnpm ci` passou sem warnings
- [ ] Validação manual executada
- [ ] Logs limpos (sem erros nos serviços)
- [ ] Documento Mestre atualizado (#update_log)
- [ ] PR aberto com descrição completa

**Status:** Sistema estável ✅ → Pode mergear
