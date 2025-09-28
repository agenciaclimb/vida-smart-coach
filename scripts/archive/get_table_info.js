import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE4MTkxMSwiZXhwIjoyMDY5NzU3OTExfQ.2cKRn4dZzXpKvhCHlDgghtieKIdHJukO8K6BLvVPdQg'; // Using service key for admin operations
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getUserTableInfo() {
  console.log('🔍 Getting real table information...\n');
  
  try {
    // Try to get table information from information_schema
    const { data, error } = await supabase.rpc('get_table_columns', {
      table_name: 'user_profiles'
    });
    
    if (error) {
      console.log('RPC method not available, using direct queries...');
      
      // Alternative: Try to insert with minimal data to see what columns are required
      console.log('📋 Testing minimal user_profiles insert...');
      
      // Create a test user with email confirmation bypass
      const testEmail = 'test2@vidasmart.com';
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'TestPassword123!',
        email_confirm: true
      });
      
      if (authError) {
        console.log('Auth creation failed, trying with anon key...');
        console.error('Auth error:', authError);
        
        // Test what columns are available by trying different combinations
        console.log('\n🧪 Testing available columns by insertion attempts...');
        
        // Try basic profile structure
        const basicProfile = {
          id: '12345678-1234-1234-1234-123456789012', // UUID format
          full_name: 'Test User',
          name: 'Test',
          email: testEmail,
          height: 175
        };
        
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .insert(basicProfile)
          .select();
          
        if (profileError) {
          console.error('❌ Profile insert failed:', profileError);
          console.log('This tells us about required/available columns');
        } else {
          console.log('✅ Profile inserted successfully:', profileData);
        }
        
      } else {
        console.log('✅ Test user created with ID:', authData.user.id);
        
        // Now try to create profile for this user
        const profileData = {
          id: authData.user.id,
          full_name: 'Test User Silva',
          name: 'Test User',
          email: testEmail,
          height: 175
        };
        
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .insert(profileData)
          .select();
          
        if (profileError) {
          console.error('❌ Profile creation failed:', profileError);
        } else {
          console.log('✅ Profile created successfully:', profile);
        }
      }
      
    } else {
      console.log('✅ Table columns:', data);
    }
    
  } catch (error) {
    console.error('❌ Table info failed:', error);
  }
  
  // Test the actual working columns we know exist
  console.log('\n📊 Testing known working columns...');
  const workingColumns = ['id', 'full_name', 'name', 'email', 'height', 'created_at', 'updated_at'];
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(workingColumns.join(','))
      .limit(1);
      
    if (error) {
      console.error('❌ Select with working columns failed:', error);
    } else {
      console.log('✅ Working columns confirmed:', workingColumns);
    }
  } catch (e) {
    console.error('❌ Working columns test failed:', e);
  }
}

getUserTableInfo();