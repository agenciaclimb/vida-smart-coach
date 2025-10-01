Param(
  [int]$PauseSeconds = $(if ($env:AGENT_PAUSE_SECONDS) { [int]$env:AGENT_PAUSE_SECONDS } else { 60 })
)
Write-Host "[loop] Iniciando Agente Vida Smart (alternando OpenAI/Gemini)..."
$i = 0
while ($true) {
  $env:PROVIDER = $(if ($i % 2 -eq 0) { "openai" } else { "gemini" })
  Write-Host "[loop] Provider: $env:PROVIDER | ciclo: $i"
  node ./scripts/agent-plan.mjs
  node ./scripts/agent-apply.mjs
  Write-Host "[loop] Pausa de $PauseSeconds s..."
  Start-Sleep -Seconds $PauseSeconds
  $i++
}
