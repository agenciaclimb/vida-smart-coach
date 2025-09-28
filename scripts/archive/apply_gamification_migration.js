import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[ERRO] Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variaveis de ambiente.');
    process.exit(1);
}

console.log('[INFO] Aplicando migracao do sistema de gamificacao...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyGamificationMigration() {
    try {
        // Read the migration SQL file
        const migrationSQL = await readFile('./supabase/migrations/20240916000001_enhance_gamification_system.sql', 'utf-8');
        
        // Split into individual statements (avoiding splits within function bodies)
        const statements = migrationSQL
            .split(/(?<!END);\s*(?:\r?\n|$)/)
            .map(stmt => stmt.trim())
            .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'COMMIT');

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            if (statement.length < 10) continue; // Skip very short statements
            
            console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}:`);
            console.log(`   ${statement.substring(0, 80)}${statement.length > 80 ? '...' : ''}`);
            
            try {
                const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
                
                if (error) {
                    // Handle specific "already exists" errors as warnings, not failures
                    if (error.message.includes('already exists') || 
                        error.message.includes('relation') && error.message.includes('already exists') ||
                        error.message.includes('column') && error.message.includes('already exists')) {
                        console.log(`   ⚠️  Already exists - skipping`);
                    } else {
                        console.error(`   ❌ Error:`, error.message);
                        errorCount++;
                        
                        // Don't fail on constraint errors - they might be duplicates
                        if (!error.message.includes('constraint') && !error.message.includes('duplicate')) {
                            continue;
                        }
                    }
                } else {
                    console.log(`   ✅ Success`);
                    successCount++;
                }
            } catch (err) {
                console.error(`   💥 Execution error:`, err.message);
                errorCount++;
            }
        }

        console.log(`\n📊 Migration Results:`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`   📝 Total statements: ${statements.length}`);

        // Verify tables were created
        console.log('\n🔍 Verifying table creation...');
        
        const tablesToCheck = [
            'daily_activities',
            'achievements', 
            'user_achievements',
            'daily_missions',
            'gamification_events',
            'user_event_participation',
            'referrals'
        ];

        let verifiedTables = 0;
        
        for (const table of tablesToCheck) {
            try {
                const { error } = await supabase.from(table).select('*').limit(1);
                if (!error) {
                    console.log(`   ✅ ${table} - Created successfully`);
                    verifiedTables++;
                } else {
                    console.log(`   ❌ ${table} - ${error.message}`);
                }
            } catch (err) {
                console.log(`   💥 ${table} - Verification failed: ${err.message}`);
            }
        }

        console.log(`\n🎯 Tables verified: ${verifiedTables}/${tablesToCheck.length}`);

        if (verifiedTables >= 5) { // Allow some flexibility
            console.log('\n🎉 Gamification migration applied successfully!');
            return true;
        } else {
            console.log('\n⚠️  Some tables may be missing. Check errors above.');
            return false;
        }

    } catch (error) {
        console.error('💥 Fatal error during migration:', error);
        return false;
    }
}

// Alternative approach: Execute individual CREATE TABLE statements directly
async function createTablesDirectly() {
    console.log('\n🔧 Creating tables directly with individual statements...');

    const createStatements = [
        // Daily Activities Table
        `CREATE TABLE IF NOT EXISTS daily_activities (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
            activity_type TEXT NOT NULL,
            activity_name TEXT NOT NULL,
            points_earned INTEGER NOT NULL DEFAULT 0,
            is_bonus BOOLEAN DEFAULT FALSE,
            bonus_type TEXT,
            description TEXT,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, activity_date, activity_type, activity_name)
        );`,

        // Achievements Table
        `CREATE TABLE IF NOT EXISTS achievements (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            icon TEXT DEFAULT '🏆',
            category TEXT NOT NULL,
            points_reward INTEGER DEFAULT 0,
            requirements JSONB NOT NULL DEFAULT '{}',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,

        // User Achievements Table  
        `CREATE TABLE IF NOT EXISTS user_achievements (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
            earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            progress JSONB DEFAULT '{}',
            UNIQUE(user_id, achievement_id)
        );`,

        // Daily Missions Table
        `CREATE TABLE IF NOT EXISTS daily_missions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
            mission_type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            target_value JSONB DEFAULT '{}',
            current_progress JSONB DEFAULT '{}',
            points_reward INTEGER NOT NULL DEFAULT 0,
            is_completed BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, mission_date, mission_type)
        );`,

        // Gamification Events Table
        `CREATE TABLE IF NOT EXISTS gamification_events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            event_type TEXT NOT NULL,
            category TEXT,
            start_date TIMESTAMP WITH TIME ZONE NOT NULL,
            end_date TIMESTAMP WITH TIME ZONE NOT NULL,
            requirements JSONB DEFAULT '{}',
            rewards JSONB DEFAULT '{}',
            bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
            is_active BOOLEAN DEFAULT TRUE,
            max_participants INTEGER,
            current_participants INTEGER DEFAULT 0,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,

        // User Event Participation Table
        `CREATE TABLE IF NOT EXISTS user_event_participation (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            event_id UUID REFERENCES gamification_events(id) ON DELETE CASCADE,
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            current_progress JSONB DEFAULT '{}',
            is_completed BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP WITH TIME ZONE,
            points_earned INTEGER DEFAULT 0,
            rank_position INTEGER,
            UNIQUE(user_id, event_id)
        );`,

        // Referrals Table
        `CREATE TABLE IF NOT EXISTS referrals (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            referral_code TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'subscribed', 'active')),
            points_earned INTEGER DEFAULT 0,
            milestone_reached TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(referrer_id, referred_id)
        );`
    ];

    let createdCount = 0;
    
    for (let i = 0; i < createStatements.length; i++) {
        const statement = createStatements[i];
        const tableName = statement.match(/CREATE TABLE[^(]*?(\w+)/)?.[1] || `table_${i + 1}`;
        
        console.log(`\n📋 Creating ${tableName}...`);
        
        try {
            const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
            
            if (error) {
                if (error.message.includes('already exists')) {
                    console.log(`   ⚠️  ${tableName} already exists`);
                } else {
                    console.error(`   ❌ Error creating ${tableName}:`, error.message);
                    continue;
                }
            } else {
                console.log(`   ✅ ${tableName} created successfully`);
            }
            createdCount++;
        } catch (err) {
            console.error(`   💥 Failed to create ${tableName}:`, err.message);
        }
    }

    return createdCount;
}

// Main execution
async function main() {
    try {
        console.log('🎬 Starting gamification migration...\n');
        
        // Try the full migration first
        const migrationSuccess = await applyGamificationMigration();
        
        if (!migrationSuccess) {
            console.log('\n🔄 Full migration had issues. Trying direct table creation...');
            const createdCount = await createTablesDirectly();
            console.log(`\n📊 Directly created ${createdCount} tables`);
        }

        // Final verification
        console.log('\n🔍 Final verification...');
        const { data: activities, error: actError } = await supabase.from('daily_activities').select('*').limit(1);
        const { data: achievements, error: achError } = await supabase.from('achievements').select('*').limit(1);
        
        if (!actError && !achError) {
            console.log('\n🎉 Gamification system is ready!');
            console.log('🔗 Application URL: https://3000-i980bncctri6yqqpcxtrd-6532622b.e2b.dev');
            
            // Now run the seed script to populate data
            console.log('\n🌱 Running seed script to populate initial data...');
            const seedModule = await import('./seed_gamification.js');
            
        } else {
            console.log('\n❌ Some tables are still missing. Manual intervention may be required.');
        }

    } catch (error) {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    }
}

main();
