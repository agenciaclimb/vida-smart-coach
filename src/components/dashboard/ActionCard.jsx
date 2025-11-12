import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * ActionCard - Card de ação rápida com gradiente e badge
 * 
 * @param {React.Element} icon - Ícone do card
 * @param {string} title - Título principal
 * @param {string} description - Descrição curta
 * @param {string} gradient - Classes do gradiente (ex: "from-blue-500 to-cyan-500")
 * @param {string} badge - Texto do badge (opcional)
 * @param {Function} onClick - Callback ao clicar
 */
const ActionCard = ({ 
  icon, 
  title, 
  description, 
  gradient = "from-gray-500 to-gray-600",
  badge,
  onClick,
  ariaLabel
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className={`cursor-pointer overflow-hidden bg-gradient-to-br ${gradient} shadow-lg hover:shadow-xl transition-all duration-300 border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel || `${title}: ${description}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        <CardHeader className="p-4 text-white relative">
          {/* Badge no canto superior direito */}
          {badge && (
            <motion.div
              className="absolute top-2 right-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Badge className="bg-white/20 text-white border-0 text-xs backdrop-blur-sm">
                {badge}
              </Badge>
            </motion.div>
          )}
          
          {/* Ícone */}
          <motion.div 
            className="mb-3"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm" aria-hidden="true">
              {React.cloneElement(icon, { className: 'w-6 h-6', strokeWidth: 2.5, 'aria-hidden': true })}
            </div>
          </motion.div>
          
          {/* Título e Descrição */}
          <div className="space-y-1">
            <h3 className="font-bold text-lg leading-tight">{title}</h3>
            <p className="text-sm text-white/80">{description}</p>
          </div>
          
          {/* Arrow de navegação */}
          <motion.div
            className="absolute bottom-3 right-3 opacity-70"
            whileHover={{ x: 4 }}
          >
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </motion.div>
        </CardHeader>
      </Card>
    </motion.div>
  );
};

export default ActionCard;
