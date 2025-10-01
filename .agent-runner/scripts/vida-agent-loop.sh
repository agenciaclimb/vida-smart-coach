#!/usr/bin/env bash
set -euo pipefail
i=0
PAUSE="${AGENT_PAUSE_SECONDS:-60}"
echo "[loop] Iniciando Agente Vida Smart (alternando OpenAI/Gemini)..."
while true; do
  if (( i % 2 == 0 )); then export PROVIDER=openai; else export PROVIDER=gemini; fi
  echo "[loop] Provider: ${PROVIDER} | ciclo: $i"
  node ./scripts/agent-plan.mjs || true
  node ./scripts/agent-apply.mjs || true
  echo "[loop] Pausa de ${PAUSE}s..."
  sleep "${PAUSE}"
  i=$((i+1))
done
