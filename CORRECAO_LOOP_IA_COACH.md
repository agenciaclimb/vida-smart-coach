# Correção Loop IA Coach - 21/10/2025 16:25

## Problema Identificado
A IA estava repetindo perguntas sobre aquecimento mesmo após o usuário responder "sim" várias vezes. 
Comportamento descrito como "conversa de doido" - voltava no mesmo assunto ignorando as respostas anteriores.

## Causa Raiz
1. **Histórico limitado**: Webhook buscava apenas 5 mensagens, insuficiente para contexto completo
2. **Ausência de detecção de loop**: Não verificava se estava repetindo a mesma resposta
3. **Ordenação confusa**: Histórico não estava claramente ordenado do mais antigo ao mais recente

## Correções Aplicadas

### 1. evolution-webhook/index.ts
- ✅ Aumentado histórico de 5 para **10 mensagens** (linha ~253)
- ✅ Adicionado campo `timestamp` na query para ordenação precisa
- ✅ Implementado **detecção de loop**: compara as duas últimas respostas da IA
  - Se forem idênticas, injeta aviso `[SYSTEM: A última resposta da IA foi repetida. AVANCE...]`
- ✅ Log `loopDetected: true/false` para diagnóstico
- ✅ Histórico ordenado cronologicamente (`.reverse()` após query descendente)

### 2. ia-coach-chat/index.ts (deploy anterior)
- ✅ Prompts SDR e Especialista com instruções anti-loop explícitas
- ✅ Parâmetros OpenAI ajustados:
  - `frequency_penalty: 0.7`
  - `presence_penalty: 0.3`
  - `top_p: 0.9`

## Deploy
```bash
supabase functions deploy evolution-webhook --project-ref zzugbgoylwbaojdnunuz
# Script size: 81.29kB
# Status: ✅ Deployed
```

## Validação Necessária
- Enviar nova mensagem no WhatsApp (ex.: "minha dúvida é alimentação: como reduzir compulsão?")
- Confirmar que a IA:
  - Reconhece respostas anteriores
  - Não repete pergunta já respondida
  - Avança logicamente (Física → Alimentação → Emocional → Espiritual)
- Verificar logs para `loopDetected: false` (nenhum loop após correção)

## Observação de Segurança
- `verify_jwt = false` na ia-coach-chat (temporário para testes)
- Reativar `verify_jwt = true` após confirmação de estabilidade
- Garantir que SUPABASE_ANON_KEY no projeto está correto

---
Status: ✅ Publicado e aguardando validação real do usuário
