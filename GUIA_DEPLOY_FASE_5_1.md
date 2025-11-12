# 🚀 GUIA DE DEPLOY - FASE 5.1 REWARDS SYSTEM

**Data:** 29/10/2025  
**Ciclo:** 32  
**Status:** Edge Functions ✅ | Migrations ⏸️ Aguardando execução manual

---

## ✅ JÁ DEPLOYADO

### Edge Functions (Supabase)
- ✅ `ia-coach-chat` - Atualizada 29/10 01:16:56
  - Sistema de reward offers (5 triggers inteligentes)
  - Integração com v_rewards_catalog
  - Prompts empáticos e contextualizados
  
- ✅ `reward-redeem` - Deployada 29/10 01:18:00
  - Validação de resgates via RPC
  - Geração de cupom único (XXXX-XXXX-XXXX)
  - Débito seguro de XP com rollback
  - Logging de eventos gamification
  
- ✅ `generate-plan` - Atualizada 28/10 14:27:02
  - Loop de feedback integrado
  - Processa plan_feedback pendentes
  - Marca como processado após regeneração

### Frontend (Vercel)
- ✅ RewardsPage completa (catalog, filters, history)
- ✅ CalendarTab com eventos de check-ins
- ✅ useUserXP hook com realtime subscription
- ✅ Header atualizado com XP consolidado
- ✅ useLifeCalendar hook para calendar sync

---

## ⏸️ PENDENTE - AÇÃO NECESSÁRIA

### 📋 Migrations SQL (Execução Manual)

**ARQUIVO:** `scripts/apply_all_migrations.sql` (427 linhas)

**INSTRUÇÕES:**

1. **Abrir SQL Editor:**
   ```
   https://supabase.com/dashboard/project/zzugbgoylwbaojdunuz/sql/new
   ```

2. **Copiar SQL:**
   - Abrir `scripts/apply_all_migrations.sql`
   - Copiar TODO o conteúdo (Ctrl+A, Ctrl+C)

3. **Colar e Executar:**
   - Colar no SQL Editor do Supabase
   - Clicar em "RUN" (botão verde)
   - Aguardar ~5-10 segundos
   - Verificar logs no console

4. **Validar Sucesso:**
   Deve aparecer:
   ```
   ✅ Migration aplicada com sucesso!
   ```

---

## 🔍 VALIDAÇÃO PÓS-DEPLOY

### Queries de Verificação

Execute no SQL Editor para confirmar:

```sql
-- 1. Verificar VIEWS (deve retornar 3 linhas)
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('v_user_xp_totals', 'v_weekly_ranking', 'v_rewards_catalog');

-- 2. Verificar TABLES (deve retornar 3 linhas)
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('rewards', 'reward_redemptions', 'reward_coupons');

-- 3. Verificar FUNCTIONS (deve retornar 2 linhas)
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('validate_reward_redemption', 'debit_user_xp');

-- 4. Testar VIEW de XP (deve mostrar usuários com XP)
SELECT user_id, xp_total, level, current_streak 
FROM v_user_xp_totals 
LIMIT 5;

-- 5. Testar CATÁLOGO (deve mostrar 5 recompensas)
SELECT id, title, xp_cost, available_stock, category
FROM v_rewards_catalog
ORDER BY xp_cost;
```

**Resultados Esperados:**
- ✅ 3 views criadas
- ✅ 3 tabelas criadas
- ✅ 2 funções criadas
- ✅ View v_user_xp_totals retorna dados dos usuários
- ✅ View v_rewards_catalog retorna 5 recompensas

---

## 🧪 TESTES E2E

### 1. Frontend (Web Panel)

**RewardsPage:**
```
URL: https://appvidasmarte.com/dashboard/rewards

Checklist:
□ Catálogo carrega com 5 recompensas
□ Filtros funcionam (categoria, XP range)
□ Botão "Resgatar" chama Edge Function
□ Toast mostra código do cupom após resgate
□ Aba "Histórico" mostra redemptions
□ XP é debitado após resgate bem-sucedido
```

**CalendarTab:**
```
URL: https://appvidasmarte.com/dashboard

Checklist:
□ Calendar renderiza eventos de check-ins
□ Plan completions aparecem como events
□ Navegação entre meses funciona
□ Tooltip mostra detalhes dos eventos
```

**Header:**
```
Checklist:
□ XP total consolidado aparece
□ Badge de nível correto (xp / 1000)
□ Progress bar para próximo nível
□ Realtime update quando XP muda
```

### 2. WhatsApp Flows

**Reward Offers (5 Triggers):**

1. **completedActivity** - Após completar exercício/refeição
   ```
   Usuário: "Finalizei o treino de pernas"
   IA: [detecta completion] → [oferece recompensa]
   Esperado: Mensagem com 🎁 sugerindo 1-3 rewards acessíveis
   ```

2. **milestone** - Ao atingir marco de XP (múltiplo de 1000)
   ```
   Usuário ganha XP e atinge 5000 total
   IA: [detecta milestone] → [celebra e oferece reward]
   Esperado: Parabéns + sugestão de recompensas especiais
   ```

