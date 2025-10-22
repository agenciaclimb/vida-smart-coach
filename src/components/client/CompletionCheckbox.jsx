import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Checkbox com animação para conclusão de itens dos planos
 * 
 * @param {object} props
 * @param {string} props.id - ID único do item
 * @param {boolean} props.checked - Se está marcado
 * @param {function} props.onCheckedChange - Callback ao mudar estado
 * @param {boolean} props.disabled - Se está desabilitado
 * @param {number} props.points - Pontos XP concedidos (opcional, para display)
 * @param {string} props.className - Classes CSS adicionais
 */
export const CompletionCheckbox = ({ 
  id, 
  checked, 
  onCheckedChange, 
  disabled = false,
  points,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.1 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className={`
            h-5 w-5 
            transition-all duration-200
            ${checked ? 'bg-green-500 border-green-500' : 'border-gray-300'}
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
        />
      </motion.div>

      {checked && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 500,
            damping: 20,
            duration: 0.3
          }}
        >
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        </motion.div>
      )}

      {checked && points && (
        <motion.span
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -10, opacity: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="text-xs font-semibold text-green-600"
        >
          +{points} XP
        </motion.span>
      )}
    </div>
  );
};
