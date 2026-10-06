// Incrementa la version cuando cambies los archivos de la aplicacion.
// Este archivo debe registrarse desde la pagina para poder funcionar.
const CACHE_PREFIX = `dev-coffe:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}v3`;
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
        (size) => `imagenes/icons/icon-${size}x${size}.png`
    ),
].map((path) => new URL(path, self.registration.scope).href);
const ASSET_URLS = new Set(ASSETS);

// Guarda tambien las fotos con carga diferida antes de habilitar el modo offline.
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

    // La pagina intenta usar la red; sin conexion, abre la copia local.
    const isAppPage = request.mode === "navigate" &&
        (url.pathname === new URL(APP_URL).pathname ||
         url.pathname === new URL(DETAIL_URL).pathname ||
         url.pathname === new URL(self.registration.scope).pathname);

    if (isAppPage) {
        event.respondWith((async () => {
            try {
                return await fetch(request);
            } catch {
                const cache = await caches.open(CACHE_NAME);
                const page = url.pathname === new URL(DETAIL_URL).pathname ? DETAIL_URL : APP_URL;
                return (await cache.match(page)) || Response.error();
            }
        })());
        return;
    }

    // Solo se interceptan los recursos de esta app, sin almacenar otras rutas.
    if (ASSET_URLS.has(url.href)) {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            // Consulta los estilos y el código actuales; conserva una copia offline.
            if (url.pathname.endsWith("/css/style.css") || url.pathname.endsWith("/js/app.js")) {
                try {
                    const response = await fetch(new Request(request, { cache: "no-cache" }));
                    if (response.ok) {
                        await cache.put(request, response.clone());
                        return response;
                    }
                    return (await cache.match(request)) || response;
                } catch {
                    return (await cache.match(request)) || Response.error();
                }
            }
            return (await cache.match(request)) || fetch(request);
        })());
    }
});
