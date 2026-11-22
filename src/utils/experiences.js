import { Mountain, Trees, Landmark, UtensilsCrossed, PartyPopper, Sparkles } from 'lucide-react';

export const CATEGORY_ICONS = {
  adventure: Mountain,
  nature: Trees,
  culture: Landmark,
  food: UtensilsCrossed,
  events: PartyPopper,
  wellness: Sparkles,
};

// Gradient used when an experience has no photo yet (and behind photos while
// they load) — one per category, so the shelf still reads at a glance.
export const CATEGORY_TONES = {
  adventure: 'from-emerald-700 to-emerald-400',
  nature: 'from-amber-700 to-amber-400',
  culture: 'from-violet-700 to-violet-400',
  food: 'from-orange-700 to-orange-400',
  events: 'from-rose-700 to-rose-400',
  wellness: 'from-sky-700 to-sky-400',
};

export const naira = (v) => `₦${Math.round(Number(v || 0)).toLocaleString('en-NG')}`;

export function formatDuration(minutes) {
  const m = Number(minutes || 0);
  if (!m) return '';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h >= 8 && !r) return 'Full day';
  return r ? `${h} hr ${r} min` : `${h} hr${h !== 1 ? 's' : ''}`;
}

/** "Fri 11 Dec" from an ISO date, without timezone drift. */
export function prettyDay(iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', opts);
}

export const slotLabel = (slot) =>
  [prettyDay(slot.date), slot.start_time].filter(Boolean).join(' · ');

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export function runDaysLabel(days = []) {
  const set = [...new Set(days)].sort();
  if (set.length === 7) return 'Daily';
  if (set.join() === '1,2,3,4,5') return 'Weekdays';
  if (set.join() === '6,7') return 'Weekends';
  return set.map(d => WEEKDAYS[d - 1]).join(', ');
}

/** Snapshot stored in the trip tray. */
export const cardSnapshot = (e) => ({
  id: e.id,
  slug: e.slug,
  title: e.title,
  price_per_person: e.price_per_person,
  primary_image: e.primary_image,
  category: e.category,
  category_label: e.category_label,
  duration_minutes: e.duration_minutes,
  provider_name: e.provider?.business_name || e.provider_name || '',
  max_group_size: e.max_group_size,
  // Lets the trip tray search stays in the right place.
  state_name: e.state_name || '',
});

/** Is an ISO date inside a stay, check-in to check-out inclusive? */
export const withinStay = (date, checkIn, checkOut) =>
  Boolean(checkIn && checkOut && date >= checkIn && date <= checkOut);

/** Shape the booking API expects for one tray item. */
export const toAddOnPayload = (item) => ({
  experience_id: item.experience.id,
  date: item.date,
  session_id: item.session_id || null,
  ...(item.guests ? { guests: item.guests } : {}),
  ...(item.package_id ? { package_id: item.package_id } : {}),
});
