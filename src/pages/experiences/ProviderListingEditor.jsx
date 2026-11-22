import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ChevronLeft, Loader2, Upload, Trash2, Star, Plus, Ban, Info, Send } from 'lucide-react';
import { providerAPI, locationAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { useExperiencesMeta } from '../../hooks/useExperiences';
import { getErrorMessage } from '../../utils/errors';
import { naira, prettyDay } from '../../utils/experiences';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EMPTY = {
  title: '', category: 'adventure', summary: '', description: '', duration_minutes: 180, difficulty: 'easy',
  max_group_size: 8, price_per_person: '', inclusions: [], exclusions: [], what_to_bring: '',
  guided_only: false, transport_included: false, meeting_point: '', meeting_directions: '', area: '',
  state: '', lga: '', schedule_type: 'sessions', run_days: [], daily_start_time: '', daily_capacity: 10,
  free_cancellation_hours: 48, booking_cutoff_hours: 12,
};

const Section = ({ title, hint, children }) => (
  <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
    <h2 className="font-semibold text-dark-900">{title}</h2>
    {hint && <p className="text-xs text-dark-500 mt-0.5">{hint}</p>}
    <div className="mt-4 space-y-4">{children}</div>
  </section>
);

const L = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="label">{label}</span>
    {children}
    {hint && <span className="block text-xs text-dark-500 mt-1">{hint}</span>}
  </label>
);

