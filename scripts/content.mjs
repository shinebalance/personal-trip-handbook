import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { z } from 'zod';

const localized = z.union([z.string().min(1), z.object({ ja: z.string().min(1), ko: z.string().optional(), en: z.string().optional() }).strict()]);
const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
const url = z.string().url().refine(value => /^https:\/\//.test(value), 'HTTPS URL required');
const entrySchema = z.object({
  id, type: z.enum(['spot', 'wish']), title: localized,
  description: z.union([z.string(), localized]).default(''),
  area: z.string().default('anywhere'), category: z.string().default('other'),
  priority: z.enum(['candidate', 'if-time', 'if-found']).default('candidate'),
  koreanName: z.string().optional(), address: z.string().optional(), query: z.string().optional(),
  mapsUrl: url.optional(), website: url.optional(), sourceUrl: url.optional(),
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  related: z.array(id).default([]),
}).strict();
const daySchema = z.object({
  type: z.literal('day'), id, title: localized,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }, 'Invalid calendar date'),
  events: z.array(z.object({ time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(), title: localized, description: localized.optional(), ref: id.optional() }).strict()),
}).strict();

function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en')).flatMap(item => {
    if (item.name.startsWith('.')) return [];
    const full = path.join(directory, item.name);
    if (item.isDirectory()) return markdownFiles(full);
    return item.isFile() && item.name.endsWith('.md') ? [full] : [];
  });
}

export function loadContent(directory) {
  const result = { entries: [], notes: [], days: [] };
  const used = new Map();
  const register = (record, source) => {
    if (used.has(record.id)) throw new Error(`${source}: duplicate ID '${record.id}' (also in ${used.get(record.id)})`);
    used.set(record.id, source);
    return { ...record, source };
  };
  for (const file of markdownFiles(directory)) {
    const source = path.relative(directory, file).replaceAll(path.sep, '/');
    try {
      const { data, content } = matter(fs.readFileSync(file, 'utf8'));
      if (data.type === 'collection') {
        const parsed = z.object({ type: z.literal('collection'), entries: z.array(entrySchema) }).strict().parse(data);
        result.entries.push(...parsed.entries.map(entry => register(entry, source)));
      } else if (['spot', 'wish'].includes(data.type)) {
        result.entries.push(register(entrySchema.parse({ ...data, description: data.description || content.trim() }), source));
      } else if (data.type === 'day') {
        result.days.push(register(daySchema.parse(data), source));
      } else if (!data.type || data.type === 'note') {
        const note = z.object({ type: z.literal('note').optional(), id: id.optional(), title: localized.optional() }).strict().parse(data);
        result.notes.push(register({ id: note.id || `note-${Buffer.from(source).toString('hex')}`, title: note.title || path.basename(file, '.md'), body: content }, source));
      } else {
        throw new Error(`Unsupported type '${data.type}'. Use spot, wish, day, collection, or note. Accommodation is outside this public handbook.`);
      }
    } catch (error) { throw new Error(`${source}: ${error.message}`); }
  }
  const entryIds = new Set(result.entries.map(entry => entry.id));
  for (const entry of result.entries) for (const ref of entry.related) {
    if (!entryIds.has(ref)) throw new Error(`${entry.source}: unknown related ID '${ref}'`);
  }
  for (const day of result.days) for (const event of day.events) {
    if (event.ref && !entryIds.has(event.ref)) throw new Error(`${day.source}: unknown event reference '${event.ref}'`);
  }
  result.days.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

export function buildContent() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const content = loadContent(path.join(root, 'mds'));
  const output = path.join(root, 'src/generated/content.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const serialized = JSON.stringify(content, null, 2) + '\n';
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== serialized) fs.writeFileSync(output, serialized);
  return content;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const data = buildContent();
  console.log(`Content: ${data.entries.length} entries, ${data.notes.length} notes, ${data.days.length} days`);
}
