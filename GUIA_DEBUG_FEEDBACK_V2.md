# 🔍 Guia de Debug - Sistema de Feedback (V2)

## 📋 Contexto
O sistema de feedback permite que usuários enviem comentários sobre seus planos (físico, nutricional, emocional, espiritual) que serão processados pelo IA Coach.

## ✅ CORREÇÃO APLICADA

### Problema Identificado
1. ❌ **Insert sem `.select()`**: O código original não retornava os dados inseridos
2. ❌ **Falta de validação**: Não verificava se `data` estava vazio após insert bem-sucedido
3. ❌ **Debug insuficiente**: Não logava informações críticas sobre user_id e resposta do Supabase

### Solução Implementada
✅ **Adicionado `.select()` após insert**: Força Supabase a retornar os dados inseridos  
✅ **Validação de `data`**: Verifica se o array de dados está vazio (indica problema de RLS)  
✅ **Debug completo**: Logs detalhados de user, user_id, feedback_text e resposta completa  

```javascript
// ANTES (sem .select())
const { error } = await supabase.from('plan_feedback').insert({...});

// DEPOIS (com .select() e validação)
const { data, error } = await supabase.from('plan_feedback').insert({...}).select();

if (!data || data.length === 0) {
  console.error('[DEBUG FEEDBACK] ⚠️ Sucesso mas sem data - possível problema de RLS');
  toast.error('Feedback não foi salvo. Verifique se você está autenticado.');
  return;
}
```

## 🧪 Passo a Passo para Teste Local

### 1. **Servidor Vite Rodando** ✅
- O servidor já foi reiniciado com o código corrigido
- Acesse: `http://localhost:5173`

### 2. **Fazer Hard Refresh no Navegador** 🔄
**IMPORTANTE:** O navegador pode estar usando cache antigo!

**Chrome/Edge:**
- `Ctrl + Shift + R` (Windows/Linux)
- `Cmd + Shift + R` (Mac)

**Firefox:**
- `Ctrl + F5` (Windows/Linux)
- `Cmd + Shift + R` (Mac)

### 3. **Fazer Login**
- Use suas credenciais de usuário
- Aguarde o carregamento completo do dashboard

### 4. **Abrir DevTools**
- Pressione `F12` ou `Ctrl + Shift + I`
- Vá para a aba **Console**
- Limpe o console (`Ctrl + L`)

### 5. **Testar Feedback**
1. Vá para a aba "Plano" no dashboard
2. Escolha qualquer tipo de plano (Treino, Nutricional, Emocional, Espiritual)
3. Clique no botão **"Dar Feedback"**
4. Digite um feedback de teste, exemplo:
   ```
   Teste de feedback com debug completo - quero ajustar meu plano de treino
   ```
5. Clique em **"Enviar Feedback"**

### 6. **Analisar Logs no Console**

**✅ SUCESSO - Você deve ver:**
```
[DEBUG FEEDBACK] Iniciando envio de feedback...
[DEBUG FEEDBACK] user: {id: "630a22ad-...", email: "..."}
[DEBUG FEEDBACK] user.id: 630a22ad-c4d4-4825-ab30-1d3bbccdcfb94
[DEBUG FEEDBACK] feedback text: "Teste de feedback..."
[DEBUG FEEDBACK] Inserindo feedback na tabela plan_feedback...
[DEBUG FEEDBACK] Resposta do Supabase: {data: Array(1), error: null}
[DEBUG FEEDBACK] ✅ Feedback inserido com sucesso! [{id: ..., user_id: ..., ...}]
```
✅ Toast de sucesso: "Feedback enviado! Vamos revisar seu plano."

**❌ ERRO - RLS Bloqueando:**
```
[DEBUG FEEDBACK] Resposta do Supabase: {data: [], error: null}
[DEBUG FEEDBACK] ⚠️ Sucesso mas sem data retornado - possível problema de RLS
```
❌ Toast de erro: "Feedback não foi salvo. Verifique se você está autenticado."

**❌ ERRO - Problema de Autenticação:**
```
[DEBUG FEEDBACK] user: null
[DEBUG FEEDBACK] user.id: undefined
```

**❌ ERRO - Supabase/Rede:**
```
[DEBUG FEEDBACK] ❌ Erro do Supabase: {code: "...", message: "..."}
```

## 🔧 Troubleshooting

### Problema: "Não vejo os logs [DEBUG FEEDBACK]"
**Solução:**
1. Faça **Hard Refresh** no navegador (`Ctrl + Shift + R`)
2. Verifique se o servidor Vite foi reiniciado
3. Limpe o cache do navegador completamente
4. Feche e abra o navegador novamente

### Problema: "user.id está undefined"
**Solução:**
1. Faça logout e login novamente
2. Verifique se o token JWT não expirou
3. Abra o DevTools → Application → Local Storage → Veja se há `supabase.auth.token`

### Problema: "data está vazio mas error é null"
**Causa:** RLS está bloqueando o insert silenciosamente  
**Solução:**
1. Verifique a política RLS em `plan_feedback`:
   ```sql
   -- No Supabase SQL Editor:
   SELECT * FROM pg_policies WHERE tablename = 'plan_feedback';
   ```
2. Política correta deve ser:
   ```sql
   CREATE POLICY "Users can insert own feedback"
   ON plan_feedback FOR INSERT
   WITH CHECK (auth.uid() = user_id);
   ```

## 📊 Validação Final

Após o teste bem-sucedido:

1. ✅ Verificar no Supabase se o feedback foi inserido:
   ```sql
   SELECT * FROM plan_feedback 
   WHERE user_id = '630a22ad-c4d4-4825-ab30-1d3bbccdcfb94' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

2. ✅ Remover logs de debug (opcional, após validação):
   - Os logs podem ser mantidos em dev
   - Remover antes do deploy em produção

## 🎯 Próximos Passos

1. **Validar E2E com IA Coach**
   - Testar se o IA Coach processa o feedback
   - Verificar se gera novo plano personalizado

2. **Deploy em Produção**
   - Após validação local completa
   - Build e deploy do código corrigido

3. **Monitoramento**
   - Acompanhar logs de feedback em produção
   - Verificar taxa de sucesso vs erro
