import { createElement, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Loader2, Compass, Store, ListChecks, Banknote, Check, X, ExternalLink, Star, ShieldCheck, Eye, Info,
  TrendingUp, PackageOpen, CircleSlash,
} from 'lucide-react';
import { staffExperiencesAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { naira, prettyDay } from '../../utils/experiences';

const TABS = [
  { key: 'overview', label: 'Overview', icon: TrendingUp },
  { key: 'listings', label: 'Listings', icon: ListChecks, badge: 'listings_pending' },
  { key: 'providers', label: 'Providers', icon: Store, badge: 'providers_pending' },
  { key: 'refunds', label: 'Refunds', icon: Banknote, badge: 'refunds_owed' },
];

const TONE = {
  pending: 'bg-amber-50 text-amber-800', approved: 'bg-emerald-50 text-emerald-700', suspended: 'bg-red-50 text-red-700',
  draft: 'bg-gray-100 text-gray-700', changes: 'bg-orange-50 text-orange-800', published: 'bg-emerald-50 text-emerald-700',
};

const Kpi = ({ label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
    {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
  </div>
);

const Overview = ({ data }) => {
  const max = Math.max(1, ...data.months.map(m => m.stay_bookings));
  return (
    <div className="space-y-6">
      {!data.enabled && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-sm flex gap-3">
          <Info size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Experiences are hidden from the public</p>
            <p className="mt-0.5">Staff can see and test everything. When the first listings are walked and live, switch it on in{' '}
              <a href="/admin/core/sitesettings/1/change/" className="underline font-semibold">Site Settings → Experiences</a>.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Attach rate" value={data.attach_rate != null ? `${data.attach_rate}%` : '—'} sub={`${data.bookings_with_experiences} of ${data.paid_stay_bookings} paid stays since ${prettyDay(String(data.launch_date))}`} />
        <Kpi label="Revenue per stay booking" value={data.revenue_per_booking ? naira(data.revenue_per_booking) : '—'} sub="Stay + experience commission" />
        <Kpi label="Experience sales" value={naira(data.experience_gross)} sub={`${naira(data.experience_commission)} commission`} />
        <Kpi label="Live experiences" value={data.live_experiences} />
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900">Stay bookings by month</h2>
        <p className="text-xs text-gray-500 mt-0.5">The lift test: do paid stays rise once experiences are on sale? Darker part = stays that carried an experience.</p>
        <div className="mt-4 grid grid-cols-6 gap-3 items-end h-40" role="img" aria-label="Paid stay bookings per month">
          {data.months.map(m => (
            <div key={m.month} className="flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-xs font-semibold text-gray-700">{m.stay_bookings}</span>
              <div className="w-full max-w-[44px] bg-primary/20 rounded-t-md relative" style={{ height: `${(m.stay_bookings / max) * 100}%`, minHeight: m.stay_bookings ? 4 : 0 }}>
                <div className="absolute bottom-0 inset-x-0 bg-primary rounded-t-md" style={{ height: m.stay_bookings ? `${(m.with_experiences / m.stay_bookings) * 100}%` : 0 }} />
              </div>
              <span className="text-[11px] text-gray-500">{new Date(`${m.month}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'short' })}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Most booked</h2>
          {data.top_experiences.length === 0 ? <p className="text-sm text-gray-500">No bookings yet.</p> : (
            <ul className="divide-y divide-gray-100 text-sm">
              {data.top_experiences.map(t => (
                <li key={t.experience__title} className="py-2 flex justify-between gap-3"><span className="text-gray-800">{t.experience__title}</span><span className="text-gray-500 flex-shrink-0">{t.n} · {t.guests} guests · {naira(t.gross)}</span></li>
              ))}
            </ul>
          )}
        </section>
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-1.5"><PackageOpen size={16} /> Packages</h2>
            <a href="/admin/experiences/package/add/" className="text-sm font-semibold text-primary hover:underline">New package</a>
          </div>
          {data.packages.length === 0 ? <p className="text-sm text-gray-500">No packages yet. A package pre-stacks live experiences over fixed dates — e.g. Jos December, 10–13 Dec.</p> : (
            <ul className="divide-y divide-gray-100 text-sm">
              {data.packages.map(p => (
                <li key={p.id} className="py-2 flex justify-between gap-3">
                  <span>{p.title} <span className="text-gray-500">· {prettyDay(String(p.start_date))} – {prettyDay(String(p.end_date))}</span></span>
                  <span className="flex gap-3 flex-shrink-0">
                    <span className={`text-xs font-semibold ${p.is_published ? 'text-emerald-700' : 'text-gray-500'}`}>{p.is_published ? 'Live' : 'Draft'}</span>
                    <Link to={`/experiences/packages/${p.slug}`} className="text-primary"><Eye size={14} /></Link>
                    <a href={`/admin/experiences/package/${p.id}/change/`} className="text-primary"><ExternalLink size={14} /></a>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

const ListingReview = ({ row, onChanged }) => {
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(row.status === 'pending');
  const check = useMutation({
    mutationFn: ({ key, ok }) => staffExperiencesAPI.setCheck(row.id, key, ok, ''),
    onSuccess: onChanged,
    onError: (e) => toast.error(getErrorMessage(e, 'Could not save the check')),
  });
  const decide = useMutation({
    mutationFn: (action) => staffExperiencesAPI.decideListing(row.id, action, note),
    onSuccess: (_, action) => { toast.success({ publish: 'Live on the shelf', changes: 'Changes requested', suspend: 'Taken off the shelf', feature: 'Featured', unfeature: 'Unfeatured' }[action]); setNote(''); onChanged(); },
    onError: (e) => toast.error(getErrorMessage(e, 'Could not update')),
  });
  const done = row.trust_checks.filter(c => c.ok).length;
  return (
    <li className="bg-white rounded-2xl border border-gray-100">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full text-left p-4 flex gap-4 items-center" aria-expanded={open}>
        <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">{row.images?.[0] && <img src={row.images[0].image} alt="" className="w-full h-full object-cover" />}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 line-clamp-1 flex items-center gap-1.5">{row.title}{row.featured && <Star size={13} className="fill-accent text-accent" />}</p>
          <p className="text-xs text-gray-500">{row.provider.business_name} · {naira(row.price_per_person)} / person · {row.images.length} photo{row.images.length !== 1 ? 's' : ''}</p>
        </div>
        <span className="text-xs text-gray-500 hidden sm:block">{done}/{row.trust_checks.length} checks</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TONE[row.status]}`}>{row.status_label}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100 p-4 grid lg:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5"><ShieldCheck size={13} /> Trust checklist — confirmed on the ground</p>
            <ul className="space-y-1.5">
              {row.trust_checks.map(c => (
                <li key={c.key}>
                  <label className="flex gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={!!c.ok} disabled={check.isPending} onChange={(e) => check.mutate({ key: c.key, ok: e.target.checked })} className="mt-0.5" />
                    <span className={c.ok ? 'text-gray-900' : 'text-gray-600'}>{c.label}{c.ok && c.by && <span className="block text-[11px] text-gray-400">{c.by} · {new Date(c.at).toLocaleDateString('en-GB')}</span>}</span>
                  </label>
                </li>
              ))}
            </ul>
            {row.provider.status !== 'approved' && <p className="mt-3 text-xs text-amber-800 bg-amber-50 rounded-lg p-2">The provider is not approved yet — approve them on the Providers tab before this can go live.</p>}
          </div>
          <div className="space-y-3 text-sm">
            <p className="text-gray-700">{row.summary}</p>
            <p className="text-gray-500 text-xs">Meets at: {row.meeting_point || '—'} · {row.schedule_type === 'sessions' ? `${row.sessions.length} upcoming date(s)` : 'Runs on set days'} · {row.duration_minutes} min · {row.difficulty}{row.guided_only ? ' · guided only' : ''}</p>
            <Link to={`/experiences/${row.slug}`} className="inline-flex items-center gap-1 text-primary font-semibold"><Eye size={14} /> Preview listing</Link>
            <textarea className="input text-sm" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note to the provider (required to request changes)" />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => decide.mutate('publish')} disabled={decide.isPending || row.missing_checks.length > 0} className="btn btn-primary btn-sm inline-flex items-center gap-1 disabled:opacity-50" title={row.missing_checks.length ? 'Every check must be confirmed first' : ''}><Check size={14} /> Publish</button>
              <button onClick={() => decide.mutate('changes')} disabled={decide.isPending || !note.trim()} className="btn btn-secondary btn-sm disabled:opacity-50">Request changes</button>
              {row.status === 'published' && <button onClick={() => decide.mutate(row.featured ? 'unfeature' : 'feature')} className="btn btn-secondary btn-sm inline-flex items-center gap-1"><Star size={13} /> {row.featured ? 'Unfeature' : 'Feature'}</button>}
              {row.status !== 'suspended' && <button onClick={() => decide.mutate('suspend')} disabled={decide.isPending} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 inline-flex items-center gap-1"><CircleSlash size={13} /> Suspend</button>}
            </div>
          </div>
        </div>
      )}
    </li>
  );
};

const Listings = () => {
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending');
  const { data = [], isLoading } = useQuery({ queryKey: ['staff-exp-listings', status], queryFn: () => staffExperiencesAPI.listings(status ? { status } : {}).then(r => r.data) });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['staff-exp-listings'] }); qc.invalidateQueries({ queryKey: ['staff-exp-overview'] }); };
  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['pending', 'Waiting for review'], ['published', 'Live'], ['changes', 'Changes requested'], ['draft', 'Drafts'], ['suspended', 'Suspended'], ['', 'All']].map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v)} className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${status === v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700'}`}>{l}</button>
        ))}
      </div>
      {isLoading ? <Loader2 className="animate-spin text-primary" /> : data.length === 0 ? <p className="text-sm text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">Nothing here.</p> : (
        <ul className="space-y-3">{data.map(r => <ListingReview key={r.id} row={r} onChanged={refresh} />)}</ul>
      )}
    </div>
  );
};

