const CACHE_NAME = "filmer-cache-v1";
const urlsToCache = ["/", "/index.html", "/manifest.json", "/icons/icon-192x192.png", "/icons/icon-512x512.png"];

// INSTALL: cache statiska filer
self.addEventListener("install", (event) => {
   event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
         return cache.addAll(urlsToCache);
      }),
   );
});

// ACTIVATE: rensa gamla cache-versioner
self.addEventListener("activate", (event) => {
   event.waitUntil(
      caches.keys().then((keys) =>
         Promise.all(
            keys.map((key) => {
               if (key !== CACHE_NAME) return caches.delete(key);
            }),
         ),
      ),
   );
});

// FETCH: försök hämta från nätet först, annars cache
self.addEventListener("fetch", (event) => {
   const requestURL = new URL(event.request.url);

   // Om det är API-förfrågan till /api/filmer
   if (requestURL.pathname.startsWith("/api/filmer")) {
      event.respondWith(
         fetch(event.request)
            .then((response) => {
               // Klona responsen och spara i cache
               const resClone = response.clone();
               caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, resClone);
               });
               return response;
            })
            .catch(() => {
               // Om offline: returnera från cache om den finns
               return caches.match(event.request);
            }),
      );
      return;
   }

   // Annars: statiska filer
   event.respondWith(
      caches.match(event.request).then((response) => {
         return response || fetch(event.request);
      }),
   );
});
