import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Main function logic
async function handleTrialReminders() {
  // 1. Initialize Supabase Admin Client
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in2Days = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
  const in1Day = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);

  // 2. Define queries for different notification types
  const queries = {
    trial_ending_3_days: supabaseAdmin
      .from('user_profiles')
      .select('id, email, phone')
      .eq('billing_status', 'trialing')
      .gte('trial_expires_at', in2Days.toISOString())
      .lt('trial_expires_at', in3Days.toISOString()),
    trial_ending_1_day: supabaseAdmin
      .from('user_profiles')
      .select('id, email, phone')
      .eq('billing_status', 'trialing')
      .gte('trial_expires_at', today.toISOString())
      .lt('trial_expires_at', in1Day.toISOString()),
    trial_expired_day_0: supabaseAdmin
      .from('user_profiles')
      .select('id, email, phone')
      .eq('billing_status', 'trialing')
      .gte('trial_expires_at', yesterday.toISOString())
      .lt('trial_expires_at', today.toISOString()),
  };

  // 3. Execute queries and collect users to notify
  const notificationsToSend = [];
  for (const [type, query] of Object.entries(queries)) {
    const { data: users, error } = await query;
    if (error) {
      console.error(`Error fetching users for ${type}:`, error.message);
      continue;
    }
    if (users) {
      users.forEach(u => notificationsToSend.push({ user: u, type }));
    }
  }

  if (notificationsToSend.length === 0) {
    return { message: 'No trial reminders to send today.' };
  }

  // 4. Filter out users who have already received a notification of the same type
  const { data: sentNotifications, error: sentErr } = await supabaseAdmin
    .from('trial_notifications')
    .select('user_id, notification_type')
    .in('user_id', notificationsToSend.map(n => n.user.id));

  if (sentErr) {
    throw new Error(`Could not fetch sent notifications: ${sentErr.message}`);
  }

  const sentSet = new Set(sentNotifications.map(n => `${n.user_id}-${n.notification_type}`));
  const filteredNotifications = notificationsToSend.filter(n => !sentSet.has(`${n.user.id}-${n.type}`));

  if (filteredNotifications.length === 0) {
    return { message: 'All potential reminders have already been sent.' };
  }

  // 5. Send notifications and log them
  const logsToInsert = [];
  for (const { user, type } of filteredNotifications) {
    // TODO: Implement actual email sending via Supabase/Resend
    console.log(`Simulating sending EMAIL for ${type} to ${user.email}`);
    logsToInsert.push({ user_id: user.id, notification_type: type, channel: 'email' });

    // TODO: Implement actual WhatsApp sending via Evolution API
    if (user.phone) {
      console.log(`Simulating sending WHATSAPP for ${type} to ${user.phone}`);
      logsToInsert.push({ user_id: user.id, notification_type: type, channel: 'whatsapp' });
    }
  }

  const { error: insertErr } = await supabaseAdmin
    .from('trial_notifications')
    .insert(logsToInsert);

  if (insertErr) {
    throw new Error(`Could not log sent notifications: ${insertErr.message}`);
  }

  return { message: `Processed and logged ${logsToInsert.length} notifications.` };
}

// Deno Deploy entry point
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const result = await handleTrialReminders();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