3. **streak** - Ao manter streak de 7+ dias
   ```
   Usuário completa 7º dia consecutivo
   IA: [detecta streak 7+] → [reconhece disciplina]
   Esperado: Celebração + oferta de reward exclusivo
   ```

4. **levelUp** - Ao subir nível (múltiplo de 5)
   ```
   Usuário atinge nível 5, 10, 15...
   IA: [detecta level % 5 == 0] → [oferece upgrade]
   Esperado: Parabéns + rewards premium
   ```

5. **highXP** - Com XP alto (>5000) - 30% chance aleatória
   ```
   Usuário conversa com >5000 XP
   IA: [30% chance] → [lembra das recompensas]
   Esperado: Lembrete casual das opções disponíveis
   ```

**Redemption Flow:**
```
1. IA oferece recompensa
2. Usuário: "Quero resgatar o e-book"
3. IA: [chama Edge Function reward-redeem]
4. Edge Function:
   - Valida (XP suficiente, estoque)
   - Cria redemption
   - Gera cupom (XXXX-XXXX-XXXX)
   - Debita XP
   - Retorna sucesso
5. IA: "Resgatado! Cupom: ABCD-1234-EFGH"
6. Painel web atualiza automaticamente (realtime)
```

---

## 📊 MONITORAMENTO

### Edge Functions Logs

**Supabase Dashboard:**
```
https://supabase.com/dashboard/project/zzugbgoylwbaojdunuz/functions

Verificar:
□ ia-coach-chat: sem erros nas últimas 24h
□ reward-redeem: invocations com 200 OK
□ generate-plan: regenerações com feedbacks processados
□ Response times < 5s (ia-coach-chat pode chegar a 100s)
```

### Métricas de Sucesso

**KPIs Esperados:**
- Reward offer rate: ~15-20% das conversas
- Redemption conversion: ~30-40% das ofertas
- XP debit success rate: 100% (com rollback)
- Calendar event sync: 100% dos check-ins
- Frontend realtime latency: <500ms

### Sentry Alerts

```
https://sentry.io/vida-smart-coach

Alertas Críticos a Monitorar:
□ ReferenceError em Edge Functions
□ RLS policy violations
□ XP debit failures
□ Coupon generation duplicates
□ Calendar sync errors
```

---

## 🐛 TROUBLESHOOTING

### Problema: Tabelas não criadas após SQL
**Solução:**
1. Verificar logs do SQL Editor
2. Se erro "already exists", tudo OK (idempotente)
3. Se erro de permissão, usar service_role no .env
4. Executar queries de validação acima

### Problema: Reward offers não aparecem no WhatsApp
**Diagnóstico:**
1. Verificar logs da ia-coach-chat
2. Confirmar v_rewards_catalog tem dados
3. Testar query: `SELECT * FROM v_rewards_catalog WHERE xp_cost <= 3000`
4. Verificar se contextData.gamification tem total_points

### Problema: Resgate falha com "XP insuficiente"
**Diagnóstico:**
1. Verificar XP do usuário: `SELECT total_points FROM gamification WHERE user_id = '...'`
2. Testar validação: `SELECT * FROM validate_reward_redemption('user_id', 'reward_id')`
3. Confirmar estoque disponível na view v_rewards_catalog

### Problema: Calendar não mostra eventos
**Diagnóstico:**
1. Verificar plan_completions tem dados: `SELECT * FROM plan_completions WHERE user_id = '...'`
2. Testar useLifeCalendar hook no console do browser
3. Confirmar realtime subscription ativa
4. Verificar filtro de datas no CalendarTab

---

## ✅ CHECKLIST FINAL

**Antes de considerar deploy completo:**

- [ ] SQL migrations aplicadas no Supabase
- [ ] 3 views + 3 tables + 2 functions criadas
- [ ] Edge Functions sem erros nos logs
- [ ] RewardsPage carrega catálogo
- [ ] Resgate via frontend funciona
- [ ] WhatsApp reward offers aparecem
- [ ] Redemption via WhatsApp gera cupom
- [ ] XP é debitado corretamente
- [ ] Calendar mostra eventos
- [ ] Header mostra XP consolidado
- [ ] Realtime updates funcionando
- [ ] Sem erros no Sentry (24h)

**Quando todos os itens estiverem ✅:**
→ **Fase 5.1 100% DEPLOYADA EM PRODUÇÃO! 🎉**

---

## 📝 PRÓXIMOS PASSOS

**Sprint 2 Continuação:**
1. Google Calendar bidirectional sync (P1)
2. AnimatedCounter com error boundaries (P1)
3. Visual Polish - design tokens (P1)
4. Questionário 4 Pilares v2.1 (P1)
5. Página de assinatura/upgrade Stripe (P2)
6. Coleta de métricas automatizada (P2)

**Melhorias Futuras:**
- Notificações push para reward offers
- Gamification leaderboard público
- Rewards partner dashboard
- A/B testing de prompts de ofertas
- Analytics de conversion funnel

---

**Última Atualização:** 29/10/2025 08:50  
**Responsável:** Agente Autônomo Ciclo 32  
**Status:** ⏸️ Aguardando execução manual de SQL migrations
