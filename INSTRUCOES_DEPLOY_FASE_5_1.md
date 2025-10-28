# 🚀 INSTRUÇÕES DE DEPLOY - Fase 5.1 (Parcial)

**Data:** 27/10/2025  
**Status:** 5 de 8 tarefas concluídas (62.5%)  
**Arquivos para deploy:** 9 arquivos criados/modificados

---

## ✅ PRÉ-REQUISITOS

- [ ] Acesso ao painel Supabase (SQL Editor)
- [ ] Acesso ao repositório Git
- [ ] Vercel CLI configurado (opcional)
- [ ] Node.js 18+ instalado

---

## 📋 CHECKLIST DE DEPLOY

### PASSO 1: Backup do Banco de Dados
```sql
-- Executar no SQL Editor do Supabase
-- Backup das tabelas que serão modificadas
CREATE TABLE IF NOT EXISTS gamification_backup_20251027 AS SELECT * FROM gamification;
```

### PASSO 2: Aplicar Views Unificadas
```sql
-- Copiar TODO o conteúdo de: EXECUTE_UNIFIED_XP_VIEWS.sql
-- Colar no SQL Editor e executar

-- Verificar criação
SELECT COUNT(*) FROM v_user_xp_totals;
SELECT COUNT(*) FROM v_weekly_ranking;

-- Deve retornar quantidade de usuários (sem erros)
```

### PASSO 3: Aplicar Sistema de Recompensas
```sql
-- Copiar TODO o conteúdo de: EXECUTE_REWARDS_SYSTEM.sql
-- Colar no SQL Editor e executar

-- Verificar criação
SELECT COUNT(*) FROM rewards;
SELECT COUNT(*) FROM v_rewards_catalog;

-- Deve retornar 5 recompensas de exemplo
```

### PASSO 4: Testar Função de Validação
```sql
-- Substituir UUIDs pelos valores reais de um usuário e recompensa
SELECT * FROM validate_reward_redemption(
  'UUID_DO_USUARIO_TESTE'::uuid,
  (SELECT id FROM rewards LIMIT 1)
);

-- Deve retornar estrutura:
-- is_valid | error_message | user_xp | reward_cost | available_stock
```

### PASSO 5: Commit do Código Frontend
```bash
# Na raiz do projeto
git status

# Verificar arquivos modificados:
# - src/hooks/useUserXP.js (novo)
# - src/pages/RewardsPage.jsx (novo)
# - src/components/client/ClientHeader.jsx (modificado)
# - src/App.tsx (modificado)
# - supabase/migrations/*.sql (novos)
# - docs/*.md (modificados)

git add .
git commit -m "feat(fase-5.1): XP unificado e loja de recompensas

- Views: v_user_xp_totals, v_weekly_ranking
- Sistema de recompensas: rewards, redemptions, coupons
- Hook useUserXP com realtime subscription
- RewardsPage com catálogo, filtros e histórico
- ClientHeader atualizado para exibir XP consolidado

Closes #ISSUE_NUMBER"

git push origin main
```

### PASSO 6: Verificar Deploy Automático no Vercel
- [ ] Acessar: https://vercel.com/seu-projeto/deployments
- [ ] Aguardar build completar (3-5 minutos)
- [ ] Verificar logs de build sem erros

### PASSO 7: Testar em Produção

#### Teste 1: Header com XP
- [ ] Fazer login em https://seu-dominio.com
- [ ] Verificar exibição de XP total no header (canto superior direito)
- [ ] Verificar badge de nível (se level > 0)
- [ ] Abrir DevTools → Network → verificar query em v_user_xp_totals

#### Teste 2: Loja de Recompensas
- [ ] Acessar https://seu-dominio.com/rewards
- [ ] Verificar exibição do saldo de XP
- [ ] Clicar nos filtros de categoria (Todas, Experiências, etc)
- [ ] Verificar cards de recompensas com imagens
- [ ] Tentar resgatar uma recompensa (com XP suficiente)
- [ ] Verificar toast de sucesso
- [ ] Ir para aba "Meus Resgates"
- [ ] Verificar resgate aparece no histórico com status "Pendente"

