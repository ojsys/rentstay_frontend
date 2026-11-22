import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Compass, ArrowRight, Trash2, CalendarDays, AlertCircle } from 'lucide-react';
import { experiencesAPI } from '../../services/api';
import { useExperiencesMeta } from '../../hooks/useExperiences';
import useTripStore from '../../store/tripStore';
import ExperienceCard from './ExperienceCard';
import { naira, prettyDay } from '../../utils/experiences';

/**
 * "Experiences near this stay" — the shelf in a stay's context.
 *
 * With dates chosen, the date picker only offers slots inside the stay. Picks
 * go to the trip tray; the booking widget (below, `TripLines`) shows the ones
 * that fall inside the stay and they are attached when the stay is booked.
 */
export const StayExperiences = ({ listing, checkIn, checkOut, guests, onPick, pickedIds = [], busy, title }) => {
  const { visible } = useExperiencesMeta();
  const { data, isLoading } = useQuery({
    queryKey: ['experiences-near', listing.slug || listing.id],
    queryFn: () => experiencesAPI.list({ listing: listing.slug || listing.id, limit: 8 }).then(r => r.data.results),
    enabled: visible,
    staleTime: 60 * 1000,
  });
  const window = checkIn && checkOut ? { start: checkIn, end: checkOut } : null;

  if (!visible || isLoading || !(data || []).length) return null;

  return (
    <section className="border-b border-gray-100 pb-8">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h2 className="text-xl font-semibold text-dark-900 flex items-center gap-2"><Compass size={20} className="text-primary" /> {title || 'Experiences near this stay'}</h2>
        <Link to="/experiences" className="text-sm font-semibold text-primary hover:underline flex-shrink-0">Browse all</Link>
      </div>
      <p className="text-sm text-dark-500 mb-4">
        {window
          ? `Add any of these for ${prettyDay(checkIn)} – ${prettyDay(checkOut)}. You pay for them with your stay, in one checkout.`
          : 'Pick your dates first, then add experiences that fall during your stay — one checkout for everything.'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.slice(0, 4).map(e => (
          <ExperienceCard key={e.id} experience={e} window={window} defaultGuests={guests}
            onPick={onPick} picked={pickedIds.includes(e.id)} busy={busy} />
        ))}
      </div>
    </section>
  );
};

export const TripLines = ({ inside, outside }) => {
  const remove = useTripStore(s => s.remove);
  if (!inside.length && !outside.length) return null;
  return (
    <div className="space-y-2">
      {inside.map(i => (
        <div key={i.key} className="flex items-start justify-between gap-2 text-dark-700">
          <span className="min-w-0">
            <span className="block line-clamp-1">{i.experience.title}</span>
            <span className="text-xs text-dark-500 flex items-center gap-1"><CalendarDays size={11} /> {prettyDay(i.date)} · {i.guests} × {naira(i.experience.price_per_person)}</span>
          </span>
          <span className="flex items-center gap-1.5 flex-shrink-0">
            {naira(Number(i.experience.price_per_person) * (i.guests || 1))}
            <button type="button" onClick={() => remove(i.key)} className="p-0.5 text-dark-400 hover:text-red-600" aria-label={`Remove ${i.experience.title}`}><Trash2 size={13} /></button>
          </span>
        </div>
      ))}
      {outside.length > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 flex gap-1.5">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          <span>
            {outside.length} experience{outside.length !== 1 ? 's' : ''} in your trip fall{outside.length === 1 ? 's' : ''} outside these dates
            ({outside.map(i => prettyDay(i.date)).join(', ')}) and won't be added.{' '}
            <button type="button" onClick={() => useTripStore.getState().setOpen(true)} className="underline font-medium inline-flex items-center gap-0.5">View trip <ArrowRight size={11} /></button>
          </span>
        </p>
      )}
    </div>
  );
};

export default StayExperiences;
