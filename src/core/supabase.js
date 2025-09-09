export { supabase } from '@/lib/supabaseClient';

/** Invoca Edge Functions com tratamento de erro consistente. */
export const invokeFn = async (functionName, body) => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body ?? {},
    });
    if (error) throw new Error(error.message || 'Request failed');
    return data;
  } catch (err) {
    console.error(`Erro na função '${functionName}':`, err);
    throw err;
  }
};
