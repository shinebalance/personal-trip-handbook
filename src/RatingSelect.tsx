import { ChevronDown } from 'lucide-react';
import { dictionaries, text } from './i18n';
import type { Entry, Locale } from './types';

type Props = { entry: Entry; locale: Locale; value: number; onChange: (id: string, value: number) => void };

export default function RatingSelect({ entry, locale, value, onChange }: Props) {
  const t = dictionaries[locale];
  return <label className={`rating-select ${value ? 'has-rating' : ''}`}>
    <select value={value} onChange={event => onChange(entry.id, Number(event.target.value))} aria-label={`${t.myPriority}: ${text(entry.title, locale)}`}>
      {t.ratingOptions.map((label, rating) => <option key={rating} value={rating}>{label}</option>)}
    </select>
    <ChevronDown size={14} aria-hidden="true" />
  </label>;
}
