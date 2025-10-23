# ✅ Checklist de Validação E2E: Loop de Feedback → IA

**Data**: 22 de outubro de 2025  
**Objetivo**: Validar o fluxo completo de feedback do usuário → IA Coach

---

## 🎯 Contexto

Implementamos o P0 "Loop de feedback → IA" que permite:
1. Usuário enviar feedback sobre planos (treino, alimentação, emocional, espiritual)
2. Feedback é salvo na tabela `plan_feedback`
3. IA Coach lê feedback pendente e ajusta abordagem
4. IA faz 1 pergunta curta para refinar o ajuste

---

## 📋 Checklist de Validação

### Parte 1: Validação de Estrutura (Backend)

- [x] **1.1 Migration criada**
  - Arquivo: `supabase/migrations/20251022_create_plan_feedback.sql`
  - Componentes: Tabela + Índices + RLS
  
- [x] **1.2 Migration aplicada no banco**
  - Executada via `scripts/run_sql_file.js`
  - Status: ✅ Sucesso

- [x] **1.3 Estrutura da tabela**
  - Colunas: id, user_id, plan_type, feedback_text, status, created_at, processed_at, ai_response, plan_updated
  - Índices: idx_plan_feedback_user, idx_plan_feedback_status, idx_plan_feedback_pending
  - RLS: Policies para SELECT e INSERT

---

### Parte 2: Validação de Frontend

- [ ] **2.1 Interface de Feedback**
  - [ ] Acessar http://localhost:5173
  - [ ] Fazer login com usuário de teste
  - [ ] Navegar para aba "Planos"
  - [ ] Localizar botão/campo de feedback em cada plano
  - [ ] Interface está responsiva e clara

- [ ] **2.2 Envio de Feedback**
  - [ ] Selecionar plano de treino (physical)
  - [ ] Escrever feedback: "Os exercícios estão muito intensos"
  - [ ] Clicar em "Enviar Feedback"
  - [ ] Verificar mensagem de sucesso (toast/notificação)
  - [ ] Não há erros no console do navegador

- [ ] **2.3 Persistência no Banco**
  - [ ] Abrir Supabase Dashboard
  - [ ] Ir para Table Editor → plan_feedback
  - [ ] Confirmar que novo registro foi criado
  - [ ] Verificar campos:
    - [ ] user_id correto
    - [ ] plan_type = 'physical'
    - [ ] feedback_text = texto enviado
    - [ ] status = 'pending'
    - [ ] created_at = timestamp atual

---

### Parte 3: Validação de IA Coach

- [ ] **3.1 Contexto da IA (Backend)**
  - [ ] Verificar Edge Function: `supabase/functions/ia-coach-chat/index.ts`
  - [ ] Confirmar que `fetchUserContext` busca feedback pendente
  - [ ] Confirmar que `buildContextPrompt` inclui feedback no prompt
  - [ ] Código tem instrução para IA reconhecer feedback

- [ ] **3.2 Resposta da IA (Web ou WhatsApp)**
  - [ ] Abrir chat com IA Coach (web ou WhatsApp)
  - [ ] Enviar mensagem: "Oi, como vai?"
  - [ ] Aguardar resposta da IA
  - [ ] Verificar se IA menciona o feedback:
    - [ ] Reconhece que você enviou feedback sobre treino
    - [ ] Faz UMA pergunta curta para ajustar (ex: "Prefere exercícios de baixo impacto?")
    - [ ] Tom é empático e consultivo

- [ ] **3.3 Ajuste do Plano (Opcional - se implementado)**
  - [ ] Responder à pergunta da IA
  - [ ] Verificar se IA confirma que vai ajustar o plano
  - [ ] Verificar no banco se:
    - [ ] status mudou para 'processed'
    - [ ] processed_at foi atualizado
    - [ ] ai_response foi preenchido (opcional)
    - [ ] plan_updated = true (se implementado)

---

### Parte 4: Validação de Integração WhatsApp

- [ ] **4.1 Webhook Evolution API**
  - [ ] Verificar Edge Function: `supabase/functions/evolution-webhook/index.ts`
  - [ ] Confirmar que chama `ia-coach-chat` com header `X-Internal-Secret`
  - [ ] Confirmar que passa histórico de chat

- [ ] **4.2 Fluxo completo WhatsApp**
  - [ ] Enviar feedback via app web
  - [ ] Abrir WhatsApp
  - [ ] Enviar mensagem para o bot
  - [ ] Verificar se bot responde mencionando o feedback
  - [ ] Responder à pergunta do bot
  - [ ] Verificar se conversação flui naturalmente

---

### Parte 5: Validação de Logs e Monitoramento

- [ ] **5.1 Logs do Frontend**
  - [ ] Console do navegador não tem erros
  - [ ] Network tab mostra requisição para Supabase com status 201 (INSERT)

- [ ] **5.2 Logs das Edge Functions**
  - [ ] Acessar Supabase Dashboard → Edge Functions → Logs
  - [ ] Verificar logs de `ia-coach-chat`
  - [ ] Confirmar que feedback pendente foi incluído no contexto
  - [ ] Não há erros 500 ou timeout

- [ ] **5.3 Logs de Banco de Dados**
  - [ ] Query para verificar todos os feedbacks pendentes:
    ```sql
    SELECT 
      id, user_id, plan_type, feedback_text, 
      status, created_at 
    FROM plan_feedback 
    WHERE status = 'pending' 
    ORDER BY created_at DESC;
    ```

---

## 🐛 Troubleshooting

### Problema: Feedback não é salvo
**Possíveis causas**:
- RLS bloqueando INSERT → Verificar policy "Users can insert own feedback"
- user_id incorreto → Verificar se `auth.uid()` está disponível
- Erro de validação → Verificar campo `plan_type` (deve ser: physical, nutritional, emotional, spiritual)

**Solução**: Verificar console do navegador e logs do Supabase

---

### Problema: IA não menciona o feedback
**Possíveis causas**:
- Edge Function não atualizada → Fazer deploy: `npx supabase functions deploy ia-coach-chat`
- INTERNAL_FUNCTION_SECRET incorreto → Verificar variável de ambiente
- Feedback já foi processado → Verificar campo `status` no banco

**Solução**: Verificar logs da Edge Function e variáveis de ambiente

---

### Problema: Erro 401 ou 403
**Possíveis causas**:
- Usuário não autenticado → Fazer login novamente
- RLS policies não aplicadas → Reaplicar migration
- Token expirado → Limpar localStorage e fazer novo login

**Solução**: Verificar autenticação e RLS policies

---

## 📊 Métricas de Sucesso

**O teste E2E é considerado bem-sucedido se**:

1. ✅ Feedback é salvo no banco sem erros
2. ✅ IA reconhece o feedback na próxima interação
3. ✅ IA faz pergunta relevante para ajustar o plano
4. ✅ Conversação é natural e empática
5. ✅ Não há erros críticos em logs

---

## 🎯 Próximos Passos Após Validação

- [ ] Se E2E passou: Marcar P0 como concluído
- [ ] Publicar Edge Functions em produção (se ainda não publicadas)
- [ ] Documentar no Documento Mestre
- [ ] Criar função opcional `process-plan-feedback` para marcar como processado
- [ ] Adicionar analytics para monitorar uso de feedback

---

## 📝 Notas de Execução

**Testado por**: _____________  
**Data**: ____/____/2025  
**Ambiente**: [ ] Local [ ] Preview [ ] Produção  

**Resultado Geral**: [ ] ✅ Passou [ ] ⚠️ Passou com ressalvas [ ] ❌ Falhou

**Observações**:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
