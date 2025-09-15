import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente estão presentes
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL não está definida nas variáveis de ambiente');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY não está definida nas variáveis de ambiente');
}

// Log para debug (remover em produção)
console.log('🔧 Supabase Config Check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl
});

// Criar cliente Supabase com configurações otimizadas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configurações de autenticação
    autoRefreshToken: true,        // Refresh automático do token
    persistSession: true,          // Persistir sessão no localStorage
    detectSessionInUrl: false,     // Não detectar sessão na URL (evita conflitos)
    flowType: 'pkce',             // Usar PKCE flow (mais seguro)
    
    // Configurações de storage
    storage: window.localStorage,   // Usar localStorage explicitamente
    storageKey: 'sb-auth-token',   // Chave personalizada para o token
    
    // Configurações de debug
    debug: import.meta.env.DEV,    // Debug apenas em desenvolvimento
  },
  
  // Configurações globais
  global: {
    headers: {
      'x-client-info': 'vida-smart-coach@1.0.0',
    },
  },
  
  // Configurações de realtime (se necessário)
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Função para verificar configuração
export const checkSupabaseConfig = () => {
  return {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    client: !!supabase,
    timestamp: new Date().toISOString()
  };
};

// Função para testar conexão
export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Conexão com Supabase OK');
    return { 
      success: true, 
      hasSession: !!data.session,
      sessionUser: data.session?.user?.id
    };
    
  } catch (error) {
    console.error('❌ Erro crítico ao testar conexão:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
};

// Função para limpar dados de sessão (útil para debug)
export const clearSupabaseSession = async () => {
  try {
    console.log('🧹 Limpando dados de sessão...');
    
    // Fazer logout
    await supabase.auth.signOut();
    
    // Limpar localStorage manualmente se necessário
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ Dados de sessão limpos');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erro ao limpar sessão:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
};

// Função para debug de sessão
export const debugSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    const debugInfo = {
      hasSession: !!session,
      error: error?.message,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        createdAt: session.user.created_at
      } : null,
      accessToken: session?.access_token ? 'Present' : 'Missing',
      refreshToken: session?.refresh_token ? 'Present' : 'Missing',
      expiresAt: session?.expires_at,
      isExpired: session?.expires_at ? session.expires_at < Math.floor(Date.now() / 1000) : null,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 Debug Session:', debugInfo);
    return debugInfo;
    
  } catch (error) {
    console.error('❌ Erro no debug de sessão:', error);
    return { error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
};

// Expor funções para debug global (remover em produção)
if (import.meta.env.DEV) {
  (window as any).supabaseDebug = {
    client: supabase,
    checkConfig: checkSupabaseConfig,
    testConnection: testSupabaseConnection,
    clearSession: clearSupabaseSession,
    debugSession: debugSession
  };
}

export default supabase;