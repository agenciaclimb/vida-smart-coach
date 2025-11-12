- [ ] 0 uso de `forEach()`
- [ ] APIs modernas (replaceAll, structuredClone)

---

### 1.2. SISTEMA DE MEMÓRIA CONTEXTUAL

**Objetivo:** IA nunca esquece informações importantes

**Tarefas:**

#### ✅ T1.4: Criar Tabela `conversation_memory`
**Impacto:** Alto  
**Esforço:** 2h

**Migration:**
```sql
CREATE TABLE conversation_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  entities JSONB NOT NULL DEFAULT '{}'::jsonb,
  conversation_summary TEXT,
  last_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  pending_actions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

CREATE INDEX idx_conversation_memory_user ON conversation_memory(user_id);
```

**Entidades Armazenadas:**
- `user_goals`: array de objetivos mencionados
- `pain_points`: array de dores relatadas
- `preferences`: objeto com preferências
- `mentioned_activities`: atividades citadas
- `emotional_state`: estado emocional inferido

---

#### ✅ T1.5: Implementar Extração de Entidades
**Impacto:** Alto  
**Esforço:** 4h

**Arquivo:** `supabase/functions/conversation-memory/index.ts`

**Patterns para Detecção:**
```typescript
const PATTERNS = {
  goals: /(quero|preciso|gostaria de)\s+(perder peso|ganhar massa|melhorar)/gi,
  pains: /(dificuldade|problema|não consigo|luto com)\s+(\w+)/gi,
  timeframes: /\b(dias|semanas|meses)\b/gi,
  emotions: /(ansioso|motivado|cansado|frustrado|feliz)/gi,
  restrictions: /(alergia|intolerância|não como|evito)\s+(\w+)/gi,
};
```

**Critérios de Aceitação:**
- [ ] Extrai 5+ tipos de entidades
- [ ] Normaliza texto (acentos, case)
- [ ] Merge inteligente (não duplica)
- [ ] Testes com casos reais

---

#### ✅ T1.6: Integrar Memória no Fluxo da IA
**Impacto:** Alto  
**Esforço:** 3h

**Integração:**
```typescript
// Carregar memória antes de processar
const memory = await loadConversationMemory(userId, supabase);

// Enriquecer contexto
const enrichedContext = `
MEMÓRIA:
Objetivos: ${memory.entities.user_goals.join(', ')}
Dores: ${memory.entities.pain_points.join(', ')}
Preferências: ${JSON.stringify(memory.entities.preferences)}

NÃO PERGUNTE sobre informações já coletadas.
`;

// Atualizar após resposta
await updateConversationMemory(userId, message, aiResponse, supabase);
```

---

### 1.3. ANTI-LOOP E ANTI-REPETIÇÃO

**Objetivo:** Eliminar 100% dos loops e repetições

**Tarefas:**

#### ✅ T1.7: Validação Pré-Resposta
**Impacto:** Crítico  
**Esforço:** 4h

**Arquivo:** `src/services/response-validator/index.ts`

**Validações:**
```typescript
interface ValidationCheck {
  name: string;
  check: (response: string, history: ChatMessage[]) => CheckResult;
  severity: 'error' | 'warning';
}

const CHECKS: ValidationCheck[] = [
  {
    name: 'repeated_question',
    check: checkForRepeatedQuestions,
    severity: 'error',
  },
  {
    name: 'ignored_user_response',
    check: checkForIgnoredUserResponse,
    severity: 'error',
  },
  {
    name: 'progression_stall',
    check: checkForProgressionStall,
    severity: 'warning',
  },
  {
    name: 'contradictions',
    check: checkForContradictions,
    severity: 'warning',
  },
];
```

**Lógica de Similaridade:**
```typescript
function calculateSimilarity(text1: string, text2: string): number {
  // Levenshtein distance + normalização
  const distance = levenshtein(normalize(text1), normalize(text2));
