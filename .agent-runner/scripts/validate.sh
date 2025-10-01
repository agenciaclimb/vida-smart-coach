#!/usr/bin/env bash
set -euo pipefail

echo "[validate] Iniciando validacoes..."
if [[ -n "${DOC_PATH:-}" && ! -f "$DOC_PATH" ]]; then
  echo "[validate] Aviso: DOC_PATH nao encontrado: $DOC_PATH"
fi
if [[ -n "${AGENT_VALIDATE_COMMAND:-}" ]]; then
  echo "[validate] Executando comando customizado: $AGENT_VALIDATE_COMMAND"
  bash -lc "$AGENT_VALIDATE_COMMAND"
fi
npm run -s build
echo "[validate] OK"
