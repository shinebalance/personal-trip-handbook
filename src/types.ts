export type Locale = 'ja' | 'ko' | 'en';
export type Localized = string | { ja: string; ko?: string; en?: string };
export type Entry = {
  id: string; type: 'spot' | 'wish'; title: Localized; description: Localized;
  area: string; category: string; priority: 'candidate' | 'if-time' | 'if-found';
  initialRating?: number;
  koreanName?: string; address?: string; query?: string; mapsUrl?: string;
  website?: string; sourceUrl?: string; verifiedAt?: string; related: string[]; source: string;
  location?: { lat: number; lng: number; sourceUrl: string; checkedAt: string; kind: 'place' | 'area' };
};
export type Note = { id: string; title: Localized; body: string; source: string };
export type Day = {
  id: string; title: Localized; date: string; source: string;
  events: { time?: string; title: Localized; description?: Localized; ref?: string }[];
};
export type Content = { entries: Entry[]; notes: Note[]; days: Day[] };
