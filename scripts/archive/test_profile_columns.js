import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProfileColumns() {
  console.log('🔍 Testing user_profiles table columns...\n');
  
  const testColumns = [
    'id', 'full_name', 'name', 'phone', 'email',
    'current_weight', 'target_weight', 'height',
    'created_at', 'updated_at'
  ];
  
  console.log('Testing column existence:');
  for (const col of testColumns) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select(col)
        .limit(1);
        
      if (!error) {
        console.log(`✅ Column exists: ${col}`);
      } else {
        console.log(`❌ Column missing: ${col} (${error.message})`);
      }
    } catch (e) {
      console.log(`❌ Column error: ${col} (${e.message})`);
    }
  }
  
  // Try to create a test profile to see what happens
  console.log('\n📝 Testing profile creation with test user...');
  
  try {
    // Login with test user first
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@vidasmart.com',
      password: '<TEST_PASSWORD>'
    });
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      return;
    }
    
    console.log('✅ Logged in successfully as:', loginData.user.email);
    
    // Try to create/update profile
    const profileData = {
      id: loginData.user.id,
      full_name: 'Teste da Silva',
      phone: '11999998888',
      current_weight: 75.5,
      target_weight: 70,
      height: 175,
      updated_at: new Date().toISOString()
    };
    
    const { data: profileResult, error: profileError } = await supabase
      .from('user_profiles')
      .upsert(profileData)
      .select()
      .single();
      
    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
    } else {
      console.log('✅ Profile created/updated successfully:', profileResult);
    }
    
    // Now test checkin creation
    console.log('\n🎯 Testing checkin creation...');
    const today = new Date().toISOString().split('T')[0];
    
    const checkinData = {
      user_id: loginData.user.id,
      date: today,
      weight: 75.0,
      mood: 4,
      energy_level: 4,
      sleep_hours: 8,
      created_at: new Date().toISOString()
    };
    
    const { data: checkinResult, error: checkinError } = await supabase
      .from('daily_checkins')
      .insert([checkinData])
      .select();
      
    if (checkinError) {
      console.error('❌ Checkin creation error:', checkinError);
    } else {
      console.log('✅ Checkin created successfully:', checkinResult);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProfileColumns();