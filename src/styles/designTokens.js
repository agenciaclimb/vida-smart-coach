/**
 * DESIGN TOKENS - VIDA SMART COACH
 * 
 * Sistema de design unificado para garantir consistência visual
 * em toda a aplicação. Use estes tokens ao invés de valores hardcoded.
 * 
 * Última atualização: 28/10/2025 - Ciclo 30
 */

export const designTokens = {
  // ============= SPACING SCALE =============
  spacing: {
    xs: '0.5rem',    // 8px - gap mínimo entre elementos pequenos
    sm: '0.75rem',   // 12px - gap entre badges, ícones pequenos
    md: '1rem',      // 16px - gap padrão entre elementos
    lg: '1.5rem',    // 24px - gap entre seções
    xl: '2rem',      // 32px - gap entre cards principais
    '2xl': '3rem',   // 48px - gap entre grandes blocos
  },

  // ============= PADDING SCALE =============
  padding: {
    xs: 'p-2',       // 8px - padding mínimo
    sm: 'p-3',       // 12px - padding pequeno
    md: 'p-4',       // 16px - padding padrão para cards
    lg: 'p-6',       // 24px - padding generoso
    xl: 'p-8',       // 32px - padding para containers principais
  },

  // ============= BORDER RADIUS =============
  radius: {
    sm: 'rounded-md',    // 6px - inputs, badges pequenos
    md: 'rounded-lg',    // 8px - cards, botões
    lg: 'rounded-xl',    // 12px - cards principais
    full: 'rounded-full', // pills, avatares
  },

  // ============= TYPOGRAPHY SCALE =============
  typography: {
    // Headings
    h1: 'text-3xl md:text-4xl font-bold',
    h2: 'text-2xl md:text-3xl font-bold',
    h3: 'text-xl md:text-2xl font-semibold',
    h4: 'text-lg md:text-xl font-semibold',
    h5: 'text-base md:text-lg font-semibold',
    
    // Body text
    body: 'text-base',
    bodyLarge: 'text-lg',
    bodySmall: 'text-sm',
    caption: 'text-xs',
    
    // Special
    display: 'text-4xl md:text-5xl lg:text-6xl font-extrabold',
  },

  // ============= COLOR GRADIENTS =============
  gradients: {
    // Brand gradient (primary)
    brand: 'bg-gradient-to-r from-green-400 via-blue-500 to-purple-600',
    brandSubtle: 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50',
    
    // Pillar-specific gradients
    physical: {
      solid: 'bg-gradient-to-tr from-blue-500 to-blue-400',
      subtle: 'bg-gradient-to-br from-blue-50 to-blue-100',
      text: 'text-blue-600',
    },
    nutritional: {
      solid: 'bg-gradient-to-tr from-green-500 to-green-400',
      subtle: 'bg-gradient-to-br from-green-50 to-green-100',
      text: 'text-green-600',
    },
    emotional: {
      solid: 'bg-gradient-to-tr from-purple-500 to-purple-400',
      subtle: 'bg-gradient-to-br from-purple-50 to-purple-100',
      text: 'text-purple-600',
    },
    spiritual: {
      solid: 'bg-gradient-to-tr from-amber-500 to-amber-400',
      subtle: 'bg-gradient-to-br from-amber-50 to-amber-100',
      text: 'text-amber-600',
    },
    
    // Gamification gradients
    xp: 'bg-gradient-to-tr from-lime-500 to-lime-400',
    level: 'bg-gradient-to-tr from-amber-500 to-amber-400',
    reward: 'bg-gradient-to-tr from-yellow-500 to-yellow-400',
    streak: 'bg-gradient-to-tr from-orange-500 to-red-500',
  },

  // ============= SHADOWS =============
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    inner: 'shadow-inner',
  },

  // ============= ANIMATIONS =============
  animations: {
    // Framer Motion variants
    fadeIn: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.2 }
    },
    slideIn: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.3 }
    },
  },

  // ============= BREAKPOINTS (Tailwind defaults) =============
  breakpoints: {
    sm: '640px',   // Mobile landscape
    md: '768px',   // Tablet
    lg: '1024px',  // Desktop
    xl: '1280px',  // Large desktop
    '2xl': '1536px', // Extra large
  },

  // ============= COMPONENT PATTERNS =============
  components: {
    card: {
      base: 'bg-white rounded-xl shadow-md p-6',
      interactive: 'bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer',
      gradient: 'rounded-xl shadow-md p-6',
    },
    badge: {
      default: 'px-3 py-1 rounded-full text-sm font-medium',
      pill: 'px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide',
    },
    button: {
      primary: 'px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:opacity-90 transition-opacity',
      secondary: 'px-4 py-2 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors',
      ghost: 'px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors',
    },
    input: {
      base: 'px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    },
  },
};

/**
 * Helper function to get pillar-specific gradient
 * @param {string} pillarType - 'physical' | 'nutritional' | 'emotional' | 'spiritual'
 * @param {string} variant - 'solid' | 'subtle' | 'text'
 */
export const getPillarGradient = (pillarType, variant = 'solid') => {
  const pillar = designTokens.gradients[pillarType];
  return pillar ? pillar[variant] : designTokens.gradients.brand;
};

/**
 * Helper function to get responsive spacing classes
 * @param {string} size - 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 * @param {string} type - 'gap' | 'space-y' | 'space-x'
 */
export const getSpacing = (size, type = 'gap') => {
  const sizeMap = {
    xs: '2', sm: '3', md: '4', lg: '6', xl: '8', '2xl': '12'
  };
  return `${type}-${sizeMap[size] || sizeMap.md}`;
};

export default designTokens;
