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
    const key = (request) => typeof request === 'string' ? request : request.url;
    const cache = {
        async match(request) {
            if (options.readError) throw new Error('Cache unavailable');
            return entries.get(key(request))?.clone();
        },
        async put(request, response) {
            if (options.writeError) throw new Error('Quota exceeded');
            entries.set(key(request), response.clone());
        },
        async addAll(requests) {
            for (const request of requests) {
                const url = new URL(request.url);
                assert.ok(url.href.startsWith(scope));
                const relative = url.pathname.slice(new URL(scope).pathname.length);
                let directory = root;
                for (const segment of relative.split('/')) {
                    assert.ok(fs.readdirSync(directory).includes(segment), `Missing/case mismatch: ${relative}`);
                    directory = path.join(directory, segment);
                }
                entries.set(request.url, new Response(fs.readFileSync(directory)));
            }
        },
    };
    vm.runInNewContext(source, {
        URL, Request, Response, console: { warn() {} },
        self: {
            registration: { scope }, location: new URL(scope),
            addEventListener: (name, callback) => { listeners[name] = callback; },
            skipWaiting: async () => {}, clients: { claim: async () => {} },
        },
        caches: {
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
        entries, calls,
        async install() {
            let pending;
            listeners.install({ waitUntil(value) { pending = value; } });
            await pending;
        },
        request(relative, mode = 'navigate') {
            let result;
            listeners.fetch({
                request: { url: new URL(relative, scope).href, method: 'GET', mode, headers: new Headers() },
                respondWith(value) { result = value; },
            });
            return result;
        },
    };
}

test('GitHub Pages subpath: precache exists with exact filename casing; pages and assets work offline', async () => {
    const sw = worker({ offline: true });
    await sw.install();
    for (const page of ['', 'index.html', '?source=pwa', 'detalle.html?cafe=imagen10.JPG']) {
        const response = await sw.request(page);
        assert.equal(response.status, 200);
        assert.match(await response.text(), /<!DOCTYPE html>/);
    }
    for (const url of sw.entries.keys()) {
        assert.equal((await sw.request(url, 'cors')).status, 200);
    }
    assert.equal(sw.calls.length, 0, 'Cache hits must never contact the network');
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
        for (const [url, mode] of [['', 'navigate'], ['js/app.js?v=4', 'cors']]) {
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

test('HTML script versions are precached', async () => {
    const sw = worker();
    await sw.install();
    for (const page of ['index.html', 'detalle.html']) {
        const html = fs.readFileSync(path.join(root, page), 'utf8');
        for (const match of html.matchAll(/<script src="([^"]+)"/g)) {
            assert.ok(sw.entries.has(new URL(match[1], scope).href));
        }
    }
});
