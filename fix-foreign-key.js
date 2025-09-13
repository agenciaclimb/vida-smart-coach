import { createClient } from '@supabase/supabase-js';

async function fixForeignKeyConstraint() {
  console.log('🔧 Starting foreign key constraint fix...');
  
  const supabaseUrl = `https://zzugbgoylwbaojdnunuz.supabase.co`;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable not found');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
  
  try {
    console.log('📊 Step 1: Checking current foreign key constraints...');
    
    const { data: currentConstraints, error: checkError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
              tc.constraint_name, 
              tc.table_name, 
              kcu.column_name, 
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name 
          FROM 
              information_schema.table_constraints AS tc 
              JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
              JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_name='user_profiles';
        `
      });
    
    if (checkError) {
      console.error('❌ Error checking constraints:', checkError);
      
      console.log('🔄 Trying alternative approach...');
      
      console.log('🗑️ Step 2: Dropping incorrect foreign key constraint...');
      const { error: dropError } = await supabase
        .rpc('exec_sql', {
          query: 'ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;'
        });
      
      if (dropError) {
        console.error('❌ Error dropping constraint:', dropError);
      } else {
        console.log('✅ Successfully dropped incorrect constraint');
      }
      
      console.log('➕ Step 3: Adding correct foreign key constraint...');
      const { error: addError } = await supabase
        .rpc('exec_sql', {
          query: `
            ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_id_fkey 
            FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
          `
        });
      
      if (addError) {
        console.error('❌ Error adding constraint:', addError);
      } else {
        console.log('✅ Successfully added correct constraint');
      }
      
    } else {
      console.log('📋 Current constraints:', currentConstraints);
    }
    
    console.log('🎯 Step 4: Verifying fix...');
    
    const { data: verifyConstraints, error: verifyError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
              tc.constraint_name, 
              tc.table_name, 
              kcu.column_name, 
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name 
          FROM 
              information_schema.table_constraints AS tc 
              JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
              JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_name='user_profiles'
              AND tc.constraint_name='user_profiles_id_fkey';
        `
      });
    
    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
    } else {
      console.log('✅ Verification result:', verifyConstraints);
      
      if (verifyConstraints && verifyConstraints.length > 0) {
        const constraint = verifyConstraints[0];
        if (constraint.foreign_table_name === 'users') {
          console.log('🚨 CONSTRAINT STILL REFERENCES WRONG TABLE: users');
          console.log('❌ Foreign key constraint fix FAILED');
        } else if (constraint.foreign_table_name === 'auth.users') {
          console.log('🎉 SUCCESS: Foreign key constraint now correctly references auth.users');
          console.log('✅ Foreign key constraint fix COMPLETED');
        } else {
          console.log('⚠️ Unexpected foreign table:', constraint.foreign_table_name);
        }
      } else {
        console.log('⚠️ No foreign key constraint found - this might indicate an issue');
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

fixForeignKeyConstraint()
  .then(() => {
    console.log('🏁 Foreign key constraint fix process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
