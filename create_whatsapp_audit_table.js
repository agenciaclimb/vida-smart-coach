import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('📝 Creating WhatsApp gamification audit log table...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAuditTable() {
    try {
        console.log('🔍 Checking if whatsapp_gamification_log table exists...');
        
        // Try to query the table to see if it exists
        const { data, error } = await supabase
            .from('whatsapp_gamification_log')
            .select('*')
            .limit(1);
        
        if (error && error.message.includes('does not exist')) {
            console.log('❌ Table does not exist. Need to create manually.');
            console.log('\n📋 SQL to run manually in Supabase Dashboard:');
            console.log('=' * 60);
            console.log(`
-- WhatsApp Gamification Audit Log Table
CREATE TABLE whatsapp_gamification_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL,
    message_body TEXT,
    detected_activity JSONB,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'fraud_detected', 'ignored')),
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE whatsapp_gamification_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own logs" ON whatsapp_gamification_log 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert logs" ON whatsapp_gamification_log 
    FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_whatsapp_log_user_id ON whatsapp_gamification_log(user_id);
CREATE INDEX idx_whatsapp_log_processed_at ON whatsapp_gamification_log(processed_at DESC);
CREATE INDEX idx_whatsapp_log_status ON whatsapp_gamification_log(status);
            `);
            console.log('=' * 60);
            console.log('\n📖 Instructions:');
            console.log('1. Go to Supabase Dashboard > SQL Editor');
            console.log('2. Paste the SQL above and run it');
            console.log('3. The WhatsApp audit log table will be created');
            
            return false;
        } else if (error) {
            console.error('❌ Error checking table:', error.message);
            return false;
        } else {
            console.log('✅ whatsapp_gamification_log table already exists!');
            return true;
        }
        
    } catch (error) {
        console.error('💥 Error:', error.message);
        return false;
    }
}

// Test basic functionality by creating a mock WhatsApp messages table
async function createMockWhatsAppTable() {
    try {
        console.log('\n📱 Checking WhatsApp messages table...');
        
        const { data, error } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .limit(1);
        
        if (error && error.message.includes('does not exist')) {
            console.log('❌ whatsapp_messages table does not exist. Creating mock table SQL:');
            console.log('\n📋 SQL for WhatsApp messages table:');
            console.log('=' * 60);
            console.log(`
-- WhatsApp Messages Table (for webhook integration)
CREATE TABLE whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message_id TEXT UNIQUE NOT NULL,
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,
    body TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    status TEXT DEFAULT 'received',
    webhook_payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own messages" ON whatsapp_messages 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert messages" ON whatsapp_messages 
    FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_whatsapp_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX idx_whatsapp_messages_processed ON whatsapp_messages(processed);
CREATE INDEX idx_whatsapp_messages_created_at ON whatsapp_messages(created_at DESC);
            `);
            console.log('=' * 60);
            
            return false;
        } else if (error) {
            console.error('❌ Error checking WhatsApp messages table:', error.message);
            return false;
        } else {
            console.log('✅ whatsapp_messages table exists!');
            return true;
        }
        
    } catch (error) {
        console.error('💥 Error checking WhatsApp messages:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Setting up WhatsApp gamification integration tables...\n');
    
    const auditExists = await createAuditTable();
    const whatsappExists = await createMockWhatsAppTable();
    
    if (auditExists && whatsappExists) {
        console.log('\n🎉 All required tables exist! WhatsApp gamification is ready!');
        
        // Test inserting a sample audit log
        console.log('\n🧪 Testing audit log insertion...');
        
        try {
            const { data, error } = await supabase
                .from('whatsapp_gamification_log')
                .insert([{
                    user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
                    message_id: 'test_' + Date.now(),
                    message_body: 'fiz exercicio hoje',
                    detected_activity: {
                        type: 'physical',
                        name: 'Treino realizado',
                        points: 25
                    },
                    status: 'success',
                    metadata: {
                        source: 'test',
                        timestamp: new Date().toISOString()
                    }
                }])
                .select();
            
            if (error) {
                console.error('❌ Test insertion failed:', error.message);
            } else {
                console.log('✅ Test audit log inserted successfully!');
                console.log('🔍 Data:', data);
            }
        } catch (err) {
            console.error('💥 Test failed:', err.message);
        }
        
    } else {
        console.log('\n⚠️  Some tables are missing. Please run the SQL manually in Supabase Dashboard.');
        console.log('\n📖 Next steps:');
        console.log('1. Copy the SQL statements above');
        console.log('2. Go to your Supabase Dashboard');
        console.log('3. Navigate to SQL Editor');
        console.log('4. Paste and execute the SQL');
        console.log('5. Re-run this script to verify');
    }
    
    console.log('\n🔗 Supabase Dashboard: https://app.supabase.com/project/zzugbgoylwbaojdnunuz');
}

main().catch(console.error);