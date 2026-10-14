// Incrementa la version cuando cambies los archivos de la aplicacion.
// Este archivo debe registrarse desde la pagina para poder funcionar.
const CACHE_PREFIX = `dev-coffe:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}v5`;
const APP_URL = new URL("index.html", self.registration.scope).href;
const DETAIL_URL = new URL("detalle.html", self.registration.scope).href;
const ASSETS = [
    "index.html",
    "detalle.html",
    "css/style.css?v=3",
    "js/app.js?v=3",
    "manifest.json",
    ...Array.from({ length: 9 }, (_, i) => `imagenes/imagen${i + 1}.jpg`),
    "imagenes/imagen10.JPG",
    ...[72, 96, 128, 144, 152, 192, 384, 512].map(
        (size) => `imagenes/icons/icon-${size}x${size}.png?v=5`
    ),
].map((path) => new URL(path, self.registration.scope).href);
const ASSET_URLS = new Set(ASSETS);

// Guarda tambien las fotos con carga diferida antes de habilitar el modo offline.
// Instalacion(Precarga de recursos estaticos.)
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await cache.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" })));
            await self.skipWaiting();
        })
    );
});

// Activa la nueva version sin tener que cerrar las pestañas de Live Server.
self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        const names = await caches.keys();
        await Promise.all(
            names
                .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
                .map((name) => caches.delete(name))
        );
        await self.clients.claim();
    })());
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== "GET" || url.origin !== self.location.origin ||
        request.headers.has("range")) {
        return;
    }

    // Cache-first: devuelve la copia local y solo consulta la red si no existe.
    const isAppPage = request.mode === "navigate" &&
        (url.pathname === new URL(APP_URL).pathname ||
         url.pathname === new URL(DETAIL_URL).pathname ||
         url.pathname === new URL(self.registration.scope).pathname);

    if (isAppPage) {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            const page = url.pathname === new URL(DETAIL_URL).pathname ? DETAIL_URL : APP_URL;
            const cachedResponse = await cache.match(page);

            if (cachedResponse) {
                return cachedResponse;
            }

            try {
                const response = await fetch(request);
                if (response.ok) {
                    await cache.put(page, response.clone());
                }
                return response;
            } catch {
                return Response.error();
            }
        })());
        return;
    }

    // Solo se interceptan los recursos de esta app, sin almacenar otras rutas.
    if (ASSET_URLS.has(url.href)) {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(request);

            if (cachedResponse) {
                return cachedResponse;
            }

            try {
                const response = await fetch(request);
                if (response.ok) {
                    await cache.put(request, response.clone());
                }
                return response;
            } catch {
                return Response.error();
            }
        })());
    }
});
