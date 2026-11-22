import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Loader2, CalendarDays, Users, Clock } from 'lucide-react';
import { experiencesAPI } from '../../services/api';
import { formatDuration, naira, prettyDay } from '../../utils/experiences';

/**
 * Pick a date (and how many people) for one experience.
 *
 * `window` limits the dates to a stay — Phase 1 sells experiences only inside
 * one. Without it the next few months are offered and the stay is chosen
 * afterwards. Unavailable dates are shown with the reason rather than hidden:
 * "Full" tells a guest something, a missing date does not.
 */
const SlotPicker = ({ experience, window: stay, defaultGuests = 2, onClose, onPick, confirmLabel = 'Add to trip' }) => {
  const maxGuests = experience.max_group_size || 10;
  const [guests, setGuests] = useState(Math.min(Math.max(1, defaultGuests), maxGuests));
  const [chosen, setChosen] = useState(null);

  const params = stay?.start && stay?.end ? { start: stay.start, end: stay.end, guests } : { guests };
  const { data, isLoading, isError } = useQuery({
    queryKey: ['experience-slots', experience.slug, params.start, params.end, guests],
    queryFn: () => experiencesAPI.slots(experience.slug, params).then(r => r.data.slots),
  });
  const slots = useMemo(() => data || [], [data]);

  // A chosen slot that no longer fits the group size is unselected.
  useEffect(() => {
    if (chosen && !slots.find(s => s.date === chosen.date && s.session_id === chosen.session_id && s.available)) {
      setChosen(null);
    }
  }, [slots, chosen]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const total = Number(experience.price_per_person) * guests;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Choose a date for ${experience.title}`}
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Add to your trip</p>
            <h3 className="font-display font-semibold text-dark-900 leading-snug mt-0.5">{experience.title}</h3>
            <p className="text-xs text-dark-500 mt-1 flex items-center gap-1.5">
              <Clock size={12} /> {formatDuration(experience.duration_minutes)}
              <span>·</span> {naira(experience.price_per_person)} / person
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-dark-400 hover:text-dark-700" aria-label="Close"><X size={20} /></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-dark-600 mb-2 flex items-center gap-1.5"><Users size={13} /> Guests</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setGuests(g => Math.max(1, g - 1))}
                className="w-8 h-8 rounded-full border border-gray-300 font-bold text-dark-600 hover:border-dark-500" aria-label="Fewer guests">−</button>
              <span className="text-sm font-medium w-16 text-center">{guests} guest{guests !== 1 ? 's' : ''}</span>
              <button type="button" onClick={() => setGuests(g => Math.min(maxGuests, g + 1))}
                className="w-8 h-8 rounded-full border border-gray-300 font-bold text-dark-600 hover:border-dark-500" aria-label="More guests">+</button>
              <span className="text-xs text-dark-400">max {maxGuests}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-dark-600 mb-2 flex items-center gap-1.5">
              <CalendarDays size={13} /> {stay?.start ? `During your stay (${prettyDay(stay.start)} – ${prettyDay(stay.end)})` : 'Choose a date'}
            </p>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-dark-500 py-4"><Loader2 size={14} className="animate-spin" /> Checking dates…</div>
            ) : isError ? (
              <p className="text-sm text-red-600">Could not load dates. Please try again.</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-dark-500 bg-gray-50 rounded-xl p-4">
                {stay?.start ? 'This experience does not run during your stay.' : 'No upcoming dates yet — check back soon.'}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slots.map((s) => {
                  const isChosen = chosen && chosen.date === s.date && chosen.session_id === s.session_id;
                  return (
                    <button
                      key={`${s.date}-${s.session_id || ''}`}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setChosen(s)}
                      className={`text-left rounded-xl border px-3 py-2.5 transition ${
                        isChosen ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                          : s.available ? 'border-gray-200 hover:border-dark-400' : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-dark-900">{prettyDay(s.date)}</span>
                      <span className="block text-xs text-dark-500">
                        {[s.start_time, s.label].filter(Boolean).join(' · ') || 'Any time'}
                      </span>
                      <span className={`block text-[11px] mt-0.5 ${s.available ? 'text-emerald-700' : 'text-dark-400'}`}>
                        {s.available ? (s.seats_left <= 5 ? `${s.seats_left} left` : 'Available') : s.reason}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-dark-500">{guests} × {naira(experience.price_per_person)}</p>
            <p className="font-bold text-dark-900">{naira(total)}</p>
          </div>
          <button
            type="button"
            disabled={!chosen}
            onClick={() => onPick({ slot: chosen, guests })}
            className="btn btn-primary px-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlotPicker;
