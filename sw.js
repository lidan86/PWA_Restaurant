var staticCacheName = 'mwsRestaurantApp-001';
let filesToCache = [
  'index.html',
  'restaurant.html',
  '/sw.js',
  '/idbhandler.js',
  'dist/main.bundle.js',
  'dist/restaurant_info.bundle.js',
  'dist/idb.bundle.js',
  'dist/idbhandler.bundle.js',
  'dist/dbhelper.bundle.js',
  'dist/maps.bundle.js',
  'dist/sw_register.bundle.js',
  // 'dist/sw.bundle.js',
  'css/styles.css',
  'img/1.jpg',
  'img/2.jpg',
  'img/3.jpg',
  'img/4.jpg',
  'img/5.jpg',
  'img/6.jpg',
  'img/7.jpg',
  'img/8.jpg',
  'img/9.jpg',
  'img/10.jpg',
  'img/icon.png',
];

this.addEventListener('install', event => {
  console.log('service worker installed');
  event.waitUntil(
    caches
      .open(staticCacheName)
      .then(cache => {
        console.log('serviceWorker is now caching ...');
        return cache.addAll(filesToCache);
      })
      .catch(error => {
        console.log('Caches open failed: ' + error);
      })
  );
});

this.addEventListener('activate', event => {
  console.log('Activating new service worker ...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(
            cacheName =>
              cacheName.startsWith('mwsRestaurantApp-') &&
              cacheName != staticCacheName
          )
          .map(cacheName => caches.delete(cacheName))
      )
        .then(() => {
          console.log('New service worker in now actived!');
        })
        .catch(() => {
          console.log('New service worker failed to be activated!');
        });
    })
  );
});

this.addEventListener('fetch', event => {
  event.respondWith(
    caches
      .match(event.request, { ignoreSearch: true }) // https://developer.mozilla.org/en-US/docs/Web/API/Cache/match
      .then(response => {
        return (
          response ||
          fetch(event.request).then(fetchResponse => {
            return caches.open(staticCacheName).then(cache => {
              cache.put(event.request, fetchResponse.clone());
              return fetchResponse;
            });
          })
        );
      })
      .catch(error => {
        return new Response('Not connected to the internet', {
          status: 404,
          statusText: 'Not connected to the internet',
        });
      })
  );
});

this.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    this.skipWaiting();
  }
});
