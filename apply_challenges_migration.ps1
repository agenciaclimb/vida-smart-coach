# Script PowerShell para aplicar migration do sistema de desafios
# Uso: .\apply_challenges_migration.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Aplicando migration 20251112_enhance_challenges_system.sql..." -ForegroundColor Cyan

# Carregar variáveis de ambiente
$envPath = Join-Path $PSScriptRoot ".env.local"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$supabaseUrl = $env:SUPABASE_URL
$serviceKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $serviceKey) {
    Write-Host "❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas" -ForegroundColor Red
    exit 1
}

# Ler arquivo SQL
$sqlPath = Join-Path $PSScriptRoot "supabase\migrations\20251112_enhance_challenges_system.sql"
$sqlContent = Get-Content $sqlPath -Raw

Write-Host "📄 Arquivo lido: $sqlPath" -ForegroundColor Green
Write-Host "📊 Tamanho: $($sqlContent.Length) caracteres`n" -ForegroundColor Gray

# Executar via API REST do Supabase (Database Webhooks)
# Como alternativa, podemos usar o SQL Editor API endpoint

$headers = @{
    "apikey" = $serviceKey
    "Authorization" = "Bearer $serviceKey"
    "Content-Type" = "application/json"
}

# Tentar executar via postgREST function exec_sql
$body = @{
    sql = $sqlContent
} | ConvertTo-Json

$endpoint = "$supabaseUrl/rest/v1/rpc/exec_sql"

Write-Host "🔧 Enviando para: $endpoint" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -Body $body
    Write-Host "✅ Migration aplicada com sucesso!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao aplicar migration:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Se falhar, tentar via SQL Editor (requer acesso ao Management API)
    Write-Host "`n⚠️ Fallback: Você pode aplicar manualmente via Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/sql" -ForegroundColor Cyan
    Write-Host "2. Cole o conteúdo de: supabase\migrations\20251112_enhance_challenges_system.sql" -ForegroundColor Cyan
    Write-Host "3. Execute (Run)" -ForegroundColor Cyan
    
    exit 1
}

Write-Host "`n🎉 Próximo passo: Deploy da Edge Function challenge-manager" -ForegroundColor Magenta
