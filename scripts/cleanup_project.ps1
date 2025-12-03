# Script de Limpeza Segura do Projeto Vida Smart Coach
# Remove arquivos temporários, caches e duplicados SEM danificar o projeto

Write-Host "🧹 Iniciando limpeza segura do projeto..." -ForegroundColor Cyan

$projectRoot = "c:\Users\JE\vida-smart-coach"
Set-Location $projectRoot

# Contador de espaço liberado
$totalFreed = 0

# 1. Limpar node_modules (pode ser reinstalado)
Write-Host "`n📦 Limpando node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    $size = (Get-ChildItem "node_modules" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ Removido node_modules (~$([math]::Round($size, 2)) MB)" -ForegroundColor Green
    $totalFreed += $size
}

# 2. Limpar dist (build cache)
Write-Host "`n🏗️ Limpando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "dist") {
    $size = (Get-ChildItem "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Removido dist (~$([math]::Round($size, 2)) MB)" -ForegroundColor Green
    $totalFreed += $size
}

# 3. Limpar logs
Write-Host "`n📝 Limpando arquivos de log..." -ForegroundColor Yellow
$logFiles = @(
    "*.log",
    "logs/*.log",
    "webserver*.log",
    "server*.log",
    "supervisord.log"
)
foreach ($pattern in $logFiles) {
    Get-ChildItem -Path $projectRoot -Filter $pattern -File -ErrorAction SilentlyContinue | ForEach-Object {
        $size = $_.Length / 1KB
        Remove-Item $_.FullName -Force
        Write-Host "  ✅ Removido $($_.Name) (~$([math]::Round($size, 2)) KB)" -ForegroundColor Green
        $totalFreed += ($size / 1024)
    }
}

# 4. Limpar arquivos temporários
Write-Host "`n🗑️ Removendo arquivos temporários..." -ForegroundColor Yellow
$tempFiles = @(
    "temp.txt",
    "tmp*.txt",
    "tmp*.sql",
    "tmp*.cjs",
    "tmp*.js",
    ".trigger-ci"
)
foreach ($pattern in $tempFiles) {
    Get-ChildItem -Path $projectRoot -Filter $pattern -File -ErrorAction SilentlyContinue | ForEach-Object {
        $size = $_.Length / 1KB
        Remove-Item $_.FullName -Force
        Write-Host "  ✅ Removido $($_.Name) (~$([math]::Round($size, 2)) KB)" -ForegroundColor Green
        $totalFreed += ($size / 1024)
    }
}

# 5. Limpar backups locais antigos (manter apenas os 3 mais recentes)
Write-Host "`n💾 Organizando backups..." -ForegroundColor Yellow
if (Test-Path "local_secrets_backup") {
    $backups = Get-ChildItem "local_secrets_backup" -File | Sort-Object LastWriteTime -Descending
    if ($backups.Count -gt 3) {
        $toRemove = $backups | Select-Object -Skip 3
        foreach ($backup in $toRemove) {
            $size = $backup.Length / 1KB
            Remove-Item $backup.FullName -Force
            Write-Host "  ✅ Removido backup antigo $($backup.Name) (~$([math]::Round($size, 2)) KB)" -ForegroundColor Green
            $totalFreed += ($size / 1024)
        }
    }
}

# 6. Limpar arquivos .codex_* (outputs de execuções antigas)
Write-Host "`n🤖 Limpando arquivos de execução do Codex..." -ForegroundColor Yellow
Get-ChildItem -Path $projectRoot -Filter ".codex_*" -File -ErrorAction SilentlyContinue | ForEach-Object {
    $size = $_.Length / 1KB
    Remove-Item $_.FullName -Force
    Write-Host "  ✅ Removido $($_.Name) (~$([math]::Round($size, 2)) KB)" -ForegroundColor Green
    $totalFreed += ($size / 1024)
}

# 7. Limpar cache do Vite
Write-Host "`n⚡ Limpando cache do Vite..." -ForegroundColor Yellow
if (Test-Path "node_modules/.vite") {
    $size = (Get-ChildItem "node_modules/.vite" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    Remove-Item -Recurse -Force "node_modules/.vite" -ErrorAction SilentlyContinue
    Write-Host "✅ Removido cache Vite (~$([math]::Round($size, 2)) MB)" -ForegroundColor Green
    $totalFreed += $size
}

# 8. Limpar coverage reports antigos
Write-Host "`n📊 Limpando relatórios de cobertura..." -ForegroundColor Yellow
if (Test-Path "coverage") {
    $size = (Get-ChildItem "coverage" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    Remove-Item -Recurse -Force "coverage" -ErrorAction SilentlyContinue
    Write-Host "✅ Removido coverage (~$([math]::Round($size, 2)) MB)" -ForegroundColor Green
    $totalFreed += $size
}

# 9. Limpar ESLint reports
Write-Host "`n🔍 Limpando relatórios ESLint..." -ForegroundColor Yellow
if (Test-Path "eslint-report.json") {
    $size = (Get-Item "eslint-report.json").Length / 1KB
    Remove-Item "eslint-report.json" -Force
    Write-Host "✅ Removido eslint-report.json (~$([math]::Round($size, 2)) KB)" -ForegroundColor Green
    $totalFreed += ($size / 1024)
}

# 10. Limpar .vercel cache
Write-Host "`n🔺 Limpando cache Vercel..." -ForegroundColor Yellow
if (Test-Path ".vercel") {
    $size = (Get-ChildItem ".vercel" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    Remove-Item -Recurse -Force ".vercel" -ErrorAction SilentlyContinue
    Write-Host "✅ Removido cache Vercel (~$([math]::Round($size, 2)) MB)" -ForegroundColor Green
    $totalFreed += $size
}

Write-Host "`n✨ Limpeza concluída!" -ForegroundColor Cyan
Write-Host "💾 Espaço liberado: ~$([math]::Round($totalFreed, 2)) MB" -ForegroundColor Green

Write-Host "`n📦 Reinstalando dependências..." -ForegroundColor Yellow
pnpm install

Write-Host "`n✅ Projeto limpo e otimizado!" -ForegroundColor Green
Write-Host "`n=== DICAS PARA MELHOR DESEMPENHO ===" -ForegroundColor Cyan
Write-Host "1. Feche abas desnecessarias no VS Code" -ForegroundColor White
Write-Host "2. Desabilite extensoes nao essenciais" -ForegroundColor White
Write-Host "3. Execute pnpm dev apenas quando necessario" -ForegroundColor White
Write-Host "4. Recarregue a janela periodicamente" -ForegroundColor White
