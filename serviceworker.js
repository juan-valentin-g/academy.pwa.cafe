// Incrementa la version cuando cambies los archivos de la aplicacion.
// Este archivo debe registrarse desde la pagina para poder funcionar.
const CACHE_PREFIX = `dev-coffe:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}v7`;
const APP_URL = new URL("index.html", self.registration.scope).href;
const DETAIL_URL = new URL("detalle.html", self.registration.scope).href;
const SCOPE_PATH = new URL(self.registration.scope).pathname;

// Sin precarga: solo se guardan los recursos solicitados durante la navegacion.
self.addEventListener("install", (event) => {
    event.waitUntil(self.skipWaiting());
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

// Un fallo de almacenamiento no debe convertir una respuesta de red en un error.
async function cacheFirst(event, cacheKey = event.request) {
    const request = event.request;
    let cache;
    try {
        cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
            return cachedResponse;
        }
    } catch (error) {
        console.warn("No se pudo consultar la caché:", error);
    }

    const response = await fetch(request);
    if (response.ok && cache) {
        // Entrega la respuesta sin esperar a que termine la escritura en disco.
        event.waitUntil(cache.put(cacheKey, response.clone()).catch((error) => {
            console.warn("No se pudo guardar el recurso en caché:", error);
        }));
    }
    return response;
}

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== "GET" || url.origin !== self.location.origin ||
        !url.pathname.startsWith(SCOPE_PATH) ||
        request.headers.has("range")) {
        return;
    }

    // Cache-first: devuelve la copia local y solo consulta la red si no existe.
    const isAppPage = request.mode === "navigate" &&
        (url.pathname === new URL(APP_URL).pathname ||
         url.pathname === new URL(DETAIL_URL).pathname ||
         url.pathname === new URL(self.registration.scope).pathname);

    if (isAppPage) {
        const page = url.pathname === new URL(DETAIL_URL).pathname ? DETAIL_URL : APP_URL;
        // El HTML de detalle es comun; los datos de cada cafe tienen su propia URL.
        event.respondWith(cacheFirst(event, page).catch(() => new Response(
            '<!doctype html><html lang="es"><meta charset="utf-8">' +
            '<meta name="viewport" content="width=device-width,initial-scale=1">' +
            '<title>Sin conexión</title><h1>Esta página aún no está guardada</h1>' +
            '<p>Conéctate a internet para abrirla por primera vez.</p>' +
            '<a href="./index.html">Volver a la galería</a></html>',
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
        )));
        return;
    }

    // Cache dinamica para recursos de la app; no se guarda el propio worker.
    const path = url.pathname.slice(SCOPE_PATH.length);
    if (/^(css\/|js\/|imagenes\/|data\/cafes\/)/.test(path) || path === "manifest.json") {
        event.respondWith(cacheFirst(event));
    }
});
