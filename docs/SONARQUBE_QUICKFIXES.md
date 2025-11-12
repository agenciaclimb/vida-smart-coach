# Guia Rápido: Correções SonarQube

Este guia mostra como corrigir os problemas mais comuns detectados pelo SonarQube.

## 🔧 Correções Simples (Quick Fixes)

### 1. Trocar `forEach()` por `for...of`

**❌ Antes:**
```javascript
items.forEach((item) => {
  console.log(item);
});
```

**✅ Depois:**
```javascript
for (const item of items) {
  console.log(item);
}
```

**Benefícios:**
- Melhor performance
- Suporta `break` e `continue`
- Mais legível

---

### 2. Usar `replaceAll()` ao invés de `replace()` com regex global

**❌ Antes:**
```javascript
const text = message.replace(/\s+/g, ' ');
```

**✅ Depois:**
```javascript
const text = message.replaceAll(/\s+/g, ' ');
```

**Nota:** Para strings simples (sem regex):
```javascript
const text = message.replaceAll(' ', '_');
```

---

### 3. Usar `structuredClone()` ao invés de `JSON.parse(JSON.stringify())`

**❌ Antes:**
```javascript
const clone = JSON.parse(JSON.stringify(profile || {}));
```

**✅ Depois:**
```javascript
const clone = structuredClone(profile || {});
```

**Benefícios:**
- Mais rápido
- Preserva tipos (Date, Map, Set, etc.)
- Mais seguro

---

### 4. Usar `Number.parseInt()` ao invés de `parseInt()`

**❌ Antes:**
```javascript
const num = parseInt(match[1]);
```

**✅ Depois:**
```javascript
const num = Number.parseInt(match[1], 10);
```

**Importante:** Sempre especifique a base (10 para decimal)

---

### 5. Arrays de validação devem ser `Set`

**❌ Antes:**
```javascript
const validTypes = ['physical', 'nutritional', 'emotional', 'spiritual'];
if (validTypes.includes(type)) { ... }
```

**✅ Depois:**
```javascript
const validTypes = new Set(['physical', 'nutritional', 'emotional', 'spiritual']);
if (validTypes.has(type)) { ... }
```

**Benefícios:**
- O(1) lookup vs O(n)
- Mais eficiente para grandes listas

---

## 🏗️ Refatorações Médias

### 6. Simplificar ternários aninhados

**❌ Antes:**
```javascript
const message = questionCount === 0 ? 'Primeira pergunta' :
  questionCount === 1 ? 'Segunda pergunta' :
  questionCount === 2 ? 'Terceira pergunta' :
  'Padrão';
```

**✅ Depois:**
```javascript
function getMessageForQuestionCount(count) {
  const messages = {
    0: 'Primeira pergunta',
    1: 'Segunda pergunta',
    2: 'Terceira pergunta',
  };
  return messages[count] || 'Padrão';
}

const message = getMessageForQuestionCount(questionCount);
```

**Ou com switch:**
```javascript
function getMessageForQuestionCount(count) {
  switch (count) {
    case 0: return 'Primeira pergunta';
    case 1: return 'Segunda pergunta';
    case 2: return 'Terceira pergunta';
    default: return 'Padrão';
  }
}
```

---

### 7. Reduzir parâmetros de funções

**❌ Antes:**
```javascript
async function processMessageByStage(
  message, userProfile, context, stage, 
  supabase, openaiKey, sessionId, planData, metadata
) {
  // ...
}
```

**✅ Depois:**
```javascript
interface ProcessMessageOptions {
  message: string;
  userProfile: any;
  context: UserContextData;
  stage: string;
  supabase: any;
  openaiKey: string;
  sessionId: string;
  planData: any;
  metadata: any;
}

async function processMessageByStage(options: ProcessMessageOptions) {
  const { message, userProfile, context, stage } = options;
  // ...
}
```

---

### 8. Evitar condições negadas

**❌ Antes:**
```javascript
const status = !askedPhysical ? 'Próxima' : 'Concluída';
```

**✅ Depois:**
```javascript
const status = askedPhysical ? 'Concluída' : 'Próxima';
```

**Regra:** Sempre coloque a condição positiva primeiro

---

## 🎯 Refatorações Complexas

### 9. Reduzir Complexidade Cognitiva

**Problema:** Função com muitos níveis de if/else/loops aninhados

**Estratégias:**

#### a) Extrair validações antecipadas (Early Returns)

**❌ Antes:**
```javascript
async function processMessage(data) {
  if (data) {
    if (data.valid) {
      if (data.user) {
        // lógica principal aqui
      } else {
        return error('Usuário não encontrado');
      }
    } else {
      return error('Dados inválidos');
    }
  } else {
    return error('Dados ausentes');
  }
}
```

