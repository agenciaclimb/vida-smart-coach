// Service Worker e Cache cleanup
console.log('?? Iniciando limpeza de SW/caches...');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      const keepFile = 'checkin-notification-sw.js';
      const removable = registrations.filter((registration) => {
        const scriptUrl =
          registration.active?.scriptURL ||
          registration.waiting?.scriptURL ||
          registration.installing?.scriptURL ||
          '';
        return !scriptUrl.includes(keepFile);
      });

      console.log(`?? Removendo ${removable.length} service workers...`);
      removable.forEach((registration) => registration.unregister());
    })
    .catch((err) => {
      console.warn('?? Erro ao limpar service workers:', err);
    });

  if ('caches' in window) {
    caches
      ?.keys?.()
      .then((keys) => {
        console.log(`??? Removendo ${keys.length} caches...`);
        keys.forEach((cacheKey) => caches.delete(cacheKey));
      })
      .catch((err) => {
        console.warn('?? Erro ao limpar caches:', err);
      });
  }
}

console.log('? Cleanup de SW/caches concluído');
