import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ===============================================
// 🔧 SUPABASE CLIENT SINGLETON - VIDA SMART
// ===============================================
// Garante apenas UMA instância do cliente Supabase

let _supabaseInstance: SupabaseClient | null = null;

/**
 * Obtém a instância única do cliente Supabase
 * @returns SupabaseClient configurado
 */
export function getSupabase(): SupabaseClient {
  if (_supabaseInstance) {
    return _supabaseInstance;
  }

  // Verificar se as variáveis de ambiente estão presentes
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('❌ VITE_SUPABASE_URL não definida nas variáveis de ambiente');
  }

  if (!supabaseAnonKey) {
    throw new Error('❌ VITE_SUPABASE_ANON_KEY não definida nas variáveis de ambiente');
  }

  // Log de configuração (removível em produção)
  console.log('🔧 Criando cliente Supabase singleton:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    keyPrefix: supabaseAnonKey.substring(0, 20) + '...'
  });

  // Criar instância única com configurações otimizadas
  _supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Configurações de autenticação robustas
      autoRefreshToken: true,        // Refresh automático
      persistSession: true,          // Persistir no localStorage
      detectSessionInUrl: false,     // Não detectar na URL (evita conflitos)
      flowType: 'pkce',             // Flow seguro PKCE
      
      // Storage customizado para debugging
      storage: {
        getItem: (key: string) => {
          const value = localStorage.getItem(key);
          if (key.includes('sb-') && value) {
            console.log('📖 Auth storage GET:', key, '→', value ? 'Present' : 'Empty');
          }
          return value;
        },
        setItem: (key: string, value: string) => {
          if (key.includes('sb-')) {
            console.log('💾 Auth storage SET:', key, '→', value ? 'Saved' : 'Cleared');
          }
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          if (key.includes('sb-')) {
            console.log('🗑️ Auth storage REMOVE:', key);
          }
          localStorage.removeItem(key);
        }
      }
    },
    
    // Headers globais
    global: {
      headers: {
        'x-client-info': 'vida-smart-coach@1.0.0',
      },
    },
    
    // Configurações de realtime (otimizadas)
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
  });

  return _supabaseInstance;
}

/**
 * Reseta o singleton (útil para testes ou reinicialização)
 */
export function resetSupabaseInstance(): void {
  console.log('🔄 Resetando instância Supabase singleton');
  _supabaseInstance = null;
}

/**
 * Verifica se o cliente está configurado corretamente
 */
export function validateSupabaseConfig(): { valid: boolean; error?: string } {
  try {
    const client = getSupabase();
    return { 
      valid: true,
      error: undefined
    };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

// Exportar instância padrão
export default getSupabase();