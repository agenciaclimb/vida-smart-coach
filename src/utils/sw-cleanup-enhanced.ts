// src/utils/sw-cleanup-enhanced.ts
console.log('🧹 Limpeza SW e cache iniciada...');

// Desregistrar SWs
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => 
    regs.forEach(reg => reg.unregister())
  );
}

// Limpar caches
if ('caches' in window) {
  caches.keys().then(names => 
    names.forEach(name => caches.delete(name))
  );
}

// Limpar localStorage legado
const legacyKeys = [
  'auth0.sPA.vida-smart-coach.is.authenticated',
  'next-auth.session-token',
  'horizons-session',
  'workbox-precache'
];

legacyKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log('🗑️ Removido:', key);
  }
});

console.log('✅ Limpeza SW concluída');