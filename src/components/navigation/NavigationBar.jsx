import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Target, 
  MessageSquare, 
  Calendar, 
  Trophy, 
  Users, 
  User, 
  Gift, 
  Plug 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const NavigationBar = ({ activeTab, onChange, notifications = {} }) => {
  const navItems = [
    { 
      value: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      color: 'from-blue-500 to-cyan-500',
      notifications: notifications.dashboard || 0
    },
    { 
      value: 'plan', 
      label: 'Meu Plano', 
      icon: Target,
      color: 'from-purple-500 to-pink-500',
      notifications: notifications.plan || 0
    },
    { 
      value: 'chat', 
      label: 'IA Coach', 
      icon: MessageSquare,
      color: 'from-green-500 to-emerald-500',
      notifications: notifications.chat || 0
    },
    { 
      value: 'calendar', 
      label: 'Calendário', 
      icon: Calendar,
      color: 'from-orange-500 to-amber-500',
      notifications: notifications.calendar || 0
    },
    { 
      value: 'gamification', 
      label: 'Gamificação', 
      icon: Trophy,
      color: 'from-yellow-500 to-orange-500',
      notifications: notifications.gamification || 0
    },
    { 
      value: 'community', 
      label: 'Comunidade', 
      icon: Users,
      color: 'from-indigo-500 to-purple-500',
      notifications: notifications.community || 0
    },
    { 
      value: 'profile', 
      label: 'Perfil', 
      icon: User,
      color: 'from-gray-500 to-slate-500',
      notifications: notifications.profile || 0
    },
    { 
      value: 'referral', 
      label: 'Indique', 
      icon: Gift,
      color: 'from-pink-500 to-rose-500',
      notifications: notifications.referral || 0
    },
    { 
      value: 'integrations', 
      label: 'Integrações', 
      icon: Plug,
      color: 'from-teal-500 to-cyan-500',
      notifications: notifications.integrations || 0
    }
  ];

  return (
    <nav className="relative w-full" role="navigation" aria-label="Menu de navegação principal">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="tablist">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;
          
          return (
            <motion.button
              key={item.value}
              onClick={() => onChange(item.value)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                isActive
                  ? 'bg-white shadow-md text-gray-900'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              aria-selected={isActive}
              aria-label={item.notifications > 0 ? `${item.label} - ${item.notifications} notificações` : item.label}
              aria-controls={`panel-${item.value}`}
            >
              <motion.div
                className={isActive ? `bg-gradient-to-r ${item.color} text-white p-1.5 rounded-md` : 'text-gray-500 p-1.5 rounded-md'}
                animate={{
                  rotate: isActive ? [0, 360] : 0
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut"
                }}
              >
                <Icon className="w-4 h-4" />
              </motion.div>
              <span>{item.label}</span>
              
              {isActive && (
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} rounded-t-full`}
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              
              {item.notifications > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1"
                >
                  <Badge 
                    variant="destructive" 
                    className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                  >
                    {item.notifications > 9 ? '9+' : item.notifications}
                  </Badge>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

NavigationBar.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  notifications: PropTypes.object,
};

export default NavigationBar;
