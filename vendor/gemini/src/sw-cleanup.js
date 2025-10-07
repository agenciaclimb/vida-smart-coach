// Service Worker cleanup to prevent caching issues
// This ensures a clean state on each app boot

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}

// Clear all caches
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    return Promise.all(
      cacheNames.map(function(cacheName) {
        return caches.delete(cacheName);
      })
    );
  });
}

// Clear storage if needed (uncomment if you want to clear localStorage on boot)
// localStorage.clear();
// sessionStorage.clear();

console.log('Service Worker and caches cleaned up');