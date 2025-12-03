# Script de Manutencao Rapida - Quick Clean
# Limpa apenas itens essenciais sem remover node_modules

Write-Host "[QUICK CLEAN] Iniciando limpeza rapida..." -ForegroundColor Cyan

$projectRoot = "c:\Users\JE\vida-smart-coach"
Set-Location $projectRoot

$totalFreed = 0

# 1. Limpar logs
Write-Host "`n[LOGS] Limpando arquivos de log..." -ForegroundColor Yellow
Get-ChildItem -Path $projectRoot -Filter "*.log" -File -ErrorAction SilentlyContinue | ForEach-Object {
    $size = $_.Length / 1KB
    Remove-Item $_.FullName -Force
    Write-Host "  [OK] $($_.Name) (~$([math]::Round($size, 2)) KB)" -ForegroundColor Green
    $totalFreed += ($size / 1024)
}

# 2. Limpar temporarios
Write-Host "`n[TEMP] Limpando temporarios..." -ForegroundColor Yellow
$tempPatterns = @("temp.txt", "tmp*.txt", "tmp*.sql", "tmp*.cjs", "tmp*.js")
foreach ($pattern in $tempPatterns) {
    Get-ChildItem -Path $projectRoot -Filter $pattern -File -ErrorAction SilentlyContinue | ForEach-Object {
        $size = $_.Length / 1KB
        Remove-Item $_.FullName -Force
        Write-Host "  [OK] $($_.Name) (~$([math]::Round($size, 2)) KB)" -ForegroundColor Green
        $totalFreed += ($size / 1024)
    }
}

# 3. Limpar .codex_*
Write-Host "`n[CODEX] Limpando arquivos Codex..." -ForegroundColor Yellow
Get-ChildItem -Path $projectRoot -Filter ".codex_*" -File -ErrorAction SilentlyContinue | ForEach-Object {
    $size = $_.Length / 1KB
    Remove-Item $_.FullName -Force
    Write-Host "  [OK] $($_.Name) (~$([math]::Round($size, 2)) KB)" -ForegroundColor Green
    $totalFreed += ($size / 1024)
}

# 4. Limpar coverage
Write-Host "`n[COVERAGE] Limpando coverage..." -ForegroundColor Yellow
if (Test-Path "coverage") {
    $size = (Get-ChildItem "coverage" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    Remove-Item -Recurse -Force "coverage" -ErrorAction SilentlyContinue
    Write-Host "[OK] Removido (~$([math]::Round($size, 2)) MB)" -ForegroundColor Green
    $totalFreed += $size
}

# 5. Limpar eslint report
Write-Host "`n[ESLINT] Limpando relatorio ESLint..." -ForegroundColor Yellow
if (Test-Path "eslint-report.json") {
    $size = (Get-Item "eslint-report.json").Length / 1KB
    Remove-Item "eslint-report.json" -Force
    Write-Host "[OK] Removido (~$([math]::Round($size, 2)) KB)" -ForegroundColor Green
    $totalFreed += ($size / 1024)
}

Write-Host "`n[CONCLUIDO] Limpeza rapida finalizada!" -ForegroundColor Green
Write-Host "[ESPACO] Total liberado: ~$([math]::Round($totalFreed, 2)) MB" -ForegroundColor Green
Write-Host "`nDica: Execute 'cleanup_safe.ps1' para limpeza completa (inclui node_modules)" -ForegroundColor Cyan
