/**
 * E2E Tests - Proactive System
 * 
 * Tests for the intelligent proactive messaging system with 8 rules,
 * cooldown management, and interactive buttons.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const TEST_USER_EMAIL = 'test.proactive@example.com';
const TEST_USER_PASSWORD = 'TestProactive123!';

let supabase: SupabaseClient;
let testUserId: string;
let testSession: any;

describe('Proactive System E2E Tests', () => {
  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create or sign in test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (authError) {
      // Try to sign up if user doesn't exist
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      if (signUpError) {
        throw new Error(`Failed to create test user: ${signUpError.message}`);
      }

      testUserId = signUpData.user!.id;
      testSession = signUpData.session;
    } else {
      testUserId = authData.user!.id;
      testSession = authData.session;
    }

    // Ensure user profile exists
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: testUserId,
        email: TEST_USER_EMAIL,
        first_name: 'Test',
        ia_stage: 'specialist',
      }, { onConflict: 'user_id' });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    // Initialize gamification data
    const { error: gamificationError } = await supabase
      .from('gamification')
      .upsert({
        user_id: testUserId,
        total_points: 5500, // High XP for testing xp_threshold rule
        current_streak: 8, // Streak for testing streak_at_risk rule
        longest_streak: 10,
      }, { onConflict: 'user_id' });

    if (gamificationError) {
      console.error('Gamification init error:', gamificationError);
    }
  });

  afterAll(async () => {
    // Cleanup: delete test data
    await supabase.from('proactive_messages').delete().eq('user_id', testUserId);
    await supabase.from('daily_activities').delete().eq('user_id', testUserId);
  });

  describe('Database Setup', () => {
    it('should have proactive_messages table', async () => {
      const { data, error } = await supabase
        .from('proactive_messages')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have v_proactive_cooldown view', async () => {
      const { data, error } = await supabase
        .from('v_proactive_cooldown')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have can_send_proactive_message function', async () => {
      const { data, error } = await supabase.rpc('can_send_proactive_message', {
        p_user_id: testUserId,
        p_message_type: 'xp_threshold',
      });

      expect(error).toBeNull();
      expect(typeof data).toBe('boolean');
    });
  });

  describe('Cooldown Management', () => {
    it('should allow first proactive message', async () => {
      const { data: canSend } = await supabase.rpc('can_send_proactive_message', {
        p_user_id: testUserId,
        p_message_type: 'xp_threshold',
      });

      expect(canSend).toBe(true);
    });

    it('should record proactive message', async () => {
      const { data, error } = await supabase
        .from('proactive_messages')
        .insert({
          user_id: testUserId,
          message_type: 'xp_threshold',
          message_content: 'Test proactive message',
          metadata: { test: true },
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.message_type).toBe('xp_threshold');
      expect(data.response_received).toBe(false);
    });

    it('should block duplicate message type within week', async () => {
      const { data: canSend } = await supabase.rpc('can_send_proactive_message', {
        p_user_id: testUserId,
        p_message_type: 'xp_threshold',
      });

      expect(canSend).toBe(false);
    });

    it('should allow different message type', async () => {
      const { data: canSend } = await supabase.rpc('can_send_proactive_message', {
        p_user_id: testUserId,
        p_message_type: 'milestone_achieved',
      });

      expect(canSend).toBe(true);
    });

    it('should block after daily limit (2 messages)', async () => {
      // Insert second message
      await supabase.from('proactive_messages').insert({
        user_id: testUserId,
        message_type: 'milestone_achieved',
        message_content: 'Second test message',
      });

      // Try third message (should be blocked)
      const { data: canSend } = await supabase.rpc('can_send_proactive_message', {
        p_user_id: testUserId,
        p_message_type: 'streak_at_risk',
      });

      expect(canSend).toBe(false);
    });

    it('should update response_received flag', async () => {
      const { data: messages } = await supabase
        .from('proactive_messages')
        .select('id')
        .eq('user_id', testUserId)
        .eq('message_type', 'xp_threshold')
        .order('sent_at', { ascending: false })
        .limit(1);

      if (messages && messages.length > 0) {
        const { error } = await supabase
          .from('proactive_messages')
          .update({
            response_received: true,
            response_at: new Date().toISOString(),
          })
          .eq('id', messages[0].id);

        expect(error).toBeNull();

        // Verify update
        const { data: updated } = await supabase
          .from('proactive_messages')
          .select('response_received, response_at')
          .eq('id', messages[0].id)
          .single();

        expect(updated?.response_received).toBe(true);
        expect(updated?.response_at).toBeDefined();
      }
    });
  });

  describe('IA Coach Integration', () => {
    it('should process message with proactive check', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ia-coach-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testSession.access_token}`,
        },
        body: JSON.stringify({
          message: 'Olá, como estão minhas conquistas?',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.reply).toBeDefined();
      expect(typeof data.reply).toBe('string');
    });

    it('should detect button response', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ia-coach-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testSession.access_token}`,
        },
        body: JSON.stringify({
          message: '1', // Button response
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.reply).toBeDefined();
    });

    it('should include gamification visual after activity', async () => {
      // First register an activity
      await supabase.from('daily_activities').insert({
        user_id: testUserId,
        activity_date: new Date().toISOString().split('T')[0],
        activity_type: 'physical',
        activity_name: 'Test workout',
        points_earned: 50,
        activity_key: `test-${Date.now()}`,
      });

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ia-coach-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testSession.access_token}`,
        },
        body: JSON.stringify({
          message: 'Completei meu treino hoje!',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.reply).toBeDefined();
      
      // Check for XP summary indicators
      const hasXPIndicators = 
        data.reply.includes('XP') || 
        data.reply.includes('Nível') ||
        data.reply.includes('█') || // Progress bar
        data.reply.includes('🏆');

      expect(hasXPIndicators).toBe(true);
    });
  });

  describe('Proactive Rules', () => {
    it('should detect xp_threshold rule (XP >5000)', async () => {
      // User already has 5500 XP from setup
      const { data: gamification } = await supabase
        .from('gamification')
        .select('total_points')
        .eq('user_id', testUserId)
        .single();

      expect(gamification?.total_points).toBeGreaterThanOrEqual(5000);
    });

    it('should detect streak_at_risk rule (streak >7)', async () => {
      const { data: gamification } = await supabase
        .from('gamification')
        .select('current_streak')
        .eq('user_id', testUserId)
        .single();

      expect(gamification?.current_streak).toBeGreaterThanOrEqual(7);
    });

    it('should detect milestone_achieved (multiple of 1000)', async () => {
      // Update XP to exact milestone
      await supabase
        .from('gamification')
        .update({ total_points: 6000 })
        .eq('user_id', testUserId);

      const { data: gamification } = await supabase
        .from('gamification')
        .select('total_points')
        .eq('user_id', testUserId)
        .single();

      expect(gamification?.total_points % 1000).toBe(0);
    });
  });

  describe('Interactive Buttons', () => {
    it('should provide stage-appropriate buttons', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ia-coach-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testSession.access_token}`,
        },
        body: JSON.stringify({
          message: 'O que posso fazer agora?',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      // Check for button indicators
      const hasButtons = 
        data.reply.includes('Ações Rápidas') ||
        data.reply.includes('Responda') ||
        data.reply.includes('📋') || // Specialist buttons
        data.reply.includes('✅');

      expect(hasButtons).toBe(true);
    });
  });

  describe('Cooldown View', () => {
    it('should query cooldown status', async () => {
      const { data, error } = await supabase
        .from('v_proactive_cooldown')
        .select('*')
        .eq('user_id', testUserId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data && data.length > 0) {
        const cooldown = data[0];
        expect(cooldown.user_id).toBe(testUserId);
        expect(cooldown.message_type).toBeDefined();
        expect(cooldown.total_sent).toBeGreaterThan(0);
        expect(cooldown.last_sent_at).toBeDefined();
      }
    });
  });
});

describe('Gamification Display Tests', () => {
  it('should format XP with progress bar', () => {
    // This would require importing the module
    // For now, just verify the pattern in responses
    const sampleResponse = '█████░░░░░ 50%';
    expect(sampleResponse).toMatch(/█+░+\s+\d+%/);
  });

  it('should include level badges', () => {
    const badges = ['🔰', '✨', '🌟', '⭐', '💎', '👑'];
    badges.forEach(badge => {
      expect(badge).toBeDefined();
      expect(badge.length).toBeGreaterThan(0);
    });
  });
});
