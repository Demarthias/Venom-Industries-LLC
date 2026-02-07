self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("v2").then(cache => {
      return cache.addAll(["/", "/index.html", "/favicon.ico"]);
    })
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== "v2").map(key => caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
