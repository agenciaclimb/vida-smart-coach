import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

try{const p = path.resolve(process.cwd(),'.env.local');if(fs.existsSync(p))dotenv.config({path:p});else dotenv.config();}catch{}
const s=createClient(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_KEY);

(async()=>{
  const r=await s.rpc('exec_sql',{sql_query:"SELECT * FROM pg_views WHERE viewname='v_user_xp_totals'"});
  console.log('View check:',r);
  const t=await s.from('v_user_xp_totals').select('user_id').limit(1);
  console.log('Select test:',t.error?('error: '+t.error.message):('ok',t.data));
})();
