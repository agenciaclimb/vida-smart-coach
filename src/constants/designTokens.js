// Design tokens centralizados para o Dashboard

export const PILLAR_COLORS = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', progress: 'bg-blue-500' },
  green: { bg: 'bg-green-100', text: 'text-green-600', progress: 'bg-green-500' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600', progress: 'bg-pink-500' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', progress: 'bg-cyan-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', progress: 'bg-purple-500' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', progress: 'bg-amber-500' },
};

export const LEVEL_TIERS = [
  { min: 30, name: 'Mestre', badge: '👑', color: 'from-amber-500 to-amber-600' },
  { min: 20, name: 'Expert', badge: '💎', color: 'from-pink-500 to-pink-600' },
  { min: 10, name: 'Avançado', badge: '⭐', color: 'from-purple-500 to-purple-600' },
  { min: 5, name: 'Praticante', badge: '🌟', color: 'from-green-500 to-green-600' },
  { min: 3, name: 'Aprendiz', badge: '✨', color: 'from-blue-500 to-blue-600' },
  { min: 0, name: 'Iniciante', badge: '🔰', color: 'from-gray-500 to-gray-600' },
];
