import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

try { const p = path.resolve(process.cwd(), '.env.local'); if (fs.existsSync(p)) dotenv.config({ path: p }); else dotenv.config(); } catch {}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const s = createClient(url, key);

(async () => {
  try {
    const a = await s.from('reward_redemptions').select('*').limit(1);
    console.log('reward_redemptions:', { ok: !a.error, error: a.error?.message, sample: a.data });
    const b = await s.from('reward_coupons').select('*').limit(1);
    console.log('reward_coupons:', { ok: !b.error, error: b.error?.message, sample: b.data });
    const c = await s.from('v_rewards_catalog').select('*').limit(1);
    console.log('v_rewards_catalog:', { ok: !c.error, error: c.error?.message, sample: c.data });
  } catch (e) {
    console.error('Probe error:', e.message || e);
    process.exit(1);
  }
})();