**✅ Depois:**
```javascript
async function processMessage(data) {
  if (!data) return error('Dados ausentes');
  if (!data.valid) return error('Dados inválidos');
  if (!data.user) return error('Usuário não encontrado');
  
  // lógica principal aqui (sem aninhamento)
}
```

#### b) Extrair funções menores

**❌ Antes:**
```javascript
function bigFunction(stage, context) {
  let prompt = '';
  
  if (stage === 'sdr') {
    if (context.questionCount === 0) {
      prompt = '...';
    } else if (context.questionCount === 1) {
      prompt = '...';
    }
    // mais lógica
  } else if (stage === 'specialist') {
    // lógica do specialist
  }
  
  return prompt;
}
```

**✅ Depois:**
```javascript
function bigFunction(stage, context) {
  const handlers = {
    sdr: () => handleSDRStage(context),
    specialist: () => handleSpecialistStage(context),
  };
  
  const handler = handlers[stage] || handleDefaultStage;
  return handler(context);
}

function handleSDRStage(context) {
  return getSDRPrompt(context.questionCount);
}

function getSDRPrompt(questionCount) {
  const prompts = {
    0: '...',
    1: '...',
  };
  return prompts[questionCount] || getDefaultPrompt();
}
```

#### c) Usar Map/Object ao invés de múltiplos if/else

**❌ Antes:**
```javascript
if (planType === 'physical') {
  icon = '🏋️';
  color = 'blue';
} else if (planType === 'nutritional') {
  icon = '🥗';
  color = 'green';
} else if (planType === 'emotional') {
  icon = '🧠';
  color = 'purple';
}
```

**✅ Depois:**
```javascript
const planConfig = {
  physical: { icon: '🏋️', color: 'blue' },
  nutritional: { icon: '🥗', color: 'green' },
  emotional: { icon: '🧠', color: 'purple' },
};

const { icon, color } = planConfig[planType] || planConfig.default;
```

---

### 10. Remover código duplicado

**❌ Antes:**
```javascript
if (planType === 'emotional') {
  practices.forEach((practice) => {
    console.log(practice);
  });
} else if (planType === 'spiritual') {
  practices.forEach((practice) => {
    console.log(practice);
  });
}
```

**✅ Depois:**
```javascript
if (planType === 'emotional' || planType === 'spiritual') {
  for (const practice of practices) {
    console.log(practice);
  }
}
```

---

## 🧹 Limpeza de Código

### 11. Remover código comentado

**❌ Antes:**
```javascript
const result = calculate();
// const oldResult = calculateOldWay();
// if (oldResult > 100) {
//   return oldResult;
// }
return result;
```

**✅ Depois:**
```javascript
const result = calculate();
return result;
```

**Regra:** Use Git para histórico, não comentários

---

### 12. Resolver TODOs

**❌ Antes:**
```javascript
// TODO: Enviar notificação por email
function handlePurchase() {
  savePurchase();
  // sendEmail(); // TODO
}
```

**✅ Opções:**

a) **Implementar agora:**
```javascript
function handlePurchase() {
  savePurchase();
  sendEmailNotification();
}
```

b) **Criar issue e remover TODO:**
```javascript
// Issue #123: Implementar notificação por email
function handlePurchase() {
  savePurchase();
}
```

c) **Adicionar prazo:**
```javascript
// TODO [2025-12-31]: Enviar notificação por email (Issue #123)
```

---

## 🚫 Suprimir Warnings (Último Recurso)

Se um warning é realmente um falso positivo:

```javascript
// NOSONAR: Deno global só disponível no runtime do Supabase
const env = Deno.env.get('VAR');
```

**Atenção:** Use com moderação e sempre justifique!

---

## 📋 Checklist de Revisão

Antes de fazer commit:

- [ ] Funções têm no máximo 7 parâmetros
- [ ] Complexidade cognitiva < 15
- [ ] Sem ternários aninhados
- [ ] Sem código comentado
- [ ] TODOs têm issues ou prazos
- [ ] Arrays de validação são Sets
- [ ] Usando APIs modernas (replaceAll, structuredClone, etc.)
- [ ] Sem `forEach()` (usar `for...of`)

---

## 🎓 Recursos

- [SonarQube Rules](https://rules.sonarsource.com/typescript/)
- [JavaScript Best Practices](https://github.com/ryanmcdermott/clean-code-javascript)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**Dica:** Use o Quick Fix do VS Code (Ctrl+.) para correções automáticas!
