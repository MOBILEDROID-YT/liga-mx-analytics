const cacheName = 'futbol-mx-analisis-pro-shell-v41';
const appShell = [
  './',
  './index.html',
  './css/style.css?v=23',
  './js/config.js',
  './js/app.js?v=18',
  './js/juego.js?v=11',
  './js/quiz.js?v=1',
  './js/quiz-runtime.js?v=1',
  './js/once-ideal.js?v=1',
  './js/misterioso.js?v=1',
  './js/reto-dt.js?v=1',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/tifo-futbol-mx.png',
  './assets/emblema-rey-android.png',
  './assets/once-ideal-pitch-wide.png',
  './assets/once-ideal-pitch-tall.png',
  './assets/once-ideal-stars.png',
  './privacidad.html',
  './terminos.html',
  './contacto.html',
  './admin.html',
  './js/admin.js?v=7'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName)
      .then((cache) => cache.addAll(appShell))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse;
          const responseCopy = networkResponse.clone();
          caches.open(cacheName).then((cache) => cache.put(event.request, responseCopy));
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