#### Teste 3: Validação de Regras
- [ ] Tentar resgatar recompensa sem XP suficiente → Deve exibir erro
- [ ] Verificar badge de "X restantes" em recompensas com estoque limitado
- [ ] Verificar indicador "Faltam X XP" quando insuficiente

---

## 🔍 TROUBLESHOOTING

### Erro: "relation v_user_xp_totals does not exist"
**Causa:** View não foi criada no banco  
**Solução:**
```sql
-- Executar EXECUTE_UNIFIED_XP_VIEWS.sql novamente no SQL Editor
```

### Erro: "permission denied for table rewards"
**Causa:** RLS policies não foram aplicadas  
**Solução:**
```sql
-- Verificar se RLS está ativo
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('rewards', 'reward_redemptions', 'reward_coupons');

-- Se rowsecurity = false, executar:
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_coupons ENABLE ROW LEVEL SECURITY;
```

### Erro: "XP não atualiza em tempo real"
**Causa:** Realtime subscription não configurado  
**Solução:**
```sql
-- No painel Supabase → Database → Replication
-- Habilitar para tabelas: gamification, daily_activities
```

### Erro: "Imagens de recompensas não carregam"
**Causa:** URLs de exemplo são externas (Unsplash)  
**Solução:**
```sql
-- Substituir URLs por imagens hospedadas em Supabase Storage
UPDATE rewards SET image_url = 'https://seu-projeto.supabase.co/storage/v1/object/public/rewards/imagem.jpg';
```

### Erro: Build falha no Vercel com "Cannot find module useUserXP"
**Causa:** Alias @/ não resolvido  
**Solução:**
```bash
# Verificar tsconfig.json ou jsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 📊 MÉTRICAS PÓS-DEPLOY

### Queries de Monitoramento

```sql
-- 1. Quantos usuários têm XP registrado?
SELECT COUNT(*) FROM v_user_xp_totals WHERE xp_total > 0;

-- 2. Distribuição de níveis
SELECT level, COUNT(*) as usuarios 
FROM v_user_xp_totals 
GROUP BY level 
ORDER BY level;

-- 3. Recompensas mais populares
SELECT r.title, COUNT(rd.id) as total_resgates
FROM rewards r
LEFT JOIN reward_redemptions rd ON rd.reward_id = r.id
GROUP BY r.id, r.title
ORDER BY total_resgates DESC
LIMIT 10;

-- 4. XP médio por usuário
SELECT 
  AVG(xp_total) as xp_medio,
  MAX(xp_total) as xp_maximo,
  MIN(xp_total) as xp_minimo
FROM v_user_xp_totals;

-- 5. Ranking semanal atual
SELECT * FROM v_weekly_ranking 
WHERE week_start = DATE_TRUNC('week', CURRENT_DATE)::DATE
ORDER BY xp_semana DESC
LIMIT 10;
```

---

## 🎯 PRÓXIMOS PASSOS

Após deploy validado, implementar tarefas restantes:

1. **Calendário de Vida** (Etapa 6)
   - Integração Google Calendar API
   - Sincronização bidirecional
   - Visualização de planos agendados

2. **Edge Function reward-redeem** (Etapa 7)
   - Processamento assíncrono de resgates
   - Geração automática de cupons
   - Webhooks para parceiros

3. **Fluxos WhatsApp** (Etapa 8)
   - Aprovação de plano via chat
   - Ofertas de recompensa ao completar desafios
   - Lembretes inteligentes de atividades

---

## 📞 SUPORTE

Em caso de problemas, consultar:
- **Logs Supabase:** Dashboard → Logs
- **Logs Vercel:** Deployments → Build Logs
- **Documento Mestre:** `docs/documento_mestre_vida_smart_coach_final.md`
- **Resumo Executivo:** `RESUMO_FASE_5_1_PARCIAL.md`

---

**Criado por:** Agente Autônomo - Ciclo 20  
**Data:** 27/10/2025  
**Versão:** 1.0
