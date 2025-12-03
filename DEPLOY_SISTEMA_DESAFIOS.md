# 🚀 GUIA DE DEPLOY - Sistema de Desafios

**Data:** 03/12/2025 | **Atualizado:** 19:00 BRT  
**Componentes:** ChallengesSection, useChallenges, challenge-manager Edge Function

## ✅ STATUS ATUAL

| Item | Status | Detalhes |
|------|--------|----------|
| Edge Function | ✅ **DEPLOYED** | https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/challenge-manager |
| Migration SQL | ⏳ **PENDENTE** | SQL copiado para clipboard → aplicar manualmente |
| Frontend | ✅ **RODANDO** | http://localhost:5173 (date-fns instalado) |
| Script de Teste | ✅ **CRIADO** | `test_challenge_function.ps1` |

---

## 📋 PASSO 1: Aplicar Migration no Supabase

### Opção A: Via SQL Editor (Recomendado)

1. Acesse o Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/sql
   ```

2. Copie o conteúdo do arquivo:
   ```
   supabase/migrations/20251112_enhance_challenges_system.sql
   ```

3. Cole no SQL Editor e clique em **"Run"**

4. Verificar sucesso:
   - ✅ Função `add_user_xp` criada
   - ✅ 6 novos achievements inseridos
   - ✅ View `user_active_challenges` criada
   - ✅ Índices de performance criados

### Opção B: Via CLI (Se disponível)

```bash
supabase db push
```

---

## 📋 PASSO 2: Deploy da Edge Function

### Via Supabase Dashboard:

1. Acesse: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/functions

2. Criar nova função:
   - **Name:** `challenge-manager`
   - **Runtime:** Deno
   - **Code:** Copiar de `supabase/functions/challenge-manager/index.ts`

3. Configurar Environment Variables:
   - `SUPABASE_URL`: https://zzugbgoylwbaojdnunuz.supabase.co
   - `SUPABASE_SERVICE_ROLE_KEY`: (sua chave service_role)

4. Deploy e testar

### Via CLI (Alternativa):

```bash
supabase functions deploy challenge-manager
```

---

## 📋 PASSO 3: Testar a Edge Function

### 3.1. Gerar Desafio Semanal

```bash
curl -X POST \
  'https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/challenge-manager' \
  -H 'Authorization: Bearer [SUA_ANON_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{"action": "generate_weekly"}'
```

**Resposta esperada:**
```json
{
  "success": true,
  "challenge": {
    "id": "uuid-aqui",
    "name": "7 Dias de Movimento",
    "description": "...",
    "category": "weekly"
  }
}
```

### 3.2. Gerar Desafio Mensal

```bash
curl -X POST \
  'https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/challenge-manager' \
  -H 'Authorization: Bearer [SUA_ANON_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{"action": "generate_monthly"}'
```

### 3.3. Verificar Progresso de Usuário

```bash
curl -X POST \
  'https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/challenge-manager' \
  -H 'Authorization: Bearer [SUA_ANON_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "check_progress",
    "user_id": "uuid-do-usuario",
    "event_id": "uuid-do-desafio"
  }'
```

---

## 📋 PASSO 4: Validar Frontend

### 4.1. Verificar Componentes

- ✅ `src/components/client/ChallengesSection.jsx` existe
- ✅ `src/hooks/useChallenges.js` existe
- ✅ Integrado em `GamificationTabEnhanced.jsx`

### 4.2. Testar Localmente

```bash
pnpm dev
```

Navegue para: `http://localhost:5173/dashboard` → Aba "Pontos" → Seção "Eventos"

**Deve mostrar:**
- Card de cada desafio ativo
- Botão "Participar do Desafio"
- Barra de progresso
- Timer com dias/horas restantes

### 4.3. Fluxo de Teste

1. Usuário clica em "Participar do Desafio"
2. Hook `useChallenges` insere em `user_event_participation`
3. Realtime subscription atualiza UI
4. Usuário completa atividades (check-ins, planos, etc)
5. Hook chama `check_progress` periodicamente (5 min)
6. Ao completar: confetti + toast + achievement

---

## 📋 PASSO 5: Seed Desafios Iniciais

Execute via SQL Editor ou função:

```sql
-- Seed manual (caso a Edge Function não esteja disponível)
INSERT INTO gamification_events (
  name, description, event_type, category,
  start_date, end_date, 
  requirements, rewards, is_active
)
VALUES
(
  '7 Dias de Movimento',
  'Complete pelo menos uma atividade física por dia durante 7 dias consecutivos',
  'challenge',
  'weekly',
  NOW(),
  NOW() + INTERVAL '7 days',
  '{"type": "daily_streak", "target": 7}'::jsonb,
  '{"xp": 500, "achievement": "seven_day_warrior"}'::jsonb,
  true
);
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Migration aplicada com sucesso (verificar no Database → Tables)
- [ ] Edge Function `challenge-manager` deployada
- [ ] Teste de geração de desafio semanal OK
- [ ] Teste de geração de desafio mensal OK
- [ ] Frontend renderiza desafios na aba Pontos
- [ ] Botão "Participar" funciona
- [ ] Progress bar atualiza
- [ ] Confetti dispara ao completar
- [ ] Achievement concedido ao completar

---

## 🐛 TROUBLESHOOTING

### Erro: "exec_sql function not found"
**Solução:** Aplicar migration via SQL Editor manualmente

### Erro: "CORS" ao chamar Edge Function
**Solução:** Verificar se função está deployada e URL está correta

### Progresso não atualiza
**Solução:** Verificar se polling está ativo (5 min) e realtime subscription conectada

### Achievements não concedem
**Solução:** Verificar se códigos em `achievements` table correspondem aos da Edge Function

---

## 📚 REFERÊNCIAS

- **Documento Mestre:** `docs/documento_mestre_vida_smart_coach_final.md` (Ciclo 42)
- **Migration:** `supabase/migrations/20251112_enhance_challenges_system.sql`
- **Edge Function:** `supabase/functions/challenge-manager/index.ts`
- **Frontend:** `src/components/client/ChallengesSection.jsx`
- **Hook:** `src/hooks/useChallenges.js`

---

**Status:** 🔄 Aguardando aplicação manual da migration e deploy da Edge Function
**Próximo Passo:** Aplicar migration via Supabase Dashboard SQL Editor
