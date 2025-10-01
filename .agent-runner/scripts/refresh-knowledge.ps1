Param(
  [int]$Lines = 200,
  [string]$Output = "domain_knowledge/doc_excerpt.md"
)

function Get-DocPath {
  if ($env:DOC_PATH) { return $env:DOC_PATH }
  $envFile = Join-Path (Get-Location) '.env'
  if (Test-Path $envFile) {
    foreach ($line in Get-Content $envFile) {
      if ($line -match '^DOC_PATH=(.+)$') {
        return $Matches[1].Trim('"')
      }
    }
  }
  return $null
}

$docPath = Get-DocPath
if (-not $docPath) {
  Write-Host "[refresh-knowledge] DOC_PATH nao definido em variavel de ambiente ou .env." -ForegroundColor Yellow
  exit 1
}
if (-not (Test-Path $docPath)) {
  Write-Host "[refresh-knowledge] Arquivo nao encontrado: $docPath" -ForegroundColor Yellow
  exit 1
}

$excerpt = Get-Content -Path $docPath -TotalCount $Lines
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$header = "# Documento Mestre - Trecho ($timestamp)"
$body = $excerpt -join "`n"
New-Item -ItemType Directory -Force -Path (Split-Path $Output -Parent) | Out-Null
$header + "`n`n" + $body | Out-File -FilePath $Output -Encoding UTF8
Write-Host "[refresh-knowledge] Trecho salvo em $Output"
