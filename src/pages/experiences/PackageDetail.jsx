import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Loader2, Home as HomeIcon, CalendarDays, Users, Check, Info, Star } from 'lucide-react';
import { experiencesAPI } from '../../services/api';
import useTripStore, { tripKey } from '../../store/tripStore';
import { cardSnapshot, formatDuration, naira, prettyDay } from '../../utils/experiences';
import { listingPath } from '../../utils/links';
import NotFound from '../NotFound';

/**
 * A package is the shelf, pre-stacked: a stay plus a fixed itinerary over
 * known dates. The guest chooses which stay anchors it; "Book the package"
 * puts the itinerary in their trip and opens that stay with the dates set,
 * where the ordinary checkout takes over — one payment for everything.
 */
const PackageDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [guests, setGuests] = useState(null);
  const [stayId, setStayId] = useState(null);
  const addToTrip = useTripStore(s => s.add);

  const { data: pkg, isLoading, isError, error } = useQuery({
    queryKey: ['experience-package', slug, guests],
    queryFn: () => experiencesAPI.package(slug, guests ? { guests } : {}).then(r => r.data),
    retry: false,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (pkg && guests === null) setGuests(pkg.default_guests || 2);
  }, [pkg, guests]);

  const stays = useMemo(() => pkg?.stays || [], [pkg]);
  useEffect(() => {
    if (stays.length && !stays.find(s => s.id === stayId)) setStayId(stays[0].id);
    if (!stays.length) setStayId(null);
  }, [stays, stayId]);

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (isError) return error?.response?.status === 404 ? <NotFound /> : <div className="container-custom py-20 text-center">Could not load this package.</div>;

  const g = guests || pkg.default_guests || 2;
  const stay = stays.find(s => s.id === stayId);
  const items = pkg.items || [];
  const experiencesTotal = items.reduce((sum, i) => sum + Number(i.experience.price_per_person) * g, 0);
  const total = (stay ? Number(stay.stay_total) : 0) + experiencesTotal;
  const maxGuests = Math.max(1, ...stays.map(s => s.capacity_adults || 1), 8);

  const book = () => {
    if (!stay) return;
    items.forEach((i) => {
      const item = {
        experience: cardSnapshot(i.experience),
        date: i.date,
        session_id: i.session,
        start_time: i.start_time,
        label: i.day_label,
        guests: g,
        package_id: pkg.id,
      };
      addToTrip({ ...item, key: tripKey(item) });
    });
    navigate(listingPath(stay, `?check_in=${pkg.start_date}&check_out=${pkg.end_date}&guests=${g}`));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-primary-800 to-accent" />
        {pkg.hero_image && <img src={pkg.hero_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
        <div className="relative container-custom pt-6 pb-12 md:pb-16">
          <Link to="/experiences" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white"><ChevronLeft size={16} /> Experiences</Link>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/80 mt-8">{pkg.eyebrow || 'Package'}</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold mt-2 max-w-3xl">{pkg.title}</h1>
          <p className="mt-3 text-white/90 flex items-center gap-2"><CalendarDays size={16} /> {prettyDay(pkg.start_date, { weekday: 'short', day: 'numeric', month: 'short' })} – {prettyDay(pkg.end_date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {pkg.nights} night{pkg.nights !== 1 ? 's' : ''}</p>
          {pkg.tagline && <p className="mt-2 max-w-2xl text-white/90">{pkg.tagline}</p>}
        </div>
      </section>

      <div className="container-custom py-8 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        <div className="space-y-6">
          {pkg.description && <p className="text-dark-700 leading-relaxed whitespace-pre-line bg-white rounded-2xl border border-gray-100 p-6">{pkg.description}</p>}

          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-display text-lg font-semibold text-dark-900 mb-3">What's inside</h2>
            <ol className="divide-y divide-dashed divide-gray-200">
              <li className="flex gap-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-wide bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 h-fit whitespace-nowrap">Stay</span>
                <p className="text-sm text-dark-700">
                  <span className="font-semibold text-dark-900">{stay ? stay.title : 'Your choice of stay'}</span>
                  {' '}— {pkg.nights} night{pkg.nights !== 1 ? 's' : ''}, {prettyDay(pkg.start_date)} – {prettyDay(pkg.end_date)}, for {g} guest{g !== 1 ? 's' : ''}.
                </p>
              </li>
              {items.map((i) => (
                <li key={i.id} className="flex gap-4 py-3">
                  <span className="text-[11px] font-bold uppercase tracking-wide bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 h-fit whitespace-nowrap">{i.day_label || prettyDay(i.date, { day: 'numeric', month: 'short' })}</span>
                  <div className="text-sm text-dark-700 min-w-0">
                    <Link to={`/experiences/${i.experience.slug}`} className="font-semibold text-dark-900 hover:text-primary">{i.experience.title}</Link>
                    {' '}with {i.experience.provider?.business_name} — {prettyDay(i.date)}{i.start_time ? `, ${i.start_time}` : ''} · {formatDuration(i.experience.duration_minutes)}.
                    {i.session_label && <span className="text-dark-500"> {i.session_label}.</span>}
                    {i.note && <p className="text-xs text-dark-500 mt-0.5">{i.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
            {pkg.note && <p className="mt-3 text-xs text-dark-500 flex gap-1.5"><Info size={13} className="flex-shrink-0 mt-0.5" /> {pkg.note}</p>}
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-dark-900 mb-3">Choose your stay</h2>
            {stays.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-dark-600">
                No stays are free for {g} guest{g !== 1 ? 's' : ''} on these dates right now. Try fewer guests, or{' '}
                <Link to={`/stays?check_in=${pkg.start_date}&check_out=${pkg.end_date}`} className="text-primary font-semibold hover:underline">search all stays</Link>.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stays.map((s) => {
                  const on = s.id === stayId;
                  return (
                    <button key={s.id} type="button" onClick={() => setStayId(s.id)} aria-pressed={on}
                      className={`text-left bg-white rounded-2xl border p-3 flex gap-3 transition ${on ? 'border-primary ring-2 ring-primary/30' : 'border-gray-100 hover:border-gray-300'}`}>
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {s.primary_image && <img src={s.primary_image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-dark-900 line-clamp-2">{s.title}</p>
                        <p className="text-xs text-dark-500 mt-0.5">{s.capacity_adults} guests · {s.beds} bed{s.beds !== 1 ? 's' : ''}{s.area ? ` · ${s.area}` : ''}</p>
                        <p className="text-sm mt-1"><span className="font-bold">{naira(s.stay_total)}</span><span className="text-dark-500 text-xs"> for {pkg.nights} nights</span></p>
                        {s.package_featured && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-accent-700 mt-1"><Star size={10} className="fill-accent text-accent" /> Package pick</span>}
                      </div>
                      {on && <Check size={18} className="text-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside>
          <div className="lg:sticky lg:top-24 bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
            <p className="text-dark-900"><span className="text-2xl font-bold">{naira(total)}</span><span className="text-dark-500"> for {g} guest{g !== 1 ? 's' : ''}</span></p>

            <div className="flex items-center gap-3 mt-4">
              <Users size={15} className="text-dark-500" />
              <button type="button" onClick={() => setGuests(Math.max(1, g - 1))} className="w-7 h-7 rounded-full border border-gray-300 font-bold text-dark-600" aria-label="Fewer guests">−</button>
              <span className="text-sm font-medium">{g} guest{g !== 1 ? 's' : ''}</span>
              <button type="button" onClick={() => setGuests(Math.min(maxGuests, g + 1))} className="w-7 h-7 rounded-full border border-gray-300 font-bold text-dark-600" aria-label="More guests">+</button>
            </div>

            <dl className="mt-5 text-sm divide-y divide-dashed divide-gray-200">
              <div className="flex justify-between py-2.5 gap-3">
                <dt className="text-dark-600 flex items-center gap-1.5"><HomeIcon size={13} /> {stay ? `Stay — ${pkg.nights} nights` : 'Stay'}</dt>
                <dd className="font-medium">{stay ? naira(stay.stay_total) : '—'}</dd>
              </div>
              {items.map(i => (
                <div key={i.id} className="flex justify-between py-2.5 gap-3">
                  <dt className="text-dark-600 line-clamp-1">{i.experience.title} × {g}</dt>
                  <dd className="font-medium">{naira(Number(i.experience.price_per_person) * g)}</dd>
                </div>
              ))}
              <div className="flex justify-between py-2.5 font-bold text-dark-900 text-base">
                <dt>Total</dt><dd>{naira(total)}</dd>
              </div>
            </dl>

            <button type="button" onClick={book} disabled={!stay} className="btn btn-primary w-full py-3 mt-3 disabled:opacity-50">Book the package</button>
            <p className="text-xs text-dark-500 mt-3 leading-relaxed">
              One Paystack checkout covers the stay and every experience. RentStay pays the host and each provider
              separately behind the scenes.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PackageDetail;
