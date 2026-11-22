import { createElement, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Loader2, Clock, Users, Gauge, Bus, ShieldAlert, BadgeCheck, MapPin, Check, X as XIcon,
  Star, CalendarDays, Backpack, Plus, Info, Instagram, Globe,
} from 'lucide-react';
import { experiencesAPI } from '../../services/api';
import useTripStore from '../../store/tripStore';
import SlotPicker from '../../components/experiences/SlotPicker';
import {
  CATEGORY_ICONS, CATEGORY_TONES, cardSnapshot, formatDuration, naira, prettyDay, runDaysLabel,
} from '../../utils/experiences';
import NotFound from '../NotFound';

const DIFFICULTY = { easy: 'Easy', moderate: 'Moderate', challenging: 'Challenging' };

const Fact = ({ icon, children }) => (
  <span className="inline-flex items-center gap-1.5 text-sm text-dark-700 bg-gray-50 rounded-full px-3 py-1.5">
    {createElement(icon, { size: 14, className: 'text-primary' })} {children}
  </span>
);

const ExperienceDetail = () => {
  const { slug } = useParams();
  const [picking, setPicking] = useState(false);
  const [photo, setPhoto] = useState(0);
  const add = useTripStore(s => s.add);
  const setTrayOpen = useTripStore(s => s.setOpen);
  // Select the array, filter outside: a selector returning a fresh array on
  // every call makes zustand 5 re-render forever.
  const trayItems = useTripStore(s => s.items);
  const inTray = useMemo(() => trayItems.filter(i => i.experience.slug === slug), [trayItems, slug]);

  const { data: e, isLoading, isError, error } = useQuery({
    queryKey: ['experience', slug],
    queryFn: () => experiencesAPI.get(slug).then(r => r.data),
    retry: false,
  });

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (isError) return error?.response?.status === 404 ? <NotFound /> : (
    <div className="container-custom py-20 text-center text-dark-600">Could not load this experience.</div>
  );

  const Icon = CATEGORY_ICONS[e.category] || Star;
  const images = e.images || [];
  const openSlots = (e.upcoming || []).filter(s => s.available);

  const onPick = ({ slot, guests }) => {
    setPicking(false);
    add({
      experience: cardSnapshot(e), date: slot.date, session_id: slot.session_id,
      start_time: slot.start_time, label: slot.label, guests,
    });
    toast.success(`Added to your trip · ${prettyDay(slot.date)}`);
    setTrayOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {e.is_preview && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
          <div className="container-custom py-2.5 flex items-center gap-2"><Info size={15} /> Preview — this experience is not on the shelf yet. Only you and RentStay staff can see it.</div>
        </div>
      )}

      <div className="container-custom pt-4 pb-2">
        <Link to="/experiences" className="inline-flex items-center gap-1.5 text-sm text-dark-600 hover:text-dark-900">
          <ChevronLeft size={16} /> All experiences
        </Link>
      </div>

      <div className="container-custom pb-16">
        <div className="mb-5">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary"><Icon size={13} /> {e.category_label}</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-dark-900 mt-1">{e.title}</h1>
          <p className="text-sm text-dark-600 mt-1.5 flex items-center gap-2 flex-wrap">
            {e.rating
              ? <span className="inline-flex items-center gap-1 font-semibold text-dark-800"><Star size={13} className="fill-accent text-accent" /> {e.rating} <span className="font-normal text-dark-500">({e.review_count} review{e.review_count !== 1 ? 's' : ''})</span></span>
              : <span className="text-dark-500">New on the shelf</span>}
            <span>·</span>
            <span>by {e.provider?.business_name}</span>
            {e.provider?.is_verified && <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 text-xs font-semibold px-2 py-0.5 rounded-full"><BadgeCheck size={12} /> Verified provider</span>}
            {(e.area || e.lga_name) && <><span>·</span><span className="inline-flex items-center gap-1"><MapPin size={13} /> {[e.area, e.lga_name].filter(Boolean).join(', ')}</span></>}
          </p>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-2 rounded-2xl overflow-hidden mb-8">
          <div className={`relative aspect-[16/10] md:aspect-auto md:h-[420px] bg-gradient-to-br ${CATEGORY_TONES[e.category] || 'from-gray-600 to-gray-400'}`}>
            {images[photo] ? <img src={images[photo].image} alt={images[photo].caption || e.title} className="absolute inset-0 w-full h-full object-cover" />
              : <Icon size={56} className="absolute inset-0 m-auto text-white/70" />}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 md:grid-cols-2 gap-2 md:h-[420px]">
              {images.slice(0, 4).map((img, i) => (
                <button key={img.id} onClick={() => setPhoto(i)} className={`relative overflow-hidden aspect-square md:aspect-auto ${photo === i ? 'ring-2 ring-primary ring-inset' : ''}`} aria-label={`Show photo ${i + 1}`}>
                  <img src={img.image} alt="" className="absolute inset-0 w-full h-full object-cover hover:opacity-90" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-wrap gap-2">
              <Fact icon={Clock}>{formatDuration(e.duration_minutes)}</Fact>
              <Fact icon={Gauge}>{DIFFICULTY[e.difficulty]}</Fact>
              <Fact icon={Users}>Up to {e.max_group_size} per booking</Fact>
              {e.schedule_type === 'daily' && <Fact icon={CalendarDays}>{runDaysLabel(e.run_days)}{e.daily_start_time ? ` · ${e.daily_start_time.slice(0, 5)}` : ''}</Fact>}
              {e.transport_included && <Fact icon={Bus}>Transport included</Fact>}
              {e.guided_only && <Fact icon={ShieldAlert}>Guided only</Fact>}
            </div>

            <section>
              <h2 className="text-lg font-semibold text-dark-900 mb-2">What you'll do</h2>
              <p className="text-dark-700 leading-relaxed whitespace-pre-line">{e.description || e.summary}</p>
            </section>

            {(e.inclusions?.length > 0 || e.exclusions?.length > 0) && (
              <section className="grid sm:grid-cols-2 gap-6">
                {e.inclusions?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-dark-900 mb-2">Included</h3>
                    <ul className="space-y-1.5">{e.inclusions.map(x => <li key={x} className="flex gap-2 text-sm text-dark-700"><Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" /> {x}</li>)}</ul>
                  </div>
                )}
                {e.exclusions?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-dark-900 mb-2">Not included</h3>
                    <ul className="space-y-1.5">{e.exclusions.map(x => <li key={x} className="flex gap-2 text-sm text-dark-700"><XIcon size={16} className="text-dark-400 flex-shrink-0 mt-0.5" /> {x}</li>)}</ul>
                  </div>
                )}
              </section>
            )}

            {e.what_to_bring && (
              <section>
                <h3 className="font-semibold text-dark-900 mb-1.5 flex items-center gap-1.5"><Backpack size={16} /> What to bring</h3>
                <p className="text-sm text-dark-700 whitespace-pre-line">{e.what_to_bring}</p>
              </section>
            )}

            <section className="border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-dark-900 mb-1.5 flex items-center gap-1.5"><MapPin size={16} /> Where you'll meet</h3>
              <p className="text-sm text-dark-700">{e.meeting_point}</p>
              <p className="text-xs text-dark-500 mt-1">Directions and the guide's phone number are in your booking once it is paid.</p>
            </section>

            <section className="border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-dark-900 mb-1.5">Cancellation</h3>
              <p className="text-sm text-dark-700">
                Free cancellation up to {e.free_cancellation_hours} hours before it starts. If the provider, the weather or
                your stay host cancels, you get everything back.
              </p>
            </section>

            {/* Provider */}
            <section className="border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-dark-900 mb-3">Your host for this experience</h3>
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg overflow-hidden flex-shrink-0">
                  {e.provider?.logo ? <img src={e.provider.logo} alt="" className="w-full h-full object-cover" /> : (e.provider?.business_name || '?')[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-dark-900 flex items-center gap-1.5">{e.provider?.business_name}{e.provider?.is_verified && <BadgeCheck size={15} className="text-emerald-600" />}</p>
                  {e.provider?.bio && <p className="text-sm text-dark-600 mt-1 whitespace-pre-line">{e.provider.bio}</p>}
                  <div className="flex gap-3 mt-2 text-sm">
                    {e.provider?.instagram && <a href={e.provider.instagram.startsWith('http') ? e.provider.instagram : `https://instagram.com/${e.provider.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><Instagram size={14} /> Instagram</a>}
                    {e.provider?.website && <a href={e.provider.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><Globe size={14} /> Website</a>}
                  </div>
                </div>
              </div>
            </section>

            {/* Reviews */}
            <section className="border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-dark-900 mb-3">Guest reviews</h3>
              {(e.reviews || []).length === 0 ? (
                <p className="text-sm text-dark-500">No reviews yet. Reviews come only from guests who booked and went.</p>
              ) : (
                <ul className="space-y-5">
                  {e.reviews.map(r => (
                    <li key={r.id}>
                      <p className="text-sm font-semibold text-dark-900 flex items-center gap-2">{r.reviewer_name}
                        <span className="inline-flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} className={i < r.rating ? 'fill-accent text-accent' : 'text-gray-300'} />)}</span>
                      </p>
                      <p className="text-sm text-dark-700 mt-1">{r.comment}</p>
                      {r.provider_reply && <p className="text-sm text-dark-600 mt-2 pl-3 border-l-2 border-gray-200"><span className="font-semibold">Reply:</span> {r.provider_reply}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Booking card */}
          <aside>
            <div className="lg:sticky lg:top-24 border border-gray-200 rounded-2xl shadow-soft p-6 bg-white">
              <p className="text-dark-900"><span className="text-2xl font-bold">{naira(e.price_per_person)}</span><span className="text-dark-500"> / person</span></p>

              <p className="text-xs font-bold uppercase tracking-wider text-dark-600 mt-5 mb-2">Upcoming dates</p>
              {openSlots.length === 0 ? (
                <p className="text-sm text-dark-500">No open dates right now.</p>
              ) : (
                <ul className="space-y-1.5 mb-1">
                  {openSlots.slice(0, 5).map(s => (
                    <li key={`${s.date}-${s.session_id || ''}`} className="flex justify-between text-sm">
                      <span className="text-dark-800">{prettyDay(s.date)}{s.start_time ? ` · ${s.start_time}` : ''}</span>
                      <span className="text-xs text-dark-500">{s.label || (s.seats_left <= 5 ? `${s.seats_left} left` : '')}</span>
                    </li>
                  ))}
                  {openSlots.length > 5 && <li className="text-xs text-dark-500">+ {openSlots.length - 5} more dates</li>}
                </ul>
              )}

              <button type="button" onClick={() => setPicking(true)} disabled={e.is_preview || openSlots.length === 0}
                className="btn btn-primary w-full py-3 mt-4 inline-flex items-center justify-center gap-2 disabled:opacity-50">
                <Plus size={16} /> {inTray.length ? 'Add another date' : 'Add to trip'}
              </button>
              {inTray.length > 0 && (
                <button type="button" onClick={() => setTrayOpen(true)} className="w-full text-center text-sm font-semibold text-primary mt-3 hover:underline">
                  In your trip: {inTray.map(i => prettyDay(i.date)).join(', ')}
                </button>
              )}
              <p className="text-xs text-dark-500 mt-4 leading-relaxed">
                Experiences are booked together with a stay nearby. Add this to your trip, choose a stay that covers the
                date, and pay for both in one checkout.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {picking && <SlotPicker experience={e} onClose={() => setPicking(false)} onPick={onPick} />}
    </div>
  );
};

export default ExperienceDetail;
