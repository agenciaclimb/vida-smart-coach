#!/bin/bash

# Script para reparar o histórico de migrações do Supabase
# Baseado nos comandos sugeridos pelo próprio Supabase

echo "🔧 Reparando histórico de migrações do Supabase..."

# Marcar migrações como revertidas (que não devem estar aplicadas)
supabase migration repair --status reverted 20250909220528
supabase migration repair --status reverted 20250911170500
supabase migration repair --status reverted 20250911173000
supabase migration repair --status reverted 20250911174500

# Marcar migrações como aplicadas (que devem estar aplicadas)
supabase migration repair --status applied 20250905000003
supabase migration repair --status applied 20250915000000
supabase migration repair --status applied 20250915100000
supabase migration repair --status applied 20250915120000
supabase migration repair --status applied 20250915130000
supabase migration repair --status applied 20250915140000

echo "✅ Reparo do histórico de migrações concluído!"

