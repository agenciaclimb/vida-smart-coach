import { createClient } from '@supabase/supabase-js';

// Tipos para clareza
interface UserProfile {
  id: string;
  email: string;
  trial_expires_at: string;
}

// Tipos de notificação alinhados com o banco de dados
type NotificationType = 'trial_expiring_3_days' | 'trial_expiring_1_day' | 'trial_expired_today';

// Configuração do Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Função principal da Edge Function
// eslint-disable-next-line no-restricted-globals
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Adicionar verificação de bearer token para segurança
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.TRIAL_REMINDER_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Lembrete de 3 dias
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setUTCDate(threeDaysFromNow.getUTCDate() + 3);
    await processUsersForDate(threeDaysFromNow, 'trial_expiring_3_days');

    // Lembrete de 1 dia
    const oneDayFromNow = new Date();
    oneDayFromNow.setUTCDate(oneDayFromNow.getUTCDate() + 1);
    await processUsersForDate(oneDayFromNow, 'trial_expiring_1_day');

    // Lembrete de expiração no dia e passados
    await processExpiredUsers('trial_expired_today');

    return new Response(JSON.stringify({ success: true, message: 'Trial reminders processed.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing trial reminders:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Processa usuários para uma data específica no futuro (lembretes de 3 e 1 dia)
async function processUsersForDate(date: Date, notificationType: NotificationType) {
  const startDate = new Date(date);
  startDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setUTCHours(23, 59, 59, 999);

  const { data: users, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, email, trial_expires_at')
    .eq('billing_status', 'trialing')
    .gte('trial_expires_at', startDate.toISOString())
    .lte('trial_expires_at', endDate.toISOString());

  if (error) {
    throw new Error(`Failed to fetch users for ${notificationType}: ${error.message}`);
  }

  if (!users || users.length === 0) {
    console.log(`No users found for notification type ${notificationType} on ${startDate.toISOString().slice(0, 10)}`);
    return;
  }

  for (const user of users) {
    await sendNotificationIfNotSent(user, notificationType);
  }
}

// Processa usuários cujo trial já expirou
async function processExpiredUsers(notificationType: NotificationType) {
    const now = new Date();

    const { data: users, error } = await supabaseAdmin
        .from('user_profiles')
        .select('id, email, trial_expires_at')
        .eq('billing_status', 'trialing')
        .lt('trial_expires_at', now.toISOString());

    if (error) {
        throw new Error(`Failed to fetch expired users: ${error.message}`);
    }

    if (!users || users.length === 0) {
        console.log(`No expired users found needing notification.`);
        return;
    }

    for (const user of users) {
        await sendNotificationIfNotSent(user, notificationType);
    }
}


async function sendNotificationIfNotSent(user: UserProfile, notificationType: NotificationType) {
  // 1. Verificar se a notificação já foi enviada
  const { data: existingNotification, error: checkError } = await supabaseAdmin
    .from('trial_notifications')
    .select('id')
    .eq('user_id', user.id)
    .eq('notification_type', notificationType)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116: No rows found
    console.error(`Error checking notification for user ${user.id}:`, checkError);
    return; // Pula este usuário em caso de erro
  }

  if (existingNotification) {
    console.log(`Notification ${notificationType} already sent to user ${user.id}. Skipping.`);
    return;
  }

  // 2. Simular o envio da notificação (Email/WhatsApp)
  // TODO: Integrar com a Evolution API (WhatsApp) para enviar uma mensagem real.
  // TODO: Integrar com o Supabase Auth (Email) para enviar um email real.
  console.log(`SIMULATING: Sending ${notificationType} notification to user ${user.id} (${user.email})`);

  // 3. Registrar que a notificação foi enviada
  const { error: insertError } = await supabaseAdmin
    .from('trial_notifications')
    .insert({
      user_id: user.id,
      notification_type: notificationType,
      channel: 'email' // Defaulting to email, can be 'whatsapp'
    });

  if (insertError) {
    console.error(`Failed to record notification for user ${user.id}:`, insertError);
  }
}
