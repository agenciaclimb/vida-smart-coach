export { supabase } from '@/lib/supabaseClient';
import { edgeFetch } from '@/lib/edgeFetch';

const REQUIRE_JWT = new Set([
  'admin-affiliates',
  'admin-create-affiliate',
  'admin-delete-affiliate',
]);

export const invokeFn = async (functionName, body) => {
  try {
    if (REQUIRE_JWT.has(functionName)) {
      const res = await edgeFetch(functionName, {
        method: 'POST',
        body: JSON.stringify(body ?? {}),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }
      return await res.json();
    }

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
