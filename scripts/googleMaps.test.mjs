import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync(new URL('../src/googleMaps.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
let moduleId = 0;
async function setup(t) {
  const previous = { window: globalThis.window, document: globalThis.document };
  class Element extends EventTarget {
    style = {};
    attributes = {};
    classes = new Set();
    children = [];
    classList = { toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name) };
    setAttribute(name, value) { this.attributes[name] = value; }
    appendChild(child) { this.children.push(child); child.parent = this; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
  }
  const timers = [];
  const window = Object.assign(new EventTarget(), { setTimeout: (...args) => { const timer = setTimeout(...args); timers.push(timer); return timer; } });
  const document = { head: new Element(), createElement: () => new Element() };
  Object.assign(globalThis, { window, document });
  t.after(() => { timers.forEach(clearTimeout); Object.assign(globalThis, previous); });
  const api = await import(`data:text/javascript;base64,${Buffer.from(`${code}\n// ${moduleId++}`).toString('base64')}`);
  return { ...api, window, document, Element };
}

test('SDK requests share one script, preserve Korean map labels, and retry after network failure', async t => {
  const { loadGoogleMaps, window, document } = await setup(t);
  const first = loadGoogleMaps('test-key');
  assert.equal(loadGoogleMaps('test-key'), first);
  assert.equal(document.head.children.length, 1);
  assert.equal(new URL(document.head.children[0].src).searchParams.get('language'), 'ko');
  const rejected = assert.rejects(first, /could not be loaded/);
  document.head.children[0].onerror();
  await rejected;
  assert.equal(document.head.children.length, 0);
  const retry = loadGoogleMaps('test-key');
  const maps = { Map: class {} };
  window.google = { maps };
  window.seoulMapsReady();
  assert.equal(await retry, maps);
  assert.equal(await loadGoogleMaps('test-key'), maps);
  assert.equal(document.head.children.length, 1);
});

test('late Google authorization errors notify the page and reject further loads', async t => {
  const { loadGoogleMaps, window } = await setup(t);
  let notified = 0;
  window.addEventListener('seoul-maps-auth-error', () => notified++);
  const request = loadGoogleMaps('test-key');
  window.google = { maps: { Map: class {} } };
  window.seoulMapsReady();
  await request;
  window.gm_authFailure();
  assert.equal(notified, 1);
  await assert.rejects(loadGoogleMaps('test-key'), /authentication failed/);
});

test('numbered pins project actual coordinates, select accessibly, and remove all interaction on cleanup', async t => {
  const { createNumberPin, Element } = await setup(t);
  const pane = new Element();
  let projected;
  class OverlayView {
    static preventMapHitsAndGesturesFrom() {}
    setMap(map) { if (map) { this.onAdd(); this.draw(); } else this.onRemove(); }
    getPanes() { return { overlayMouseTarget: pane }; }
    getProjection() { return { fromLatLngToDivPixel: point => { projected = point; return { x: 123, y: 456 }; } }; }
  }
  class LatLng { constructor(position) { Object.assign(this, position); } }
  let clicks = 0;
  const position = { lat: 37.5580543, lng: 126.9260821 };
  const pin = createNumberPin({ OverlayView, LatLng }, {}, position, 3, 'Animate 弘大', () => clicks++, 3);
  const button = pane.children[0];
  assert.deepEqual({ ...projected }, position);
  assert.equal(button.textContent, '03');
  assert.equal(button.attributes['aria-label'], '3. Animate 弘大');
  assert.equal(button.attributes['data-count'], '3');
  assert.equal(button.style.left, '123px');
  assert.equal(button.style.top, '456px');
  button.dispatchEvent(new Event('click'));
  assert.equal(clicks, 1);
  pin.setSelected(true);
  assert.equal(button.attributes['aria-pressed'], 'true');
  assert.ok(button.classes.has('selected'));
  pin.setMap(null);
  assert.equal(pane.children.length, 0);
  button.dispatchEvent(new Event('click'));
  assert.equal(clicks, 1);
});
