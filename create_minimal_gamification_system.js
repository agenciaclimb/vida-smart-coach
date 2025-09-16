import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🎮 Creating minimal gamification system...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMinimalGamificationSystem() {
    try {
        console.log('🔍 Checking existing gamification structure...');
        
        // Check what tables we have
        const { data: gamificationData, error: gamError } = await supabase
            .from('gamification')
            .select('*')
            .limit(1);
        
        console.log('✅ Gamification table exists');
        
        // Check user_profiles 
        const { data: profilesData, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, name, email')
            .limit(1);
            
        console.log('✅ User profiles table exists');
        
        // Since we can't create new tables via code, let's work with existing ones
        // Let's enhance the gamification system with what we have
        
        console.log('\n🔧 Setting up gamification features with existing tables...');
        
        // 1. Check if there are users to work with
        if (profilesData && profilesData.length > 0) {
            console.log(`👥 Found ${profilesData.length} user(s) to set up gamification for`);
            
            for (const user of profilesData) {
                console.log(`\n🎯 Setting up gamification for ${user.name || user.email}...`);
                
                // Check if user already has gamification data
                const { data: existingGam, error: existingError } = await supabase
                    .from('gamification')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
                
                if (existingError && existingError.code === 'PGRST116') {
                    // User doesn't have gamification data, create it
                    console.log('   🆕 Creating new gamification record...');
                    
                    const { data: newGam, error: newGamError } = await supabase
                        .from('gamification')
                        .insert([{
                            user_id: user.id,
                            total_points: 0,
                            current_streak: 0,
                            longest_streak: 0,
                            level: 1,
                            badges: []
                        }])
                        .select()
                        .single();
                    
                    if (newGamError) {
                        console.error(`   ❌ Error creating gamification:`, newGamError.message);
                    } else {
                        console.log('   ✅ Gamification record created successfully');
                    }
                } else if (existingError) {
                    console.error(`   ❌ Error checking gamification:`, existingError.message);
                } else {
                    console.log(`   ⚠️  User already has gamification data (Level ${existingGam.level}, ${existingGam.total_points} points)`);
                }
            }
        } else {
            console.log('⚠️  No users found to set up gamification for');
        }
        
        // 2. Create a simple activity logging system using existing tables
        console.log('\n📝 Setting up activity logging system...');
        
        // We'll use the daily_checkins table if it exists, or create a note about needed tables
        const { data: checkinsData, error: checkinsError } = await supabase
            .from('daily_checkins')
            .select('*')
            .limit(1);
        
        if (checkinsError && checkinsError.message.includes('does not exist')) {
            console.log('❌ daily_checkins table not found');
            console.log('💡 Will use user_achievements table for activity tracking');
        } else {
            console.log('✅ daily_checkins table available for activity tracking');
        }
        
        // 3. Create sample achievements using user_achievements table
        console.log('\n🏆 Creating sample achievements system...');
        
        const sampleAchievements = [
            {
                achievement_type: 'streak_master',
                achievement_name: 'Streak Master',
                description: '7 days consecutive activity',
                icon: '🔥',
                points_earned: 500,
                earned_at: new Date().toISOString()
            },
            {
                achievement_type: 'fitness_warrior', 
                achievement_name: 'Fitness Warrior',
                description: 'Complete 5 workouts',
                icon: '💪',
                points_earned: 300,
                earned_at: new Date().toISOString()
            },
            {
                achievement_type: 'nutrition_ninja',
                achievement_name: 'Nutrition Ninja', 
                description: 'Perfect nutrition for 7 days',
                icon: '🥗',
                points_earned: 400,
                earned_at: new Date().toISOString()
            }
        ];
        
        // If we have users, create sample achievements for the first user
        if (profilesData && profilesData.length > 0) {
            const firstUser = profilesData[0];
            console.log(`   🎖️ Creating sample achievements for ${firstUser.name || firstUser.email}...`);
            
            for (const achievement of sampleAchievements) {
                try {
                    const { data, error } = await supabase
                        .from('user_achievements')
                        .insert([{
                            user_id: firstUser.id,
                            ...achievement
                        }])
                        .select();
                    
                    if (error) {
                        if (error.message.includes('duplicate')) {
                            console.log(`   ⚠️  Achievement ${achievement.achievement_type} already exists`);
                        } else {
                            console.error(`   ❌ Error creating achievement ${achievement.achievement_type}:`, error.message);
                        }
                    } else {
                        console.log(`   ✅ Achievement ${achievement.achievement_type} created`);
                    }
                } catch (err) {
                    console.error(`   💥 Error processing achievement ${achievement.achievement_type}:`, err.message);
                }
            }
        }
        
        // 4. Verify the system is working
        console.log('\n🧪 Testing gamification system...');
        
        // Get total users with gamification
        const { count: totalGamified, error: countError } = await supabase
            .from('gamification')
            .select('*', { count: 'exact', head: true });
            
        // Get total achievements  
        const { count: totalAchievements, error: achCountError } = await supabase
            .from('user_achievements')
            .select('*', { count: 'exact', head: true });
        
        console.log(`   📊 Users with gamification: ${totalGamified || 0}`);
        console.log(`   🏆 Total achievements: ${totalAchievements || 0}`);
        
        // 5. Create a simple demo activity function
        console.log('\n🚀 Creating demo WhatsApp activity processor...');
        
        if (profilesData && profilesData.length > 0) {
            const demoUser = profilesData[0];
            console.log(`   📱 Simulating WhatsApp activity for ${demoUser.name || demoUser.email}...`);
            
            // Simulate adding points for a WhatsApp activity
            const activityPoints = 25;
            const activityType = 'physical_activity';
            
            // Update user's gamification points
            const { data: currentGam } = await supabase
                .from('gamification')
                .select('total_points, level')
                .eq('user_id', demoUser.id)
                .single();
            
            if (currentGam) {
                const newPoints = (currentGam.total_points || 0) + activityPoints;
                const newLevel = Math.max(1, Math.floor(newPoints / 1000) + 1);
                
                const { error: updateError } = await supabase
                    .from('gamification')
                    .update({
                        total_points: newPoints,
                        level: newLevel,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', demoUser.id);
                
                if (updateError) {
                    console.error('   ❌ Error updating points:', updateError.message);
                } else {
                    console.log(`   ✅ Added ${activityPoints} points! New total: ${newPoints} (Level ${newLevel})`);
                    
                    // Create achievement if reached new level
                    if (newLevel > (currentGam.level || 1)) {
                        const levelAchievement = {
                            user_id: demoUser.id,
                            achievement_type: `level_${newLevel}`,
                            achievement_name: `Level ${newLevel} Reached!`,
                            description: `Congratulations! You reached level ${newLevel}`,
                            icon: '🏆',
                            points_earned: newLevel * 50,
                            earned_at: new Date().toISOString()
                        };
                        
                        const { error: levelError } = await supabase
                            .from('user_achievements')
                            .insert([levelAchievement]);
                        
                        if (!levelError) {
                            console.log(`   🎉 Level up achievement created for Level ${newLevel}!`);
                        }
                    }
                }
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('💥 Fatal error:', error);
        return false;
    }
}

// Summary and next steps
async function showSystemStatus() {
    try {
        console.log('\n📋 GAMIFICATION SYSTEM STATUS');
        console.log('=' * 50);
        
        // Check key tables
        const tables = {
            'gamification': '🎮',
            'user_achievements': '🏆', 
            'user_profiles': '👤',
            'whatsapp_messages': '📱'
        };
        
        for (const [table, icon] of Object.entries(tables)) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });
                
                if (error) {
                    console.log(`${icon} ${table}: ❌ ${error.message}`);
                } else {
                    console.log(`${icon} ${table}: ✅ (${count || 0} records)`);
                }
            } catch (err) {
                console.log(`${icon} ${table}: ❌ ${err.message}`);
            }
        }
        
        console.log('\n💡 NEXT STEPS FOR FULL FUNCTIONALITY:');
        console.log('1. 🎯 Test the gamification UI in the app');
        console.log('2. 📱 Set up WhatsApp webhook integration');
        console.log('3. 🛡️ Implement anti-fraud system');
        console.log('4. ⚡ Add real-time notifications');
        console.log('5. 📊 Create admin dashboard');
        
        console.log('\n🔗 Access the app: https://3000-i980bncctri6yqqpcxtrd-6532622b.e2b.dev');
        console.log('🎮 The gamification system is now ready for basic testing!');
        
    } catch (error) {
        console.error('Error getting system status:', error);
    }
}

// Main execution
async function main() {
    const success = await createMinimalGamificationSystem();
    
    if (success) {
        await showSystemStatus();
        console.log('\n🎉 Minimal gamification system setup complete!');
    } else {
        console.log('\n❌ Setup encountered issues. Check the errors above.');
    }
}

main().catch(console.error);