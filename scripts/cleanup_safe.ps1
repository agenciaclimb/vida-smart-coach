# Script de Limpeza Segura do Projeto Vida Smart Coach
# Remove arquivos temporarios, caches e duplicados SEM danificar o projeto

Write-Host "[LIMPEZA] Iniciando limpeza segura do projeto..." -ForegroundColor Cyan

$projectRoot = "c:\Users\JE\vida-smart-coach"
Set-Location $projectRoot

$totalFreed = 0

# 1. Limpar node_modules
Write-Host "`n[PACOTES] Limpando node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    $size = (Get-ChildItem "node_modules" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "[OK] Removido node_modules (~$([math]::Round($size, 2)) MB)" -ForegroundColor Green
    $totalFreed += $size
}

# 2. Limpar dist
Write-Host "`n[BUILD] Limpando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "dist") {
    $size = (Get-ChildItem "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Remove-Item -Recurse -Force "dist"
    Write-Host "[OK] Removido dist (~$([math]::Round($size, 2)) MB)" -ForegroundColor Green
    $totalFreed += $size
}

# 3. Limpar logs
Write-Host "`n[LOGS] Limpando arquivos de log..." -ForegroundColor Yellow
$logPatterns = @("*.log")
foreach ($pattern in $logPatterns) {
    Get-ChildItem -Path $projectRoot -Filter $pattern -File -ErrorAction SilentlyContinue | ForEach-Object {
        $size = $_.Length / 1KB
        Remove-Item $_.FullName -Force
        Write-Host "  [OK] Removido $($_.Name) (~$([math]::Round($size, 2)) KB)" -ForegroundColor Green
        $totalFreed += ($size / 1024)
    }
}

# 4. Limpar arquivos temporarios
Write-Host "`n[TEMP] Removendo arquivos temporarios..." -ForegroundColor Yellow
$tempPatterns = @("temp.txt", "tmp*.txt", "tmp*.sql", "tmp*.cjs", "tmp*.js", ".trigger-ci")
foreach ($pattern in $tempPatterns) {
    Get-ChildItem -Path $projectRoot -Filter $pattern -File -ErrorAction SilentlyContinue | ForEach-Object {
        $size = $_.Length / 1KB
        Remove-Item $_.FullName -Force
        Write-Host "  [OK] Removido $($_.Name) (~$([math]::Round($size, 2)) KB)" -ForegroundColor Green
        $totalFreed += ($size / 1024)
    }
}

# 5. Limpar arquivos .codex_*
Write-Host "`n[CODEX] Limpando arquivos de execucao do Codex..." -ForegroundColor Yellow
Get-ChildItem -Path $projectRoot -Filter ".codex_*" -File -ErrorAction SilentlyContinue | ForEach-Object {
    $size = $_.Length / 1KB
    Remove-Item $_.FullName -Force
    Write-Host "  [OK] Removido $($_.Name) (~$([math]::Round($size, 2)) KB)" -ForegroundColor Green
    $totalFreed += ($size / 1024)
}

# 6. Limpar coverage reports
Write-Host "`n[COVERAGE] Limpando relatorios de cobertura..." -ForegroundColor Yellow
if (Test-Path "coverage") {
    $size = (Get-ChildItem "coverage" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    Remove-Item -Recurse -Force "coverage" -ErrorAction SilentlyContinue
    Write-Host "[OK] Removido coverage (~$([math]::Round($size, 2)) MB)" -ForegroundColor Green
    $totalFreed += $size
}

# 7. Limpar ESLint reports
Write-Host "`n[ESLINT] Limpando relatorios ESLint..." -ForegroundColor Yellow
if (Test-Path "eslint-report.json") {
    $size = (Get-Item "eslint-report.json").Length / 1KB
    Remove-Item "eslint-report.json" -Force
    Write-Host "[OK] Removido eslint-report.json (~$([math]::Round($size, 2)) KB)" -ForegroundColor Green
    $totalFreed += ($size / 1024)
}

# 8. Limpar .vercel cache
Write-Host "`n[VERCEL] Limpando cache Vercel..." -ForegroundColor Yellow
if (Test-Path ".vercel") {
    $size = (Get-ChildItem ".vercel" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    Remove-Item -Recurse -Force ".vercel" -ErrorAction SilentlyContinue
    Write-Host "[OK] Removido cache Vercel (~$([math]::Round($size, 2)) MB)" -ForegroundColor Green
    $totalFreed += $size
}

Write-Host "`n[CONCLUIDO] Limpeza finalizada!" -ForegroundColor Cyan
Write-Host "[ESPACO] Total liberado: ~$([math]::Round($totalFreed, 2)) MB" -ForegroundColor Green

Write-Host "`n[REINSTALAR] Reinstalando dependencias..." -ForegroundColor Yellow
pnpm install

Write-Host "`n[SUCESSO] Projeto limpo e otimizado!" -ForegroundColor Green
Write-Host "`n=== DICAS PARA MELHOR DESEMPENHO ===" -ForegroundColor Cyan
Write-Host "1. Feche abas desnecessarias no VS Code" -ForegroundColor White
Write-Host "2. Desabilite extensoes nao essenciais" -ForegroundColor White
Write-Host "3. Execute pnpm dev apenas quando necessario" -ForegroundColor White
Write-Host "4. Recarregue a janela periodicamente (Ctrl+Shift+P > Reload Window)" -ForegroundColor White
