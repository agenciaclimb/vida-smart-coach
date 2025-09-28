# 🚀 GUIA PASSO-A-PASSO: MIGRAÇÃO SUPABASE

## 📋 O QUE VOCÊ VAI FAZER:
Adicionar campos essenciais no banco de dados para acompanhamento completo dos clientes.

---

## 🔥 PASSO 1: EXECUTAR SQL NO SUPABASE

### **1.1 Acesse o Supabase Dashboard:**
👉 **CLIQUE AQUI:** https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/sql/new

### **1.2 Copie o SQL:**
📁 Arquivo: `EXECUTE_THIS_SQL.sql` (na raiz do projeto)

**OU copie este código:**

```sql
-- 🔥 MIGRAÇÃO ESSENCIAL - ADICIONAR CAMPOS DO CLIENTE
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS current_weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50);

-- ADICIONAR CAMPOS DO CHECK-IN DIÁRIO  
ALTER TABLE daily_checkins
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS mood_score INTEGER,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_weight ON user_profiles(current_weight);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_weight ON daily_checkins(weight);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_mood_score ON daily_checkins(mood_score);

-- TRIGGER PARA UPDATE AUTOMÁTICO
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_daily_checkins_updated_at ON daily_checkins;
CREATE TRIGGER update_daily_checkins_updated_at
    BEFORE UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### **1.3 Execute o SQL:**
1. Cole o código no editor SQL do Supabase
2. Clique no botão **"RUN"** 
3. Aguarde a confirmação de sucesso ✅

---

## ✅ PASSO 2: VERIFICAR SE FUNCIONOU

### **2.1 Execute o script de verificação:**
```bash
cd /home/user/webapp
node verify_migration.js
```

### **2.2 O que você deve ver:**
```
✅ user_profiles.phone - WhatsApp do cliente - DISPONÍVEL
✅ user_profiles.current_weight - Peso atual - DISPONÍVEL  
✅ user_profiles.target_weight - Peso meta - DISPONÍVEL
✅ user_profiles.gender - Gênero - DISPONÍVEL
✅ user_profiles.goal_type - Objetivo principal - DISPONÍVEL
✅ daily_checkins.weight - Peso no check-in - DISPONÍVEL
✅ daily_checkins.mood_score - Score de humor - DISPONÍVEL

🎉 MIGRAÇÃO COMPLETA! TODOS OS CAMPOS ESTÃO DISPONÍVEIS
```

---

## 🎯 PASSO 3: TESTAR O SISTEMA COMPLETO

### **3.1 Acesse a aplicação:**
👉 https://5173-iv9yhogpcrchrblddtvwb-6532622b.e2b.dev/dashboard

### **3.2 Teste o perfil completo:**
1. Vá em **"Meu Perfil"**
2. Preencha todos os 9 campos:
   - Nome Completo ⭐
   - WhatsApp
   - Idade  
   - Altura ⭐
   - Peso Atual ⭐
   - Peso Meta
   - Gênero
   - Nível de Atividade
   - Objetivo Principal
3. Clique **"Salvar Alterações"**
4. ✅ Deve mostrar: "Perfil atualizado com sucesso!"

### **3.3 Teste o check-in completo:**
1. No dashboard, veja **"Check-in Diário Rápido"**
2. Preencha os 3 campos:
   - Peso (kg)
   - Humor hoje
   - Sono (horas)
3. Clique **"Registrar Check-in"**
4. ✅ Deve mostrar: "Check-in registrado com sucesso! 🎉"

---

## 📧 PASSO 4: RESOLVER PROBLEMA DOS EMAILS (OPCIONAL)

### **4.1 Configurar SMTP personalizado:**
1. Acesse: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/auth/providers
2. Configure Gmail ou SendGrid
3. Teste envio de email

### **4.2 Limpar usuários de teste:**
1. Acesse: Auth → Users
2. Delete contas com emails inválidos (test@, demo@)
3. Isso reduzirá o bounce rate

---

## 🎉 RESULTADO FINAL

Após a migração você terá:

### **📊 Sistema Completo de Acompanhamento:**
- ✅ Perfil completo do cliente (9 campos)
- ✅ Check-in diário com peso (3 campos) 
- ✅ Todos os dados para criar planos personalizados
- ✅ WhatsApp para contato direto
- ✅ Acompanhamento de evolução detalhado

### **💼 Para o seu negócio:**
- 📈 Relatórios de progresso semanais/mensais
- 🎯 Criação de planos baseados em dados reais
- 📱 Comunicação direta com clientes
- 💪 Coaching baseado em evidências

---

## ❓ SE ALGO DER ERRADO:

1. **Execute:** `node verify_migration.js`
2. **Se der erro:** Execute o SQL novamente no Supabase
3. **Se persistir:** Me envie o log de erro

**🔥 EXECUTE A MIGRAÇÃO AGORA E TENHA O SISTEMA COMPLETO!** 🚀