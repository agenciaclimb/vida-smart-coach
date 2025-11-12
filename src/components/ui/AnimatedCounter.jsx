import { useState, useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';

/**
 * AnimatedCounter - Contador animado para números com validação robusta
 * @param {number|string} value - Valor final do contador
 * @param {number} duration - Duração da animação em segundos (default: 1)
 * @param {string} suffix - Sufixo (ex: 'pts', 'XP', 'dias')
 * @param {string} className - Classes CSS adicionais
 * @param {string} fontSize - Tamanho da fonte (default: 'text-2xl')
 * @param {boolean} animate - Se deve animar (default: true)
 */
export default function AnimatedCounter({ 
  value = 0, 
  duration = 1, 
  suffix = '', 
  className = '',
  fontSize = 'text-2xl',
  animate = true
}) {
  // Validação robusta do valor
  const parseValue = (val) => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return !isNaN(parsed) ? parsed : 0;
    }
    return 0;
  };

  const numericValue = parseValue(value);
  const [displayValue, setDisplayValue] = useState(numericValue);
  
  const spring = useSpring(numericValue, {
    duration: animate ? duration * 1000 : 0,
    bounce: 0
  });

  useEffect(() => {
    if (!animate) return undefined;
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [spring, animate]);

  useEffect(() => {
    const newValue = parseValue(value);
    if (animate) {
      spring.set(newValue);
    } else {
      setDisplayValue(newValue);
    }
  }, [value, spring, animate]);

  // Fallback para renderização direta se não estiver animando
  if (!animate) {
    return (
      <span className={`font-bold tabular-nums ${fontSize} ${className}`}>
        {numericValue.toLocaleString('pt-BR')}
        {suffix && <span className="ml-1 text-sm opacity-80">{suffix}</span>}
      </span>
    );
  }

  return (
    <motion.span 
      className={`font-bold tabular-nums ${fontSize} ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayValue.toLocaleString('pt-BR')}
      {suffix && <span className="ml-1 text-sm opacity-80">{suffix}</span>}
    </motion.span>
  );
}

/**
 * AnimatedNumberBadge - Badge animado para exibir números com destaque
 */
export function AnimatedNumberBadge({ 
  value, 
  label, 
  icon: Icon, 
  gradient = 'from-blue-500 to-blue-600',
  size = 'md'
}) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const fontSize = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  return (
    <motion.div
      className={`bg-gradient-to-br ${gradient} rounded-xl text-white ${sizeClasses[size]} shadow-lg`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center justify-between mb-2">
        {Icon && <Icon className={`${iconSizes[size]} opacity-80`} />}
        <span className="text-sm font-medium opacity-90">{label}</span>
      </div>
      <AnimatedCounter 
        value={value} 
        className="text-white" 
        fontSize={fontSize[size]}
      />
    </motion.div>
  );
}
