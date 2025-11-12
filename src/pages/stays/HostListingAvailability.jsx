import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { staysAPI } from '../../services/api';
import { Loader2, CalendarClock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const HostListingAvailability = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [blocked, setBlocked] = useState([]);
  const [busy, setBusy] = useState([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [note, setNote] = useState('');
  const [month, setMonth] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null); // Date
  const [dragEnd, setDragEnd] = useState(null); // Date

  const load = async () => {
    try {
      const [ls, av, bl] = await Promise.all([
        staysAPI.getListing(id),
        staysAPI.availability(id, {}),
        staysAPI.listBlocked(id),
      ]);
      setListing(ls.data);
      setBusy(av.data.busy || []);
      setBlocked(bl.data || []);
    } catch (e) {
      toast.error('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const addBlocked = async (e) => {
    e.preventDefault();
    if (!start || !end) { toast.error('Select start and end'); return; }
    try {
      await staysAPI.addBlocked(id, start, end, note);
      setStart(''); setEnd(''); setNote('');
      load();
      toast.success('Blocked');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const isInRanges = (dateStr, ranges) => {
    const d = new Date(dateStr);
    const ds = d.toISOString().slice(0,10);
    return ranges.some(r => ds >= r.start_date && ds <= r.end_date);
  };

  const toggleDayBlock = async (dateObj) => {
    const ds = dateObj.toISOString().slice(0,10);
    // Only allow adding single-day block via calendar to keep UX simple
    try {
      await staysAPI.addBlocked(id, ds, ds, '');
      await load();
    } catch (e) { toast.error('Failed'); }
  };

  const inDragRange = (cell) => {
    if (!dragging || !dragStart) return false;
    const s = dragStart < dragEnd ? dragStart : dragEnd || dragStart;
    const e = dragEnd && (dragEnd > dragStart ? dragEnd : dragStart) || dragStart;
    const ds = cell.toISOString().slice(0,10);
    const ss = s.toISOString().slice(0,10);
    const es = e.toISOString().slice(0,10);
    return ds >= ss && ds <= es;
  };

  const anyBusyInRange = (s, e) => {
    // iterate dates from s to e
    const cur = new Date(s);
    while (cur <= e) {
      const ds = cur.toISOString().slice(0,10);
      if (isInRanges(ds, busy)) return true;
      cur.setDate(cur.getDate()+1);
    }
    return false;
  };

  const monthLabel = (d) => d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const prevMonth = () => { const d = new Date(month); d.setMonth(d.getMonth()-1); setMonth(d); };
  const nextMonth = () => { const d = new Date(month); d.setMonth(d.getMonth()+1); setMonth(d); };

  const buildCalendar = () => {
    const year = month.getFullYear();
    const mon = month.getMonth();
    const first = new Date(year, mon, 1);
    const last = new Date(year, mon+1, 0);
    const startDay = first.getDay();
    const days = last.getDate();
    const cells = [];
    for (let i=0;i<startDay;i++) cells.push(null);
    for (let d=1; d<=days; d++) cells.push(new Date(year, mon, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const removeBlock = async (bid) => {
    try {
      await staysAPI.removeBlocked(id, bid);
      load();
    } catch { toast.error('Failed to remove'); }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center text-dark-600"><Loader2 className="animate-spin mr-2"/> Loading…</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="flex items-center mb-4"><CalendarClock className="text-primary mr-2"/><h1 className="text-2xl font-display font-bold text-dark-900">Manage Availability</h1></div>
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-dark-900">{listing?.title}</h3>
        <p className="text-sm text-dark-600">Type: {listing?.listing_type?.replace('_', ' ')}, Nightly: ₦{Number(listing?.nightly_rate||0).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-900 mb-2">Add Blocked Dates</h3>
          <form onSubmit={addBlocked} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Start</label>
              <input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="label">End</label>
              <input type="date" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Note</label>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button className="btn btn-primary">Block Dates</button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-dark-900 mb-2">Current Blocks</h3>
          {blocked.length === 0 ? (
            <p className="text-sm text-dark-600">None</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {blocked.map(b => (
                <li key={b.id} className="flex items-center justify-between border-b pb-2">
                  <span>{b.start_date} — {b.end_date} {b.note ? `• ${b.note}` : ''}</span>
                  <button className="btn btn-secondary btn-sm inline-flex items-center" onClick={() => removeBlock(b.id)}><Trash2 size={14} className="mr-1"/> Remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-2">
          <button className="btn btn-light btn-sm" onClick={prevMonth}>Prev</button>
          <h3 className="text-lg font-semibold text-dark-900">{monthLabel(month)}</h3>
          <button className="btn btn-light btn-sm" onClick={nextMonth}>Next</button>
        </div>
        <p className="text-xs text-dark-600 mb-2">Tip: Click and drag to block a range. Hold Alt and drag to unblock (removes overlapped blocked ranges).</p>
        <div className="grid grid-cols-7 gap-1 text-xs text-dark-600 mb-1">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {buildCalendar().map((cell, idx) => {
            if (!cell) return <div key={idx} className="h-10 bg-gray-50 rounded"/>;
            const ds = cell.toISOString().slice(0,10);
            const blockedDay = isInRanges(ds, blocked);
            const busyDay = isInRanges(ds, busy);
            const selected = inDragRange(cell);
            const base = busyDay ? 'bg-red-100 text-red-700' : blockedDay ? 'bg-amber-100 text-amber-700' : 'bg-white text-dark-800';
            const hover = busyDay ? '' : 'hover:bg-gray-50';
            const selCls = selected && !busyDay ? 'ring-2 ring-amber-400 bg-amber-50' : '';
            return (
              <button
                key={idx}
                className={`h-10 rounded border text-sm ${base} ${hover} ${selCls}`}
                onMouseDown={(e) => {
                  if (busyDay) return;
                  setDragging(true);
                  setDragStart(new Date(cell));
                  setDragEnd(new Date(cell));
                }}
                onMouseEnter={() => {
                  if (!dragging) return;
                  setDragEnd(new Date(cell));
                }}
                onMouseUp={async (evt) => {
                  if (!dragging) return;
                  const s = (dragStart < dragEnd ? dragStart : dragEnd) || dragStart;
                  const e = (dragEnd && (dragEnd > dragStart ? dragEnd : dragStart)) || dragStart;
                  setDragging(false);
                  if (!s || !e) return;
                  const ss = s.toISOString().slice(0,10);
                  const es = e.toISOString().slice(0,10);
                  if (evt.altKey) {
                    try {
                      const toRemove = blocked.filter(b => b.start_date >= ss && b.end_date <= es).map(b => b.id);
                      for (const bid of toRemove) { await staysAPI.removeBlocked(id, bid); }
                      await load();
                    } catch { toast.error('Failed to unblock'); }
                    return;
                  }
                  // ensure no busy in range
                  if (anyBusyInRange(s, e)) { toast.error('Dates intersect a confirmed booking'); return; }
                  try {
                    await staysAPI.addBlocked(id, ss, es, '');
                    await load();
                  } catch { toast.error('Failed'); }
                }}
                onClick={(e) => {
                  // Single click adds a single-day block when not dragging
                  if (dragging) return;
                  if (!busyDay) toggleDayBlock(cell);
                }}
              >{cell.getDate()}</button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs">
          <span className="px-2 py-1 rounded border bg-amber-100 text-amber-700">Blocked</span>
          <span className="px-2 py-1 rounded border bg-red-100 text-red-700">Busy</span>
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-dark-900 mb-2">Busy (Confirmed Bookings)</h3>
        {busy.length === 0 ? (
          <p className="text-sm text-dark-600">No confirmed bookings yet.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            {busy.map((r, idx) => (
              <li key={idx} className="rounded border px-2 py-1">{r.start_date} — {r.end_date}</li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
};

export default HostListingAvailability;
