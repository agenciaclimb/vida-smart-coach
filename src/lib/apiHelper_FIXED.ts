import { supabase } from './supabase';

interface ApiOptions {
  maxRetries?: number;
  showError?: boolean;
}

/**
 * Wrapper para chamadas API com refresh automático de token
 */
export const apiCall = async <T>(
  apiFunction: () => Promise<{ data: T; error: any }>,
  options: ApiOptions = {}
): Promise<{ data: T; error: any }> => {
  const { maxRetries = 1, showError = true } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 API Call - Tentativa ${attempt + 1}/${maxRetries + 1}`);
      
      const result = await apiFunction();

      // Se sucesso, retornar resultado
      if (!result.error) {
        console.log('✅ API Call bem-sucedida');
        return result;
      }

      // Verificar se é erro de token expirado
      const isTokenError = result.error?.message?.includes('JWT expired') ||
                          result.error?.message?.includes('invalid claim') ||
                          result.error?.message?.includes('token') ||
                          result.error?.code === 'PGRST301';

      if (isTokenError && attempt < maxRetries) {
        console.log('🔄 Token expirado detectado, tentando refresh...');
        
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('❌ Falha no refresh do token:', refreshError?.message);
          
          // Se refresh falhar, fazer logout
          await supabase.auth.signOut();
          window.location.href = '/login';
          
          return {
            data: null as T,
            error: { message: 'Sessão expirada. Faça login novamente.' }
          };
        }

        console.log('✅ Token refreshed, tentando API novamente...');
        continue; // Tentar novamente com o novo token
      }

      // Se não é erro de token ou esgotaram as tentativas
      if (showError) {
        console.error('❌ Erro na API:', result.error);
      }
      
      return result;

    } catch (error) {
      console.error('❌ Erro crítico na API call:', error);
      
      if (attempt === maxRetries) {
        return {
          data: null as T,
          error: { message: 'Erro de conexão. Tente novamente.' }
        };
      }
    }
  }

  // Fallback (não deveria chegar aqui)
  return {
    data: null as T,
    error: { message: 'Erro desconhecido na API' }
  };
};

/**
 * Funções específicas para as APIs do dashboard
 */
export const fetchDadosComunidade = async () => {
  return apiCall(async () => {
    return await supabase
      .from('comunidade')
      .select('*');
  });
};

export const fetchPlanos = async () => {
  return apiCall(async () => {
    return await supabase
      .from('planos')
      .select('*');
  });
};

export const fetchRecompensas = async () => {
  return apiCall(async () => {
    return await supabase
      .from('recompensas')
      .select('*');
  });
};

export const fetchUserProfile = async (userId: string) => {
  return apiCall(async () => {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
  });
};

/**
 * Função genérica para qualquer query do Supabase
 */
export const executeSupabaseQuery = async <T>(
  queryBuilder: any,
  options?: ApiOptions
): Promise<{ data: T; error: any }> => {
  return apiCall(async () => {
    return await queryBuilder;
  }, options);
};

/**
 * Helper para verificar se usuário está autenticado
 */
export const checkAuth = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.log('ℹ️ Usuário não autenticado');
      return false;
    }

    // Verificar se token não está expirado
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.log('⚠️ Token expirado, tentando refresh...');
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.log('❌ Refresh falhou, usuário não autenticado');
        return false;
      }
      
      console.log('✅ Token refreshed automaticamente');
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar auth:', error);
    return false;
  }
};