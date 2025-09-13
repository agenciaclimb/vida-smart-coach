// Debug script para verificar configurações
console.log('=== DEBUG ENV VARIABLES ===');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '[PRESENT]' : '[MISSING]');
console.log('VITE_STRIPE_PUBLIC_KEY:', import.meta.env.VITE_STRIPE_PUBLIC_KEY ? '[PRESENT]' : '[MISSING]');
console.log('VITE_APP_BASE_URL:', import.meta.env.VITE_APP_BASE_URL);
console.log('VITE_FUNCTIONS_ENABLED:', import.meta.env.VITE_FUNCTIONS_ENABLED);
console.log('NODE_ENV:', import.meta.env.NODE_ENV);
console.log('MODE:', import.meta.env.MODE);
console.log('================');

// Teste de conectividade com Supabase
import { supabase } from './lib/supabaseClient.js';

console.log('=== TESTING SUPABASE CONNECTION ===');
try {
  const { data, error } = await supabase.auth.getSession();
  console.log('Session test result:', { hasSession: !!data?.session, error: error?.message });
} catch (e) {
  console.error('Session test failed:', e.message);
}

// Teste básico de ping
try {
  const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
  console.log('Database connectivity test:', { success: !error, error: error?.message });
} catch (e) {
  console.error('Database test failed:', e.message);
}
console.log('====================');