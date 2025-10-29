# 🎨 Design System - Vida Smart Coach

## Design Tokens

Este projeto usa um sistema de design tokens para garantir consistência visual. Sempre use os tokens ao invés de valores hardcoded.

### Importação

```javascript
import { designTokens, getPillarGradient, getSpacing } from '@/styles/designTokens';
```

### Uso Básico

#### Spacing

```javascript
// ❌ Evitar
<div className="space-y-4 gap-6">

// ✅ Preferir
<div className={`${getSpacing('md', 'space-y')} ${getSpacing('lg', 'gap')}`}>
// ou
<div className="space-y-4 gap-6"> // valores padronizados: 2, 3, 4, 6, 8, 12
```

#### Gradientes por Pilar

```javascript
// Físico (azul)
<Card className={getPillarGradient('physical', 'solid')}>
<div className={getPillarGradient('physical', 'subtle')}>
<p className={getPillarGradient('physical', 'text')}>

// Nutricional (verde)
<Card className={getPillarGradient('nutritional', 'solid')}>

// Emocional (roxo)
<Card className={getPillarGradient('emotional', 'solid')}>

// Espiritual (âmbar)
<Card className={getPillarGradient('spiritual', 'solid')}>
```

#### Typography

```javascript
<h1 className={designTokens.typography.h1}>Título Principal</h1>
<h2 className={designTokens.typography.h2}>Subtítulo</h2>
<p className={designTokens.typography.body}>Texto normal</p>
<span className={designTokens.typography.caption}>Legendas</span>
```

#### Border Radius

```javascript
<Card className={designTokens.radius.lg}>  // Cards principais
<Button className={designTokens.radius.md}> // Botões
<Badge className={designTokens.radius.full}> // Pills
```

### Padrões de Componentes

#### Card Padrão
```javascript
<div className={designTokens.components.card.base}>
  {/* conteúdo */}
</div>
```

#### Card Interativo
```javascript
<div className={designTokens.components.card.interactive}>
  {/* conteúdo clicável */}
</div>
```

#### Botão Primário
```javascript
<button className={designTokens.components.button.primary}>
  Ação Principal
</button>
```

### Animações Framer Motion

```javascript
import { motion } from 'framer-motion';

<motion.div {...designTokens.animations.fadeIn}>
  {/* conteúdo animado */}
</motion.div>
```

## Breakpoints Responsivos

Use os breakpoints padrão do Tailwind:

- `sm:` - 640px (mobile landscape)
- `md:` - 768px (tablet)
- `lg:` - 1024px (desktop)
- `xl:` - 1280px (large desktop)

```javascript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* layout responsivo */}
</div>
```

## Visual Polish Checklist

Ao criar ou revisar componentes:

- [ ] Usar spacing consistente (2, 3, 4, 6, 8, 12)
- [ ] Aplicar gradientes temáticos por pilar
- [ ] Border-radius padronizado (md, lg, xl, full)
- [ ] Typography scale consistente
- [ ] Responsividade testada (375px, 768px, 1024px)
- [ ] Animações suaves com framer-motion
- [ ] Shadows apropriados (sm, md, lg)

## Migração de Código Legado

### Antes
```javascript
<div className="p-4 bg-gradient-to-tr from-blue-500 to-blue-400 rounded-xl shadow-lg">
```

### Depois
```javascript
<div className={`${designTokens.padding.md} ${getPillarGradient('physical', 'solid')} ${designTokens.radius.lg} ${designTokens.shadows.lg}`}>
```

Ou usando classes diretas (mais simples):
```javascript
<div className="p-4 bg-gradient-to-tr from-blue-500 to-blue-400 rounded-xl shadow-lg">
// ✅ OK se usar valores padronizados
```

---

**Última atualização:** Ciclo 30 - 28/10/2025
