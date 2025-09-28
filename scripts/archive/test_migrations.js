#!/usr/bin/env node

/**
 * Test Migrations Script
 * Tests the new migrations before applying to production
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_ANON_KEY environment variable is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('count')
            .limit(1);
            
        if (error) {
            console.error('❌ Database connection failed:', error.message);
            return false;
        }
        
        console.log('✅ Database connection successful');
        return true;
    } catch (err) {
        console.error('❌ Database connection error:', err.message);
        return false;
    }
}

async function checkTableStructure() {
    console.log('🔍 Checking table structure...');
    
    try {
        // Check user_profiles table structure
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1);
            
        if (profileError) {
            console.error('❌ Error checking user_profiles:', profileError.message);
            return false;
        }
        
        // Check daily_checkins table structure
        const { data: checkinData, error: checkinError } = await supabase
            .from('daily_checkins')
            .select('*')
            .limit(1);
            
        if (checkinError) {
            console.error('❌ Error checking daily_checkins:', checkinError.message);
            return false;
        }
        
        console.log('✅ Table structure check passed');
        return true;
    } catch (err) {
        console.error('❌ Table structure check error:', err.message);
        return false;
    }
}

async function testEssentialFields() {
    console.log('🔍 Testing essential fields...');
    
    const testFields = [
        'phone', 'current_weight', 'target_weight', 'height', 
        'age', 'gender', 'activity_level', 'goal_type', 
        'whatsapp', 'full_name'
    ];
    
    try {
        // Try to select the new fields
        const selectFields = testFields.join(', ');
        const { data, error } = await supabase
            .from('user_profiles')
            .select(selectFields)
            .limit(1);
            
        if (error) {
            console.error('❌ Essential fields test failed:', error.message);
            console.log('Missing fields might need migration application');
            return false;
        }
        
        console.log('✅ Essential fields test passed');
        return true;
    } catch (err) {
        console.error('❌ Essential fields test error:', err.message);
        return false;
    }
}

async function testRLSPolicies() {
    console.log('🔍 Testing RLS policies...');
    
    try {
        // Test if we can access tables with RLS enabled
        const tables = ['community_feed', 'app_plans', 'planos'];
        
        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
                
            if (error && !error.message.includes('permission denied')) {
                console.error(`❌ RLS test failed for ${table}:`, error.message);
                return false;
            }
        }
        
        console.log('✅ RLS policies test passed');
        return true;
    } catch (err) {
        console.error('❌ RLS policies test error:', err.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting migration tests...\n');
    
    const tests = [
        { name: 'Database Connection', fn: testDatabaseConnection },
        { name: 'Table Structure', fn: checkTableStructure },
        { name: 'Essential Fields', fn: testEssentialFields },
        { name: 'RLS Policies', fn: testRLSPolicies }
    ];
    
    let passedTests = 0;
    
    for (const test of tests) {
        console.log(`\n--- ${test.name} ---`);
        const result = await test.fn();
        if (result) {
            passedTests++;
        }
        console.log('');
    }
    
    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${passedTests}/${tests.length}`);
    console.log(`❌ Failed: ${tests.length - passedTests}/${tests.length}`);
    
    if (passedTests === tests.length) {
        console.log('\n🎉 All tests passed! Migrations are working correctly.');
        return true;
    } else {
        console.log('\n⚠️  Some tests failed. Please check the migrations.');
        return false;
    }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(err => {
            console.error('❌ Test execution failed:', err);
            process.exit(1);
        });
}

export { runTests };

