import fs from 'node:fs';
import path from 'node:path';

function loadEnv(){
  const p = path.resolve(process.cwd(), '.env.local');
  if(!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)){
    if(!line || line.startsWith('#') || !line.includes('=')) continue;
    const [k, ...rest] = line.split('=');
    const v = rest.join('=');
    if(!(k in process.env)) process.env[k] = v;
  }
}

const args = Object.fromEntries(process.argv.slice(2).map((a,i,arr)=> a.startsWith('--') ? [a.slice(2), (arr[i+1] && !arr[i+1].startsWith('--')) ? arr[i+1] : 'true'] : [] ).filter(Boolean));

async function main(){
  loadEnv();
  const url = `${process.env.SUPABASE_URL}/functions/v1/generate-plan`;
  const token = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  let userId = args.userId;
  const planType = args.planType || 'physical';
  if(!url || !token){
    console.error('Missing SUPABASE_URL or token env');
    process.exit(1);
  }

  if(!userId){
    const rest = `${process.env.SUPABASE_URL}/rest/v1/user_profiles?select=id&limit=1`;
    const r = await fetch(rest, { headers: { apikey: token, Authorization: `Bearer ${token}` } });
    const j = await r.json().catch(()=>[]);
    userId = j?.[0]?.id;
    console.log('auto-picked userId:', userId);
  }
  if(!userId){
    console.error('No userId available. Pass --userId');
    process.exit(1);
  }

  const body = {
    userId,
    planType,
    userProfile: {
      id: userId,
      full_name: args.name || 'Teste',
      goal: args.goal || 'definição',
      experience: args.experience || 'intermediário',
      limitations: args.limitations || '',
      time: args.time || '60min/dia'
    }
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  console.log('status', res.status);
  console.log(text);
}

main();
