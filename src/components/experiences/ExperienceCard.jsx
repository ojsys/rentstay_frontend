import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, BadgeCheck, Check, Plus, Clock, Bus, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import useTripStore from '../../store/tripStore';
import SlotPicker from './SlotPicker';
import {
  CATEGORY_ICONS, CATEGORY_TONES, cardSnapshot, formatDuration, naira, runDaysLabel, prettyDay,
} from '../../utils/experiences';

/**
 * A card on the shelf. "Add to trip" opens the date picker; the pick lands in
 * the trip tray (or, when `onPick` is given, goes straight to the caller —
 * the checkout page attaches it to the booking directly).
 */
const ExperienceCard = ({ experience: e, window: stay, defaultGuests, onPick, picked = false, busy = false }) => {
  const [picking, setPicking] = useState(false);
  const add = useTripStore(s => s.add);
  const inTray = useTripStore(s => s.items.some(i => i.experience.id === e.id));
  const isAdded = onPick ? picked : inTray;
  const Icon = CATEGORY_ICONS[e.category] || Star;

  const handlePick = ({ slot, guests }) => {
    setPicking(false);
    const item = {
      experience: cardSnapshot(e),
      date: slot.date,
      session_id: slot.session_id,
      start_time: slot.start_time,
      label: slot.label,
      guests,
    };
    if (onPick) {
      onPick(item);
      return;
    }
    add(item);
    toast.success(`Added to your trip · ${prettyDay(slot.date)}`);
  };

  const schedule = e.schedule_type === 'daily'
    ? runDaysLabel(e.run_days)
    : e.next_date ? `Next: ${prettyDay(e.next_date)}` : 'Dates on request';

  return (
    <article className="group bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden flex flex-col">
      <Link to={`/experiences/${e.slug}`} className="relative block aspect-[4/3] overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_TONES[e.category] || 'from-gray-600 to-gray-400'}`} />
        {e.primary_image ? (
          <img src={e.primary_image} alt="" loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <Icon size={40} className="absolute inset-0 m-auto text-white/70" />
        )}
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-dark-800 text-[11px] font-semibold px-2 py-1 rounded-full">
          <Icon size={11} className="text-primary" /> {e.category_label}
        </span>
        {e.featured && (
          <span className="absolute top-2.5 right-2.5 bg-accent text-white text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full">Pick</span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link to={`/experiences/${e.slug}`} className="font-semibold text-dark-900 leading-snug hover:text-primary line-clamp-2">
          {e.title}
        </Link>
        <p className="text-xs text-dark-500 mt-1 flex items-center gap-1 flex-wrap">
          by {e.provider?.business_name}
          {e.provider?.is_verified && (
            <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full font-semibold text-[10px]">
              <BadgeCheck size={10} /> Verified
            </span>
          )}
          {e.guided_only && (
            <span className="inline-flex items-center gap-0.5 text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-full font-semibold text-[10px]">
              <ShieldAlert size={10} /> Guided only
            </span>
          )}
        </p>
        <p className="text-xs text-dark-500 mt-1.5 flex items-center gap-1.5 flex-wrap">
          <Clock size={11} /> {formatDuration(e.duration_minutes)}
          <span>·</span> {schedule}
          {e.transport_included && <><span>·</span><Bus size={11} /> Transport</>}
        </p>
        <p className="text-xs mt-1.5">
          {e.rating
            ? <span className="inline-flex items-center gap-1 font-semibold text-dark-800"><Star size={11} className="fill-accent text-accent" /> {e.rating} <span className="text-dark-400 font-normal">({e.review_count})</span></span>
            : <span className="text-dark-400">New on the shelf</span>}
        </p>

        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <p className="text-sm text-dark-900"><span className="font-bold text-base">{naira(e.price_per_person)}</span><span className="text-dark-500"> / person</span></p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => setPicking(true)}
          className={`mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition ${
            isAdded ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'bg-primary text-white hover:bg-primary-600'
          } disabled:opacity-60`}
        >
          {isAdded ? <><Check size={15} /> Added · add another date</> : <><Plus size={15} /> {onPick ? 'Add to this stay' : 'Add to trip'}</>}
        </button>
      </div>

      {picking && (
        <SlotPicker
          experience={e}
          window={stay}
          defaultGuests={defaultGuests}
          onClose={() => setPicking(false)}
          onPick={handlePick}
          confirmLabel={onPick ? 'Add to this stay' : 'Add to trip'}
        />
      )}
    </article>
  );
};

export default ExperienceCard;
