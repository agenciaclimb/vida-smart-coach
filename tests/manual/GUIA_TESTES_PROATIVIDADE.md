# 🧪 Guia de Testes Manuais - Sistema de Proatividade WhatsApp

## Data: 11/11/2025
## Versão: 1.0
## Responsável: QA Team

---

## 📋 PRÉ-REQUISITOS

### Setup de Ambiente
- [ ] Edge Function `ia-coach-chat` deployada (versão com proatividade)
- [ ] Migration `20251111_create_proactive_messages.sql` aplicada
- [ ] Usuário de teste configurado com:
  - XP: 5500+ (para testar `xp_threshold`)
  - Streak: 8+ dias (para testar `streak_at_risk`)
  - Plano ativo nos 4 pilares
  - WhatsApp conectado à Evolution API

### Ferramentas
- Supabase Dashboard (monitorar tabelas)
- WhatsApp (conversa com IA)
- Postman/cURL (testes diretos da API, opcional)

---

## 🎯 TESTES DE REGRAS PROATIVAS

### Teste 1: XP Threshold (>5000 XP)
**Objetivo:** Validar sugestão de recompensas quando XP alto

**Passos:**
1. Confirmar XP do usuário >5000 no dashboard
   ```sql
   SELECT total_points FROM gamification WHERE user_id = 'USER_ID';
   ```
2. Não ter resgatado recompensas nos últimos 7 dias
3. Enviar mensagem qualquer no WhatsApp
4. **Resultado Esperado:** IA menciona XP acumulado e sugere recompensas

**Critérios de Aceitação:**
- [ ] Mensagem proativa enviada
- [ ] Conteúdo menciona XP atual
- [ ] Sugere catálogo de recompensas
- [ ] Tom motivacional e positivo
- [ ] Registro em `proactive_messages` com `message_type = 'xp_threshold'`

**Validação SQL:**
```sql
SELECT * FROM proactive_messages 
WHERE user_id = 'USER_ID' 
AND message_type = 'xp_threshold'
ORDER BY sent_at DESC LIMIT 1;
```

---

### Teste 2: Streak at Risk (7+ dias)
**Objetivo:** Validar alerta quando streak em risco

**Passos:**
1. Confirmar streak ≥7 dias
   ```sql
   SELECT current_streak FROM gamification WHERE user_id = 'USER_ID';
   ```
2. Não registrar atividade hoje
3. Enviar mensagem no WhatsApp
4. **Resultado Esperado:** IA alerta sobre streak em risco

**Critérios de Aceitação:**
- [ ] Mensagem urgente sobre streak
- [ ] Menciona número de dias consecutivos
- [ ] Emoji 🔥 presente
- [ ] Call-to-action para registrar atividade
- [ ] Registro em `proactive_messages` com `message_type = 'streak_at_risk'`

---

### Teste 3: Milestone Achieved (múltiplo de 1000)
**Objetivo:** Validar celebração em milestones de XP

**Passos:**
1. Ajustar XP do usuário para múltiplo de 1000 (ex: 6000)
   ```sql
   UPDATE gamification SET total_points = 6000 WHERE user_id = 'USER_ID';
   ```
2. Completar atividade que ganhe XP
3. **Resultado Esperado:** IA celebra milestone alcançado

**Critérios de Aceitação:**
- [ ] Mensagem começa com 🎉
- [ ] Menciona milestone específico (ex: "6000 XP")
- [ ] Tom celebratório
- [ ] Reforço positivo
- [ ] Registro em `proactive_messages` com `message_type = 'milestone_achieved'`

---

### Teste 4: Inactive 24h
**Objetivo:** Validar lembrete após inatividade

**Passos:**
1. Simular inatividade (ajustar `created_at` da última mensagem em `conversation_memory`)
   ```sql
   UPDATE conversation_memory 
   SET created_at = NOW() - INTERVAL '25 hours'
   WHERE user_id = 'USER_ID' 
   AND role = 'user'
   ORDER BY created_at DESC LIMIT 1;
   ```
2. Aguardar trigger automático OU enviar mensagem
3. **Resultado Esperado:** IA envia lembrete amigável

**Critérios de Aceitação:**
- [ ] Tom amigável, não acusatório
- [ ] Pergunta como o usuário está
- [ ] Menciona importância de consistência
- [ ] Emoji positivo (💪, 👋)
- [ ] Registro em `proactive_messages` com `message_type = 'inactive_24h'`

---

### Teste 5: Progress Stagnant (3+ dias sem completions)
**Objetivo:** Validar sugestões quando progresso parado

