const STATIC_CACHE = "static-cache-v5";
const API_CACHE = "api-cache-v5";
const RUNTIME_CACHE = "runtime-cache-v3";

const urlsToCache = ["/", "/index.html", "/manifest.json", "/icons/icon-192x192.png", "/icons/icon-512x512.png"];

// INSTALL
self.addEventListener("install", (event) => {
   event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(urlsToCache)));
   self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", (event) => {
   event.waitUntil(
      caches.keys().then((keys) =>
         Promise.all(
            keys.map((key) => {
               if (key !== STATIC_CACHE && key !== API_CACHE && key !== RUNTIME_CACHE) {
                  return caches.delete(key);
               }
            }),
         ),
      ),
   );
   self.clients.claim();
});

// FETCH
self.addEventListener("fetch", (event) => {
   const requestURL = new URL(event.request.url);

   // GET filmer – network first
   if (requestURL.pathname.startsWith("/api/filmer") && event.request.method === "GET") {
      event.respondWith(
         fetch(event.request)
            .then((response) => {
               const clone = response.clone();
               caches.open(API_CACHE).then((cache) => {
                  cache.put(event.request, clone);
               });
               return response;
            })
            .catch(() => caches.match(event.request)),
      );
      return;
   }

   // POST / DELETE – offline queue
   if (
      requestURL.pathname.startsWith("/api/filmer") &&
      (event.request.method === "POST" || event.request.method === "DELETE")
   ) {
      event.respondWith(
         fetch(event.request).catch(async () => {
            await saveRequest(event.request);
            await self.registration.sync.register("sync-filmer");

            notifyClient("offline-saved");

            return new Response(JSON.stringify({ message: "Offline sparad för synk!" }), {
               headers: { "Content-Type": "application/json" },
            });
         }),
      );
      return;
   }

   // 🧠 VITE JS + CSS (module scripts & styles)
   if (event.request.destination === "script" || event.request.destination === "style") {
      event.respondWith(
         caches.match(event.request).then((response) => {
            return (
               response ||
               fetch(event.request).then((res) => {
                  const clone = res.clone();
                  caches.open(RUNTIME_CACHE).then((cache) => {
                     cache.put(event.request, clone);
                  });
                  return res;
               })
            );
         }),
      );
      return;
   }

   // Allt annat – cache first
   event.respondWith(
      caches.match(event.request).then((response) => {
         return response || fetch(event.request);
      }),
   );
});

// Background Sync
self.addEventListener("sync", (event) => {
   if (event.tag === "sync-filmer") {
      event.waitUntil(sendOfflineRequests());
   }
});

// IndexedDB
function openDB() {
   return new Promise((resolve, reject) => {
      const request = indexedDB.open("filmer-offline-db", 1);

      request.onupgradeneeded = () => {
         request.result.createObjectStore("requests", {
            autoIncrement: true,
         });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
   });
}

async function saveRequest(request) {
   const db = await openDB();
   const tx = db.transaction("requests", "readwrite");
   const store = tx.objectStore("requests");

   const body = await request.clone().text();

   store.add({
      url: request.url,
      method: request.method,
      body,
      headers: [...request.headers],
   });
}

async function sendOfflineRequests() {
   const db = await openDB();
   const tx = db.transaction("requests", "readwrite");
   const store = tx.objectStore("requests");

   const allRequests = store.getAll();

   allRequests.onsuccess = async () => {
      for (const req of allRequests.result) {
         await fetch(req.url, {
            method: req.method,
            body: req.body,
            headers: req.headers,
         });
      }
      store.clear();
      notifyClient("synced");
   };
}

// Meddelande till React
function notifyClient(type) {
   self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
         client.postMessage(type);
      });
   });
}
