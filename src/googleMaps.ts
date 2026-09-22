/// <reference types="google.maps" />

let pending: Promise<typeof google.maps> | undefined;
let authFailed = false;
type MapsWindow = Window & { google?: typeof google; seoulMapsReady?: () => void; gm_authFailure?: () => void };

/** One SDK load per page. UI labels are translated by React; the base map uses Korean local names. */
export function loadGoogleMaps(key: string): Promise<typeof google.maps> {
  if (authFailed) return Promise.reject(new Error('Google Maps authentication failed'));
  const scope = window as MapsWindow;
  if (scope.google?.maps.Map) return Promise.resolve(scope.google.maps);
  if (pending) return pending;
  pending = new Promise<typeof google.maps>((resolve, reject) => {
    const script = document.createElement('script');
    let settled = false;
    const timer = window.setTimeout(() => fail(), 20000);
    function fail() {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.remove();
      delete scope.seoulMapsReady;
      reject(new Error('Google Maps could not be loaded'));
    }
    const previousAuthFailure = scope.gm_authFailure;
    scope.gm_authFailure = () => {
      authFailed = true;
      window.dispatchEvent(new Event('seoul-maps-auth-error'));
      fail();
      previousAuthFailure?.();
    };
    scope.seoulMapsReady = () => {
      if (settled) return;
      if (!scope.google?.maps.Map) { fail(); return; }
      settled = true;
      clearTimeout(timer);
      delete scope.seoulMapsReady;
      resolve(scope.google.maps);
    };
    script.src = `https://maps.googleapis.com/maps/api/js?${new URLSearchParams({ key, callback: 'seoulMapsReady', loading: 'async', v: 'quarterly', language: 'ko', region: 'KR' })}`;
    script.async = true;
    script.onerror = fail;
    document.head.appendChild(script);
  }).catch(error => { pending = undefined; throw error; });
  return pending;
}

export function createNumberPin(maps: typeof google.maps, map: google.maps.Map, position: google.maps.LatLngLiteral, number: number, label: string, onSelect: () => void) {
  class NumberPin extends maps.OverlayView {
    button = document.createElement('button');
    constructor() {
      super();
      this.button.type = 'button';
      this.button.className = 'number-pin';
      this.button.textContent = String(number).padStart(2, '0');
      this.button.title = label;
      this.button.setAttribute('aria-label', `${number}. ${label}`);
      this.button.setAttribute('aria-pressed', 'false');
      this.button.addEventListener('click', onSelect);
      maps.OverlayView.preventMapHitsAndGesturesFrom(this.button);
      this.setMap(map);
    }
    onAdd() { this.getPanes()?.overlayMouseTarget.appendChild(this.button); }
    draw() {
      const point = this.getProjection().fromLatLngToDivPixel(new maps.LatLng(position));
      if (!point) return;
      this.button.style.left = `${point.x}px`;
      this.button.style.top = `${point.y}px`;
    }
    setSelected(selected: boolean) {
      this.button.classList.toggle('selected', selected);
      this.button.setAttribute('aria-pressed', String(selected));
      this.button.style.zIndex = selected ? '2' : '1';
    }
    onRemove() { this.button.remove(); this.button.removeEventListener('click', onSelect); }
  }
  return new NumberPin();
}
