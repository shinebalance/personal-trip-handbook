import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Bookmark, CalendarDays, Check, ChevronDown, Coffee, Copy, ExternalLink, Footprints, Globe2, MapPin, Music2, NotebookPen, Search, ShoppingBag, SlidersHorizontal, Utensils, X, Cookie, Cpu, Gamepad2, PenTool, Map as MapIcon, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import contentJson from './generated/content.json';
import { dictionaries, text } from './i18n';
import type { Content, Entry, Locale } from './types';
import AreaMap from './AreaMap';

const content = contentJson as Content;
type View = 'spots' | 'wishes' | 'itinerary' | 'notes';
const viewIcons = { spots: MapPin, wishes: Coffee, itinerary: CalendarDays, notes: NotebookPen };
const categoryIcons: Record<string, typeof BookOpen> = { books: BookOpen, anime: Gamepad2, music: Music2, design: PenTool, electronics: Cpu, shopping: ShoppingBag, walk: Footprints, cafe: Coffee, meal: Utensils, sweet: Cookie };
const validLocales = ['ja', 'ko', 'en'];
const mapKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY?.trim();
function stored<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
function save(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Preferences are optional in restricted browsers. */ } }
function currentLocale(): Locale {
  const requested = new URLSearchParams(location.search).get('lang') || stored('seoul-language', 'ja');
  return validLocales.includes(requested) ? requested as Locale : 'ja';
}
const queryFor = (entry: Entry) => entry.query || [entry.koreanName || text(entry.title, 'en'), entry.address || ['서울', !['anywhere', 'unconfirmed'].includes(entry.area) ? dictionaries.ko.areas[entry.area] || entry.area : ''].filter(Boolean).join(' ')].join(' ');
const mapUrl = (entry: Entry) => entry.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryFor(entry))}`;
const mapProvider = (entry: Entry) => entry.mapsUrl?.startsWith('https://map.naver.com/') ? 'NAVER Map' : 'Google Maps';
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  return { view: (parts[0] || 'spots') as View, id: parts[1] || '' };
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(currentLocale);
  const [page, setPage] = useState(route);
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('all');
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');
  const [onlyChecked, setOnlyChecked] = useState(false);
  const [layout, setLayout] = useState<'cards' | 'map'>('cards');
  const [checked, setChecked] = useState<string[]>(() => { const value = stored<unknown>('seoul-checked', []); return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []; });
  const [toast, setToast] = useState('');
  const t = dictionaries[locale];
  const selected = content.entries.find(entry => entry.id === page.id);
  const isList = page.view === 'spots' || page.view === 'wishes';
  const previousFocus = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const changed = () => setPage(route());
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  useEffect(() => { document.documentElement.lang = locale; save('seoul-language', locale); }, [locale]);
  useEffect(() => { save('seoul-checked', checked); }, [checked]);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer); } }, [toast]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !selected || !isList) return;
    previousFocus.current = document.activeElement as HTMLElement;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = ''; previousFocus.current?.focus(); };
  }, [selected, isList]);

  function changeLocale(value: Locale) {
    setLocale(value);
    const url = new URL(location.href); url.searchParams.set('lang', value); history.replaceState(null, '', url);
  }
  function reset() { setSearch(''); setArea('all'); setCategory('all'); setPriority('all'); setOnlyChecked(false); }
  function go(view: View) { reset(); location.hash = `/${view}`; window.scrollTo({ top: 0 }); }
  function openEntry(entry: Entry) { const view = entry.type === 'wish' ? 'wishes' : 'spots'; if (view !== page.view) reset(); location.hash = `/${view}/${entry.id}`; }
  function closeDetail() { location.hash = `/${page.view}`; }
  function toggle(id: string) { setChecked(value => value.includes(id) ? value.filter(item => item !== id) : [...value, id]); }
  async function copy(value: string) { try { await navigator.clipboard.writeText(value); setToast(t.copied); } catch { setToast(t.copyFailed); } }
  async function share() {
    if (navigator.share) { try { await navigator.share({ title: selected ? text(selected.title, locale) : 'Seoul Notes', url: location.href }); return; } catch (error) { if ((error as Error).name === 'AbortError') return; } }
    await copy(location.href);
  }
  const entries = content.entries.filter(entry => page.view === 'wishes' ? entry.type === 'wish' || entry.category === 'cafe' : entry.type === 'spot');
  const areas = [...new Set(entries.map(entry => entry.area))];
  const categories = [...new Set(entries.map(entry => entry.category))];
  const filtered = entries.filter(entry =>
    (area === 'all' || entry.area === area) && (category === 'all' || entry.category === category) &&
    (priority === 'all' || entry.priority === priority) && (!onlyChecked || checked.includes(entry.id)) &&
    [JSON.stringify(entry.title), JSON.stringify(entry.description), entry.koreanName, entry.address,
      ...Object.values(dictionaries).map(d => d.areas[entry.area]), ...Object.values(dictionaries).map(d => d.categories[entry.category])]
      .join(' ').normalize('NFKC').toLocaleLowerCase().includes(search.trim().normalize('NFKC').toLocaleLowerCase()));

  const matchingNotes = content.notes.filter(note => [text(note.title, locale), note.body].join(' ').normalize('NFKC').toLocaleLowerCase().includes(search.trim().normalize('NFKC').toLocaleLowerCase()));

  return <>
    <a href="#main" className="skip-link" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus(); }}>{t.details}</a>
    <header className="site-header shell">
      <a className="brand" href="#/spots" onClick={reset} aria-label="Seoul Notes"><span className="brand-icon"><BookOpen size={23} strokeWidth={1.6} /></span><span><strong>Seoul notes<span>.</span></strong><small>{t.subtitle}</small></span></a>
      <div className="language-switch" role="group" aria-label={t.language}><Globe2 size={16} />{(['ja', 'ko', 'en'] as Locale[]).map(lang => <button key={lang} lang={lang} className={locale === lang ? 'active' : ''} aria-pressed={locale === lang} onClick={() => changeLocale(lang)}>{({ ja: '日本語', ko: '한국어', en: 'EN' })[lang]}</button>)}</div>
    </header>
    <main id="main" className="shell" tabIndex={-1}>
      {page.view === 'spots' && <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="small-rule" /> SEOUL, SOUTH KOREA <span className="tiny-star">✳</span></div><h1>{t.heroTitle}</h1><p>{t.heroDescription}</p><a className="hero-link" href="#places" onClick={event => { event.preventDefault(); document.getElementById('places')?.scrollIntoView({ behavior: 'smooth' }); }}>{t.placesLabel}<ArrowDown size={16} /></a></div>
        <div className="postcard"><img src={`${import.meta.env.BASE_URL}images/seoul-at-dusk.jpg`} alt={t.photoAlt} width="1600" height="727" /><div className="postcard-caption"><span>서울에서,</span><span>A LITTLE SEOUL IN MY POCKET</span></div><span className="postcard-stamp">SEOUL<br /><b>서울</b></span></div>
      </section>}
      <nav className="main-nav" aria-label={t.subtitle}>{(Object.keys(viewIcons) as View[]).map(view => { const Icon = viewIcons[view]; return <button key={view} className={page.view === view ? 'active' : ''} onClick={() => go(view)} aria-current={page.view === view ? 'page' : undefined}><Icon size={18} strokeWidth={1.8} /><span>{t[view]}</span>{view === 'spots' && <small>{content.entries.filter(e => e.type === 'spot').length}</small>}</button>; })}</nav>
      {isList && <section id="places" className="places-section">
        <div className="section-heading"><div><span className="eyebrow">{page.view === 'spots' ? 'MY PLACES' : 'LITTLE WISH LIST'}</span><h2>{page.view === 'spots' ? t.listTitle : t.wishesTitle}</h2><p>{page.view === 'spots' ? t.listSubtitle : t.wishesSubtitle}</p></div><div className="result-counter" aria-live="polite"><strong>{String(filtered.length).padStart(2, '0')}</strong><span>{t.results}</span></div></div>
        <div className="filter-panel">
          <div className="filter-top"><label className="search-box"><Search size={20} /><input type="search" placeholder={t.search} value={search} onChange={event => setSearch(event.target.value)} aria-label={t.search} /></label><label className="select-box"><MapPin size={17} /><select value={area} onChange={event => setArea(event.target.value)} aria-label={t.allAreas}><option value="all">{t.allAreas}</option>{areas.map(a => <option value={a} key={a}>{t.areas[a] || a}</option>)}</select><ChevronDown size={15} /></label><label className="select-box priority-select"><SlidersHorizontal size={16} /><select value={priority} onChange={event => setPriority(event.target.value)} aria-label={t.allPriorities}><option value="all">{t.allPriorities}</option>{(['candidate', 'if-time', 'if-found'] as const).map(p => <option value={p} key={p}>{t[p]}</option>)}</select><ChevronDown size={15} /></label></div>
          <div className="filter-bottom"><div className="category-list" role="group" aria-label={t.allCategories}>{['all', ...categories].map(cat => <button aria-pressed={category === cat} className={category === cat ? 'active' : ''} key={cat} onClick={() => setCategory(cat)}>{cat === 'all' ? t.allCategories : t.categories[cat] || cat}</button>)}</div><label className="checked-filter"><input type="checkbox" checked={onlyChecked} onChange={event => setOnlyChecked(event.target.checked)} /><span>{t.showCompleted}</span></label></div>
        </div>
        {page.view === 'spots' && <div className="view-switch" role="group" aria-label={t.displayMode}><button aria-pressed={layout === 'cards'} onClick={() => setLayout('cards')}><BookOpen size={17} />{t.cardView}</button><button aria-pressed={layout === 'map'} onClick={() => setLayout('map')}><MapIcon size={17} />{t.areaMapView}</button></div>}
        {page.view === 'spots' && layout === 'map' ? <AreaMap entries={filtered} locale={locale} onOpen={openEntry} mapUrl={mapUrl} /> : <div className="cards-grid">{filtered.map((entry, index) => { const Icon = categoryIcons[entry.category] || Bookmark; const done = checked.includes(entry.id); return <article className={`place-card tone-${entry.category} ${done ? 'is-checked' : ''}`} key={entry.id}>
          <div className="card-top"><span className="category-icon"><Icon size={25} strokeWidth={1.5} /></span><span className="card-category">{t.categories[entry.category] || entry.category}</span><button className={`check-button ${done ? 'checked' : ''}`} aria-label={`${done ? t.completed : t.check}: ${text(entry.title, locale)}`} aria-pressed={done} onClick={() => toggle(entry.id)}>{done ? <Check size={18} /> : <Bookmark size={18} strokeWidth={1.5} />}</button></div>
          <div className="card-area"><MapPin size={12} /><span>{t.areas[entry.area] || entry.area}</span><span className="card-index">{String(index + 1).padStart(2, '0')}</span></div>
          <button className="card-title" onClick={() => openEntry(entry)}><h3>{text(entry.title, locale)}</h3></button><p className="korean-name" lang="ko">{locale === 'ko' ? text(entry.title, 'en') : entry.koreanName}</p><p className="card-description">{text(entry.description, locale)}</p>
          <div className="card-footer"><span className={`priority ${entry.priority}`}><span />{t[entry.priority]}</span><button onClick={() => openEntry(entry)} aria-label={`${t.details}: ${text(entry.title, locale)}`}>{t.details}<ArrowUpRight size={15} /></button>{entry.type === 'spot' && <a className="map-mini" href={mapUrl(entry)} target="_blank" rel="noreferrer" aria-label={`${entry.address ? t.map : t.mapSearch}: ${text(entry.title, locale)}`}><MapIcon size={18} /></a>}</div>
        </article>; })}</div>}
        {filtered.length === 0 && <div className="empty-state"><Search size={35} strokeWidth={1.3} /><h3>{t.noResults}</h3><p>{t.noResultsHint}</p><button className="raised-button" onClick={reset}>{t.reset}<ArrowRight size={16} /></button></div>}
        <p className="local-caption"><Check size={14} />{t.localOnly}</p>
      </section>}
      {page.view === 'itinerary' && <section className="secondary-page"><div className="section-heading"><div><span className="eyebrow">DAY BY DAY</span><h1>{t.itineraryTitle}</h1><p>{t.itinerarySubtitle}</p></div></div>{content.days.length === 0 ? <div className="empty-state itinerary-empty"><span className="empty-icon"><CalendarDays size={36} strokeWidth={1.3} /></span><h2>{t.noDays}</h2><p>{t.noDaysHint}</p><button className="raised-button" onClick={() => go('spots')}>{t.browse}<ArrowRight size={17} /></button></div> : content.days.map(day => <article className="day-card" key={day.id}><div className="day-heading"><CalendarDays size={22} /><div><span>{day.date}</span><h2>{text(day.title, locale)}</h2></div></div><ol className="timeline">{day.events.map((event, i) => { const entry = content.entries.find(e => e.id === event.ref); return <li key={i}><time>{event.time || t.timeTbd}</time><div><h3>{text(event.title, locale)}</h3>{event.description && <p>{text(event.description, locale)}</p>}{entry && <button className="text-button" onClick={() => openEntry(entry)}>{text(entry.title, locale)}<ArrowUpRight size={16} /></button>}</div></li>; })}</ol></article>)}</section>}
      {page.view === 'notes' && <section className="secondary-page"><div className="section-heading"><div><span className="eyebrow">FROM MY NOTEBOOK</span><h1>{t.noteTitle}</h1><p>{t.noteSubtitle}</p></div></div><p className="note-language"><Globe2 size={16} />{t.originalHint}</p><label className="search-box note-search"><Search size={20} /><input type="search" placeholder={t.search} aria-label={t.search} value={search} onChange={event => setSearch(event.target.value)} /></label>{content.notes.length === 0 && <p>{t.noteEmpty}</p>}{content.notes.length > 0 && matchingNotes.length === 0 && <div className="empty-state"><h3>{t.noResults}</h3><button className="raised-button" onClick={reset}>{t.reset}</button></div>}{matchingNotes.map(note => <article className="note-card" key={note.id}><div className="note-heading"><NotebookPen size={21} /><h2>{text(note.title, locale)}</h2><span>{t.originalNote}</span></div><div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}<ExternalLink size={13} /></a> }}>{note.body}</ReactMarkdown></div></article>)}</section>}
      {(!Object.keys(viewIcons).includes(page.view) || (page.id && !selected)) && <section className="empty-state"><h2>{t.notFound}</h2><button className="raised-button" onClick={() => go('spots')}>{t.back}</button></section>}
    </main>
    <footer className="site-footer shell"><div><BookOpen size={17} /><span>Seoul notes.</span><span className="footer-divider" />{t.subtitle}</div><details><summary>{t.credits}</summary><p><a href="https://commons.wikimedia.org/wiki/File:Seoul_at_Dusk.jpg" target="_blank" rel="noreferrer">Seoul at Dusk — Markrosenrosen</a> / <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>. Resized; cropped for display.</p></details></footer>
    {selected && isList && <dialog ref={dialogRef} className="detail-dialog" aria-labelledby="detail-title" onCancel={event => { event.preventDefault(); closeDetail(); }} onClick={event => { if (event.target === event.currentTarget) closeDetail(); }}><div className="detail-inner"><div className="detail-top"><span className="eyebrow">{t.categories[selected.category] || selected.category} · {t.areas[selected.area] || selected.area}</span><button autoFocus className="icon-button" onClick={closeDetail} aria-label={t.close}><X size={22} /></button></div><span className={`priority ${selected.priority}`}><span />{t[selected.priority]}</span><h2 id="detail-title">{text(selected.title, locale)}</h2><p className="detail-korean" lang="ko">{locale === 'ko' ? text(selected.title, 'en') : selected.koreanName}</p><div className="detail-note"><span><NotebookPen size={16} />{t.reason}</span><div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}</a> }}>{text(selected.description, locale)}</ReactMarkdown></div></div>
      <div className="detail-actions"><button className="raised-button" onClick={() => toggle(selected.id)} aria-pressed={checked.includes(selected.id)}>{checked.includes(selected.id) ? <Check size={17} /> : <Bookmark size={17} />}{checked.includes(selected.id) ? t.completed : t.check}</button><button className="raised-button" onClick={share}><Share2 size={16} />{t.share}</button></div>
      {selected.type === 'spot' ? <><div className="address-block"><h3><MapPin size={17} />{t.address}</h3>{selected.address ? <><p className="copyable" lang="ko">{selected.address}</p><button className="text-button" onClick={() => copy(selected.address!)}><Copy size={15} />{t.copyAddress}</button></> : <p>{t.locationPending}</p>}{selected.verifiedAt && <small>{t.verified}: {selected.verifiedAt} · <a href={selected.sourceUrl} target="_blank" rel="noreferrer">{t.source}</a></small>}</div><a className="map-button" href={mapUrl(selected)} target="_blank" rel="noreferrer"><MapPin size={19} />{selected.address ? t.map : t.mapSearch}<ArrowUpRight size={18} /></a><div className="map-preview"><div className="map-preview-heading"><MapIcon size={17} /><h3>{t.mapPreview}</h3></div>{mapKey ? <><iframe key={`${selected.id}-${locale}`} title={`${t.mapPreview}: ${text(selected.title, locale)}`} width="600" height="280" loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" src={`https://www.google.com/maps/embed/v1/${selected.address ? 'place' : 'search'}?${new URLSearchParams({ key: mapKey, q: queryFor(selected), language: locale }).toString()}`} /><p className="map-status">{t.loadingMap}</p></> : <div className="map-placeholder"><MapPin size={30} strokeWidth={1.3} /><strong>{t.mapUnavailable}</strong><p>{t.mapFallback}</p><a href={mapUrl(selected)} target="_blank" rel="noreferrer">{mapProvider(selected)}<ArrowUpRight size={15} /></a></div>}</div></> : <p className="wish-location"><ShoppingBag size={17} />{t.foodLocation}</p>}
      <div className="reference-links">{selected.website && <a href={selected.website} target="_blank" rel="noreferrer"><Globe2 size={17} />{t.website}<ArrowUpRight size={16} /></a>}{selected.sourceUrl && selected.sourceUrl !== selected.website && <a href={selected.sourceUrl} target="_blank" rel="noreferrer"><BookOpen size={17} />{t.source}<ArrowUpRight size={16} /></a>}<a href={`https://www.google.com/search?q=${encodeURIComponent(queryFor(selected))}`} target="_blank" rel="noreferrer"><Search size={17} />{t.webSearch}<ArrowUpRight size={16} /></a></div>
      {selected.related.length > 0 && <section className="related"><h3>{t.related}</h3>{selected.related.map(id => { const entry = content.entries.find(e => e.id === id)!; return <button key={id} onClick={() => openEntry(entry)}>{text(entry.title, locale)}<ArrowRight size={15} /></button>; })}</section>}
    </div>{toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}</dialog>}
    {toast && !(selected && isList) && <div className="toast" role="status"><Check size={16} />{toast}</div>}
  </>;
}
