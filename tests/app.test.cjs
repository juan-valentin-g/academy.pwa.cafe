const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');

class Element {
    children = [];
    dataset = {};
    events = {};
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute() {}
    addEventListener(name, callback) { this.events[name] = callback; }
    querySelectorAll() {
        return this.children.flatMap(card => card.children.filter(child => child.dataset.src));
    }
}

function page({ detail = false, offline = false, serviceWorker = true } = {}) {
    const container = new Element();
    const requests = [];
    const observed = [];
    const events = {};
    let intersect;
    let reloads = 0;
    class Observer {
        constructor(callback) { intersect = callback; }
        observe(element) { observed.push(element); }
        unobserve(element) { observed.splice(observed.indexOf(element), 1); }
    }
    const context = vm.createContext({
        console, URLSearchParams,
        document: {
            querySelector: selector => selector === (detail ? '#detalle' : '#galeria') ? container : null,
            createElement: () => new Element(),
        },
        window: {
            IntersectionObserver: Observer,
            location: { search: '?cafe=imagen10.JPG', reload: () => { reloads++; } },
        },
        navigator: serviceWorker ? {
            serviceWorker: {
                controller: null,
                addEventListener: (name, callback) => { events[name] = callback; },
                register: async () => {},
            },
        } : {},
        IntersectionObserver: Observer,
        async fetch(url) {
            requests.push(url);
            if (offline) throw new Error('Offline');
            return { ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(root, url), 'utf8')) };
        },
    });
    vm.runInContext(source, context);
    return {
        container, requests, observed, events,
        get reloads() { return reloads; },
        reveal(target) { intersect([{ target, isIntersecting: true }]); },
        async settle() { await new Promise(resolve => setImmediate(resolve)); },
    };
}

test('gallery requests no detail data and defers images beyond the first row', () => {
    const app = page();
    assert.equal(app.container.children.length, 10);
    assert.equal(app.requests.length, 0);
    const images = app.container.children.map(card => card.children[0]);
    assert.equal(images.filter(image => image.src).length, 3);
    assert.equal(app.observed.length, 7);
    app.reveal(images[3]);
    assert.equal(images[3].src, 'imagenes/imagen4.jpg');
    assert.equal(images[4].src, undefined);
    assert.equal(app.observed.length, 6);
});

test('opening a detail downloads only that cafe and displays its original information', async () => {
    const app = page({ detail: true });
    await app.settle();
    assert.deepEqual(app.requests, ['data/cafes/imagen10.json']);
    assert.equal(app.container.children[0].src, 'imagenes/imagen10.JPG');
    const content = app.container.children[1];
    assert.equal(content.children[0].textContent, 'Una taza de café negro');
    assert.equal(content.children.length, 3);
});

test('unavailable detail displays an explanation and allows retrying', async () => {
    const app = page({ detail: true, offline: true });
    await app.settle();
    const content = app.container.children[1];
    assert.equal(content.children[0].textContent, 'Información no disponible');
    await content.children[2].events.click();
    assert.equal(app.requests.length, 2);
    assert.equal(app.container.children.length, 2);
});

test('site still renders online without service worker support', async () => {
    const app = page({ detail: true, serviceWorker: false });
    await app.settle();
    assert.equal(app.container.children[1].children[0].textContent, 'Una taza de café negro');
});

test('taking control reloads the initial page once so its requests can be cached', () => {
    const app = page();
    app.events.controllerchange();
    app.events.controllerchange();
    assert.equal(app.reloads, 1);
});
