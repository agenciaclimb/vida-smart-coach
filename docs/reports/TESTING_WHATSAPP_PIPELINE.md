# Teste Manual do Pipeline WhatsApp

1. Certifique-se de que as migrações foram aplicadas (`20250917000000_fix_whatsapp_gamification_infra.sql`) e que as funções `evolution-webhook` e `send-whatsapp-notification` estão publicadas.
2. No Supabase Dashboard, crie ou confirme um usuário com `user_profiles.phone` preenchido (mesmo número do teste, no formato internacional `+55...`).
3. Dispare uma requisição POST para a função `evolution-webhook` simulando o payload da Evolution API:

```bash
curl -X POST https://<PROJECT>.supabase.co/functions/v1/evolution-webhook \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "demo-instance",
    "data": {
      "key": { "remoteJid": "+5511999999999@s.whatsapp.net", "fromMe": false },
      "message": { "conversation": "Fiz um treino pesado hoje!" }
    }
  }'
```

4. Abra o SQL Editor e verifique:
   - `select user_id, phone_number, normalized_phone from whatsapp_messages order by created_at desc limit 5;`
   - `select status, detected_activity from whatsapp_gamification_log order by processed_at desc limit 5;`

5. Faça login na aplicação com o mesmo usuário e acesse `/demo` ou `/dashboard` para confirmar os pontos atualizados.

6. Caso o payload resulte em fraude (verifique mensagens com spam), valide se o log registra `status = 'fraud_detected'`.

7. Para limpar dados de teste, remova os registros criados em `whatsapp_messages`, `whatsapp_gamification_log` e `daily_activities` para o usuário utilizado.
