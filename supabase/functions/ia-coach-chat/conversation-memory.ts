type SupabaseClient = {
  from: (table: string) => any;
};

export type ConversationMemoryEntities = {
  user_goals: string[];
  pain_points: string[];
  preferences: Record<string, string>;
  mentioned_activities: string[];
  restrictions: string[];
  emotional_state?: string;
};

export type ConversationMemorySnapshot = {
  session_id: string;
  entities: ConversationMemoryEntities;
};

const createEmptyEntities = (): ConversationMemoryEntities => ({
  user_goals: [],
  pain_points: [],
  preferences: {},
  mentioned_activities: [],
  restrictions: [],
  emotional_state: undefined,
});

const DEFAULT_MEMORY: ConversationMemorySnapshot = {
  session_id: 'default',
  entities: createEmptyEntities(),
};

export async function loadConversationMemory(
  userId: string,
  supabase: SupabaseClient,
  sessionId = DEFAULT_MEMORY.session_id,
): Promise<ConversationMemorySnapshot> {
  try {
    const { data, error } = await supabase
      .from('conversation_memory')
      .select('session_id, entities')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ...DEFAULT_MEMORY, session_id: sessionId };

    return {
      session_id: data.session_id,
      entities: {
        ...createEmptyEntities(),
        ...(data.entities || {}),
      },
    };
  } catch (err) {
    console.error('[conversation_memory] load error', err);
    return { ...DEFAULT_MEMORY, session_id: sessionId };
  }
}

export async function updateConversationMemory(params: {
  userId: string;
  message: string;
  aiResponse: string;
  supabase: SupabaseClient;
  sessionId?: string;
}) {
  const sessionId = params.sessionId || DEFAULT_MEMORY.session_id;
  const current = await loadConversationMemory(params.userId, params.supabase, sessionId);
  const signals = extractMemorySignals(`${params.message}\n${params.aiResponse}`);
  const merged = mergeEntities(current.entities, signals);

  try {
    await params.supabase
      .from('conversation_memory')
      .upsert(
        {
          user_id: params.userId,
          session_id: sessionId,
          entities: merged,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,session_id' },
      );
  } catch (err) {
    console.error('[conversation_memory] update error', err);
  }
}

export function mergeEntities(
  current: ConversationMemoryEntities,
  incoming: ConversationMemoryEntities,
): ConversationMemoryEntities {
  return {
    user_goals: mergeArrays(current.user_goals, incoming.user_goals),
    pain_points: mergeArrays(current.pain_points, incoming.pain_points),
    mentioned_activities: mergeArrays(current.mentioned_activities, incoming.mentioned_activities),
    restrictions: mergeArrays(current.restrictions, incoming.restrictions),
    preferences: { ...current.preferences, ...incoming.preferences },
    emotional_state: incoming.emotional_state || current.emotional_state,
  };
}

function mergeArrays(current: string[], incoming: string[]): string[] {
  const set = new Set<string>();
  for (const value of [...current, ...incoming]) {
    const normalized = sanitizeValue(value);
    if (normalized) set.add(normalized);
  }
  return Array.from(set);
}

export function extractMemorySignals(text: string): ConversationMemoryEntities {
  const normalized = normalizeText(text);
  const prepared = injectClauseBreaks(normalized);
  const entities = createEmptyEntities();

  for (const match of matchAll(prepared, PATTERNS.goals)) {
    const parts = splitCompositeGoals(match[2]);
    for (const part of parts) addEntity(entities.user_goals, part);
  }
  for (const match of matchAll(prepared, PATTERNS.pains)) {
    addEntity(entities.pain_points, match[2]);
  }
  for (const match of matchAll(prepared, PATTERNS.restrictions)) {
    addEntity(entities.restrictions, match[2]);
  }
  for (const match of matchAll(prepared, PATTERNS.preferences)) {
    const value = sanitizeValue(match[2]);
    if (value) {
      entities.preferences[value] = 'preferred';
    }
  }
  for (const match of matchAll(prepared, PATTERNS.activities)) {
    addEntity(entities.mentioned_activities, match[0]);
  }

  const emotion = normalized.match(PATTERNS.emotions);
  if (emotion) {
    entities.emotional_state = emotion[0].toLowerCase();
  }

  return entities;
}

const PATTERNS = {
  // Captura até fim da frase/linha para permitir vírgulas e " e " dentro do trecho de objetivos
  goals: /(quero|preciso|gostaria de)\s+([^\.\n]+)/gi,
  pains: /(dificuldade|problema|nao consigo|não consigo|luto com)\s+([^.,;]+)/gi,
  restrictions: /(nao como|não como|evito|intolerancia|intolerância|alergia a)\s+([^.,;]+)/gi,
  preferences: /(prefiro|gosto de|adoro)\s+([^.,;]+)/gi,
  activities: /(treino|corrida|meditacao|meditação|yoga|respiracao|respiração)/gi,
  emotions: /(ansioso|motivado|cansado|frustrado|feliz|esgotado|animado)/i,
};

function addEntity(target: string[], rawValue: string) {
  const normalized = sanitizeValue(rawValue);
  if (!normalized || target.includes(normalized)) return;
  target.push(normalized);
}

function injectClauseBreaks(text: string): string {
  return text
    .replace(/\s+e\s+(?=(?:adoro|prefiro|gosto de))/g, '. ')
    .replace(/\s+e\s+(?=evito)/g, '. ')
    .replace(/\s+e\s+(?=nao como)/g, '. ')
    .replace(/\s+e\s+(?=não como)/g, '. ');
}

// Heurística para dividir objetivos compostos: "perder peso, ganhar massa e melhorar alimentacao"
const GOAL_VERBS = [
  'perder','ganhar','melhorar','reduzir','aumentar','dormir','comer','beber','treinar','caminhar','correr','meditar','focar','organizar'
];

function splitCompositeGoals(raw: string): string[] {
  const value = sanitizeValue(raw);
  if (!value) return [];
  // Divide por vírgulas primeiro
  let parts = value.split(/\s*,\s*/g);
  // Em seguida, divide cada parte por " e " quando o segundo termo parece um novo objetivo (começa com verbo conhecido)
  const out: string[] = [];
  for (const p of parts) {
    const segments = p.split(/\s+e\s+/g);
    if (segments.length === 1) {
      out.push(segments[0]);
      continue;
    }
    // Mantém agrupado quando o segundo termo não inicia com verbo de objetivos
    const rebuilt: string[] = [];
    let buffer = segments[0];
    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      const startsWithVerb = GOAL_VERBS.some(v => seg.startsWith(v + ' '));
      if (startsWithVerb) {
        rebuilt.push(buffer);
        buffer = seg;
      } else {
        buffer = `${buffer} e ${seg}`;
      }
    }
    rebuilt.push(buffer);
    out.push(...rebuilt);
  }
  return out.map(clean).filter(Boolean);
}

export function normalizeText(value: string): string {
  return stripAccents(value).toLowerCase();
}

export function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function clean(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

const STOPWORDS = ['em', 'de', 'da', 'do', 'no', 'na', 'ao', 'a'];

function sanitizeValue(value: string): string {
  let sanitized = clean(stripAccents(value).toLowerCase());
  for (const stopword of STOPWORDS) {
    if (sanitized.startsWith(`${stopword} `)) {
      sanitized = sanitized.slice(stopword.length + 1);
      break;
    }
  }
  return sanitized.trim();
}

function matchAll(text: string, pattern: RegExp): RegExpExecArray[] {
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(pattern);
  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    matches.push(match);
    if (!regex.global) break;
  }
  return matches;
}
