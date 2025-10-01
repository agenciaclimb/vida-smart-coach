Param(
  [int]$PauseSeconds = $(if ($env:AGENT_PAUSE_SECONDS) { [int]$env:AGENT_PAUSE_SECONDS } else { 300 }),
  [int]$StartHour = 23,
  [int]$EndHour = 7
)

function Format-Hour([int]$hour) {
  $normalized = ($hour % 24 + 24) % 24
  return ('{0:d2}:00' -f $normalized)
}

function Test-InWindow([datetime]$date) {
  if ($StartHour -le $EndHour) {
    return ($date.Hour -ge $StartHour -and $date.Hour -lt $EndHour)
  }
  return ($date.Hour -ge $StartHour -or $date.Hour -lt $EndHour)
}

function Get-NextWindowStart([datetime]$date) {
  if (Test-InWindow $date) { return $date }
  $startToday = [datetime]::Today.AddHours($StartHour)
  if ($StartHour -le $EndHour) {
    if ($date -lt $startToday) { return $startToday }
    return $startToday.AddDays(1)
  }
  if ($date.Hour -lt $StartHour) { return $startToday }
  return $startToday.AddDays(1)
}

function Invoke-HelperScript {
  param(
    [Parameter(Mandatory=$true)][string]$ScriptPath,
    [Parameter(Mandatory=$true)][string]$Label
  )
  if (-not (Test-Path $ScriptPath)) {
    Write-Host ("[nightly] Script {0} nao encontrado em {1}" -f $Label, $ScriptPath) -ForegroundColor Yellow
    return
  }
  try {
    $output = & powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File $ScriptPath
    $output | ForEach-Object {
      if ($_ -is [string] -and $_.Trim()) {
        Write-Host ("[nightly][{0}] {1}" -f $Label, $_)
      }
    }
  }
  catch {
    Write-Host ("[nightly] Falha ao executar {0}: {1}" -f $Label, $_) -ForegroundColor Yellow
  }
}

function Ensure-GitRepo {
  if (Test-Path '.git') { return $true }
  try {
    $top = git rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -eq 0 -and $top) {
      Write-Host "[nightly] Aviso: execucao fora da raiz do repo. Detectado repo em $top" -ForegroundColor Yellow
      return $true
    }
  }
  catch {
    Write-Host "[nightly] Nenhum repositorio Git detectado. O agente nao aplicara patches automaticamente." -ForegroundColor Yellow
  }
  return $false
}

$startLabel = Format-Hour $StartHour
$endLabel = Format-Hour $EndHour
Write-Host "[nightly] Agente noturno iniciado. Janela ativa: $startLabel ate $endLabel"
$hasGit = Ensure-GitRepo
$reportEachCycle = $env:AGENT_REPORT_EACH_CYCLE -eq '1'
$i = 0
while ($true) {
  $now = Get-Date
  if (Test-InWindow $now) {
    $provider = if ($i % 2 -eq 0) { "openai" } else { "gemini" }
    $env:PROVIDER = $provider
    Write-Host "[nightly] Provider: $provider | ciclo: $i | $($now.ToString('u'))"
    Invoke-HelperScript -ScriptPath "./scripts/sync-env.ps1" -Label "sync-env"
    Invoke-HelperScript -ScriptPath "./scripts/refresh-knowledge.ps1" -Label "refresh-knowledge"
    node ./scripts/agent-plan.mjs
    node ./scripts/agent-apply.mjs
    if ($reportEachCycle) {
      Invoke-HelperScript -ScriptPath "./scripts/agent-report.ps1" -Label "report"
    }
    Write-Host "[nightly] Pausa de $PauseSeconds s"
    Start-Sleep -Seconds $PauseSeconds
    $i++
  }
  else {
    $next = Get-NextWindowStart $now
    $sleepSeconds = [Math]::Max([int](($next - $now).TotalSeconds), 60)
    Write-Host "[nightly] Fora da janela ($($now.ToString('HH:mm'))). Dormindo ate $($next.ToString('yyyy-MM-dd HH:mm'))"
    Start-Sleep -Seconds $sleepSeconds
  }
}
