import { createElement, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Loader2, Store, Plus, CalendarDays, Wallet, Star, Users, Phone, Clock, BadgeCheck, Eye, Send, Pencil,
  ListChecks, LayoutDashboard, MessageSquare, UserCog, AlertCircle, X, ShieldCheck, Footprints, Banknote,
} from 'lucide-react';
import { providerAPI, dashboardAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { naira, prettyDay } from '../../utils/experiences';
import BankAccountsManager from '../../components/dashboard/BankAccountsManager';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'listings', label: 'Experiences', icon: ListChecks },
  { key: 'bookings', label: 'Bookings', icon: CalendarDays },
  { key: 'earnings', label: 'Earnings', icon: Wallet },
  { key: 'reviews', label: 'Reviews', icon: MessageSquare },
  { key: 'profile', label: 'Profile', icon: UserCog },
];

const STATUS_TONE = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-50 text-amber-800',
  changes: 'bg-orange-50 text-orange-800',
  published: 'bg-emerald-50 text-emerald-700',
  suspended: 'bg-red-50 text-red-700',
};

const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="label">{label}</span>
    {children}
    {hint && <span className="block text-xs text-dark-500 mt-1">{hint}</span>}
  </label>
);

const ProfileForm = ({ initial = {}, onSubmit, busy, submitLabel }) => {
  const [form, setForm] = useState({
    business_name: initial.business_name || '', phone: initial.phone || '', whatsapp: initial.whatsapp || '',
    instagram: initial.instagram || '', website: initial.website || '', bio: initial.bio || '',
  });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <Field label="Business or trading name *"><input className="input" required value={form.business_name} onChange={set('business_name')} placeholder="e.g. Highland Hike Collective" /></Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Phone *" hint="Guests get this number once they have paid."><input className="input" required value={form.phone} onChange={set('phone')} placeholder="0803 000 0000" /></Field>
        <Field label="WhatsApp"><input className="input" value={form.whatsapp} onChange={set('whatsapp')} placeholder="If different from phone" /></Field>
        <Field label="Instagram"><input className="input" value={form.instagram} onChange={set('instagram')} placeholder="@yourhandle" /></Field>
        <Field label="Website"><input className="input" type="url" value={form.website} onChange={set('website')} placeholder="https://" /></Field>
      </div>
      <Field label="About you" hint="Who you are, how long you've been running this, and what guests can expect."><textarea className="input" rows={4} value={form.bio} onChange={set('bio')} /></Field>
      <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : submitLabel}</button>
    </form>
  );
};

