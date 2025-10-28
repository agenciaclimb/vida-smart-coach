import React from 'react';
import { Home, ClipboardList, MessageCircle, Trophy, Calendar } from 'lucide-react';

const NAV_ITEMS = [
  { value: 'dashboard', label: 'Início', icon: Home },
  { value: 'plan', label: 'Plano', icon: ClipboardList },
  { value: 'calendar', label: 'Calendário', icon: Calendar },
  { value: 'chat', label: 'IA', icon: MessageCircle },
  { value: 'gamification', label: 'Pontos', icon: Trophy },
];

const MobileBottomNav = ({ activeTab, onChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="grid grid-cols-5 gap-1 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]">
        {NAV_ITEMS.map(({ value, label, icon: Icon }) => {
          const isActive = activeTab === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange?.(value)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-md transition-colors ${
                isActive ? 'text-primary' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? '' : 'opacity-80'}`} />
              <span className="text-[11px] leading-4 mt-0.5">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
