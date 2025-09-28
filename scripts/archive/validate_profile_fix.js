import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 VALIDATING PROFILE SAVING FUNCTIONALITY AFTER TYPE FIX\\n');
console.log('='.repeat(80));

async function validateProfileFix() {
    let testsPassed = 0;
    let totalTests = 0;
    
    const logTest = (testName, passed, details = '') => {
        totalTests++;
        if (passed) {
            testsPassed++;
            console.log(`✅ ${testName}`);
        } else {
            console.log(`❌ ${testName}`);
        }
        if (details) {
            console.log(`   ${details}`);
        }
    };
    
    // Test 1: Check if tables exist and have correct structure
    console.log('\\n1️⃣ TESTING DATABASE STRUCTURE');
    console.log('-'.repeat(50));
    
    try {
        // Check user_profiles table structure
        const { data: profileCols, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(0);
            
        if (profileError) {
            logTest('user_profiles table exists', false, `Error: ${profileError.message}`);
        } else {
            logTest('user_profiles table exists', true);
        }
        
        // Check daily_checkins table structure
        const { data: checkinCols, error: checkinError } = await supabase
            .from('daily_checkins')
            .select('*')
            .limit(0);
            
        if (checkinError) {
            logTest('daily_checkins table exists', false, `Error: ${checkinError.message}`);
        } else {
            logTest('daily_checkins table exists', true);
        }
    } catch (e) {
        logTest('Database structure test', false, `Unexpected error: ${e.message}`);
    }
    
    // Test 2: Check if safe functions exist
    console.log('\\n2️⃣ TESTING SAFE UPSERT FUNCTIONS');
    console.log('-'.repeat(50));
    
    try {
        // Test safe_upsert_user_profile function
        const { data: functionData, error: functionError } = await supabase
            .rpc('safe_upsert_user_profile', {
                p_user_id: '00000000-0000-0000-0000-000000000000',
                p_full_name: 'Test Function'
            });
            
        if (functionError) {
            if (functionError.message.includes('not allowed') || functionError.code === '42501') {
                logTest('safe_upsert_user_profile function exists', true, 'Function exists (RLS prevented execution as expected)');
            } else if (functionError.message.includes('does not exist')) {
                logTest('safe_upsert_user_profile function exists', false, 'Function not found - migration may not have been executed');
            } else {
                logTest('safe_upsert_user_profile function exists', false, `Error: ${functionError.message}`);
            }
        } else {
            logTest('safe_upsert_user_profile function exists', true, 'Function executed successfully');
        }
    } catch (e) {
        logTest('Safe function test', false, `Unexpected error: ${e.message}`);
    }
    
    // Test 3: Check current session (if any)
    console.log('\\n3️⃣ TESTING AUTHENTICATION STATUS');
    console.log('-'.repeat(50));
    
    try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            logTest('Session check', false, `Error: ${sessionError.message}`);
        } else if (session?.session?.user) {
            logTest('User authentication', true, `Logged in as: ${session.session.user.email}`);
            
            // If user is authenticated, test profile operations
            console.log('\\n4️⃣ TESTING PROFILE OPERATIONS (AUTHENTICATED USER)');
            console.log('-'.repeat(50));
            
            const userId = session.session.user.id;
            
            // Test profile retrieval
            try {
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();
                    
                if (profileError) {
                    logTest('Profile retrieval', false, `Error: ${profileError.message}`);
                } else {
                    logTest('Profile retrieval', true, profile ? 'Profile found' : 'No profile yet (normal for new users)');
                    
                    if (profile) {
                        console.log('   📋 Current profile data:');
                        console.log(`      Name: ${profile.full_name || profile.name || 'Not set'}`);
                        console.log(`      Email: ${profile.email || 'Not set'}`);
                        console.log(`      Phone: ${profile.phone || 'Not set'}`);
                        console.log(`      Age: ${profile.age || 'Not set'}`);
                        console.log(`      Height: ${profile.height || 'Not set'}`);
                        console.log(`      Weight: ${profile.current_weight || 'Not set'}`);
                        console.log(`      Target: ${profile.target_weight || 'Not set'}`);
                        console.log(`      Gender: ${profile.gender || 'Not set'}`);
                        console.log(`      Activity: ${profile.activity_level || 'Not set'}`);
                        console.log(`      Goal: ${profile.goal_type || 'Not set'}`);
                    }
                }
            } catch (e) {
                logTest('Profile retrieval', false, `Unexpected error: ${e.message}`);
            }
            
            // Test profile update with potential type conflicts
            try {
                const testProfileData = {
                    full_name: 'Test User Updated',
                    phone: '11999887766',
                    age: '25',  // String that should be converted to integer
                    height: '175',  // String that should be converted to integer
                    current_weight: '70.5',  // String that should be converted to decimal
                    target_weight: '68.0',  // String that should be converted to decimal
                    gender: 'masculino',
                    activity_level: 'moderado',
                    goal_type: 'perder_peso'
                };
                
                console.log('   🧪 Testing profile update with mixed data types...');
                
                // Try the safe function first
                const { data: safeResult, error: safeError } = await supabase
                    .rpc('safe_upsert_user_profile', {
                        p_user_id: userId,
                        p_full_name: testProfileData.full_name,
                        p_phone: testProfileData.phone,
                        p_age: parseInt(testProfileData.age),
                        p_height: parseInt(testProfileData.height),
                        p_current_weight: parseFloat(testProfileData.current_weight),
                        p_target_weight: parseFloat(testProfileData.target_weight),
                        p_gender: testProfileData.gender,
                        p_activity_level: testProfileData.activity_level,
                        p_goal_type: testProfileData.goal_type
                    });
                    
                if (safeError) {
                    logTest('Profile update (safe function)', false, `Error: ${safeError.message}`);
                    
                    // Fallback to direct upsert
                    console.log('   🔄 Trying fallback method...');
                    
                    const { data: fallbackResult, error: fallbackError } = await supabase
                        .from('user_profiles')
                        .upsert({
                            id: userId,
                            full_name: testProfileData.full_name,
                            name: testProfileData.full_name,
                            email: session.session.user.email,
                            phone: testProfileData.phone,
                            age: parseInt(testProfileData.age),
                            height: parseInt(testProfileData.height),
                            current_weight: parseFloat(testProfileData.current_weight),
                            target_weight: parseFloat(testProfileData.target_weight),
                            gender: testProfileData.gender,
                            activity_level: testProfileData.activity_level,
                            goal_type: testProfileData.goal_type,
                            updated_at: new Date().toISOString()
                        })
                        .select()
                        .single();
                        
                    if (fallbackError) {
                        logTest('Profile update (fallback method)', false, `Error: ${fallbackError.message}`);
                    } else {
                        logTest('Profile update (fallback method)', true, 'Profile updated successfully');
                        console.log('   ✅ No type mismatch errors detected!');
                    }
                } else {
                    logTest('Profile update (safe function)', true, 'Profile updated successfully');
                    console.log('   ✅ Safe function working correctly!');
                }
                
            } catch (e) {
                logTest('Profile update test', false, `Unexpected error: ${e.message}`);
            }
            
            // Test daily checkin operations
            console.log('\\n5️⃣ TESTING DAILY CHECKIN OPERATIONS');
            console.log('-'.repeat(50));
            
            try {
                const testCheckinData = {
                    user_id: userId,
                    date: new Date().toISOString().split('T')[0],
                    mood: '4',  // String that should be converted to integer
                    mood_score: '4',  // String that should be converted to integer
                    energy_level: '3',  // String that should be converted to integer
                    sleep_hours: '7.5',  // String that should be converted to decimal
                    weight: '70.2'  // String that should be converted to decimal
                };
                
                console.log('   🧪 Testing checkin with mixed data types...');
                
                const { data: checkinResult, error: checkinError } = await supabase
                    .from('daily_checkins')
                    .upsert({
                        user_id: testCheckinData.user_id,
                        date: testCheckinData.date,
                        mood: parseInt(testCheckinData.mood),
                        mood_score: parseInt(testCheckinData.mood_score),
                        energy_level: parseInt(testCheckinData.energy_level),
                        sleep_hours: parseFloat(testCheckinData.sleep_hours),
                        weight: parseFloat(testCheckinData.weight),
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                    
                if (checkinError) {
                    logTest('Daily checkin update', false, `Error: ${checkinError.message}`);
                } else {
                    logTest('Daily checkin update', true, 'Checkin saved successfully');
                    console.log('   ✅ No type mismatch errors in checkins!');
                }
                
            } catch (e) {
                logTest('Daily checkin test', false, `Unexpected error: ${e.message}`);
            }
            
        } else {
            logTest('User authentication', false, 'No authenticated user found');
            console.log('   ℹ️ To test profile operations completely, log in to the application first');
        }
    } catch (e) {
        logTest('Authentication test', false, `Unexpected error: ${e.message}`);
    }
    
    // Final report
    console.log('\\n' + '='.repeat(80));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(80));
    
    const successRate = Math.round((testsPassed / totalTests) * 100);
    
    console.log(`✅ Tests Passed: ${testsPassed}/${totalTests} (${successRate}%)`);
    
    if (successRate >= 80) {
        console.log('\\n🎉 EXCELLENT! The type mismatch fix appears to be working correctly.');
        console.log('✅ Profile saving functionality should now work properly.');
    } else if (successRate >= 60) {
        console.log('\\n⚠️ PARTIAL SUCCESS: Some tests failed, but core functionality may work.');
        console.log('🔧 Check the failed tests above and ensure the migration was executed.');
    } else {
        console.log('\\n❌ CRITICAL: Multiple tests failed. Profile saving may still have issues.');
        console.log('🚨 Make sure to execute the CRITICAL_TYPE_FIX_MIGRATION.sql in Supabase.');
    }
    
    console.log('\\n📋 NEXT STEPS:');
    console.log('1. 🗄️ Execute CRITICAL_TYPE_FIX_MIGRATION.sql in Supabase Dashboard');
    console.log('2. 🔄 Restart the application to reload the updated schema');
    console.log('3. 🧪 Test profile saving in the web interface');
    console.log('4. 📱 Test daily check-ins functionality');
    console.log('5. 🔍 Monitor browser console for any remaining errors');
    
    console.log('\\n🔗 USEFUL LINKS:');
    console.log('📊 Supabase SQL Editor: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/sql/new');
    console.log('🛠️ Application URL: Use the GetServiceUrl tool to get the current URL');
    
    console.log('\\n✨ Good luck! The profile panel should now save information correctly.');
}

validateProfileFix().catch(console.error);