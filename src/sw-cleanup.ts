// Service Worker e Cache cleanup
console.log('🧹 Iniciando limpeza de SW/caches...');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    console.log(`🔄 Removendo ${regs.length} service workers...`);
    regs.forEach((r) => r.unregister());
  }).catch(err => {
    console.warn('⚠️ Erro ao limpar service workers:', err);
  });
  
  if ('caches' in window) {
    caches?.keys?.().then((keys) => {
      console.log(`🗑️ Removendo ${keys.length} caches...`);
      keys.forEach((k) => caches.delete(k));
    }).catch(err => {
      console.warn('⚠️ Erro ao limpar caches:', err);
    });
  }
}

console.log('✅ Cleanup de SW/caches concluído');