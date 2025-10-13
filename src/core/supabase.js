export { supabase } from '@/lib/supabaseClient.ts';
export const invokeFn = async (name, payload) => {
  const { data, error } = await supabase.functions.invoke(name, payload ? { body: payload } : undefined);
  if (error) throw error;
  return data;
};
