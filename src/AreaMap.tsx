import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Expand, LoaderCircle, MapPin, Navigation, RotateCcw } from 'lucide-react';
import { createNumberPin, loadGoogleMaps } from './googleMaps';
import { dictionaries, text } from './i18n';
import type { Entry, Locale } from './types';

const copy = {
  ja: {
    title: '地図で、次の寄り道を。', hint: '番号を選ぶと一覧と地図が連動。同じ建物のピンは押すたび店が切り替わります。',
    pinned: '件をピン表示', pending: '位置・支店の確認待ち', pendingHint: '位置が未登録の候補は、ピンを表示していません。',
    fit: 'すべてのピンを見る', loading: '地図を読み込んでいます…',
    noKey: 'エリア地図は準備中です', noKeyHint: '各スポットの地図リンクはそのまま使えます。',
    failed: '地図を読み込めませんでした', failedHint: '接続や地図の設定をご確認ください。スポットの地図リンクからも場所を確認できます。',
    retry: '再読み込み', noPins: 'この条件では、位置が登録されたスポットがありません。',
    select: '気になる番号を選んでみよう', areaPoint: 'エリアの代表位置', source: '位置の出典',
  },
  ko: {
    title: '지도에서 다음 목적지를 찾아요.', hint: '번호를 선택하면 목록과 지도가 함께 움직여요. 같은 건물의 핀은 누를 때마다 가게가 바뀝니다.',
    pinned: '개 장소 표시', pending: '위치 · 지점 확인 중', pendingHint: '위치가 등록되지 않은 장소는 지도에 표시하지 않아요.',
    fit: '모든 핀 보기', loading: '지도를 불러오는 중…',
    noKey: '동네 지도를 준비 중이에요', noKeyHint: '각 장소의 지도 링크는 이용할 수 있어요.',
    failed: '지도를 불러오지 못했어요', failedHint: '연결과 지도 설정을 확인해 주세요. 각 장소의 지도 링크도 이용할 수 있어요.',
    retry: '다시 불러오기', noPins: '이 조건에는 위치가 등록된 장소가 없어요.',
    select: '관심 있는 번호를 선택해 보세요', areaPoint: '지역의 대표 위치', source: '위치 출처',
  },
  en: {
    title: 'Find your next little detour.', hint: 'Choose a number to connect the list and map. Tap a shared pin again to see another shop in the building.',
    pinned: 'places pinned', pending: 'Location or branch to confirm', pendingHint: 'Places without a saved location are not pinned.',
    fit: 'Show all pins', loading: 'Loading the map…',
    noKey: 'The neighborhood map is getting ready', noKeyHint: 'Individual map links are still available.',
    failed: 'The map could not be loaded', failedHint: 'Check the connection and map settings. You can still use each place’s map link.',
    retry: 'Reload', noPins: 'No places with saved locations match these filters.',
    select: 'Choose a number that catches your eye', areaPoint: 'Representative area location', source: 'Location source',
  },
};

type Props = { entries: Entry[]; locale: Locale; onOpen: (entry: Entry) => void; mapUrl: (entry: Entry) => string };
type Pin = ReturnType<typeof createNumberPin>;
const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY?.trim();

