
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: localStorage, // explícito
    },
    global: { headers: { "x-supabase-api-version": "2024-01-01" } },
  }
);

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
