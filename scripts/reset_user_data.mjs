// Reset user data by email for clean testing
// Usage: node scripts/reset_user_data.mjs <email>

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('Missing .env.local at project root');
  }
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  envContent.split('\n').forEach((line) => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...values] = line.split('=');
      if (key && values.length) env[key.trim()] = values.join('=').trim();
    }
  });
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const k of required) {
    if (!env[k]) throw new Error(`Missing ${k} in .env.local`);
  }
  return env;
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Provide an email to reset.');
    console.error('Example: node scripts/reset_user_data.mjs user@example.com');
    process.exit(1);
  }

  const env = loadEnv();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`\n🧹 Resetting data for: ${email}`);

  // 1) Resolve user id + phone
  const { data: profile, error: profileErr } = await supabase
    .from('user_profiles')
    .select('id, email, ia_stage, phone')
    .eq('email', email)
    .maybeSingle();

  if (profileErr) {
    console.error('Failed to fetch user profile:', profileErr.message);
    process.exit(1);
  }
  if (!profile) {
    console.error('User not found in user_profiles by email. Aborting.');
    process.exit(2);
  }

  const userId = profile.id;
  const phone = profile.phone || null;
  console.log(`👤 user_id=${userId} | phone=${phone || 'n/a'} | current_stage=${profile.ia_stage || 'n/a'}`);

  // 2) Tables to delete, in safe dependency order
  const tables = [
    'plan_completions',
    'plan_feedback',
    'conversation_memory',
    'interactions',
    'area_diagnostics',
    'client_actions',
    'client_goals',
    'daily_missions',
    'daily_activities',
    'daily_checkins',
    'user_training_plans',
    'user_gamification_summary',
    'gamification',
    'stage_transitions',
    'client_stages',
  ];

  // 2.a) Best-effort deletions by user_id
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).delete().eq('user_id', userId);
      if (error && !String(error.message).includes('relation') /* table may not exist */) {
        console.warn(`⚠️ ${table}: ${error.message}`);
      } else {
        console.log(`✅ Cleared ${table}`);
      }
    } catch (e) {
      console.warn(`⚠️ ${table}: ${e.message}`);
    }
  }

  // 2.b) WhatsApp messages by phone (schema evolved: user_phone or phone)
  if (phone) {
    try {
      const { error: delWAErr1 } = await supabase.from('whatsapp_messages').delete().eq('user_phone', phone);
      if (!delWAErr1) console.log('✅ Cleared whatsapp_messages by user_phone');
      else console.log('ℹ️ user_phone column not matched or no rows');
    } catch {}
    try {
      const { error: delWAErr2 } = await supabase.from('whatsapp_messages').delete().eq('phone', phone);
      if (!delWAErr2) console.log('✅ Cleared whatsapp_messages by phone');
      else console.log('ℹ️ phone column not matched or no rows');
    } catch {}
  }

  // 3) Reset profile stage + metadata
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ ia_stage: 'sdr', stage_metadata: {} })
      .eq('id', userId);
    if (error) console.warn('⚠️ Could not reset ia_stage:', error.message);
    else console.log('✅ user_profiles.ia_stage reset to sdr and stage_metadata cleared');
  } catch (e) {
    console.warn('⚠️ Could not update user_profiles:', e.message);
  }

  // 4) Optional: reinitialize gamification summary if table exists
  try {
    const { error: insErr } = await supabase.from('user_gamification_summary').insert({
      user_id: userId,
      total_points: 0,
      current_level: 1,
      badges: [],
      streak_days: 0,
    });
    if (!insErr) console.log('✅ Reinitialized user_gamification_summary');
  } catch {
    // ignore if table not present
  }

  console.log('\n🎉 Reset concluído. Pode testar pelo WhatsApp a partir do SDR.');
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(99);
});