**Passos:**
1. Confirmar última atividade foi há 3+ dias
   ```sql
   SELECT MAX(completed_at) FROM daily_activities 
   WHERE user_id = 'USER_ID' AND is_completed = true;
   ```
2. Enviar mensagem no WhatsApp
3. **Resultado Esperado:** IA oferece ajuda/ajuste de plano

**Critérios de Aceitação:**
- [ ] Tom empático
- [ ] Pergunta sobre dificuldades
- [ ] Oferece ajustar plano
- [ ] Menciona estar disponível para apoiar
- [ ] Registro em `proactive_messages` com `message_type = 'progress_stagnant'`

---

### Teste 6: Repeated Difficulties
**Objetivo:** Validar detecção de dificuldades repetidas

**Passos:**
1. Inserir 3+ feedbacks negativos sobre mesmo pilar
   ```sql
   INSERT INTO plan_feedback (user_id, plan_type, item_pillar, feedback_text)
   VALUES 
   ('USER_ID', 'physical', 'physical', 'muito difícil'),
   ('USER_ID', 'physical', 'physical', 'não consigo fazer'),
   ('USER_ID', 'physical', 'physical', 'muito pesado');
   ```
2. Enviar mensagem no WhatsApp
3. **Resultado Esperado:** IA oferece ajuste específico do pilar

**Critérios de Aceitação:**
- [ ] Identifica pilar com dificuldade
- [ ] Tom compreensivo
- [ ] Oferece ajuste/alternativas
- [ ] Emoji de apoio (💙, ✨)
- [ ] Registro em `proactive_messages` com `message_type = 'repeated_difficulties'`

---

### Teste 7: Checkin Missed (após 20h)
**Objetivo:** Validar nudge para check-in diário

**Passos:**
1. Aguardar até 20h+ (horário Brasília)
2. Não ter registrado atividade hoje
3. Enviar mensagem no WhatsApp
4. **Resultado Esperado:** IA lembra do check-in

**Critérios de Aceitação:**
- [ ] Enviado apenas após 20h
- [ ] Menciona "ainda dá tempo"
- [ ] Call-to-action claro
- [ ] Tom motivacional, não pressionador
- [ ] Registro em `proactive_messages` com `message_type = 'checkin_missed'`

---

### Teste 8: Success Pattern (7/14/21/30 dias)
**Objetivo:** Validar reforço positivo em padrões de sucesso

**Passos:**
1. Confirmar streak em milestone (7, 14, 21 ou 30 dias)
2. Registrar atividade consecutiva
3. **Resultado Esperado:** IA celebra padrão de sucesso

**Critérios de Aceitação:**
- [ ] Reconhece número exato de dias
- [ ] Tom celebratório
- [ ] Reforço sobre consistência
- [ ] Emoji de celebração (🌟, 🎊)
- [ ] Registro em `proactive_messages` com `message_type = 'success_pattern'`

---

## 🎮 TESTES DE GAMIFICAÇÃO VISUAL

### Teste 9: XP Summary Após Check-in
**Objetivo:** Validar exibição de XP após atividade

**Passos:**
1. Completar check-in (manhã/tarde/noite)
2. Observar resposta da IA

**Critérios de Aceitação:**
- [ ] Mostra "+XX XP conquistados!"
- [ ] Progress bar ASCII presente (`█████░░░░░`)
- [ ] Indica nível atual
- [ ] Mostra XP total
- [ ] Indica % para próximo nível
- [ ] Badge de nível correto (🔰/✨/🌟/⭐/💎/👑)

**Exemplo Esperado:**
```
✨ +50 XP conquistados!

✨ Nível 5
🏆 Total: 5,550 XP
█████████░ 90%
⬆️ Próximo nível: 100 XP
```

---

### Teste 10: Streak Celebration
**Objetivo:** Validar celebração de sequências

**Passos:**
1. Completar atividade com streak ≥3 dias
2. Observar resposta adicional

**Critérios de Aceitação:**
- [ ] Aparece automaticamente após XP summary
- [ ] Emoji de fogo (🔥/⚡)
- [ ] Menciona número de dias
- [ ] Mensagem motivacional contextual

**Exemplos Esperados:**
```
🔥 SEQUÊNCIA DE 7 DIAS! 🔥
ÓTIMO! 1 semana completa! Continue assim, você está no caminho certo! 🌟
```

---

### Teste 11: Mensagem Motivacional
**Objetivo:** Validar mensagens contextuais