const Apply = ({ user }) => {
  const qc = useQueryClient();
  const apply = useMutation({
    mutationFn: (data) => providerAPI.apply(data),
    onSuccess: () => { toast.success('Application sent'); qc.invalidateQueries({ queryKey: ['provider-profile'] }); },
    onError: (e) => toast.error(getErrorMessage(e, 'Could not send your application')),
  });
  return (
    <div className="container-custom py-10 grid lg:grid-cols-2 gap-10">
      <div>
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-primary"><Store size={14} /> For guides, venues & creators</p>
        <h1 className="font-display text-3xl font-bold text-dark-900 mt-2">List your experience on RentStay</h1>
        <p className="text-dark-600 mt-3">Visitors booking a stay near you can add your hike, tour, tasting or workshop to the same trip and pay once. You keep running it; we bring the bookings and handle payment.</p>
        <ul className="mt-6 space-y-4">
          {[
            { icon: Store, t: 'Free to list', d: 'We take a commission only on bookings made through RentStay, deducted from your payout.' },
            { icon: Footprints, t: 'Verified in person', d: 'Someone from RentStay meets you and walks the experience before it goes live. That badge is what guests trust.' },
            { icon: Banknote, t: 'Paid to your bank', d: 'Earnings are released the day the experience happens. Withdraw any time after.' },
          ].map(({ icon, t, d }) => (
            <li key={t} className="flex gap-3">
              <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">{createElement(icon, { size: 17 })}</span>
              <div><p className="font-semibold text-dark-900">{t}</p><p className="text-sm text-dark-600">{d}</p></div>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
        {user ? (
          <>
            <h2 className="font-semibold text-dark-900">Tell us about your business</h2>
            <p className="text-sm text-dark-500 mt-1 mb-4">RentStay will be in touch to meet you and walk your first experience before it goes live.</p>
            <ProfileForm initial={{ phone: user.phone_number || '' }} onSubmit={(d) => apply.mutate(d)} busy={apply.isPending} submitLabel="Apply to list" />
          </>
        ) : (
          <div className="text-center py-6">
            <h2 className="font-semibold text-dark-900 text-lg">Start with a free account</h2>
            <p className="text-sm text-dark-500 mt-1">Then tell us about your business — it takes two minutes.</p>
            <Link to="/register?type=provider" className="btn btn-primary w-full mt-5 inline-flex items-center justify-center gap-2"><Store size={16} /> Create a provider account</Link>
            <p className="text-sm text-dark-600 mt-4">
              Already on RentStay?{' '}
              <Link to={`/login?redirect=${encodeURIComponent('/experiences/provider')}`} className="text-primary font-semibold hover:underline">Log in</Link>
              {' '}and apply from your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value, sub, icon: Icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4">
    <p className="text-xs text-dark-500 flex items-center gap-1.5">{Icon && <Icon size={13} />} {label}</p>
    <p className="text-xl font-bold text-dark-900 mt-1">{value}</p>
    {sub && <p className="text-xs text-dark-500 mt-0.5">{sub}</p>}
  </div>
);

const BookingRow = ({ b, onCancel }) => (
  <li className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
    <div className="sm:w-28 flex-shrink-0">
      <p className="text-sm font-bold text-dark-900">{prettyDay(b.date)}</p>
      <p className="text-xs text-dark-500">{b.start_time ? b.start_time.slice(0, 5) : 'Any time'}</p>
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-dark-900 text-sm">{b.experience_title}</p>
      <p className="text-xs text-dark-600 mt-0.5 flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1"><Users size={12} /> {b.guests} guest{b.guests !== 1 ? 's' : ''}</span>
        <span>{b.guest_name}</span>
        {b.guest_phone && <a href={`tel:${b.guest_phone}`} className="inline-flex items-center gap-1 text-primary"><Phone size={12} /> {b.guest_phone}</a>}
        {b.stay?.area && <span>Staying in {b.stay.area}</span>}
      </p>
      {b.status === 'cancelled' && <p className="text-xs text-red-600 mt-1">Cancelled by {b.cancelled_by || '—'}{b.cancellation_reason ? `: ${b.cancellation_reason}` : ''}</p>}
    </div>
    <div className="text-right flex-shrink-0">
      <p className="text-sm font-bold text-dark-900">{naira(b.payout)}</p>
      <p className="text-[11px] text-dark-500">your payout</p>
      {onCancel && b.status === 'confirmed' && (
        <button onClick={() => onCancel(b)} className="text-xs font-semibold text-red-600 hover:underline mt-1">Cancel</button>
      )}
    </div>
  </li>
);

const Bookings = () => {
  const qc = useQueryClient();
  const [when, setWhen] = useState('upcoming');
  const [cancelling, setCancelling] = useState(null);
  const [reason, setReason] = useState('');
  const { data = [], isLoading } = useQuery({ queryKey: ['provider-bookings', when], queryFn: () => providerAPI.bookings(when).then(r => r.data) });
  const cancel = useMutation({
    mutationFn: () => providerAPI.cancelBooking(cancelling.id, reason),
    onSuccess: () => { toast.success('Cancelled — the guest is refunded in full'); setCancelling(null); setReason(''); qc.invalidateQueries({ queryKey: ['provider-bookings'] }); },
    onError: (e) => toast.error(getErrorMessage(e, 'Could not cancel')),
  });
  return (
    <div>
      <div className="inline-flex bg-gray-100 rounded-xl p-1 mb-4">
        {['upcoming', 'past', 'cancelled'].map(w => (
          <button key={w} onClick={() => setWhen(w)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize ${when === w ? 'bg-white shadow-sm text-dark-900' : 'text-dark-600'}`}>{w}</button>
        ))}
      </div>
      {isLoading ? <Loader2 className="animate-spin text-primary" /> : data.length === 0 ? (
        <p className="text-sm text-dark-500 bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">No {when} bookings.</p>
      ) : (
        <ul className="space-y-3">{data.map(b => <BookingRow key={b.id} b={b} onCancel={when === 'upcoming' ? setCancelling : null} />)}</ul>
      )}
      {cancelling && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setCancelling(null)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between"><h3 className="font-bold text-dark-900">Cancel this booking?</h3><button onClick={() => setCancelling(null)} aria-label="Close"><X size={18} /></button></div>
            <p className="text-sm text-dark-600 mt-2">{cancelling.experience_title}, {prettyDay(cancelling.date)} for {cancelling.guest_name}. The guest gets a full refund and is told why. Cancel only for weather, safety or a genuine emergency.</p>
            <textarea className="input mt-3" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason the guest will see (required)" />
            <button disabled={!reason.trim() || cancel.isPending} onClick={() => cancel.mutate()} className="mt-3 w-full py-2.5 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50">{cancel.isPending ? 'Cancelling…' : 'Cancel and refund guest'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

const Earnings = () => {
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['provider-earnings'], queryFn: () => providerAPI.earnings().then(r => r.data) });
  const { data: accounts = [] } = useQuery({ queryKey: ['bank-accounts'], queryFn: () => dashboardAPI.getBankAccounts().then(r => r.data?.results || r.data || []) });
  const request = useMutation({
    mutationFn: () => providerAPI.requestPayout({ amount, bank_account_id: bank }),
    onSuccess: (r) => { toast.success(r.data.detail); setAmount(''); qc.invalidateQueries({ queryKey: ['provider-earnings'] }); },
    onError: (e) => toast.error(getErrorMessage(e, 'Could not request the withdrawal')),
  });
  if (isLoading) return <Loader2 className="animate-spin text-primary" />;
  const available = Number(data.available_balance);
  const valid = accounts.filter(a => a.bank_code);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Available to withdraw" value={naira(data.available_balance)} icon={Wallet} />
        <Stat label="Waiting for the day" value={naira(data.pending)} sub={data.next_release_date ? `Next release ${prettyDay(data.next_release_date)}` : null} icon={Clock} />
        <Stat label="Released so far" value={naira(data.released)} />
        <Stat label="Withdrawn" value={naira(data.withdrawn)} />
      </div>
      <p className="text-xs text-dark-500">{data.hold_policy} RentStay's commission ({Number(data.commission_rate)}%) is already deducted from these figures.</p>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-dark-900 mb-3">Withdraw</h3>
        {valid.length === 0 ? <p className="text-sm text-dark-600">Add a bank account below first.</p> : (
          <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => { e.preventDefault(); request.mutate(); }}>
            <select className="input sm:max-w-xs" value={bank} onChange={e => setBank(e.target.value)} required>
              <option value="">Choose account</option>
              {valid.map(a => <option key={a.id} value={a.id}>{a.bank_name} — {a.account_number}</option>)}
            </select>
            <input className="input sm:max-w-[180px]" type="number" min="1" max={available} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" required />
            <button className="btn btn-primary" disabled={request.isPending || available <= 0}>{request.isPending ? 'Requesting…' : 'Request withdrawal'}</button>
          </form>
        )}
        {(data.payouts || []).length > 0 && (
          <ul className="mt-4 divide-y divide-gray-100 text-sm">
            {data.payouts.map(p => (
              <li key={p.id} className="py-2 flex justify-between"><span>{naira(p.amount)} · {new Date(p.created_at).toLocaleDateString('en-GB')}</span><span className="capitalize text-dark-600">{p.status}</span></li>
            ))}
          </ul>
        )}
      </div>
      <BankAccountsManager title="Payout accounts" description="Where your experience earnings are sent." />
    </div>
  );
};

const Reviews = () => {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState({});
  const { data = [], isLoading } = useQuery({ queryKey: ['provider-reviews'], queryFn: () => providerAPI.reviews().then(r => r.data) });
  const reply = useMutation({
    mutationFn: ({ id, text }) => providerAPI.reply(id, text),
    onSuccess: () => { toast.success('Reply posted'); qc.invalidateQueries({ queryKey: ['provider-reviews'] }); },
    onError: (e) => toast.error(getErrorMessage(e, 'Could not post the reply')),
  });
  if (isLoading) return <Loader2 className="animate-spin text-primary" />;
  if (!data.length) return <p className="text-sm text-dark-500 bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">No reviews yet. Guests can review once their experience has taken place.</p>;
  return (
    <ul className="space-y-3">
      {data.map(r => (
        <li key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-semibold text-dark-900 flex items-center gap-2">{r.reviewer_name} on {r.experience_title}
            <span className="inline-flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} className={i < r.rating ? 'fill-accent text-accent' : 'text-gray-300'} />)}</span>
          </p>
          <p className="text-sm text-dark-700 mt-1">{r.comment}</p>
          {r.provider_reply ? <p className="text-sm text-dark-600 mt-2 pl-3 border-l-2 border-gray-200"><b>Your reply:</b> {r.provider_reply}</p> : (
            <div className="mt-2 flex gap-2">
              <input className="input text-sm" value={drafts[r.id] || ''} onChange={e => setDrafts(d => ({ ...d, [r.id]: e.target.value }))} placeholder="Reply publicly…" />
              <button className="btn btn-secondary btn-sm" disabled={!drafts[r.id]?.trim()} onClick={() => reply.mutate({ id: r.id, text: drafts[r.id] })}>Reply</button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

const Listings = ({ listings }) => {
  const qc = useQueryClient();
  const submit = useMutation({
    mutationFn: (id) => providerAPI.submit(id),
    onSuccess: () => { toast.success('Submitted — RentStay will be in touch to verify it in person'); qc.invalidateQueries({ queryKey: ['provider-listings'] }); },
    onError: (e) => toast.error(getErrorMessage(e, 'Could not submit')),
  });
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-dark-600">Every experience is walked and safety-checked by RentStay before it goes live.</p>
        <Link to="/experiences/provider/listings/new" className="btn btn-primary btn-sm inline-flex items-center gap-1.5 flex-shrink-0"><Plus size={15} /> New</Link>
      </div>
      {listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
          <ListChecks className="mx-auto text-dark-300" size={30} />
          <p className="font-semibold text-dark-800 mt-2">No experiences yet</p>
          <Link to="/experiences/provider/listings/new" className="btn btn-primary mt-4 inline-flex items-center gap-1.5"><Plus size={15} /> Create your first</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {listings.map(l => (
            <li key={l.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 items-center">
              <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">{l.images?.[0] && <img src={l.images[0].image} alt="" className="w-full h-full object-cover" />}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-dark-900 line-clamp-1">{l.title}</p>
                <p className="text-xs text-dark-500 mt-0.5">{naira(l.price_per_person)} / person · {l.bookings_count} booking{l.bookings_count !== 1 ? 's' : ''} · {l.schedule_type === 'sessions' ? `${l.sessions.length} upcoming date${l.sessions.length !== 1 ? 's' : ''}` : 'Runs on set days'}</p>
                <span className={`inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_TONE[l.status]}`}>{l.status_label}</span>
                {l.status === 'changes' && l.review_note && <p className="text-xs text-orange-800 mt-1">{l.review_note}</p>}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                <Link to={`/experiences/${l.slug}`} className="btn btn-secondary btn-sm inline-flex items-center gap-1"><Eye size={13} /> View</Link>
                <Link to={`/experiences/provider/listings/${l.id}`} className="btn btn-secondary btn-sm inline-flex items-center gap-1"><Pencil size={13} /> Edit</Link>
                {['draft', 'changes'].includes(l.status) && (
                  <button onClick={() => submit.mutate(l.id)} disabled={submit.isPending} className="btn btn-primary btn-sm inline-flex items-center gap-1"><Send size={13} /> Submit</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ProviderDashboard = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const qc = useQueryClient();

  const profile = useQuery({ queryKey: ['provider-profile'], queryFn: () => providerAPI.profile().then(r => r.data.provider), enabled: isAuthenticated });
  const provider = profile.data;
  const listings = useQuery({ queryKey: ['provider-listings'], queryFn: () => providerAPI.listings().then(r => r.data.results || r.data), enabled: !!provider });
  const upcoming = useQuery({ queryKey: ['provider-bookings', 'upcoming'], queryFn: () => providerAPI.bookings('upcoming').then(r => r.data), enabled: !!provider && tab === 'overview' });
  const earnings = useQuery({ queryKey: ['provider-earnings'], queryFn: () => providerAPI.earnings().then(r => r.data), enabled: !!provider && tab === 'overview' });
  const update = useMutation({
    mutationFn: (d) => providerAPI.updateProfile(d),
    onSuccess: () => { toast.success('Profile saved'); qc.invalidateQueries({ queryKey: ['provider-profile'] }); },
    onError: (e) => toast.error(getErrorMessage(e, 'Could not save')),
  });

  // Logged-out visitors get the pitch and a way to sign up, not a bare login wall.
  if (!isAuthenticated) return <Apply user={null} />;
  if (profile.isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!provider) return <Apply user={user} />;

  const all = listings.data || [];
  const setTab = (key) => setParams({ tab: key }, { replace: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Experience provider</p>
          <h1 className="font-display text-2xl font-bold text-dark-900 mt-1 flex items-center gap-2">{provider.business_name}{provider.is_verified && <BadgeCheck className="text-emerald-600" size={20} />}</h1>
          {provider.status === 'pending' && (
            <p className="mt-3 text-sm text-amber-800 bg-amber-50 rounded-xl px-3 py-2 inline-flex items-start gap-2"><ShieldCheck size={16} className="flex-shrink-0 mt-0.5" /> Your application is under review. You can prepare experiences now; RentStay will contact you to verify in person before anything goes live.</p>
          )}
          {provider.status === 'suspended' && (
            <p className="mt-3 text-sm text-red-700 bg-red-50 rounded-xl px-3 py-2 inline-flex items-start gap-2"><AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> Your account is suspended and your experiences are hidden. Contact RentStay.</p>
          )}
          <nav className="flex gap-1 mt-5 overflow-x-auto -mx-4 px-4" aria-label="Provider sections">
            {TABS.map(({ key, label, icon }) => (
              <button key={key} onClick={() => setTab(key)} aria-current={tab === key ? 'page' : undefined}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold border-b-2 transition ${tab === key ? 'border-primary text-primary' : 'border-transparent text-dark-600 hover:text-dark-900'}`}>
                {createElement(icon, { size: 15 })} {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="container-custom py-6">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat label="Upcoming bookings" value={(upcoming.data || []).length} icon={CalendarDays} />
              <Stat label="Available to withdraw" value={naira(earnings.data?.available_balance)} icon={Wallet} />
              <Stat label="Waiting for the day" value={naira(earnings.data?.pending)} icon={Clock} />
              <Stat label="Live experiences" value={all.filter(l => l.status === 'published').length} sub={`${all.length} in total`} icon={ListChecks} />
            </div>
            <section>
              <h2 className="font-semibold text-dark-900 mb-3">Next up</h2>
              {(upcoming.data || []).length === 0 ? (
                <p className="text-sm text-dark-500 bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">No upcoming bookings yet.</p>
              ) : <ul className="space-y-3">{upcoming.data.slice(0, 5).map(b => <BookingRow key={b.id} b={b} />)}</ul>}
            </section>
          </div>
        )}
        {tab === 'listings' && (listings.isLoading ? <Loader2 className="animate-spin text-primary" /> : <Listings listings={all} />)}
        {tab === 'bookings' && <Bookings />}
        {tab === 'earnings' && <Earnings />}
        {tab === 'reviews' && <Reviews />}
        {tab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-2xl">
            <ProfileForm initial={provider} onSubmit={(d) => update.mutate(d)} busy={update.isPending} submitLabel="Save profile" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;
