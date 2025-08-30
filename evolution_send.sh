#!/usr/bin/env bash
# Envio robusto pela Evolution API (com validação, retries e mensagens claras)
set -Eeuo pipefail

# 0) Requisitos (lidos do Ambiente do Codex)
need() { test -n "${!1:-}" || { echo "❌ Faltou variável: $1"; exit 2; }; }
need EVOLUTION_API_URL
need EVOLUTION_INSTANCE_ID
need EVOLUTION_API_KEY

# 1) Parâmetros
TO="${1:-}"                                     # DDI+DDD+NUMERO (sem +)
MSG="${2:-Vida Smart ✅ teste Codex}"           # mensagem
if [[ -z "$TO" ]]; then
  echo "uso: <script> 55DDDNÚMERO [mensagem]"
  echo "ex.:   5531999999999 \"Olá do Vida Smart\""
  exit 2
fi
if ! [[ "$TO" =~ ^[0-9]{10,15}$ ]]; then
  echo "❌ Número fora do padrão (use DDI+DDD+NÚMERO, sem espaços/+, 10–15 dígitos)."
  exit 2
fi

# 2) Monta endpoint e corpo JSON (100% válido)
BASE="${EVOLUTION_API_URL%/}"
URL="${BASE}/message/sendText/${EVOLUTION_INSTANCE_ID}"

json_escape() {
  python3 - "$1" <<'PY'
import json,sys
print(json.dumps(sys.argv[1]))
PY
}

BODY=$(printf '{"text":%s,"number":"%s"}' "$(json_escape "$MSG")" "$TO")

echo "→ POST $URL"
echo "→ Destino: $TO"

# 3) Envia com retries exponenciais
attempt=0; max=4; backoff=1
while :; do
  attempt=$((attempt+1))
  RESP="$(curl -sS -X POST "$URL" \
          -H "Content-Type: application/json" \
          -H "apikey: ${EVOLUTION_API_KEY}" \
          -d "$BODY" \
          -w '||HTTP:%{http_code}' )" || RC=$?
  RC=${RC:-0}
  CODE="${RESP##*||HTTP:}"
  BODY_RESP="${RESP%||HTTP:*}"

  echo "HTTP $CODE"
  [[ -n "$BODY_RESP" ]] && echo "$BODY_RESP"

  case "$CODE" in
    200|201)
      echo "✅ Mensagem enviada com sucesso."
      exit 0
      ;;
    401)
      echo "🔐 Token inválido/ausente (header 'apikey'). Confira EVOLUTION_API_KEY."
      exit 4
      ;;
    404)
      echo "🚫 Endpoint incorreto. Verifique INSTANCE_ID e path /message/sendText/<ID>."
      exit 4
      ;;
    4*)
      echo "❗ Erro do cliente (JSON/number). Campos obrigatórios: text, number (E.164 sem '+')."
      exit 4
      ;;
    5*)
      if (( attempt < max )); then
        echo "⏳ Retentando em ${backoff}s… ($attempt/$max)"
        sleep "$backoff"
        backoff=$((backoff*2))
      else
        echo "❌ Falha no servidor Evolution."
        exit 5
      fi
      ;;
    *)
      if (( attempt < max )); then
        echo "⏳ Retentando em ${backoff}s… ($attempt/$max)"
        sleep "$backoff"
        backoff=$((backoff*2))
      else
        echo "❌ Estado desconhecido."
        exit 6
      fi
      ;;
  esac
done
