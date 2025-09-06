
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Configuração do Supabase incompleta. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const invokeFn = async (functionName, body) => {
  if (import.meta.env.VITE_FUNCTIONS_ENABLED !== 'true') {
    const errorMessage = `A chamada da função '${functionName}' foi bloqueada porque VITE_FUNCTIONS_ENABLED não está definida como 'true'.`;
    console.warn(errorMessage);
    return Promise.reject(new Error(errorMessage));
  }

  const { data, error } = await supabase.functions.invoke(functionName, { body: body ?? {} });

  if (error) {
    const errorMessage = `Erro ao invocar a função '${functionName}': ${error.message}`;
    console.error(errorMessage, error);
    if (error.message.includes('Failed to fetch') || error.message.includes('request')) {
      throw new Error(`Falha de conexão ao tentar executar a função '${functionName}'. Verifique o CORS e se a função está implantada.`);
    }
    throw new Error(error.message);
  }

  return data;
};
