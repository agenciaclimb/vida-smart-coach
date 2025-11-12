import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

try {
  const localEnv = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(localEnv)) dotenv.config({ path: localEnv }); else dotenv.config();
} catch {}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

(async () => {
  try {
    const { data, error } = await supabase.from('rewards').select('*').order('created_at');
    if (error) throw error;
    console.log('Rewards sample:', data?.slice(0,5));
    const { data: cat, error: e2 } = await supabase.from('v_rewards_catalog').select('*').limit(5);
    if (!e2) console.log('Catalog sample:', cat);
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  }
})();
