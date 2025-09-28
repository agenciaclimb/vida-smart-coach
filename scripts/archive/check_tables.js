import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableStructures() {
  console.log('🔍 Checking table structures...\n');
  
  try {
    // Check user_profiles table structure
    console.log('📋 USER_PROFILES TABLE:');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
      
    if (profilesError) {
      console.error('❌ Error checking user_profiles:', profilesError);
    } else {
      console.log('✅ user_profiles columns:', Object.keys(profiles?.[0] || {}));
    }
    
    // Check daily_checkins table structure  
    console.log('\n📊 DAILY_CHECKINS TABLE:');
    const { data: checkins, error: checkinsError } = await supabase
      .from('daily_checkins')
      .select('*')
      .limit(1);
      
    if (checkinsError) {
      console.error('❌ Error checking daily_checkins:', checkinsError);
    } else {
      console.log('✅ daily_checkins columns:', Object.keys(checkins?.[0] || {}));
    }
    
    // Try different column names that might exist
    console.log('\n🔍 Testing possible column names in daily_checkins:');
    const testColumns = ['mood', 'mood_score', 'energy_level', 'sleep', 'sleep_hours', 'weight'];
    
    for (const col of testColumns) {
      try {
        const { data, error } = await supabase
          .from('daily_checkins')
          .select(col)
          .limit(1);
          
        if (!error) {
          console.log(`✅ Column exists: ${col}`);
        }
      } catch (e) {
        console.log(`❌ Column missing: ${col}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Table check failed:', error);
  }
}

checkTableStructures();