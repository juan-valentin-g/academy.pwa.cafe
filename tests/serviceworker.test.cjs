const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'serviceworker.js'), 'utf8');
const scope = 'https://example.test/academy.pwa.cafe/';

function worker(options = {}) {
    const listeners = {};
    const entries = new Map();
    const calls = [];
    const writes = [];
    const deleted = [];
    let claimed = false;
    const key = (request) => typeof request === 'string' ? request : request.url;
    const cache = {
        async match(request) {
            if (options.readError) throw new Error('Cache unavailable');
            return entries.get(key(request))?.clone();
        },
        async put(request, response) {
            if (options.writeDelay) await options.writeDelay;
            if (options.writeError) throw new Error('Quota exceeded');
            entries.set(key(request), response.clone());
        },
        async addAll() { throw new Error('Preloading is forbidden'); },
    };
    vm.runInNewContext(source, {
        URL, Request, Response, console: { warn() {} },
        self: {
            registration: { scope }, location: new URL(scope),
            addEventListener: (name, callback) => { listeners[name] = callback; },
            skipWaiting: async () => {}, clients: { claim: async () => { claimed = true; } },
        },
        caches: {
            async keys() { return options.cacheNames || []; },
            async delete(name) { deleted.push(name); },
            async open() {
                if (options.openError) throw new Error('Storage denied');
                return cache;
            },
        },
        async fetch(request) {
            calls.push(key(request));
            if (options.offline) throw new Error('Offline');
            return new Response('from network', { status: options.status || 200 });
        },
    });
    return {
        entries, calls, deleted,
        get claimed() { return claimed; },
        async activate() {
            let pending;
            listeners.activate({ waitUntil(value) { pending = value; } });
            await pending;
        },
        async flush() { await Promise.all(writes); },
        async install() {
            let pending;
            listeners.install({ waitUntil(value) { pending = value; } });
            await pending;
        },
        request(relative, mode = 'navigate', overrides = {}) {
            let result;
            listeners.fetch({
                request: { url: new URL(relative, scope).href, method: 'GET', mode, headers: new Headers(), ...overrides },
                waitUntil(value) { writes.push(value); },
                respondWith(value) { result = value; },
            });
            return result;
        },
    };
}

test('install downloads nothing and succeeds offline', async () => {
    const sw = worker({ offline: true });
    await sw.install();
    assert.equal(sw.calls.length, 0);
    assert.equal(sw.entries.size, 0);
});

test('only resources used while browsing are stored and available offline', async () => {
    const options = {};
    const sw = worker(options);
    await sw.install();
    const visited = ['', 'js/app.js?v=5', 'css/style.css?v=3', 'imagenes/imagen1.jpg',
        'detalle.html?cafe=imagen1.jpg', 'data/cafes/imagen1.json'];
    for (const url of visited) {
        assert.equal((await sw.request(url)).status, 200);
    }
    await sw.flush();
    assert.equal(sw.calls.length, visited.length);
    assert.equal(sw.entries.has(scope + 'imagenes/imagen2.jpg'), false);
    assert.equal(sw.entries.has(scope + 'data/cafes/imagen2.json'), false);
    options.offline = true;
    for (const url of visited) assert.equal((await sw.request(url)).status, 200);
    assert.equal((await sw.request('index.html')).status, 200);
    assert.equal(sw.calls.length, visited.length, 'Cache hits must not use the network');
    await assert.rejects(sw.request('data/cafes/imagen2.json', 'cors'), /Offline/);
});

test('offline unvisited page returns a useful response without caching it', async () => {
    const sw = worker({ offline: true });
    const response = await sw.request('detalle.html?cafe=imagen2.jpg');
    assert.equal(response.status, 503);
    assert.match(await response.text(), /Conéctate a internet/);
    assert.equal(sw.entries.size, 0);
});

test('cache miss uses network once, then serves the stored response', async () => {
    const sw = worker();
    assert.equal(await (await sw.request('')).text(), 'from network');
    assert.equal(await (await sw.request('index.html')).text(), 'from network');
    assert.equal(sw.calls.length, 1);
});

for (const failure of ['openError', 'readError', 'writeError']) {
    test(`${failure}: storage failure does not discard a valid network response`, async () => {
        const sw = worker({ [failure]: true });
        for (const [url, mode] of [['', 'navigate'], ['js/app.js?v=5', 'cors']]) {
            const response = await sw.request(url, mode);
            assert.equal(response.status, 200);
            assert.equal(await response.text(), 'from network');
        }
    });
}

test('HTTP errors are not cached, and other sites/routes are not intercepted', async () => {
    const sw = worker({ status: 404 });
    assert.equal((await sw.request('')).status, 404);
    assert.equal(sw.entries.size, 0);
    assert.equal(sw.request('https://other.test/index.html'), undefined);
    assert.equal(sw.request('/another-project/index.html'), undefined);
});

test('response is delivered without waiting for cache writes', async () => {
    let finish;
    const writeDelay = new Promise(resolve => { finish = resolve; });
    const sw = worker({ writeDelay });
    const response = await sw.request('imagenes/imagen1.jpg', 'cors');
    assert.equal(await response.text(), 'from network');
    assert.equal(sw.entries.size, 0);
    finish();
    await sw.flush();
    assert.equal(sw.entries.size, 1);
});

test('activation removes old app cache without touching other projects', async () => {
    const old = 'dev-coffe:' + scope + ':v6';
    const current = 'dev-coffe:' + scope + ':v7';
    const sw = worker({ cacheNames: [old, current, 'other-project-cache'] });
    await sw.activate();
    assert.deepEqual(sw.deleted, [old]);
    assert.equal(sw.claimed, true);
    assert.equal(sw.calls.length, 0);
});

test('POST, range requests and the service worker itself are not intercepted', () => {
    const sw = worker();
    assert.equal(sw.request('serviceworker.js', 'cors'), undefined);
    assert.equal(sw.request('data/cafes/imagen1.json', 'cors', { method: 'POST' }), undefined);
    assert.equal(sw.request('imagenes/imagen1.jpg', 'cors', { headers: new Headers({ Range: 'bytes=0-100' }) }), undefined);
});
