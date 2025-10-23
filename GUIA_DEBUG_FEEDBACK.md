# 🔍 GUIA RÁPIDO DE DEBUG: Feedback não funcionando

## ❌ Problema
Você tentou enviar feedback mas "nada aconteceu"

## ✅ Diagnóstico Feito
- ✅ Tabela `plan_feedback` existe e está correta
- ✅ INSERT funciona com admin (Service Role Key)
- ✅ RLS está ATIVO e bloqueando usuários não autenticados (correto!)
- ❓ Problema mais provável: **USUÁRIO NÃO AUTENTICADO**

---

## 🎯 TESTE RÁPIDO (3 minutos)

### Passo 1: Abrir o App e DevTools
1. Acesse: http://localhost:5173
2. Pressione **F12** para abrir DevTools
3. Vá para aba **Console**

### Passo 2: Verificar Autenticação
Cole e execute no console:

```javascript
// Verificar se está autenticado
const { data } = await supabase.auth.getSession();
console.log("✅ Autenticado:", data.session?.user ? "SIM" : "NÃO");
console.log("Email:", data.session?.user?.email);
console.log("User ID:", data.session?.user?.id);
```

**Resultado esperado:**
- ✅ Se mostrar `Autenticado: SIM` → Está logado, vá para Passo 3
- ❌ Se mostrar `Autenticado: NÃO` → **FAÇA LOGIN** e volte ao Passo 1

### Passo 3: Testar INSERT Direto
Cole e execute no console:

```javascript
// Testar INSERT direto
const { data: session } = await supabase.auth.getSession();

if (session?.session?.user) {
  const { data, error } = await supabase.from("plan_feedback").insert({
    user_id: session.session.user.id,
    plan_type: "physical",
    feedback_text: "TESTE DIRETO DO CONSOLE - Os exercícios estão muito intensos",
    status: "pending"
  });
  
  if (error) {
    console.error("❌ ERRO:", error);
  } else {
    console.log("✅ SUCESSO! Feedback inserido:", data);
  }
} else {
  console.error("❌ Você não está autenticado!");
}
```

**Resultado esperado:**
- ✅ Se mostrar `SUCESSO!` → INSERT funciona! Problema é no componente
- ❌ Se mostrar `ERRO:` → Veja o erro e vá para "Problemas Comuns" abaixo

### Passo 4: Testar Via Interface
1. **Limpe o console** (clique no ícone 🚫 ou Ctrl+L)
2. Vá para aba **"Planos"** no app
3. Clique em **"Enviar Feedback"** em qualquer plano
4. **Escreva um feedback** (ex: "Teste via interface")
5. Clique em **"Enviar"**
6. **Olhe o console** → Você vai ver logs tipo:

```
[DEBUG FEEDBACK] Iniciando envio de feedback...
[DEBUG FEEDBACK] user: { id: "...", email: "..." }
[DEBUG FEEDBACK] user?.id: "..."
[DEBUG FEEDBACK] feedback: "Teste via interface"
[DEBUG FEEDBACK] Dados a inserir: { user_id: "...", plan_type: "physical", ... }
[DEBUG FEEDBACK] Resposta do Supabase: { data: [...], error: null }
[DEBUG FEEDBACK] ✅ Feedback inserido com sucesso!
```

**Resultado esperado:**
- ✅ Se ver `✅ Feedback inserido com sucesso!` → **FUNCIONOU!** 🎉
- ❌ Se ver `❌ ERRO: Usuário não autenticado!` → Faça login no app
- ❌ Se ver outro erro → Copie a mensagem e veja "Problemas Comuns"

---

## 🐛 Problemas Comuns

### Erro: "new row violates row-level security policy"
**Causa**: Usuário não autenticado ou RLS bloqueando

**Solução**:
1. Faça login no app
2. Verifique se `user.id` está correto
3. Execute query para verificar policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'plan_feedback';
   ```

### Erro: "❌ ERRO: Usuário não autenticado!"
**Causa**: `user?.id` é `undefined` no componente

**Solução**:
1. Faça login no app (http://localhost:5173)
2. Verifique se `useAuth()` está retornando o usuário corretamente
3. Execute no console:
   ```javascript
   // Verificar contexto React (pode não funcionar fora do React)
   console.log(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
   ```

### Nada aparece no console
**Causa**: DevTools não está aberto ou não está na aba certa

**Solução**:
1. Abra DevTools (F12)
2. Vá para aba **Console**
3. Recarregue a página (F5)
4. Tente enviar feedback novamente

---

## 📊 Verificar no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **Table Editor** → `plan_feedback`
4. Se o feedback foi inserido, você verá:
   - ✅ Novo registro com seu `user_id`
   - ✅ `plan_type` = "physical" (ou outro)
   - ✅ `feedback_text` = seu texto
   - ✅ `status` = "pending"

---

## 🎯 Resultado Esperado

Após seguir este guia:
- ✅ Você saberá se está autenticado
- ✅ Feedback será inserido com sucesso
- ✅ Verá mensagem de sucesso no app
- ✅ Verá o registro no Supabase Dashboard

---

## 💡 Próximos Passos (Após Funcionar)

1. **Testar com IA**: Conversar com o coach e verificar se ele menciona o feedback
2. **Remover logs de debug**: Limpar os `console.log` de produção
3. **Marcar P0 como concluído**: Atualizar Documento Mestre

---

## 🆘 Se Ainda Não Funcionar

Execute este comando para ver todos os feedbacks no banco:

```bash
node debug_feedback.mjs
```

E compartilhe os logs para investigação adicional.
