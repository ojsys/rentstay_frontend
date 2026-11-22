import { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, X, Trash2, ArrowRight, CalendarDays } from 'lucide-react';
import useTripStore from '../../store/tripStore';
import { useExperiencesMeta } from '../../hooks/useExperiences';
import { naira, prettyDay } from '../../utils/experiences';

/**
 * The floating "Your trip" pill and drawer.
 *
 * Everything picked from the shelf collects here until it is attached to a
 * stay. The way out is always a stay: "Find a stay for these dates" opens the
 * stays search spanning the picked experiences.
 */
const HIDDEN_ON = [/^\/staff/, /^\/dashboard/, /^\/experiences\/provider/];

const TripTray = () => {
  const { visible } = useExperiencesMeta();
  const { items, open, setOpen, remove, prune } = useTripStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { prune(); }, [prune]);
  useEffect(() => { setOpen(false); }, [location.pathname, setOpen]);

  const sorted = useMemo(() => [...items].sort((a, b) => a.date.localeCompare(b.date)), [items]);
  if (!visible || items.length === 0) return null;
  if (HIDDEN_ON.some(r => r.test(location.pathname))) return null;

  const first = sorted[0].date;
  const last = sorted[sorted.length - 1].date;
  const checkout = (() => {
    const [y, m, d] = last.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    return next.toLocaleDateString('en-CA');
  })();
  const guests = Math.max(...items.map(i => i.guests || 1));
  // Search stays where the experiences are — when they are all in one state.
  // Experiences span many places, so a trip mixing two is left unfiltered.
  const places = [...new Set(items.map(i => i.experience.state_name).filter(Boolean))];
  const where = places.length === 1 ? `&city=${encodeURIComponent(places[0])}` : '';
  const total = items.reduce((s, i) => s + Number(i.experience.price_per_person) * (i.guests || 1), 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-40 bottom-20 right-4 sm:bottom-6 sm:right-6 inline-flex items-center gap-2 bg-dark-900 text-white rounded-full pl-4 pr-5 py-3 shadow-xl hover:bg-dark-800 transition"
      >
        <Compass size={18} />
        <span className="text-sm font-semibold">Your trip</span>
        <span className="bg-accent text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] px-1.5 inline-flex items-center justify-center">{items.length}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside
            role="dialog"
            aria-label="Your trip"
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-display font-semibold text-lg text-dark-900">Your trip</h2>
                <p className="text-xs text-dark-500">Experiences are booked together with a stay — one payment.</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-dark-400 hover:text-dark-700" aria-label="Close"><X size={20} /></button>
            </div>

            <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {sorted.map((i) => (
                <li key={i.key} className="p-4 flex gap-3">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {i.experience.primary_image && <img src={i.experience.primary_image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/experiences/${i.experience.slug}`} className="text-sm font-semibold text-dark-900 line-clamp-2 hover:text-primary">{i.experience.title}</Link>
                    <p className="text-xs text-dark-500 mt-0.5 flex items-center gap-1">
                      <CalendarDays size={11} /> {prettyDay(i.date)}{i.start_time ? ` · ${i.start_time}` : ''}
                    </p>
                    <p className="text-xs text-dark-700 mt-0.5">{i.guests} × {naira(i.experience.price_per_person)}</p>
                  </div>
                  <button onClick={() => remove(i.key)} className="self-start p-1.5 text-dark-400 hover:text-red-600" aria-label={`Remove ${i.experience.title}`}>
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="p-5 border-t border-gray-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-dark-600">Experiences</span>
                <span className="font-bold text-dark-900">{naira(total)}</span>
              </div>
              <p className="text-xs text-dark-500">
                Pick a stay that covers {prettyDay(first)}{first !== last ? ` – ${prettyDay(last)}` : ''}. These experiences are added to it automatically.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/stays?check_in=${first}&check_out=${checkout}&guests=${guests}${where}`)}
                className="btn btn-primary w-full py-3 inline-flex items-center justify-center gap-2"
              >
                Find a stay{places.length === 1 ? ` in ${places[0]}` : ''} for these dates <ArrowRight size={16} />
              </button>
              <Link to="/experiences" className="block text-center text-sm font-semibold text-primary hover:underline">Keep browsing experiences</Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default TripTray;
