# Configuração Base – Evolution API & IA Coach

> **Objetivo**: Documentar os pilares do funcionamento do WhatsApp + IA, evitando regressões quando novas automações forem implementadas.

---

## 1. Secrets necessários (Supabase CLI)

Execute sempre via CLI, com os valores privados da conta:

```bash
supabase secrets set \
  SERVICE_ROLE_KEY="<service-role-key>" \
  ANON_KEY="<anon-key>" \
  PROJECT_URL="https://<projeto>.supabase.co" \
  JWT_SECRET="<jwt-secret>" \
  OPENAI_API_KEY="<openai-key>" \
  EVOLUTION_API_URL="https://api.evoapicloud.com" \
  EVOLUTION_INSTANCE_ID="<id-instancia-evolution>" \
  EVOLUTION_INSTANCE_TOKEN="<token-instancia-evolution>"
```

- **Nunca** versionar `.env` com valores reais.
- Atualizou secret? Refaça o deploy: `supabase functions deploy evolution-webhook --no-verify-jwt` e `supabase functions deploy ia-coach-chat --no-verify-jwt`.

---

## 2. Webhook Evolution → Supabase

| Item | Valor |
| --- | --- |
| URL | `https://<projeto>.supabase.co/functions/v1/evolution-webhook` |
| Header | `apikey: <TOKEN_DA_INSTANCIA>` |
| Eventos mínimos | `MESSAGES_UPSERT` (demais eventos opcionais) |

### Normalização do número
O webhook remove os sufixos `@s.whatsapp.net` / `@c.us` e salva em `whatsapp_messages` e `user_profiles` como dígitos puros (`55DDDNNNNNNN`).

### Filtro de eventos
Somente eventos `messages.upsert` / `messages.update` são processados. Demais eventos retornam `200 { status: "ignored" }`.

### Fluxo de processamento
1. Recebe evento da Evolution.
2. Valida header `apikey` com o token da instância.
3. Concilia usuário (`user_profiles.phone`).
4. Armazena mensagem recebida (`direction: inbound`).
5. Invoca `ia-coach-chat` com o histórico recente.
6. Envia resposta via `POST /message/sendText/{instanceId}` usando **o token da instância**.
7. Armazena mensagem enviada (`direction: outbound`).

---

## 3. IA Coach – comportamento esperado

A função `supabase/functions/ia-coach-chat/index.ts` mantém o comportamento oficial. Não alterar sem sincronizar com estas diretrizes:

- **Tom**: coach motivador, perguntas abertas, evita listas longas.
- **Estágios**: `sdr`, `specialist`, `seller`, `partner` (ver `processMessageByStage`).
- **Histórico**: recebe `chatHistory` já normalizado pelo webhook.
- **Registro**: toda interação é salva em `interactions` e atualiza `client_stages` conforme regra do estágio.
- **Falhas**: qualquer erro deve gerar resposta empática “Desculpe, tive um problema técnico…” (já implementado).

### Recomendações ao editar o prompt/comportamento
1. Ajustes devem ocorrer na função `processMessageByStage` ou helpers específicos. Não sobrescrever prompts globais sem documentar.
2. Se necessário novo modo, criar estágio adicional e registrar aqui.
3. Sempre rodar `Supabase secrets set OPENAI_API_KEY=...` caso a chave mude.

---

## 4. Checklist antes de publicar alterações
- [ ] Secrets confirmados (`supabase secrets list` – valores não aparecem, mas nomes sim).
- [ ] `git grep "apikey"` confirma que nenhum token literal está no repo.
- [ ] Teste cURL (Evolution) retorna `200`.
- [ ] Mensagem real via WhatsApp recebeu resposta humanizada.
- [ ] Documento atualizado caso prompt/comportamento mude.

---

## 5. Perguntas frequentes

**“Recebo 401 Invalid api key”**
- Revise se o header usa o **token da instância** (Tela: Projetos → Instâncias → Painel de Controle).
- Verifique se o secret `EVOLUTION_INSTANCE_TOKEN` foi definido após a mudança.

**“IA respondendo texto padrão”**
- Cheque logs da `evolution-webhook`. Se houver `Unauthorized`, o header não bate com o secret.
- Falhas na `ia-coach-chat` geram fallback; veja os logs dessa função.

**“Preciso alterar o tom da IA”**
- Documente a alteração desejada aqui antes de mudar o código: qual estágio muda, qual objetivo, exemplos.

---

Manter este documento sincronizado evita regressões cada vez que uma IA (ou humano) fizer melhorias.
