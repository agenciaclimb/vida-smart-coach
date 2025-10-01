Write-Host "[validate] Iniciando validacoes..."
if ($env:DOC_PATH -and -not (Test-Path $env:DOC_PATH)) {
  Write-Host "[validate] Aviso: DOC_PATH nao encontrado: $env:DOC_PATH"
}
if ($env:AGENT_VALIDATE_COMMAND) {
  Write-Host "[validate] Executando comando customizado: $env:AGENT_VALIDATE_COMMAND"
  Invoke-Expression $env:AGENT_VALIDATE_COMMAND
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
npm run -s build
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host "[validate] OK"
