import { createElement, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, Compass, ArrowRight, BadgeCheck, CreditCard, Home as HomeIcon, Store } from 'lucide-react';
import { experiencesAPI } from '../../services/api';
import { useExperiencesMeta } from '../../hooks/useExperiences';
import ExperienceCard from '../../components/experiences/ExperienceCard';
import { CATEGORY_ICONS } from '../../utils/experiences';
import NotFound from '../NotFound';
import PackageBanner from '../../components/experiences/PackageBanner';

const ExperiencesShelf = () => {
  const { visible, categories, locations, isLoading: metaLoading } = useExperiencesMeta();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const state = params.get('state') || '';
  const [q, setQ] = useState(params.get('q') || '');

  const list = useQuery({
    queryKey: ['experiences', category, state, params.get('q') || ''],
    queryFn: () => experiencesAPI.list({
      category: category || undefined, state: state || undefined, q: params.get('q') || undefined,
    }).then(r => r.data.results),
    enabled: visible,
  });
  const packages = useQuery({
    queryKey: ['experience-packages'],
    queryFn: () => experiencesAPI.packages().then(r => r.data),
    enabled: visible,
  });

  const all = useMemo(() => list.data || [], [list.data]);
  const picks = all.filter(e => e.featured);
  const filtering = Boolean(category || state || params.get('q'));
  const setState = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('state', value); else next.delete('state');
    setParams(next, { replace: true });
  };

  const setCategory = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('category', value); else next.delete('category');
    setParams(next, { replace: true });
  };
  const submitSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (q.trim()) next.set('q', q.trim()); else next.delete('q');
    setParams(next, { replace: true });
  };

  if (metaLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!visible) return <NotFound />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="container-custom py-10 md:py-14">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-primary">
            <Compass size={14} /> Experiences
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-dark-900 mt-2 max-w-2xl">
            Your stay, with the place attached
          </h1>
          <p className="text-dark-600 mt-3 max-w-2xl">
            Hikes, heritage, food and festivals run by local guides, venues and creators.
            Verified on the ground and ranked by guest reviews. Book them with your stay — one payment.
          </p>

          <form onSubmit={submitSearch} className="mt-6 flex max-w-2xl bg-white border border-gray-200 rounded-full shadow-soft overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
            <Search size={18} className="text-dark-400 ml-4 self-center flex-shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search hikes, museums, food…"
              className="flex-1 min-w-0 px-3 py-3 text-sm outline-none"
              aria-label="Search experiences"
            />
            {locations.length > 1 && (
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                aria-label="Where"
                className="hidden sm:block border-l border-gray-200 px-3 text-sm text-dark-700 bg-transparent outline-none max-w-[170px]"
              >
                <option value="">Anywhere</option>
                {locations.map(l => <option key={l.state_id} value={l.state_id}>{l.state__name} ({l.count})</option>)}
              </select>
            )}
            <button type="submit" className="bg-primary text-white font-semibold text-sm px-5 sm:px-6 hover:bg-primary-600">Search</button>
          </form>

          <ol className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              { icon: Compass, title: 'Pick experiences', text: 'Add them to your trip from here or from any stay page.' },
              { icon: HomeIcon, title: 'Choose your stay', text: 'Experiences attach to the stay that covers their dates.' },
              { icon: CreditCard, title: 'Pay once', text: 'One Paystack checkout for the stay and everything on it.' },
            ].map(({ icon, title, text }, i) => (
              <li key={title} className="flex gap-3 bg-gray-50 rounded-xl p-4">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">{i + 1}</span>
                <div>
                  <p className="font-semibold text-dark-900 flex items-center gap-1.5">{createElement(icon, { size: 14, className: 'text-primary' })} {title}</p>
                  <p className="text-dark-500 text-xs mt-0.5">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="container-custom py-8 space-y-10">
        {/* Where — its own row on phones, where the search bar has no room */}
        {locations.length > 1 && (
          <select value={state} onChange={(e) => setState(e.target.value)} aria-label="Where" className="input sm:hidden">
            <option value="">Anywhere</option>
            {locations.map(l => <option key={l.state_id} value={l.state_id}>{l.state__name} ({l.count})</option>)}
          </select>
        )}

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" role="tablist" aria-label="Categories">
          <button role="tab" aria-selected={!category} onClick={() => setCategory('')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition ${!category ? 'bg-dark-900 text-white border-dark-900' : 'bg-white border-gray-200 text-dark-700 hover:border-dark-400'}`}>
            All
          </button>
          {categories.map(({ value, label }) => {
            const Icon = CATEGORY_ICONS[value];
            const on = category === value;
            return (
              <button key={value} role="tab" aria-selected={on} onClick={() => setCategory(value)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition ${on ? 'bg-dark-900 text-white border-dark-900' : 'bg-white border-gray-200 text-dark-700 hover:border-dark-400'}`}>
                {Icon && <Icon size={14} />} {label}
              </button>
            );
          })}
        </div>

        {/* Packages */}
        {!filtering && (packages.data || []).map(pkg => <PackageBanner key={pkg.id} pkg={pkg} />)}

        {list.isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>
        ) : list.isError ? (
          <div className="text-center py-16">
            <p className="text-dark-600">Could not load experiences.</p>
            <button onClick={() => list.refetch()} className="btn btn-secondary mt-3">Try again</button>
          </div>
        ) : all.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <Compass size={32} className="mx-auto text-dark-300" />
            <p className="font-semibold text-dark-800 mt-3">{filtering ? 'Nothing matches that yet' : 'The shelf is being stocked'}</p>
            <p className="text-sm text-dark-500 mt-1">
              {filtering ? 'Try another category or search.' : 'Every experience is walked and safety-checked in person before it lists.'}
            </p>
            {filtering && <button onClick={() => { setQ(''); setParams({}, { replace: true }); }} className="btn btn-secondary mt-4">Clear filters</button>}
          </div>
        ) : (
          <>
            {!filtering && picks.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-bold text-dark-900 mb-4">Staff picks</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {picks.map(e => <ExperienceCard key={e.id} experience={e} />)}
                </div>
              </section>
            )}
            <section>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-dark-900">
                  {filtering ? `${all.length} experience${all.length !== 1 ? 's' : ''}` : 'Everything on the shelf'}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {all.map(e => <ExperienceCard key={e.id} experience={e} />)}
              </div>
            </section>
          </>
        )}

        {/* Trust + supplier CTA */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <BadgeCheck className="text-emerald-600" />
            <h3 className="font-semibold text-dark-900 mt-2">A badge means someone actually went</h3>
            <p className="text-sm text-dark-600 mt-1">
              Before anything lists, RentStay meets the guide, walks the route, names first-aid cover and agrees a
              rain plan. Ranking is earned through verification and reviews — never paid placement.
            </p>
          </div>
          <div className="bg-dark-900 text-white rounded-2xl p-6">
            <Store className="text-accent" />
            <h3 className="font-semibold mt-2">Run tours, a venue or a food experience?</h3>
            <p className="text-sm text-white/75 mt-1">List it on RentStay and get booked by visitors who already have a stay. Free to list; we take a commission only when you are booked.</p>
            <Link to="/experiences/provider" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-accent hover:gap-2.5 transition-all">
              List your experience <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExperiencesShelf;
