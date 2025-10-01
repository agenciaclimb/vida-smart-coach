# Compara .env.example (esperado) com .env.vercel (definido no Vercel)
$examplePath = ".env.example"
$vercelPath = ".env.vercel"
if (-not (Test-Path $examplePath)) {
  Write-Output "Arquivo .env.example ausente."
  exit 1
}
if (-not (Test-Path $vercelPath)) {
  Write-Output "Arquivo .env.vercel ausente."
  exit 1
}
$need = (Get-Content $examplePath | Where-Object { $_ -match '^[A-Z0-9_]+=' }) -replace '=.*','' | Sort-Object -Unique
$has  = (Get-Content $vercelPath  | Where-Object { $_ -match '^[A-Z0-9_]+=' }) -replace '=.*','' | Sort-Object -Unique
$missing = Compare-Object $need $has -PassThru | Where-Object { $_ -in $need }
$extra = Compare-Object $has $need -PassThru | Where-Object { $_ -in $has }
$report = @()
$report += "Faltando no Vercel:" 
$report += ($missing -join "`n")
$report += ""
$report += "Sem correspondente no .env.example:" 
$report += ($extra -join "`n")
$reportText = $report -join "`n"
New-Item -ItemType Directory -Force -Path "agent_outputs" | Out-Null
$reportText | Out-File agent_outputs/env_drift_result.md -Encoding utf8
Write-Output "Relatorio salvo em agent_outputs/env_drift_result.md"
