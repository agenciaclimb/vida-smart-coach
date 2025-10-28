import { useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

/**
 * AnimatedCounter - Contador animado para números
 * @param {number} value - Valor final do contador
 * @param {number} duration - Duração da animação em segundos (default: 1)
 * @param {string} suffix - Sufixo (ex: 'pts', 'XP', 'dias')
 * @param {string} className - Classes CSS adicionais
 */
export default function AnimatedCounter({ 
  value = 0, 
  duration = 1, 
  suffix = '', 
  className = '',
  fontSize = 'text-2xl'
}) {
  const [displayValue, setDisplayValue] = useState(0);
  
  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0
  });

  const display = useTransform(spring, (latest) => {
    const rounded = Math.round(latest);
    setDisplayValue(rounded);
    return rounded;
  });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

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
