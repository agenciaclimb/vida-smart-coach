import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function hasRewardOfferFromMessage(message, context) {
  const m = message.toLowerCase();
  const userXP = context?.gamification?.total_points || 0;
  const level = context?.gamification?.level || 0;
  const streak = context?.gamification?.current_streak || 0;
  const triggers = {
    completedActivity: /\b(conclu[íi]|fiz|terminei|acabei|completei)\b/.test(m),
    milestone: /\b(conquist|meta|objetivo|atingi)\b/.test(m),
    streak: streak >= 7,
    levelUp: level > 0 && level % 5 === 0,
    highXP: userXP >= 5000
  };
  const triggered = Object.entries(triggers).find(([, v]) => v);
  return { triggered: triggered?.[0] || null, userXP, level, streak };
}

async function fetchContext(userId) {
  const run = async (q) => {
    try { const { data, error } = await q; if (error) throw error; return data; } catch { return null; }
  };

  const [gamification, recentActivities] = await Promise.all([
    run(supabase.from('user_gamification_summary').select('total_points, level, current_streak').eq('user_id', userId).maybeSingle()),
    run(
      supabase
        .from('daily_activities')
        .select('activity_date, points_earned')
        .eq('user_id', userId)
        .gte('activity_date', new Date(Date.now() - 24*60*60*1000).toISOString().slice(0,10))
        .order('activity_date', { ascending: false })
        .limit(10)
    )
  ]);

  return { gamification, recentActivities: recentActivities || [] };
}

async function suggestRewards(userXP) {
  const { data, error } = await supabase
    .from('v_rewards_catalog')
    .select('id, title, xp_cost, category, available_stock')
    .lte('xp_cost', userXP)
    .gt('available_stock', 0)
    .order('xp_cost', { ascending: true })
    .limit(3);
  if (error) return [];
  return data || [];
}

async function runTestForUser(viewRow, scenario) {
  const { user_id, email } = viewRow;
  const context = await fetchContext(user_id);
  const evalRes = hasRewardOfferFromMessage(scenario.message, context);
  const rewards = await suggestRewards(evalRes.userXP);

  const shouldOffer = !!evalRes.triggered && evalRes.userXP >= 1000 && rewards.length > 0;
  return {
    email,
    userXP: evalRes.userXP,
    level: evalRes.level,
    trigger: evalRes.triggered,
    shouldOffer,
    rewards
  };
}

async function pickTopUser(filter) {
  const { data } = await supabase
    .from('v_user_xp_totals')
    .select('user_id, email, xp_total, level, current_streak')
    .order('xp_total', { ascending: false })
    .limit(50);
  if (!data || data.length === 0) return null;
  const list = filter ? data.filter(filter) : data;
  return list[0] || null;
}

async function main() {
  console.log('🧪 OFFLINE TESTES - reward triggers (sem Edge Function)\n');

  const scenarios = [
    { key: 'completedActivity', message: 'Acabei de completar meu treino de pernas!' },
    { key: 'milestone', message: 'Atingi uma meta importante no meu objetivo' },
    { key: 'streak', message: 'Mais um dia cumprido com disciplina' },
    { key: 'levelUp', message: 'Subi de nível, estou no 5!' },
    { key: 'highXP', message: 'Como está meu progresso?' },
  ];

  const selectors = {
    completedActivity: u => u.xp_total >= 1000,
    milestone: u => u.xp_total >= 1000,
    streak: u => (u.current_streak || 0) >= 7,
    levelUp: u => (u.level || 0) > 0 && u.level % 5 === 0,
    highXP: u => u.xp_total >= 5000,
  };

  let passCount = 0;

  for (const s of scenarios) {
    const userView = await pickTopUser(selectors[s.key]);
    if (!userView) {
      console.log(`⚠️  ${s.key}: nenhum usuário elegível encontrado, pulando`);
      continue;
    }
    const res = await runTestForUser(userView, s);
    const ok = res.shouldOffer;
    if (ok) passCount++;
    console.log(`\n${ok ? '✅' : '⚠️'} ${s.key}: ${res.email} | XP=${res.userXP} | trigger=${res.trigger} | rewards=${res.rewards.length}`);
    if (res.rewards.length) {
      console.log('   Sugeridas:', res.rewards.map(r => `${r.title} (${r.xp_cost})`).join(', '));
    }
  }

  console.log(`\n📈 Resultado offline: ${passCount}/5 triggers com ofertas válidas.`);
}

main().catch(err => {
  console.error('Erro no offline test:', err);
  process.exit(1);
});
