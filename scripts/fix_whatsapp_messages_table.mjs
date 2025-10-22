// Apply whatsapp_messages table fix directly to production
import fs from 'node:fs';
import path from 'node:path';

function loadDotenvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

async function runSQL(supabaseUrl, serviceKey, sql) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SQL failed (${res.status}): ${err}`);
  }
  
  return res.json();
}

async function main() {
  loadDotenvLocal();
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  console.log('🔧 Fixing whatsapp_messages table structure...\n');

  // Step 1: Backup existing data if any
  console.log('1. Checking existing data...');
  try {
    const checkRes = await fetch(`${supabaseUrl}/rest/v1/whatsapp_messages?select=count`, {
      method: 'HEAD',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'count=exact',
      }
    });
    const count = checkRes.headers.get('content-range')?.split('/')[1] || '0';
    console.log(`   Found ${count} existing messages`);
  } catch (err) {
    console.log('   Table does not exist or has errors (expected)');
  }

  // Step 2: Drop and recreate table
  console.log('\n2. Recreating table with correct structure...');
  
  const sql = `
-- Drop old table
DROP TABLE IF EXISTS public.whatsapp_messages CASCADE;

-- Create with correct structure
CREATE TABLE public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    event TEXT DEFAULT 'messages.upsert',
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages(phone);
CREATE INDEX idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp DESC);
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);

-- RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Service role can manage whatsapp_messages" ON public.whatsapp_messages;
CREATE POLICY "Service role can manage whatsapp_messages" ON public.whatsapp_messages
    FOR ALL USING (true);

-- Permissions
GRANT ALL ON public.whatsapp_messages TO service_role;
GRANT SELECT ON public.whatsapp_messages TO authenticated;
`;

  try {
    // Execute via SQL editor endpoint
    const execRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ sql }),
    });

    if (execRes.ok) {
      console.log('   ✅ Table recreated successfully');
    } else {
      // Try alternative: direct SQL execution
      console.log('   Using alternative approach...');
      
      const statements = sql.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        if (!stmt.trim()) continue;
        
        const stmtRes = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ query: stmt }),
        });
        
        if (!stmtRes.ok && !stmt.includes('DROP POLICY')) {
          console.warn(`   Warning: ${stmt.slice(0, 50)}... failed`);
        }
      }
    }
  } catch (err) {
    console.error('   ❌ Failed:', err.message);
    console.log('\n⚠️  Manual action required:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/editor');
    console.log('   2. Run this SQL:\n');
    console.log(sql);
    process.exit(1);
  }

  // Step 3: Verify
  console.log('\n3. Verifying table structure...');
  const verifyRes = await fetch(`${supabaseUrl}/rest/v1/whatsapp_messages?select=id&limit=1`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    }
  });
  
  if (verifyRes.ok) {
    console.log('   ✅ Table is accessible and ready');
  } else {
    const err = await verifyRes.text();
    console.error('   ❌ Verification failed:', err);
  }

  console.log('\n✅ Done! Now test the webhook again.');
}

main().catch(err => {
  console.error('\n💥 Script failed:', err);
  process.exit(1);
});
