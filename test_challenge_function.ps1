#!/usr/bin/env pwsh
# Script para testar Edge Function challenge-manager

$ErrorActionPreference = "Stop"

# Configurações
$SUPABASE_URL = "https://zzugbgoylwbaojdnunuz.supabase.co"
$FUNCTION_URL = "$SUPABASE_URL/functions/v1/challenge-manager"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE"

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  TESTANDO EDGE FUNCTION: challenge-manager" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Teste 1: Gerar desafio semanal
Write-Host "`n[1/3] Gerando desafio SEMANAL..." -ForegroundColor Yellow

$body1 = @{
    action = "generate_weekly"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri $FUNCTION_URL -Method POST `
        -Headers @{
            "Authorization" = "Bearer $ANON_KEY"
            "Content-Type" = "application/json"
        } `
        -Body $body1

    Write-Host "✅ SUCESSO: Desafio semanal gerado" -ForegroundColor Green
    Write-Host ($response1 | ConvertTo-Json -Depth 5) -ForegroundColor Gray
} catch {
    Write-Host "❌ ERRO ao gerar desafio semanal:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Teste 2: Gerar desafio mensal
Write-Host "`n[2/3] Gerando desafio MENSAL..." -ForegroundColor Yellow

$body2 = @{
    action = "generate_monthly"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri $FUNCTION_URL -Method POST `
        -Headers @{
            "Authorization" = "Bearer $ANON_KEY"
            "Content-Type" = "application/json"
        } `
        -Body $body2

    Write-Host "✅ SUCESSO: Desafio mensal gerado" -ForegroundColor Green
    Write-Host ($response2 | ConvertTo-Json -Depth 5) -ForegroundColor Gray
} catch {
    Write-Host "❌ ERRO ao gerar desafio mensal:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Teste 3: Verificar progresso de todos os usuários
Write-Host "`n[3/3] Verificando PROGRESSO de usuários..." -ForegroundColor Yellow

$body3 = @{
    action = "check_progress"
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri $FUNCTION_URL -Method POST `
        -Headers @{
            "Authorization" = "Bearer $ANON_KEY"
            "Content-Type" = "application/json"
        } `
        -Body $body3

    Write-Host "✅ SUCESSO: Progresso verificado" -ForegroundColor Green
    Write-Host ($response3 | ConvertTo-Json -Depth 5) -ForegroundColor Gray
} catch {
    Write-Host "❌ ERRO ao verificar progresso:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  TESTES CONCLUÍDOS!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "`nVerifique os resultados acima e confirme:" -ForegroundColor White
Write-Host "  1. Desafios foram criados na tabela gamification_events" -ForegroundColor White
Write-Host "  2. Progresso foi atualizado em user_event_participation" -ForegroundColor White
Write-Host "  3. Acesse o Dashboard: http://localhost:5173/dashboard`n" -ForegroundColor White
