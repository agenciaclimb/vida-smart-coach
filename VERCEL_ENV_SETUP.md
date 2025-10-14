# Configuração de Variáveis de Ambiente - Vercel

## 🔧 Variáveis Obrigatórias

Para que o deployment funcione corretamente na Vercel, as seguintes variáveis de ambiente devem ser configuradas:

### 🔑 Stripe (Pagamentos)
```
STRIPE_SECRET_KEY=sk_test_... ou sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 🗄️ Supabase (Database)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...
```

⚠️ **IMPORTANTE**: Se `SUPABASE_SERVICE_ROLE_KEY` estiver configurada como `${SB_SECRET_KEY}`, isso é uma **referência de variável**. Você precisa:

1. **Opção A**: Substituir por valor direto
   - Copie o valor real da Service Role Key do Supabase
   - Cole diretamente no campo (sem `${}`)

2. **Opção B**: Configurar a variável `SB_SECRET_KEY`
   - Crie uma nova variável `SB_SECRET_KEY` com o valor real
   - Mantenha `SUPABASE_SERVICE_ROLE_KEY=${SB_SECRET_KEY}`

### 🌐 Vercel (Opcional)
```
VERCEL_ENV=production
```

## 📋 Como Configurar na Vercel

1. Acesse o dashboard da Vercel
2. Vá para o projeto `vida-smart-coach`
3. Clique em **Settings** → **Environment Variables**
4. Adicione cada variável acima com seus respectivos valores

## ⚠️ Importante

- Use `STRIPE_SECRET_KEY` de **test** para staging
- Use `STRIPE_SECRET_KEY` de **live** apenas para produção
- `STRIPE_WEBHOOK_SECRET` deve corresponder ao endpoint configurado no dashboard do Stripe
- `SUPABASE_SERVICE_ROLE_KEY` é diferente da `SUPABASE_ANON_KEY`
- **Se usar `${SB_SECRET_KEY}`, certifique-se que essa variável existe e tem o valor correto**

## 🔧 Correção Específica Atual

Baseado na sua configuração, você tem:
```
SUPABASE_SERVICE_ROLE_KEY=${SB_SECRET_KEY}
```

**Ação necessária**: Verificar se `SB_SECRET_KEY` existe e tem o valor correto da Service Role Key do Supabase.

## 🔍 Verificação

Após configurar, o próximo deploy deveria funcionar sem erros.