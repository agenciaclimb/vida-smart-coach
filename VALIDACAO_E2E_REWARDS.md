# Validação E2E — Fase 5.1 (Rewards + WhatsApp)

Objetivo: Validar ponta a ponta as ofertas de recompensa no WhatsApp e o fluxo de resgate via Edge Function `reward-redeem`, garantindo geração de cupom, débito de XP e reflexão no Dashboard.

## Pré-requisitos
- Usuário autenticado (Supabase Auth) com telefone cadastrado (formato: 55DDDNNNNNNN)
- Edge Functions publicadas: `ia-coach-chat`, `reward-redeem`
- Migrations aplicadas: views (`v_user_xp_totals`, `v_weekly_ranking`, `v_rewards_catalog`), tabelas (`rewards`, `reward_redemptions`, `reward_coupons`), funções (`validate_reward_redemption`, `debit_user_xp`)

## Cenários de Teste (WhatsApp)
1. completedActivity
   - Marque um item de plano como concluído no painel e envie uma mensagem de progresso no WhatsApp.
   - Esperado: IA sugere 1-3 recompensas compatíveis com seu XP atual.

2. milestone (>= 1000 XP)
   - Alcançar/exceder 1000 XP. Enviar mensagem celebrando.
   - Esperado: oferta de recompensa.

3. streak >= 7
   - Manter streak de 7 dias. Enviar mensagem.
   - Esperado: oferta de recompensa.

4. levelUp múltiplos de 5
   - Ao subir para níveis 5, 10, 15, ... interagir no chat.
   - Esperado: oferta de recompensa.

5. highXP > 5000
   - Com XP alto, enviar mensagem. (Oferta com 30% de chance para não soar “spam”.)
   - Esperado: oferta de recompensa.

## Cenários de Teste (Resgate)
1. Resgate por Catálogo (Web)
   - Abra a página Recompensas → clique em Resgatar em um item com XP suficiente.
   - Esperado: toast sucesso com código de cupom (formato XXXX-XXXX-XXXX), XP debitado, histórico atualizado.

2. Resgate Induzido pela IA (quando aplicável)
   - Após oferta no WhatsApp, a IA pode orientar a abrir o catálogo ou fornecer código (quando fluxo permitir).

## Validação de Banco de Dados
Execute no SQL Editor do Supabase:
```sql
-- Confirme tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' AND table_name IN ('rewards','reward_redemptions','reward_coupons');

-- Últimos 5 resgates
SELECT id, user_id, reward_id, xp_spent, status, created_at 
FROM reward_redemptions 
ORDER BY created_at DESC 
LIMIT 5;

-- Cupons recentes
SELECT id, redemption_id, code, expires_at, used 
FROM reward_coupons 
ORDER BY created_at DESC 
LIMIT 5;

-- XP Atual do Usuário
SELECT user_id, xp_total, level FROM v_user_xp_totals 
WHERE user_id = '<USER_ID>';
```

## Critérios de Aceitação
- [ ] IA sugere recompensas em pelo menos 3 dos 5 gatilhos testados
- [ ] Resgate gera código e debita XP corretamente (sem negativos)
- [ ] Histórico de resgates visível e restrito ao usuário (RLS)
- [ ] Header exibe XP atualizado imediatamente após resgate
- [ ] Nenhum erro nas Edge Functions (logs limpos)

## Troubleshooting
- Oferta não apareceu: Verifique XP/streak/nível e tente outro gatilho.
- Resgate falhou (403/401): Checar Bearer token no frontend (session.access_token).
- Débito não ocorreu: Verificar função `debit_user_xp` e rollback do fluxo.
- Erros em Deno no editor: ignorar localmente; validar via dashboard Supabase.

## Métricas (pós-teste)
- Offer rate (% conversas com oferta)
- Redemption conversion (% ofertas que viram resgate)
- Tempo de resposta (ms) das funçõ
