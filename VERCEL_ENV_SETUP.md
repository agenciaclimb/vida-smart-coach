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

## 🔍 Verificação

Após configurar, o próximo deploy deveria funcionar sem erros.