**Passos:**
1. Após XP summary e streak, observar mensagem adicional
2. Validar relevância ao contexto

**Critérios de Aceitação:**
- [ ] Mensagem contextual ao progresso
- [ ] Tom positivo e encorajador
- [ ] Relevante ao nível/streak/progresso

**Exemplos:**
- "🎯 Você está QUASE no próximo nível! Só mais um pouquinho!"
- "🔥 8 dias consecutivos! Sua dedicação é inspiradora!"
- "💪 Falta pouco para o próximo nível! Continue firme!"

---

## 🎯 TESTES DE BOTÕES INTERATIVOS

### Teste 12: Botões por Estágio - SDR
**Objetivo:** Validar botões para novos usuários

**Passos:**
1. Usar conta em estágio SDR
2. Enviar mensagem qualquer
3. Observar botões sugeridos

**Critérios de Aceitação:**
- [ ] Seção "🎯 Ações Rápidas:" presente
- [ ] Botão 1: 📝 Preencher Questionário
- [ ] Botão 2: 💬 Falar com IA
- [ ] Instrução clara: "Responda *1* para:"

---

### Teste 13: Botões por Estágio - Specialist
**Objetivo:** Validar botões para usuários com plano

**Passos:**
1. Usar conta em estágio Specialist
2. Enviar mensagem
3. Observar botões

**Critérios de Aceitação:**
- [ ] Botão 1: 📋 Ver Meu Plano
- [ ] Botão 2: ✅ Registrar Atividade
- [ ] Botão 3: 📅 Agendar
- [ ] Botão 4: 🔧 Ajustar Plano (se feedback pendente)

---

### Teste 14: Resposta a Botões - Número
**Objetivo:** Validar parse de resposta numérica

**Passos:**
1. Receber botões interativos
2. Responder apenas com número: "1"
3. Observar ação da IA

**Critérios de Aceitação:**
- [ ] IA reconhece escolha
- [ ] Executa ação correspondente
- [ ] Marca proativa como respondida (se aplicável)
- [ ] Não repete menu de botões

---

### Teste 15: Resposta a Botões - Texto
**Objetivo:** Validar parse de resposta textual

**Passos:**
1. Receber botões interativos
2. Responder com texto: "ver meu plano"
3. Observar ação da IA

**Critérios de Aceitação:**
- [ ] IA reconhece intenção
- [ ] Executa ação correspondente
- [ ] Matching case-insensitive

---

## 🛡️ TESTES DE COOLDOWN

### Teste 16: Limite Diário (2 mensagens)
**Objetivo:** Validar limite de 2 proativas/dia

**Passos:**
1. Confirmar que já foram enviadas 2 proativas hoje
   ```sql
   SELECT COUNT(*) FROM proactive_messages 
   WHERE user_id = 'USER_ID' 
   AND sent_at >= CURRENT_DATE;
   ```
2. Tentar disparar 3ª proativa
3. **Resultado Esperado:** 3ª proativa bloqueada

**Critérios de Aceitação:**
- [ ] Function `can_send_proactive_message` retorna `false`
- [ ] Não aparece nova proativa
- [ ] Conversa normal prossegue

---

### Teste 17: Limite Semanal por Tipo (1/semana)
**Objetivo:** Validar limite de 1 proativa do mesmo tipo/semana

**Passos:**
1. Confirmar envio de proativa `xp_threshold` hoje
2. Tentar disparar novamente `xp_threshold` amanhã
3. **Resultado Esperado:** Bloqueada por limite semanal

**Critérios de Aceitação:**
- [ ] Cooldown respeitado
- [ ] Outros tipos ainda permitidos
- [ ] View `v_proactive_cooldown` reflete status

**Validação SQL:**
```sql
SELECT * FROM v_proactive_cooldown 
WHERE user_id = 'USER_ID' 
AND message_type = 'xp_threshold';
-- Verificar: sent_this_week >= 1
```

---

### Teste 18: Skip em Conversa Ativa
**Objetivo:** Validar que proativas não interrompem conversas

**Passos:**
1. Iniciar conversa ativa (múltiplas mensagens)
2. Tentar disparar proativa nas próximas 2h
3. **Resultado Esperado:** Proativa bloqueada

**Critérios de Aceitação:**
- [ ] Function detecta atividade recente
- [ ] Proativa não enviada
- [ ] Conversa flui naturalmente

---

### Teste 19: Horário Permitido (8h-22h)
**Objetivo:** Validar janela de horário

