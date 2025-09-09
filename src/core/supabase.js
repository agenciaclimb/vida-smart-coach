export { supabase } from '@/lib/supabaseClient';

/** Invoca Supabase Edge Functions com tratamento de erro consistente. */
export const invokeFn = async (functionName, body) => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body ?? {},
    });
    if (error) {
      const msg = error?.message || String(error);
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    console.error(`Erro na função '${functionName}':`, err);
    throw err;
  }
};
