# Integração Horizons/Devi - Variáveis de Ambiente

## Variáveis Obrigatórias para Frontend

Configure as seguintes variáveis de ambiente no Horizons/Devi:

### Supabase Core
```bash
# URL do projeto Supabase
VITE_SUPABASE_URL=https://gpdrhfhjdxhczdlfaesn.supabase.co

# Chave pública (anon key) - segura para frontend
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZHJoZmhqZHhoY3pkbGZhZXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3MDI0MDAsImV4cCI6MjA0MDI3ODQwMH0.Vx_KQ6cJqFjNdKjpNFNGvMoNaOJXyIJZ8wJZQJZQJZQ
```

### Edge Functions
```bash
# URL base das Edge Functions
VITE_SUPABASE_FUNCTIONS_URL=https://gpdrhfhjdxhczdlfaesn.supabase.co/functions/v1

# Habilitar uso das functions
VITE_FUNCTIONS_ENABLED=true
```

### Configurações Opcionais
```bash
# Ambiente de desenvolvimento
VITE_NODE_ENV=production

# Configurações Google OAuth (se necessário)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_REDIRECT_URI=https://your-domain.com/auth/callback

# Configurações Google Calendar (se necessário)  
VITE_GOOGLE_CALENDAR_CLIENT_ID=your-google-calendar-client-id
VITE_GOOGLE_CALENDAR_REDIRECT_URI=https://your-domain.com/auth/calendar/callback
```

## Edge Functions Disponíveis

Todas as functions estão funcionando corretamente com CORS configurado:

### Admin Functions
- `GET /functions/v1/admin-affiliates` - Lista afiliados
- `POST /functions/v1/admin-create-affiliate` - Cria afiliado
- `DELETE /functions/v1/admin-delete-affiliate?id={id}` - Remove afiliado

### Provider Functions
- `GET /functions/v1/get-active-provider` - Provedor ativo

### QR Code Functions
- `POST /functions/v1/evolution-qr` - Gera QR code

### Google Integration Functions
- `GET /functions/v1/get-google-credentials` - Credenciais Google OAuth
- `GET /functions/v1/get-google-calendar-credentials` - Credenciais Google Calendar

## Exemplo de Uso no Frontend

```typescript
// Configuração do cliente Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Chamada para Edge Function
const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
const response = await fetch(`${functionsUrl}/admin-affiliates`, {
  headers: {
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json'
  }
})
```

## Verificação da Configuração

Para verificar se as variáveis estão configuradas corretamente:

1. **Teste de conexão Supabase:**
```bash
curl -X GET "${VITE_SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}"
```

2. **Teste de Edge Function:**
```bash
curl -X GET "${VITE_SUPABASE_FUNCTIONS_URL}/admin-affiliates" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}"
```

## Notas Importantes

- ✅ **CORS**: Todas as functions têm CORS configurado para `*` (permitir todas as origens)
- ✅ **Autenticação**: Functions configuradas com `verify_jwt = false` para acesso público
- ⚠️ **Segurança**: Em produção, considere restringir CORS para domínios específicos
- ⚠️ **RLS**: Tabelas `plans` e `rewards` precisam ser criadas no banco remoto para funcionar

## Próximos Passos

1. Configure as variáveis no Horizons/Devi
2. Aplique as migrations no banco remoto: `supabase db push`
3. Teste a integração com as Edge Functions
4. Implemente autenticação se necessário