**Passos:**
1. Testar antes das 8h (horário Brasília)
2. Testar depois das 22h
3. **Resultado Esperado:** Ambos bloqueados

**Critérios de Aceitação:**
- [ ] Não envia antes de 8h
- [ ] Não envia depois de 22h
- [ ] Envia normalmente entre 8h-22h

---

## 📊 TESTES DE INTEGRAÇÃO

### Teste 20: Proativa + Botões
**Objetivo:** Validar combinação de proativa com botões

**Passos:**
1. Disparar proativa `xp_threshold`
2. Observar se botões também aparecem
3. Responder a botão

**Critérios de Aceitação:**
- [ ] Proativa exibida
- [ ] Botões contextuais adicionados
- [ ] Resposta a botão funciona
- [ ] Proativa marcada como respondida

---

### Teste 21: Gamificação + Botões
**Objetivo:** Validar XP summary com botões

**Passos:**
1. Completar check-in
2. Observar XP summary
3. Observar botões ao final

**Critérios de Aceitação:**
- [ ] XP summary completo
- [ ] Streak celebration (se aplicável)
- [ ] Mensagem motivacional
- [ ] Botões ao final da resposta

---

### Teste 22: Proativa + Gamificação
**Objetivo:** Validar múltiplas features juntas

**Passos:**
1. Completar atividade que dispara:
   - Milestone achieved (XP multiple de 1000)
   - Ganho de XP
   - Streak celebration
2. Observar resposta completa

**Critérios de Aceitação:**
- [ ] Proativa de milestone
- [ ] XP summary
- [ ] Streak celebration
- [ ] Botões ao final
- [ ] Ordem lógica e legível

---

## 🔍 VALIDAÇÕES SQL

### Checklist de Queries

**1. Verificar proativas enviadas hoje:**
```sql
SELECT 
  message_type,
  message_content,
  sent_at,
  response_received
FROM proactive_messages
WHERE user_id = 'USER_ID'
AND sent_at >= CURRENT_DATE
ORDER BY sent_at DESC;
```

**2. Verificar cooldown status:**
```sql
SELECT * FROM v_proactive_cooldown
WHERE user_id = 'USER_ID'
ORDER BY message_type;
```

**3. Verificar gamification atual:**
```sql
SELECT 
  total_points,
  current_streak,
  longest_streak
FROM gamification
WHERE user_id = 'USER_ID';
```

**4. Verificar atividades recentes:**
```sql
SELECT 
  activity_date,
  activity_type,
  activity_name,
  points_earned
FROM daily_activities
WHERE user_id = 'USER_ID'
ORDER BY activity_date DESC
LIMIT 10;
```

**5. Verificar conversação recente:**
```sql
SELECT 
  role,
  content,
  created_at
FROM conversation_memory
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ CHECKLIST FINAL

### Funcionalidades Core
- [ ] Todas 8 regras proativas funcionando
- [ ] Cooldown respeitado (2/dia, 1/tipo/semana, 2h pause, 8h-22h)
- [ ] Gamificação visual exibida corretamente
- [ ] Botões interativos por estágio funcionando
- [ ] Parse de respostas (número e texto) funciona
- [ ] Integração end-to-end sem erros

### Performance
- [ ] Latência <2s por mensagem
- [ ] Sem memory leaks
- [ ] Queries SQL otimizadas
- [ ] Edge Function não timeout

### UX
- [ ] Tom das mensagens apropriado
- [ ] Emojis consistentes
- [ ] Formatação legível no WhatsApp
- [ ] Não repetitivo/spam
- [ ] Valor agregado ao usuário

### Dados
- [ ] Proativas registradas corretamente
- [ ] Cooldown view atualizada
- [ ] Métricas de resposta rastreadas
- [ ] RLS policies funcionando

---

## 🐛 BUGS CONHECIDOS

*(Preencher durante testes)*

| ID | Descrição | Severidade | Status |
|----|-----------|------------|--------|
|    |           |            |        |

---

## 📈 MÉTRICAS COLETADAS

*(Preencher após testes)*

| Métrica | Valor | Meta | Status |
|---------|-------|------|--------|
| Proativas enviadas/dia | | 50+ | |
| Taxa de resposta | | >40% | |
| Latência média | | <1.5s | |
| Erros | | 0 | |
| Taxa de bloqueio (cooldown) | | ~20% | |

---

## 📝 OBSERVAÇÕES

*(Anotar insights, sugestões, melhorias)*

---

**Data de Execução:** ___/___/_____  
**Executado por:** _________________  
**Aprovado por:** _________________
