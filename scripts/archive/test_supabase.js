import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test functions
async function testConnection() {
  console.log('🔧 Testing Supabase connection...');
  
  try {
    // Test 1: Check connection
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .limit(5);
      
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log('✅ Users found:', users?.length || 0);
      if (users?.length > 0) {
        console.log('📋 First user sample:', users[0]);
      }
    }
    
    // Test 2: Check tables
    const { data: tables, error: tablesError } = await supabase
      .from('daily_checkins')
      .select('user_id, date, mood_score')
      .limit(3);
      
    if (tablesError) {
      console.error('❌ Error fetching checkins:', tablesError);
    } else {
      console.log('✅ Daily checkins found:', tables?.length || 0);
    }
    
    // Test 3: Create a test user if none exists
    if (!users || users.length === 0) {
      console.log('📝 Creating test user...');
      
      const testEmail = 'test@vidasmart.com';
      const testPassword = 'TestPassword123!';
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });
      
      if (authError) {
        console.error('❌ Error creating test user:', authError);
      } else {
        console.log('✅ Test user created:', authData.user?.email);
        console.log('🔑 Use these credentials to test:');
        console.log('   Email:', testEmail);
        console.log('   Password:', testPassword);
      }
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

// Test profile update
async function testProfileUpdate() {
  console.log('🧪 Testing profile update functionality...');
  
  try {
    // Try to authenticate first with existing session
    const { data: session } = await supabase.auth.getSession();
    
    if (session?.session?.user) {
      const userId = session.session.user.id;
      console.log('📝 Testing profile update for user:', userId);
      
      const testProfile = {
        id: userId,
        full_name: 'Usuário Teste',
        phone: '11999998888',
        current_weight: 75.5,
        target_weight: 70,
        height: 175,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(testProfile)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Profile update error:', error);
      } else {
        console.log('✅ Profile updated successfully:', data);
      }
    } else {
      console.log('⚠️ No active session found for profile test');
    }
    
  } catch (error) {
    console.error('❌ Profile update test failed:', error);
  }
}

// Test checkin creation
async function testCheckinCreation() {
  console.log('🎯 Testing checkin creation...');
  
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (session?.session?.user) {
      const userId = session.session.user.id;
      const today = new Date().toISOString().split('T')[0];
      
      const testCheckin = {
        user_id: userId,
        date: today,
        weight: 75.0,
        mood_score: 4,
        sleep_hours: 8,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('daily_checkins')
        .insert([testCheckin])
        .select();
        
      if (error) {
        console.error('❌ Checkin creation error:', error);
      } else {
        console.log('✅ Checkin created successfully:', data);
      }
    } else {
      console.log('⚠️ No active session found for checkin test');
    }
    
  } catch (error) {
    console.error('❌ Checkin creation test failed:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Supabase functionality tests...\n');
  
  await testConnection();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testProfileUpdate();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testCheckinCreation();
  console.log('\n🏁 Tests completed!');
}

runTests().catch(console.error);