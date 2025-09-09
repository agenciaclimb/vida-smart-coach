export { supabase } from '@/lib/supabaseClient';

export const invokeFn = async (functionName, body) => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body ?? {},
    });
    if (error) {
      const msg = error?.message || String(error);
      if (msg.includes('Failed to fetch') || msg.includes('request')) {
        throw new Error(
          `Falha ao conectar na função '${functionName}'. Verifique CORS e se a função está implantada.`
        );
      }
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    console.error(`Erro ao invocar função '${functionName}':`, err);
    throw err;
  }
};