const Providers = () => {
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending');
  const { data = [], isLoading } = useQuery({ queryKey: ['staff-exp-providers', status], queryFn: () => staffExperiencesAPI.providers(status ? { status } : {}).then(r => r.data) });
  const decide = useMutation({
    mutationFn: ({ id, action }) => staffExperiencesAPI.decideProvider(id, action, ''),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['staff-exp-providers'] }); qc.invalidateQueries({ queryKey: ['staff-exp-overview'] }); },
    onError: (e) => toast.error(getErrorMessage(e, 'Could not update')),
  });
  return (
    <div>
      <div className="flex gap-2 mb-4">
        {[['pending', 'Applied'], ['approved', 'Approved'], ['suspended', 'Suspended'], ['', 'All']].map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v)} className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${status === v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700'}`}>{l}</button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mb-3">Approve only after meeting them — approval puts a "Verified" badge on everything they list.</p>
      {isLoading ? <Loader2 className="animate-spin text-primary" /> : data.length === 0 ? <p className="text-sm text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">Nothing here.</p> : (
        <ul className="space-y-3">
          {data.map(p => (
            <li key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{p.business_name} <span className={`ml-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${TONE[p.status]}`}>{p.status}</span></p>
                <p className="text-xs text-gray-500 mt-0.5">{p.user.name} · {p.user.email} · {p.phone || 'no phone'}{p.instagram ? ` · ${p.instagram}` : ''} · {p.experiences_count} experience{p.experiences_count !== 1 ? 's' : ''}</p>
                {p.bio && <p className="text-sm text-gray-700 mt-1 line-clamp-2">{p.bio}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {p.status === 'pending' && <button onClick={() => decide.mutate({ id: p.id, action: 'approve' })} className="btn btn-primary btn-sm inline-flex items-center gap-1"><Check size={14} /> Approve</button>}
                {p.status === 'suspended' && <button onClick={() => decide.mutate({ id: p.id, action: 'reinstate' })} className="btn btn-secondary btn-sm">Reinstate</button>}
                {p.status !== 'suspended' && <button onClick={() => decide.mutate({ id: p.id, action: 'suspend' })} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 inline-flex items-center gap-1"><X size={14} /> Suspend</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Refunds = () => {
  const qc = useQueryClient();
  const [status, setStatus] = useState('owed');
  const [refs, setRefs] = useState({});
  const { data, isLoading } = useQuery({ queryKey: ['staff-exp-refunds', status], queryFn: () => staffExperiencesAPI.refunds(status).then(r => r.data) });
  const mark = useMutation({
    mutationFn: ({ id, reference }) => staffExperiencesAPI.markRefunded(id, reference),
    onSuccess: () => { toast.success('Recorded as refunded — the guest has been told'); qc.invalidateQueries({ queryKey: ['staff-exp-refunds'] }); qc.invalidateQueries({ queryKey: ['staff-exp-overview'] }); },
    onError: (e) => toast.error(getErrorMessage(e, 'Could not record the refund')),
  });
  const rows = data?.results || [];
  return (
    <div>
      <div className="flex gap-2 mb-3">
        {[['owed', 'Owed'], ['refunded', 'Refunded']].map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v)} className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${status === v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700'}`}>{l}</button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mb-3">Experience refunds are owed by policy — the stay host has no say. Send the transfer, then record it here with its reference.</p>
      {isLoading ? <Loader2 className="animate-spin text-primary" /> : rows.length === 0 ? <p className="text-sm text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">Nothing {status}.</p> : (
        <ul className="space-y-3">
          {rows.map(r => (
            <li key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{naira(r.refund_amount)} to {r.guest.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.experience} ({r.provider}) · {prettyDay(String(r.date))} · {r.guests} guest(s) · booking #{r.booking_id} at {r.stay}</p>
                  <p className="text-xs text-gray-500">Cancelled by {r.cancelled_by}{r.cancellation_reason ? ` — ${r.cancellation_reason}` : ''} · {r.guest.email}{r.guest.phone ? ` · ${r.guest.phone}` : ''}</p>
                  {r.refund_reference && <p className="text-xs text-emerald-700 mt-1">Ref {r.refund_reference} · {new Date(r.refunded_at).toLocaleDateString('en-GB')}</p>}
                </div>
              </div>
              {status === 'owed' && data.can_mark_paid && (
                <div className="flex gap-2 mt-3">
                  <input className="input text-sm" placeholder="Transfer reference" value={refs[r.id] || ''} onChange={e => setRefs(x => ({ ...x, [r.id]: e.target.value }))} />
                  <button onClick={() => mark.mutate({ id: r.id, reference: refs[r.id] || '' })} disabled={mark.isPending || !refs[r.id]?.trim()} className="btn btn-primary btn-sm flex-shrink-0 disabled:opacity-50">Mark refunded</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {status === 'owed' && data && !data.can_mark_paid && rows.length > 0 && (
        <p className="text-xs text-gray-500 mt-3">Recording refunds needs the "Can change experience add-on" permission.</p>
      )}
    </div>
  );
};

const StaffExperiences = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const overview = useQuery({ queryKey: ['staff-exp-overview'], queryFn: () => staffExperiencesAPI.overview().then(r => r.data) });
  const queues = overview.data?.queues || {};
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Compass size={20} /> Experiences</h1>
          <p className="text-sm text-gray-500">Phase 1 — sold only as add-ons to a stay. Measured by attach rate and stay-booking lift.</p>
        </div>
        <Link to="/experiences" className="text-sm font-semibold text-primary hover:underline flex-shrink-0">Open the shelf</Link>
      </div>
      <nav className="flex gap-1 border-b border-gray-200 overflow-x-auto" aria-label="Experiences sections">
        {TABS.map(({ key, label, icon, badge }) => (
          <button key={key} onClick={() => setParams({ tab: key }, { replace: true })} aria-current={tab === key ? 'page' : undefined}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold border-b-2 -mb-px ${tab === key ? 'border-primary text-primary' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            {createElement(icon, { size: 15 })} {label}
            {badge && queues[badge] > 0 && <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px]">{queues[badge]}</span>}
          </button>
        ))}
      </nav>
      {tab === 'overview' && (overview.isLoading ? <Loader2 className="animate-spin text-primary" /> : overview.isError ? <p className="text-sm text-red-600">Could not load the overview.</p> : <Overview data={overview.data} />)}
      {tab === 'listings' && <Listings />}
      {tab === 'providers' && <Providers />}
      {tab === 'refunds' && <Refunds />}
    </div>
  );
};

export default StaffExperiences;
