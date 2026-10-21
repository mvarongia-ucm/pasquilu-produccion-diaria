/* Pasquilu - produccion diaria
 * Estrategia "primero la red": siempre se intenta bajar la version nueva,
 * y solo si no hay senal se usa la copia guardada. Asi el pastelero nunca
 * se queda con un formulario viejo cuando yo publico una correccion, pero
 * igual puede trabajar en la fabrica aunque ande mal el internet.          */
var CACHE = "pasquilu-produccion-v1";
var BASICOS = ["./", "./index.html", "./manifest.webmanifest",
               "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(BASICOS).catch(function () { /* si alguno falla, seguimos */ });
  }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) {
      if (k !== CACHE) return caches.delete(k);
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;                 /* los envios nunca se cachean */
  if (req.url.indexOf("script.google.com") >= 0) return;

  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200 && res.type === "basic") {
        var copia = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copia); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match("./index.html");
      });
    })
  );
});
