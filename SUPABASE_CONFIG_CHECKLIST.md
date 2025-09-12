# 🔧 Checklist Configuração Supabase - Vida Smart

## ✅ Configurações de Autenticação no Supabase Dashboard

Acesse: `https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/auth/settings`

### 1. **Site URL Configuration**
```
Site URL: https://www.appvidasmart.com
```

### 2. **Redirect URLs**
Adicionar todas estas URLs:
```
https://www.appvidasmart.com
https://www.appvidasmart.com/
https://www.appvidasmart.com/dashboard
https://www.appvidasmart.com/login
https://www.appvidasmart.com/**
```

### 3. **Auth Settings**
```
✅ Enable email confirmations: OFF (para desenvolvimento)
✅ Enable secure email change: ON
✅ Double confirm email changes: OFF
✅ Enable manual linking: OFF
```

### 4. **Session Configuration**
```
✅ JWT expiry: 3600 (1 hora)
✅ Refresh token rotation: ON
✅ Reuse interval: 10 (segundos)
```

### 5. **Email Templates** (Se aplicável)
- Verificar se templates de email estão configurados
- Confirmar URLs de callback nos templates

## 🗄️ Database Policies (RLS)

Verificar se estas tabelas têm políticas corretas:

### Tabela `profiles` (ou similar)
```sql
-- Policy para SELECT
CREATE POLICY "Users can read own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Policy para INSERT
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy para UPDATE
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);
```

### Tabela `comunidade`
```sql
-- Policy para SELECT (todos usuários autenticados)
CREATE POLICY "Authenticated users can read comunidade" ON comunidade
FOR SELECT TO authenticated USING (true);
```

### Tabela `planos`
```sql
-- Policy para SELECT (todos usuários autenticados)
CREATE POLICY "Authenticated users can read planos" ON planos
FOR SELECT TO authenticated USING (true);
```

### Tabela `recompensas`
```sql
-- Policy para SELECT (todos usuários autenticados)
CREATE POLICY "Authenticated users can read recompensas" ON recompensas
FOR SELECT TO authenticated USING (true);
```

## 🔍 Verificações de Database

### 1. Tabelas Existem?
Confirmar que estas tabelas existem:
- `profiles` (ou `user_profiles`)
- `comunidade` 
- `planos`
- `recompensas`

### 2. RLS Habilitado?
```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'comunidade', 'planos', 'recompensas');
```

### 3. Policies Existem?
```sql
-- Listar todas as policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'comunidade', 'planos', 'recompensas');
```

## 🔐 Teste de Autenticação

### No Console do Supabase:
```sql
-- Criar usuário de teste (se necessário)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_current,
  email_change_confirm_status,
  recovery_token,
  ott_token,
  confirmation_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'teste@vidasmart.com',
  crypt('senha123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  0,
  '',
  '',
  now()
);
```

## ⚠️ Problemas Comuns

### 1. **Error: JWT expired**
- Verificar configuração de JWT expiry
- Implementar refresh automático (já no código)

### 2. **Error: new row violates row-level security**
- Verificar policies das tabelas
- Confirmar se usuário tem permissões corretas

### 3. **Error: relation does not exist**
- Confirmar que tabelas existem
- Verificar se migrations foram aplicadas

### 4. **CORS errors**
- Verificar Site URL e Redirect URLs
- Confirmar domínio no Supabase

## 🚨 Comandos de Debug

### No navegador (Console):
```javascript
// Testar conexão
await window.supabaseDebug.testConnection();

// Ver sessão atual
await window.supabaseDebug.debugSession();

// Limpar sessão
await window.supabaseDebug.clearSession();

// Verificar config
window.supabaseDebug.checkConfig();
```

## ✅ Validação Final

Depois de configurar, testar:

1. ✅ Login funciona
2. ✅ Dashboard carrega sem erros
3. ✅ Dados são exibidos corretamente
4. ✅ Refresh de token funciona
5. ✅ Logout funciona
6. ✅ Redirecionamentos funcionam