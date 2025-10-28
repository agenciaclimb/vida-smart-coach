# 🚀 GUIA DE DEPLOY - FASE 5.1

## ⚡ Quick Deploy (3 passos essenciais)

### 1️⃣ Deploy das SQL Migrations
Execute no **Supabase SQL Editor** (nessa ordem):

```sql
-- 1. Views de XP unificado
-- Cole todo o conteúdo de: EXECUTE_UNIFIED_XP_VIEWS.sql
```

```sql
-- 2. Sistema de Recompensas completo
-- Cole todo o conteúdo de: EXECUTE_REWARDS_SYSTEM.sql
```

### 2️⃣ Deploy da Edge Function

```bash
# Navegue até a pasta do projeto
cd c:\Users\JE\vida-smart-coach

# Deploy da função reward-redeem
npx supabase functions deploy reward-redeem

# Verificar deploy
npx supabase functions list
```

### 3️⃣ Deploy do Frontend

```bash
# Build da aplicação
npm run build

# (Opcional) Preview local
npm run preview

# Deploy automático via Vercel/Netlify (se configurado)
# OU copie a pasta dist/ para seu servidor
```

---

## 🔍 Verificação Pós-Deploy

### ✅ Verificar Views SQL
```sql
-- Teste a view de XP
SELECT * FROM v_user_xp_totals LIMIT 5;

-- Teste a view de recompensas
SELECT * FROM v_rewards_catalog;
```

### ✅ Verificar Edge Function
```bash
# Teste local (se necessário)
curl -X POST https://seu-projeto.supabase.co/functions/v1/reward-redeem \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rewardId": "uuid-da-recompensa"}'
```

### ✅ Verificar Frontend
1. Acesse `/dashboard?tab=calendar` - Deve mostrar o calendário
2. Acesse `/rewards` - Deve mostrar catálogo de recompensas
3. Verifique XP no header - Deve mostrar total consolidado
4. Teste resgate de recompensa (se houver XP disponível)

---

## 🐛 Troubleshooting

### Problema: View não encontrada
**Solução:** Execute novamente o SQL do arquivo `EXECUTE_UNIFIED_XP_VIEWS.sql`

### Problema: Função reward-redeem retorna 500
**Solução:** 
1. Verifique logs: `npx supabase functions logs reward-redeem`
2. Confirme que `debit_user_xp` foi criado no SQL
3. Verifique permissões RLS

### Problema: Calendário não carrega atividades
**Solução:**
1. Verifique se `daily_activities` tem dados
2. Confirme que `activity_date` está no formato correto (YYYY-MM-DD)
3. Verifique RLS policies da tabela

### Problema: Resgate de recompensa falha
**Solução:**
1. Confirme XP disponível: `SELECT * FROM v_user_xp_totals WHERE user_id = 'seu-uuid'`
2. Verifique estoque: `SELECT * FROM v_rewards_catalog WHERE id = 'reward-uuid'`
3. Teste validação: `SELECT * FROM validate_reward_redemption('user-uuid', 'reward-uuid')`

---

## 📦 Arquivos Criados (Checklist)

### SQL
- [x] `EXECUTE_UNIFIED_XP_VIEWS.sql`
- [x] `EXECUTE_REWARDS_SYSTEM.sql`
- [x] `supabase/migrations/20251027143000_create_unified_xp_views.sql`
- [x] `supabase/migrations/20251027144000_create_rewards_system.sql`
- [x] `supabase/migrations/20251027150000_add_debit_xp_function.sql`

### Edge Functions
- [x] `supabase/functions/reward-redeem/index.ts`
- [x] `supabase/functions/ia-coach-chat/index.ts` (modificado)

### Frontend
- [x] `src/components/client/CalendarTab.jsx`
- [x] `src/hooks/useUserXP.js`
- [x] `src/pages/RewardsPage.jsx`
- [x] `src/components/client/ClientHeader.jsx` (modificado)
- [x] `src/pages/ClientDashboard.jsx` (modificado)
- [x] `src/components/client/MobileBottomNav.jsx` (modificado)

### Documentação
- [x] `FASE_5_1_COMPLETA.md`
- [x] `DEPLOY_FASE_5_1.md` (este arquivo)

---

## 🎯 Teste de Integração Completo

### Cenário 1: Novo Usuário
1. ✅ Cadastro → Header mostra "0 XP - Nível 1"
2. ✅ Completa 1 atividade → XP aumenta automaticamente
3. ✅ Acessa `/rewards` → Vê recompensas disponíveis
4. ✅ Tenta resgatar sem XP → Mensagem de erro apropriada

### Cenário 2: Usuário Ativo
1. ✅ WhatsApp: Completa atividade → IA Coach oferece recompensa
2. ✅ Acumula 500 XP → Pode resgatar primeira recompensa
3. ✅ Resgata recompensa → Recebe cupom, XP é debitado
4. ✅ Calendário mostra atividades planejadas do mês

### Cenário 3: Power User
1. ✅ Atinge 7 dias de streak → Oferta especial no WhatsApp
2. ✅ Level up (nível 5, 10, 15) → Celebração + oferta
3. ✅ Visualiza histórico de resgates
4. ✅ Cupons com data de expiração clara

---

## 🔐 Segurança - Checklist Final

- [x] RLS habilitado em `rewards`
- [x] RLS habilitado em `reward_redemptions`
- [x] RLS habilitado em `reward_coupons`
- [x] Edge Function valida Bearer token
- [x] SQL functions com SECURITY DEFINER adequado
- [x] Validação de XP disponível antes do resgate
- [x] Proteção contra XP negativo (GREATEST)
- [x] Transações atômicas com rollback

---

## 📊 Monitoramento Sugerido

### Métricas para Acompanhar
1. **Taxa de Resgate:** % usuários que resgatam recompensas
2. **XP Médio:** Média de XP por usuário ativo
3. **Recompensas Populares:** Quais são mais resgatadas
4. **Tempo para Primeiro Resgate:** Quantos dias até o primeiro resgate
5. **Erros de Resgate:** Logs de falhas (estoque, XP insuficiente)

### Queries Úteis
```sql
-- Taxa de engajamento com recompensas
SELECT 
  COUNT(DISTINCT user_id) as usuarios_com_resgate,
  (SELECT COUNT(*) FROM auth.users) as total_usuarios,
  ROUND(100.0 * COUNT(DISTINCT user_id) / (SELECT COUNT(*) FROM auth.users), 2) as taxa_engajamento
FROM reward_redemptions;

-- Recompensas mais populares
SELECT 
  r.name,
  COUNT(*) as total_resgates,
  SUM(rr.xp_spent) as xp_total_gasto
FROM reward_redemptions rr
JOIN rewards r ON r.id = rr.reward_id
GROUP BY r.name
ORDER BY total_resgates DESC;

-- XP médio por usuário
SELECT 
  AVG(xp_total) as xp_medio,
  AVG(level) as nivel_medio,
  AVG(active_days) as dias_ativos_medio
FROM v_user_xp_totals;
```

---

## 🎉 Pronto para Produção!

Após completar este checklist, o sistema está pronto para:
- ✅ Receber usuários reais
- ✅ Processar resgates de recompensas
- ✅ Oferecer recompensas via WhatsApp
- ✅ Visualizar calendário de atividades
- ✅ Tracking de XP em tempo real

**Próximo passo:** Monitorar métricas e iterar baseado no feedback dos usuários.

---

**Deploy preparado por:** GitHub Copilot  
**Data:** 27/10/2025  
**Versão:** 5.1.0