export default function AreaMap({ entries, locale, onOpen, mapUrl }: Props) {
  const c = copy[locale];
  const t = dictionaries[locale];
  // Stable inputs avoid re-creating map instances when the enclosing component re-renders.
  const entrySignature = JSON.stringify(entries);
  const located = useMemo(() => entries.filter(entry => entry.location), [entrySignature]);
  const groups = useMemo(() => {
    const byPosition = new Map<string, { entries: Entry[]; number: number }>();
    located.forEach((entry, index) => {
      const position = `${entry.location!.lat},${entry.location!.lng}`;
      const group = byPosition.get(position);
      if (group) group.entries.push(entry);
      else byPosition.set(position, { entries: [entry], number: index + 1 });
    });
    return byPosition;
  }, [located]);
  const unlocated = entries.filter(entry => !entry.location);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const active = located.find(entry => entry.id === activeId);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(key ? 'loading' : 'error');
  const [attempt, setAttempt] = useState(0);
  const canvas = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapsRef = useRef<typeof google.maps | null>(null);
  const pins = useRef<Map<string, Pin>>(new Map());
  const rows = useRef<Map<string, HTMLButtonElement>>(new Map());
  const list = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  function selectFromList(id: string) {
    activeIdRef.current = id;
    setActiveId(id);
    if (window.matchMedia('(max-width: 700px)').matches) {
      panel.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }

  function fitAll() {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps || located.length === 0) return;
    if (located.length === 1) {
      map.setCenter(located[0].location!);
      map.setZoom(16);
    } else {
      const bounds = new maps.LatLngBounds();
      located.forEach(entry => bounds.extend(entry.location!));
      map.fitBounds(bounds, 65);
    }
  }

  useEffect(() => {
    if (!key || !canvas.current || located.length === 0) return;
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    setStatus('loading');
    const failed = () => { if (!cancelled) setStatus('error'); };
    window.addEventListener('seoul-maps-auth-error', failed);
    loadGoogleMaps(key).then(maps => {
      if (cancelled || !canvas.current) return;
      mapsRef.current = maps;
      mapRef.current = new maps.Map(canvas.current, {
        center: located[0].location!, zoom: 13, maxZoom: 19,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: true,
        clickableIcons: false, gestureHandling: 'cooperative',
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
      });
      setStatus('ready');
      observer = new ResizeObserver(() => {
        if (mapRef.current) maps.event.trigger(mapRef.current, 'resize');
      });
      observer.observe(canvas.current);
    }).catch(failed);
    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener('seoul-maps-auth-error', failed);
      pins.current.forEach(pin => pin.setMap(null));
      pins.current.clear();
      if (mapRef.current && mapsRef.current) mapsRef.current.event.clearInstanceListeners(mapRef.current);
      mapRef.current = null;
    };
    // The map survives filter and language changes. It is created only when a map can be shown.
  }, [attempt, located.length > 0]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (status !== 'ready' || !map || !maps) return;
    pins.current.forEach(pin => pin.setMap(null));
    pins.current.clear();
    groups.forEach((group, position) => {
      const entry = group.entries[0];
      pins.current.set(position, createNumberPin(maps, map, entry.location!, group.number, group.entries.map(item => text(item.title, locale)).join(' / '), () => {
        const currentIndex = group.entries.findIndex(item => item.id === activeIdRef.current);
        const next = group.entries[(currentIndex + 1) % group.entries.length];
        activeIdRef.current = next.id;
        setActiveId(next.id);
        const row = rows.current.get(next.id);
        const container = list.current;
        if (row && container) container.scrollTo({
          top: row.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 10,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        });
      }, group.entries.length));
    });
    fitAll();
    return () => { pins.current.forEach(pin => pin.setMap(null)); pins.current.clear(); };
  }, [status, located, groups, locale]);

  useEffect(() => {
    const activePosition = active?.location ? `${active.location.lat},${active.location.lng}` : null;
    pins.current.forEach((pin, position) => pin.setSelected(position === activePosition));
    if (active?.location && mapRef.current) mapRef.current.panTo(active.location);
  }, [active, status, located, locale]);

  return <section className="area-map" aria-label={c.title}>
    <div className="area-map-heading"><div><h3>{c.title}</h3><p>{c.hint}</p></div><span className="pin-count"><MapPin size={16} />{located.length} {c.pinned}</span></div>
    <div className="area-map-layout">
      <div className="map-results" ref={list}>
        {located.map((entry, index) => <article className={`map-result ${active?.id === entry.id ? 'active' : ''}`} key={entry.id}>
          <button className="map-result-select" ref={element => { if (element) rows.current.set(entry.id, element); else rows.current.delete(entry.id); }} onClick={() => selectFromList(entry.id)} aria-pressed={active?.id === entry.id}>
            <span className="map-row-number">{String(index + 1).padStart(2, '0')}</span><span className="map-result-text"><small>{t.areas[entry.area] || entry.area} · {t.categories[entry.category] || entry.category}</small><strong>{text(entry.title, locale)}</strong><span lang={locale === 'ko' ? 'en' : 'ko'}>{locale === 'ko' ? text(entry.title, 'en') : entry.koreanName}</span></span><Navigation size={16} />
          </button>
          <div className="map-result-actions"><button onClick={() => onOpen(entry)}>{t.details}<ArrowUpRight size={14} /></button><a href={mapUrl(entry)} target="_blank" rel="noreferrer">{t.map}<ArrowUpRight size={14} /></a></div>
        </article>)}
        {unlocated.length > 0 && <div className="unlocated-spots"><h4>{c.pending} · {unlocated.length}</h4><p>{c.pendingHint}</p>{unlocated.map(entry => <button key={entry.id} onClick={() => onOpen(entry)}>{text(entry.title, locale)}<ArrowUpRight size={14} /></button>)}</div>}
      </div>
      <div className="area-map-panel" ref={panel}>
        <div className="area-map-toolbar"><span>{located.length} {c.pinned}</span><button onClick={fitAll} disabled={status !== 'ready' || !located.length}><Expand size={15} />{c.fit}</button></div>
        <div className="map-stage">
          <div ref={canvas} className="google-area-canvas" role="region" aria-label={c.title} />
          {(status !== 'ready' || located.length === 0) && <div className="map-state" role="status">{status === 'loading' && key && located.length > 0 ? <><LoaderCircle className="spin" size={29} /><strong>{c.loading}</strong></> : <><MapPin size={32} strokeWidth={1.4} /><strong>{located.length === 0 ? c.noPins : !key ? c.noKey : c.failed}</strong><p>{located.length === 0 ? c.pendingHint : !key ? c.noKeyHint : c.failedHint}</p>{key && located.length > 0 && <button className="raised-button" onClick={() => setAttempt(value => value + 1)}><RotateCcw size={15} />{c.retry}</button>}</>}</div>}
        </div>
        <div className="map-selected" aria-live="polite">{active ? <><div><span className="eyebrow">{t.areas[active.area] || active.area}{active.location?.kind === 'area' ? ` · ${c.areaPoint}` : ''}</span><h4>{text(active.title, locale)}</h4><p>{text(active.description, locale)}</p><a className="location-source" href={active.location?.sourceUrl} target="_blank" rel="noreferrer">{c.source}<ArrowUpRight size={12} /></a></div><button className="raised-button" onClick={() => onOpen(active)}>{t.details}<ArrowUpRight size={16} /></button></> : <p><MapPin size={18} />{c.select}</p>}</div>
        <p className="map-data-credit">Location data includes <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>.</p>
      </div>
    </div>
  </section>;
}
