# 🔧 CORREÇÃO ESPECÍFICA - SESSION TIMEOUT

## 🎯 PROBLEMA IDENTIFICADO:
- Supabase session fica em loop de timeout
- "Boot: session-timeout, proceeding without session"
- "Forcing ready state after timeout"

## 🛠️ CORREÇÃO MÍNIMA (Preservando seu código):

### 1. ADICIONAR TIMEOUT NO AuthProvider:

Encontre no seu `AuthProvider.tsx` a parte que faz `getSession()` e adicione timeout:

```typescript
// ANTES (problemático):
useEffect(() => {
  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    // ... resto do código
  };
  getSession();
}, []);

// DEPOIS (com timeout):
useEffect(() => {
  let mounted = true;
  
  const getSession = async () => {
    try {
      // ADICIONAR TIMEOUT de 10 segundos
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 10000)
      );
      
      const { data: { session }, error } = await Promise.race([
        sessionPromise, 
        timeoutPromise
      ]);
      
      if (error) throw error;
      
      if (mounted) {
        setUser(session?.user || null);
        setLoading(false);
      }
    } catch (error) {
      console.log('⚠️ Session timeout ou erro, continuando sem sessão');
      if (mounted) {
        setUser(null);
        setLoading(false); // IMPORTANTE: Parar loading mesmo com erro
      }
    }
  };

  getSession();
  
  return () => { mounted = false; };
}, []);
```

### 2. ADICIONAR TIMEOUT NO onAuthStateChange:

```typescript
// Adicionar timeout também no listener:
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    console.log('🔄 Auth event:', event);
    
    // Timeout para processar event
    setTimeout(() => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    }, 100); // Processar em próximo tick
  }
);
```

### 3. GARANTIR LOADING FALSE:

No seu AuthProvider, garanta que loading sempre vira false:

```typescript
// Adicionar useEffect de segurança:
useEffect(() => {
  // Timeout de segurança - forçar loading false após 15 segundos
  const safetyTimeout = setTimeout(() => {
    console.log('🚨 Safety timeout - forçando loading false');
    setLoading(false);
  }, 15000);

  return () => clearTimeout(safetyTimeout);
}, []);
```

## 🔥 CORREÇÃO MAIS SIMPLES (se a acima for complexa):

### Substitua apenas a lógica de inicialização:

```typescript
// No seu AuthProvider, substitua o useEffect de inicialização por:
useEffect(() => {
  console.log('🚀 Iniciando auth com timeout de segurança...');
  
  let mounted = true;
  
  // Timeout de segurança
  const safetyTimer = setTimeout(() => {
    if (mounted) {
      console.log('⏰ Timeout de segurança ativado');
      setLoading(false);
      setUser(null);
    }
  }, 8000); // 8 segundos máximo

  // Tentar obter sessão
  supabase.auth.getSession()
    .then(({ data: { session }, error }) => {
      if (mounted) {
        clearTimeout(safetyTimer);
        setUser(session?.user || null);
        setLoading(false);
        console.log('✅ Sessão carregada:', !!session);
      }
    })
    .catch((error) => {
      if (mounted) {
        clearTimeout(safetyTimer);
        console.log('❌ Erro na sessão:', error.message);
        setUser(null);
        setLoading(false);
      }
    });

  return () => {
    mounted = false;
    clearTimeout(safetyTimer);
  };
}, []);
```

## 🎯 RESULTADO ESPERADO:

✅ Loading para após máximo 8 segundos
✅ Tela branca desaparece
✅ App funciona mesmo se sessão falhar
✅ Mantém toda sua funcionalidade existente