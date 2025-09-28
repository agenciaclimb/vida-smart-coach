import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('🔐 Testing login functionality...\n');
  
  // Try different email/password combinations that might exist
  const testAccounts = [
    { email: 'test@vidasmart.com', password: 'TestPassword123!' },
    { email: 'demo@vidasmart.com', password: 'Demo123456!' },
    { email: 'admin@vidasmart.com', password: 'Admin123!' },
    { email: 'user@vidasmart.com', password: 'User123!' }
  ];
  
  for (const account of testAccounts) {
    console.log(`🔑 Trying login with ${account.email}...`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword(account);
      
      if (error) {
        console.log(`❌ Login failed: ${error.message}`);
      } else {
        console.log(`✅ Login successful!`);
        console.log(`   User ID: ${data.user.id}`);
        console.log(`   Email: ${data.user.email}`);
        console.log(`   Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);
        
        // Test the functionality with this user
        await testUserFunctions(data.user);
        
        // Sign out
        await supabase.auth.signOut();
        console.log('🚪 Signed out\n');
        return; // Stop after first successful login
      }
    } catch (e) {
      console.log(`❌ Exception: ${e.message}`);
    }
  }
  
  console.log('❌ No successful login found. Creating a simple test...\n');
  await createSimpleUser();
}

async function testUserFunctions(user) {
  console.log('\n📋 Testing profile operations...');
  
  try {
    // Test profile read
    const { data: existingProfile, error: readError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (readError && readError.code !== 'PGRST116') {
      console.error('Profile read error:', readError);
    } else {
      console.log('Current profile:', existingProfile || 'None');
    }
    
    // Test profile upsert
    const profileData = {
      id: user.id,
      full_name: 'Usuário Teste Funcional',
      name: 'Teste',
      email: user.email,
      height: 175,
      updated_at: new Date().toISOString()
    };
    
    const { data: profileResult, error: profileError } = await supabase
      .from('user_profiles')
      .upsert(profileData)
      .select()
      .single();
      
    if (profileError) {
      console.error('❌ Profile upsert failed:', profileError);
    } else {
      console.log('✅ Profile upserted successfully:', profileResult);
    }
    
    // Test checkin
    console.log('\n🎯 Testing checkin operations...');
    
    const today = new Date().toISOString().split('T')[0];
    
    const checkinData = {
      user_id: user.id,
      date: today,
      mood: 5,
      energy_level: 5,
      sleep_hours: 8,
      created_at: new Date().toISOString()
    };
    
    const { data: checkinResult, error: checkinError } = await supabase
      .from('daily_checkins')
      .insert([checkinData])
      .select();
      
    if (checkinError) {
      if (checkinError.code === '23505' || checkinError.message.includes('duplicate')) {
        console.log('⚠️ Checkin already exists for today');
      } else {
        console.error('❌ Checkin creation failed:', checkinError);
      }
    } else {
      console.log('✅ Checkin created successfully:', checkinResult);
    }
    
  } catch (error) {
    console.error('❌ Function test failed:', error);
  }
}

async function createSimpleUser() {
  console.log('📝 Creating simple user without email confirmation...');
  
  // Generate a random email to avoid conflicts
  const randomId = Math.random().toString(36).substring(2, 15);
  const testEmail = `test-${randomId}@example.com`;
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'Test123456!',
    options: {
      data: {
        full_name: 'Test User'
      }
    }
  });
  
  if (error) {
    console.error('❌ Simple user creation failed:', error);
  } else {
    console.log('✅ Simple user created:', testEmail);
    console.log('   Note: May require email confirmation');
  }
}

testLogin();