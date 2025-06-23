const CACHE_NAME = 'printex-pdf-automation-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/images/Icon.png',
  '/images/Printex_Logo_Slogan_CMYK.png',
  '/images/DragDrop.png'
];

// Installation des Service Workers und Caching der App-Shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Anfragen abfangen und aus dem Cache oder Netzwerk bedienen
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
