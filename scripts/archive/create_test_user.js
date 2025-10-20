import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAndTestUser() {
  console.log('👤 Creating and testing user functionality...\n');
  
  const testEmail = 'demo@vidasmart.com';
  const testPassword = '<DEMO_PASSWORD>';
  
  try {
    console.log('📝 Attempting to sign up user...');
    
    // Try to sign up
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Demo User',
        }
      }
    });
    
    if (signupError) {
      console.log('Signup failed, trying to sign in instead...');
      console.log('Error:', signupError.message);
      
      // Try to sign in with existing user
      const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (signinError) {
        console.error('❌ Sign in failed:', signinError.message);
        return;
      }
      
      console.log('✅ Signed in successfully!');
      console.log('User ID:', signinData.user.id);
      console.log('Email:', signinData.user.email);
      
      // Test profile creation
      await testProfileFunction(signinData.user);
      
      // Test checkin creation
      await testCheckinFunction(signinData.user);
      
    } else {
      console.log('✅ User created successfully!');
      console.log('User ID:', signupData.user.id);
      console.log('Email:', signupData.user.email);
      console.log('⚠️ Check email for confirmation link');
    }
    
  } catch (error) {
    console.error('❌ Operation failed:', error);
  }
}

async function testProfileFunction(user) {
  console.log('\n📋 Testing profile creation...');
  
  try {
    const profileData = {
      id: user.id,
      full_name: 'Demo da Silva',
      name: 'Demo',
      email: user.email,
      height: 180,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profileData)
      .select()
      .single();
      
    if (error) {
      console.error('❌ Profile creation failed:', error);
    } else {
      console.log('✅ Profile created successfully:', data);
    }
    
  } catch (error) {
    console.error('❌ Profile test failed:', error);
  }
}

async function testCheckinFunction(user) {
  console.log('\n🎯 Testing checkin creation...');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const checkinData = {
      user_id: user.id,
      date: today,
      mood: 4,
      energy_level: 4,
      sleep_hours: 8,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('daily_checkins')
      .insert([checkinData])
      .select();
      
    if (error) {
      console.error('❌ Checkin creation failed:', error);
    } else {
      console.log('✅ Checkin created successfully:', data);
    }
    
  } catch (error) {
    console.error('❌ Checkin test failed:', error);
  }
}

console.log('🚀 Starting user creation and testing...');
console.log('📧 Test credentials:');
console.log('   Email: demo@vidasmart.com');
console.log('   Password: <DEMO_PASSWORD>');
console.log('');

createAndTestUser();