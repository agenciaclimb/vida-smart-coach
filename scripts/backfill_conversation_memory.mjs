// Seed conversation_memory rows based on historical interactions.
// Usage:
//    pnpm exec node scripts/backfill_conversation_memory.mjs --days=30
//    pnpm exec node scripts/backfill_conversation_memory.mjs 14   # shorthand

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const DEFAULT_WINDOW_DAYS = 30;
const FETCH_BATCH_SIZE = 500;
const UPSERT_BATCH_SIZE = 200;

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('Missing .env.local at project root');
  }
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const rawLine of envContent.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const [key, ...rest] = line.split('=');
    if (!key || !rest.length) continue;
    env[key.trim()] = rest.join('=').trim();
  }
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Missing ${key} in .env.local`);
    }
  }
  return env;
}

function parseCliOptions() {
  let days = DEFAULT_WINDOW_DAYS;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--days=')) {
      const parsed = Number(arg.split('=')[1]);
      if (!Number.isNaN(parsed) && parsed > 0) days = parsed;
    } else if (/^\d+$/.test(arg)) {
      const parsed = Number(arg);
      if (!Number.isNaN(parsed) && parsed > 0) days = parsed;
    }
  }
  return { days };
}

function normalize(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function clean(value = '') {
  return value.trim().replace(/\s+/g, ' ');
}

function matchAll(text, pattern) {
  const matches = [];
  const regex = new RegExp(pattern);
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match);
    if (!regex.global) break;
  }
  return matches;
}

function extractMemorySignals(text) {
  const normalized = normalize(text);
  const entities = {
    user_goals: [],
    pain_points: [],
    preferences: {},
    mentioned_activities: [],
    restrictions: [],
  };

  matchAll(normalized, /(quero|preciso|gostaria de)\s+([^.,;]+)/gi).forEach((match) => {
    entities.user_goals.push(clean(match[2]));
  });

  matchAll(normalized, /(dificuldade|problema|nao consigo|luto com)\s+([^.,;]+)/gi).forEach((match) => {
    entities.pain_points.push(clean(match[2]));
  });

  matchAll(normalized, /(nao como|evito|intolerancia|alergia a)\s+([^.,;]+)/gi).forEach((match) => {
    entities.restrictions.push(clean(match[2]));
  });

  matchAll(normalized, /(prefiro|gosto de|adoro)\s+([^.,;]+)/gi).forEach((match) => {
    entities.preferences[clean(match[2])] = 'preferred';
  });

  matchAll(normalized, /(treino|corrida|meditacao|yoga|respiracao)/gi).forEach((match) => {
    entities.mentioned_activities.push(clean(match[0]));
  });

  const emotion = normalized.match(/(ansioso|motivado|cansado|frustrado|feliz|esgotado|animado)/i);
  if (emotion) {
    entities.emotional_state = emotion[0].toLowerCase();
  }

  return entities;
}

function mergeEntities(current, incoming) {
  return {
    user_goals: mergeArrays(current?.user_goals || [], incoming.user_goals),
    pain_points: mergeArrays(current?.pain_points || [], incoming.pain_points),
    mentioned_activities: mergeArrays(current?.mentioned_activities || [], incoming.mentioned_activities),
    restrictions: mergeArrays(current?.restrictions || [], incoming.restrictions),
    preferences: { ...(current?.preferences || {}), ...incoming.preferences },
    emotional_state: incoming.emotional_state || current?.emotional_state,
  };
}

function mergeArrays(base, incoming) {
  const set = new Set(base);
  for (const item of incoming) {
    const trimmed = clean(item);
    if (trimmed) set.add(trimmed);
  }
  return Array.from(set);
}

function buildSummary(snippets) {
  if (!snippets.length) return null;
  const cleaned = snippets
    .map((snippet) => clean(snippet).slice(0, 280))
    .filter(Boolean);
  if (!cleaned.length) return null;
  return cleaned.slice(-5).join(' | ').slice(0, 1000);
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function toSessionId(timestamp) {
  if (!timestamp) return 'default';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'default';
  return date.toISOString().split('T')[0];
}

async function harvestSessions(supabase, sinceIso) {
  const sessions = new Map();
  let from = 0;
  let totalFetched = 0;

  while (true) {
    const to = from + FETCH_BATCH_SIZE - 1;
    const { data, error } = await supabase
      .from('interactions')
      .select('id, user_id, content, ai_response, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to read interactions: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (!row.user_id) continue;
      const sessionId = toSessionId(row.created_at);
      const key = `${row.user_id}:${sessionId}`;
      if (!sessions.has(key)) {
        sessions.set(key, {
          user_id: row.user_id,
          session_id: sessionId,
          snippets: [],
          userSnippets: [],
          first_seen: row.created_at,
          last_seen: row.created_at,
          entities: null,
        });
      }
      const entry = sessions.get(key);
      if (row.content) {
        entry.snippets.push(row.content);
        entry.userSnippets.push(row.content);
      }
      if (row.ai_response) {
        entry.snippets.push(row.ai_response);
      }
      entry.last_seen = row.created_at || entry.last_seen;
      if (!entry.first_seen && row.created_at) {
        entry.first_seen = row.created_at;
      }
    }

    totalFetched += data.length;
    process.stdout.write(`\r[fetch] ${totalFetched} interactions since ${sinceIso}...`);

    if (data.length < FETCH_BATCH_SIZE) break;
    from += FETCH_BATCH_SIZE;
  }

  process.stdout.write('\n');
  return sessions;
}

function buildPayloads(sessions) {
  const rows = [];
  for (const entry of sessions.values()) {
    const combined = entry.snippets.join('\n');
    const extracted = extractMemorySignals(combined);
    const summarized = buildSummary(entry.snippets);
    const payload = {
      user_id: entry.user_id,
      session_id: entry.session_id,
      entities: mergeEntities(null, extracted),
      conversation_summary: summarized,
      last_topics: entry.userSnippets.slice(-5).map((t) => clean(t).slice(0, 140)),
      pending_actions: [],
      created_at: entry.first_seen || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    rows.push(payload);
  }
  return rows;
}

async function upsertMemory(supabase, rows) {
  let total = 0;
  for (const portion of chunk(rows, UPSERT_BATCH_SIZE)) {
    const { error } = await supabase
      .from('conversation_memory')
      .upsert(portion, { onConflict: 'user_id,session_id' });
    if (error) {
      throw new Error(`Failed to upsert conversation_memory: ${error.message}`);
    }
    total += portion.length;
    process.stdout.write(`\r[upsert] ${total}/${rows.length} memory snapshots...`);
  }
  process.stdout.write('\n');
}

async function main() {
  const { days } = parseCliOptions();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();
console.log(`\n[start] Backfilling conversation_memory using interactions since ${sinceIso} (${days} days)...`);

  const env = loadEnv();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const sessions = await harvestSessions(supabase, sinceIso);
  if (sessions.size === 0) {
    console.log('[info] No interactions found for the selected window. Nothing to backfill.');
    return;
  }

  const payloads = buildPayloads(sessions);
  await upsertMemory(supabase, payloads);

console.log(`[done] Backfill complete: ${payloads.length} conversation_memory rows ready.`);
}

main().catch((err) => {
console.error('\n[error] Backfill failed:', err.message);
  process.exit(1);
});
