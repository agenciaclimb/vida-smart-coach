#!/usr/bin/env bash
set -euo pipefail

echo "=== VIDA SMART - E2E (DB -> Functions -> Build -> Test) ==="
: "${SUPABASE_PROJECT_REF:?SUPABASE_PROJECT_REF não definido}"
: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN não definido}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY não definido}"

echo "[1/6] npm install"
npm install

echo "[2/6] Migrações locais (se existirem scripts JS)"
if [ -f "./apply_gamification_migration.js" ]; then node ./apply_gamification_migration.js; else echo " - skip apply_gamification_migration.js"; fi
if [ -f "./apply_migration.js" ]; then node ./apply_migration.js; else echo " - skip apply_migration.js"; fi

echo "[3/6] DB push"
supabase db push --project-ref "${SUPABASE_PROJECT_REF}"

echo "[4/6] Deploy das Edge Functions"
supabase functions deploy evolution-webhook --project-ref "${SUPABASE_PROJECT_REF}"

if [ -f "supabase/functions/send-whatsapp-notification/index.ts" ]; then
  supabase functions deploy send-whatsapp-notification --project-ref "${SUPABASE_PROJECT_REF}"
else
  echo " - send-whatsapp-notification ausente, criando stub rápido…"
  mkdir -p supabase/functions/send-whatsapp-notification
  cat > supabase/functions/send-whatsapp-notification/index.ts <<'EOTS'
Deno.serve(async (req: Request) => {
  try {
    const body = await req.json();
    console.log("send-whatsapp-notification payload:", body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }, status: 200
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid json" }), {
      headers: { "Content-Type": "application/json" }, status: 400
    });
  }
});
EOTS
  supabase functions deploy send-whatsapp-notification --project-ref "${SUPABASE_PROJECT_REF}"
fi

echo "[5/6] Build do frontend"
npm run build

echo "[6/6] Teste do webhook evolution-webhook"
WEBHOOK_URL="https://${SUPABASE_PROJECT_REF}.functions.supabase.co/evolution-webhook"
PAYLOAD='{"event":"message_received","user_id":"00000000-0000-0000-0000-000000000000","phone":"+5511999999999","message":"Teste gamificação via Manus","timestamp":1726540000}'
HTTP_STATUS=$(curl -s -o /tmp/webhook_resp.json -w "%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" -H "Content-Type: application/json" \
  -d "$PAYLOAD" || true)
echo "Status webhook: $HTTP_STATUS"
echo "Resposta:"
cat /tmp/webhook_resp.json || true

echo "=== SQL de verificação (cole no Supabase se quiser checar manualmente) ==="
echo "SELECT * FROM public.whatsapp_messages ORDER BY created_at DESC LIMIT 10;"
echo "SELECT * FROM public.whatsapp_gamification_log ORDER BY created_at DESC LIMIT 10;"

echo "=== FIM DO E2E ==="

