self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed');
    event.waitUntil(
      caches.open('v1').then((cache) => {
        return cache.addAll(['/']); // Cache your static assets here
      })
    );
  });
  
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });