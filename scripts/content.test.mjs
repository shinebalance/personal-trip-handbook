import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadContent } from './content.mjs';

function withNotes(files, callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'trip-content-'));
  try {
    for (const [name, body] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(directory, name)), { recursive: true });
      fs.writeFileSync(path.join(directory, name), body);
    }
    callback(directory);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}
const frontmatter = (data, body = '') => `---\n${JSON.stringify(data)}\n---\n${body}`;
const spot = { type: 'spot', id: 'a-bookshop', title: { ja: '本屋', ko: '서점', en: 'Bookshop' } };

test('new nested Markdown becomes a note without any metadata; single spots use their body', () => {
  withNotes({ 'nested/idea.md': '# New idea\n- Look for records', 'shop.md': frontmatter(spot, '本を見たい') }, directory => {
    const result = loadContent(directory);
    assert.equal(result.notes.length, 1);
    assert.match(result.notes[0].body, /Look for records/);
    assert.equal(result.entries[0].description, '本を見たい');
    assert.equal(result.entries[0].priority, 'candidate');
  });
});
test('collections and dated itineraries resolve stable references', () => {
  withNotes({ 'places.md': frontmatter({ type: 'collection', entries: [spot] }), 'day.md': frontmatter({ type: 'day', id: 'day-one', title: '1日目', date: '2026-10-01', events: [{ time: '11:00', title: '本屋へ', ref: 'a-bookshop' }] }) }, directory => {
    const result = loadContent(directory);
    assert.equal(result.days[0].events[0].ref, result.entries[0].id);
  });
});
test('bad content cannot replace the live site: duplicate IDs, unknown references, accommodation, invalid URLs and dates fail with context', () => {
  const cases = [
    [{ 'first.md': frontmatter(spot), 'duplicate.md': frontmatter(spot) }, /duplicate ID/],
    [{ 'bad.md': frontmatter({ ...spot, related: ['missing'] }) }, /bad.md: unknown related/],
    [{ 'hotel.md': frontmatter({ type: 'stay', id: 'hotel', title: 'Hotel' }) }, /hotel.md: Unsupported type/],
    [{ 'url.md': frontmatter({ ...spot, website: 'javascript:alert(1)' }) }, /HTTPS URL/],
    [{ 'day.md': frontmatter({ type: 'day', id: 'day-one', title: 'day', date: '2026-02-31', events: [] }) }, /Invalid calendar date/],
    [{ 'day.md': frontmatter({ type: 'day', id: 'day-one', title: 'day', date: '2026-10-01', events: [{ title: 'Missing place', ref: 'missing' }] }) }, /unknown event reference/],
  ];
  for (const [files, pattern] of cases) withNotes(files, directory => assert.throws(() => loadContent(directory), pattern));
});