const ProviderListingEditor = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { categories } = useExperiencesMeta();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState({ dates: '', start_time: '07:00', capacity: '', label: '' });
  const [cancelling, setCancelling] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const existing = useQuery({
    queryKey: ['provider-listing', id],
    queryFn: () => providerAPI.listing(id).then(r => r.data),
    enabled: !isNew && isAuthenticated,
  });
  const states = useQuery({ queryKey: ['states'], queryFn: () => locationAPI.getStates().then(r => r.data.results || r.data), staleTime: Infinity });
  const lgas = useQuery({
    queryKey: ['lgas', form.state],
    queryFn: () => locationAPI.getLGAs(form.state).then(r => r.data.results || r.data),
    enabled: !!form.state,
    staleTime: Infinity,
  });

  useEffect(() => {
    const d = existing.data;
    if (!d) return;
    setForm({
      ...EMPTY,
      ...Object.fromEntries(Object.keys(EMPTY).map(k => [k, d[k] ?? EMPTY[k]])),
      daily_start_time: d.daily_start_time ? d.daily_start_time.slice(0, 5) : '',
      state: d.state || '', lga: d.lga || '',
    });
  }, [existing.data]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isNew && existing.isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  const exp = existing.data;
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const lines = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value.split('\n') }));

  const payload = () => ({
    ...form,
    inclusions: form.inclusions.map(s => s.trim()).filter(Boolean),
    exclusions: form.exclusions.map(s => s.trim()).filter(Boolean),
    state: form.state || null,
    lga: form.lga || null,
    daily_start_time: form.daily_start_time || null,
    run_days: form.schedule_type === 'daily' ? form.run_days : [],
  });

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        const res = await providerAPI.createListing(payload());
        toast.success('Saved. Now add photos and dates.');
        qc.invalidateQueries({ queryKey: ['provider-listings'] });
        navigate(`/experiences/provider/listings/${res.data.id}`, { replace: true });
      } else {
        await providerAPI.updateListing(id, payload());
        toast.success(exp?.status === 'published' ? 'Saved' : 'Saved');
        qc.invalidateQueries({ queryKey: ['provider-listing', id] });
        qc.invalidateQueries({ queryKey: ['provider-listings'] });
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save'));
    } finally { setSaving(false); }
  };

  const refresh = () => qc.invalidateQueries({ queryKey: ['provider-listing', id] });

  const upload = async (e) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);
    for (const f of files) {
      const fd = new FormData();
      fd.append('image', f);
      try { await providerAPI.uploadImage(id, fd); } catch { toast.error(`Could not upload ${f.name}`); }
    }
    setUploading(false);
    e.target.value = '';
    refresh();
  };

  const addSessions = async () => {
    const dates = session.dates.split(/[\s,]+/).filter(Boolean);
    if (!dates.length) { toast.error('Pick at least one date'); return; }
    try {
      const res = await providerAPI.addSessions(id, { dates, start_time: session.start_time, capacity: session.capacity || form.max_group_size, label: session.label });
      toast.success(`${res.data.created} date${res.data.created !== 1 ? 's' : ''} added`);
      setSession(s => ({ ...s, dates: '', label: '' }));
      refresh();
    } catch (err) { toast.error(getErrorMessage(err, 'Could not add dates')); }
  };

  const cancelSession = async (s, reason = '') => {
    const booked = s.capacity - s.seats_left;
    try {
      await providerAPI.cancelSession(id, s.id, reason);
      toast.success(booked > 0 ? 'Date cancelled and guests refunded' : 'Date removed');
      setCancelling(null);
      setCancelReason('');
      refresh();
    } catch (err) { toast.error(getErrorMessage(err, 'Could not cancel the date')); }
  };
  // A date with bookings needs a reason the guests will see; an empty one can just go.
  const askCancel = (s) => (s.capacity - s.seats_left > 0 ? setCancelling(s) : cancelSession(s));

  const submit = async () => {
    try {
      await providerAPI.submit(id);
      toast.success('Submitted for review');
      refresh();
    } catch (err) { toast.error(getErrorMessage(err, 'Could not submit')); }
  };

  const toggleDay = (d) => setForm(f => ({ ...f, run_days: f.run_days.includes(d) ? f.run_days.filter(x => x !== d) : [...f.run_days, d].sort() }));

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="container-custom pt-6 max-w-3xl">
        <Link to="/experiences/provider?tab=listings" className="inline-flex items-center gap-1.5 text-sm text-dark-600 hover:text-dark-900"><ChevronLeft size={16} /> Your experiences</Link>
        <div className="flex items-start justify-between gap-3 mt-3">
          <h1 className="font-display text-2xl font-bold text-dark-900">{isNew ? 'New experience' : form.title || 'Edit experience'}</h1>
          {exp && ['draft', 'changes'].includes(exp.status) && (
            <button onClick={submit} className="btn btn-primary btn-sm inline-flex items-center gap-1.5 flex-shrink-0"><Send size={14} /> Submit for review</button>
          )}
        </div>
        {exp?.status === 'changes' && exp.review_note && <p className="mt-3 text-sm bg-orange-50 text-orange-800 rounded-xl p-3"><b>RentStay asked for changes:</b> {exp.review_note}</p>}
        {exp?.status === 'published' && <p className="mt-3 text-sm bg-blue-50 text-blue-800 rounded-xl p-3 flex gap-2"><Info size={16} className="flex-shrink-0 mt-0.5" /> This is live. Changing the price, title, meeting point, duration or difficulty sends it back for a quick review.</p>}

        <form onSubmit={save} className="mt-5 space-y-5">
          <Section title="The basics">
            <L label="Title *"><input className="input" required maxLength={200} value={form.title} onChange={set('title')} placeholder="e.g. Shere Hills sunrise expedition" /></L>
            <div className="grid sm:grid-cols-2 gap-4">
              <L label="Category"><select className="input" value={form.category} onChange={set('category')}>{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></L>
              <L label="Difficulty"><select className="input" value={form.difficulty} onChange={set('difficulty')}><option value="easy">Easy</option><option value="moderate">Moderate</option><option value="challenging">Challenging</option></select></L>
            </div>
            <L label="One-line summary *" hint="Shown on the card. 240 characters max."><input className="input" required maxLength={240} value={form.summary} onChange={set('summary')} /></L>
            <L label="What guests will do"><textarea className="input" rows={6} value={form.description} onChange={set('description')} placeholder="Walk the guest through it, start to finish." /></L>
          </Section>

          <Section title="Price and group" hint="Price honestly — include entry, guide, transport and food if you provide them.">
            <div className="grid sm:grid-cols-3 gap-4">
              <L label="Price per person (₦) *"><input className="input" type="number" min="1" required value={form.price_per_person} onChange={set('price_per_person')} /></L>
              <L label="Duration (minutes) *"><input className="input" type="number" min="15" step="15" required value={form.duration_minutes} onChange={set('duration_minutes')} /></L>
              <L label="Most guests per booking"><input className="input" type="number" min="1" value={form.max_group_size} onChange={set('max_group_size')} /></L>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <L label="Included" hint="One per line"><textarea className="input" rows={4} value={form.inclusions.join('\n')} onChange={lines('inclusions')} placeholder={'Guide\nWater\nTransport from town'} /></L>
              <L label="Not included" hint="One per line"><textarea className="input" rows={4} value={form.exclusions.join('\n')} onChange={lines('exclusions')} /></L>
            </div>
            <L label="What to bring"><input className="input" value={form.what_to_bring} onChange={set('what_to_bring')} placeholder="Walking shoes, a light jacket" /></L>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.transport_included} onChange={set('transport_included')} /> Transport included</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.guided_only} onChange={set('guided_only')} /> Guided only (never sold as a self-guided visit)</label>
            </div>
          </Section>

          <Section title="Where guests meet you">
            <L label="Meeting point *" hint="A place guests can actually find. Shown on the listing."><input className="input" required value={form.meeting_point} onChange={set('meeting_point')} placeholder="e.g. Main gate, city wildlife park" /></L>
            <L label="Directions and landmarks" hint="Sent to guests once they have paid."><textarea className="input" rows={3} value={form.meeting_directions} onChange={set('meeting_directions')} /></L>
            <div className="grid sm:grid-cols-3 gap-4">
              <L label="State"><select className="input" value={form.state} onChange={(e) => setForm(f => ({ ...f, state: e.target.value, lga: '' }))}><option value="">—</option>{(states.data || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></L>
              <L label="LGA"><select className="input" value={form.lga} onChange={set('lga')} disabled={!form.state}><option value="">—</option>{(lgas.data || []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></L>
              <L label="Area"><input className="input" value={form.area} onChange={set('area')} placeholder="e.g. Rayfield" /></L>
            </div>
          </Section>

          <Section title="When it runs">
            <div className="grid sm:grid-cols-2 gap-3">
              {[['sessions', 'On set dates', 'A sunrise hike on announced dates, a festival day.'], ['daily', 'On set days of the week', 'A museum visit every Tuesday to Saturday.']].map(([v, t, d]) => (
                <label key={v} className={`rounded-xl border p-3 cursor-pointer ${form.schedule_type === v ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'}`}>
                  <input type="radio" name="schedule" className="sr-only" checked={form.schedule_type === v} onChange={() => setForm(f => ({ ...f, schedule_type: v }))} />
                  <span className="font-semibold text-sm text-dark-900">{t}</span>
                  <span className="block text-xs text-dark-500 mt-0.5">{d}</span>
                </label>
              ))}
            </div>
            {form.schedule_type === 'daily' && (
              <>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d, i) => (
                    <button type="button" key={d} onClick={() => toggleDay(i + 1)} aria-pressed={form.run_days.includes(i + 1)}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${form.run_days.includes(i + 1) ? 'bg-dark-900 text-white border-dark-900' : 'border-gray-200 text-dark-700'}`}>{d}</button>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <L label="Start time"><input className="input" type="time" value={form.daily_start_time} onChange={set('daily_start_time')} /></L>
                  <L label="Places per day"><input className="input" type="number" min="1" value={form.daily_capacity} onChange={set('daily_capacity')} /></L>
                </div>
              </>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <L label="Free cancellation until (hours before)" hint="Guests cancelling later get nothing back."><input className="input" type="number" min="0" value={form.free_cancellation_hours} onChange={set('free_cancellation_hours')} /></L>
              <L label="Stop taking bookings (hours before)"><input className="input" type="number" min="0" value={form.booking_cutoff_hours} onChange={set('booking_cutoff_hours')} /></L>
            </div>
          </Section>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : isNew ? 'Save and continue' : 'Save changes'}</button>
            {!isNew && <Link to={`/experiences/${exp?.slug}`} className="btn btn-secondary">Preview</Link>}
          </div>
        </form>

        {!isNew && exp && (
          <div className="mt-6 space-y-5">
            <Section title="Photos" hint="Take them on site, as guests will see it. No stock or borrowed images — RentStay checks.">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {exp.images.map(img => (
                  <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={img.image} alt="" className="w-full h-full object-cover" />
                    {img.is_primary && <span className="absolute top-1.5 left-1.5 bg-white/90 text-[10px] font-bold px-1.5 py-0.5 rounded">Cover</span>}
                    <div className="absolute inset-x-0 bottom-0 p-1.5 flex justify-end gap-1 bg-gradient-to-t from-black/50 to-transparent">
                      {!img.is_primary && <button type="button" onClick={async () => { await providerAPI.setPrimaryImage(id, img.id); refresh(); }} className="p-1.5 bg-white rounded-lg" aria-label="Make cover photo"><Star size={13} /></button>}
                      <button type="button" onClick={async () => { await providerAPI.deleteImage(id, img.id); refresh(); }} className="p-1.5 bg-white rounded-lg text-red-600" aria-label="Delete photo"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-dark-500 text-xs cursor-pointer hover:border-primary hover:text-primary">
                  {uploading ? <Loader2 className="animate-spin" /> : <><Upload size={18} /> Add photos</>}
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={upload} disabled={uploading} />
                </label>
              </div>
            </Section>

            {form.schedule_type === 'sessions' && (
              <Section title="Dates" hint="Add the dates you'll run it. Each date has its own number of places.">
                <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
                  <L label="Date">
                    <input className="input" type="date" min={new Date().toLocaleDateString('en-CA')} value={session.dates.split(/[\s,]+/)[0] || ''} onChange={e => setSession(s => ({ ...s, dates: e.target.value }))} />
                  </L>
                  <L label="Start"><input className="input" type="time" value={session.start_time} onChange={e => setSession(s => ({ ...s, start_time: e.target.value }))} /></L>
                  <L label="Places"><input className="input w-24" type="number" min="1" value={session.capacity} placeholder={String(form.max_group_size)} onChange={e => setSession(s => ({ ...s, capacity: e.target.value }))} /></L>
                </div>
                <L label="Label (optional)" hint='e.g. "Carnival Day 2"'><input className="input" value={session.label} onChange={e => setSession(s => ({ ...s, label: e.target.value }))} /></L>
                <button type="button" onClick={addSessions} className="btn btn-secondary btn-sm inline-flex items-center gap-1"><Plus size={14} /> Add date</button>

                {exp.sessions.length > 0 && (
                  <ul className="divide-y divide-gray-100 border-t border-gray-100 mt-2">
                    {exp.sessions.map(s => (
                      <li key={s.id} className={`py-2.5 flex items-center justify-between gap-3 text-sm ${s.is_cancelled ? 'opacity-50 line-through' : ''}`}>
                        <span><b>{prettyDay(s.date)}</b> · {s.start_time.slice(0, 5)}{s.label ? ` · ${s.label}` : ''}</span>
                        <span className="flex items-center gap-3">
                          <span className="text-xs text-dark-500">{s.capacity - s.seats_left}/{s.capacity} booked</span>
                          {!s.is_cancelled && <button type="button" onClick={() => askCancel(s)} className="text-xs font-semibold text-red-600 inline-flex items-center gap-1"><Ban size={12} /> Cancel</button>}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            )}

            {cancelling && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setCancelling(null)}>
                <div role="dialog" aria-modal="true" className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold text-dark-900">Cancel {prettyDay(cancelling.date)}?</h3>
                  <p className="text-sm text-dark-600 mt-2">{cancelling.capacity - cancelling.seats_left} guest(s) are booked. They will be refunded in full and told why.</p>
                  <textarea className="input mt-3" rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason guests will see, e.g. heavy rain forecast" />
                  <div className="flex gap-2 mt-3">
                    <button type="button" onClick={() => setCancelling(null)} className="flex-1 btn btn-secondary">Keep the date</button>
                    <button type="button" disabled={!cancelReason.trim()} onClick={() => cancelSession(cancelling, cancelReason)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm disabled:opacity-50">Cancel and refund</button>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-dark-500">Guests pay {naira(form.price_per_person || 0)} per person. RentStay's commission is deducted from your payout, never added to the guest's price.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderListingEditor;
