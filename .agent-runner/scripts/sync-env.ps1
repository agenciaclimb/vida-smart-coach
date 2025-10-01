Param(
  [string]$Source,
  [string]$Destination = ".env.local"
)

$candidatePaths = @()
if ($Source) { $candidatePaths += $Source }
$candidatePaths += @(
  "..\\.env.local",
  "..\\vida-smart-coach\\.env.local",
  "..\\..\\vida-smart-coach\\.env.local"
) | Select-Object -Unique

$found = $null
foreach ($path in $candidatePaths) {
  $resolved = Resolve-Path -Path $path -ErrorAction SilentlyContinue
  if ($resolved) { $found = $resolved.Path; break }
}

if (-not $found) {
  Write-Host "[sync-env] Nao foi possivel localizar .env.local. Verifique a pasta do projeto principal." -ForegroundColor Yellow
  exit 1
}

Write-Host "[sync-env] Copiando $found -> $Destination"
Copy-Item -Path $found -Destination $Destination -Force
Write-Host "[sync-env] Copia concluida"
