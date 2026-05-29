import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { staysAPI } from '../../services/api';
import { Loader2, CalendarClock, Trash2, ChevronLeft, ChevronRight, ArrowLeft, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const HostListingAvailability = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [blocked, setBlocked] = useState([]);
  const [busy, setBusy] = useState([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [note, setNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);

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
    } catch { toast.error('Failed to load listing'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const addBlocked = async (e) => {
    e.preventDefault();
    if (!start || !end) { toast.error('Select start and end dates'); return; }
    try {
      await staysAPI.addBlocked(id, start, end, note);
      setStart(''); setEnd(''); setNote('');
      setShowAddForm(false);
      load();
      toast.success('Dates blocked');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const isInRanges = (dateStr, ranges) => {
    const ds = new Date(dateStr).toISOString().slice(0, 10);
    return ranges.some(r => ds >= r.start_date && ds <= r.end_date);
  };

  const inDragRange = (cell) => {
    if (!dragging || !dragStart) return false;
    const s = dragStart < (dragEnd || dragStart) ? dragStart : (dragEnd || dragStart);
    const e = (dragEnd || dragStart) > dragStart ? (dragEnd || dragStart) : dragStart;
    const ds = cell.toISOString().slice(0, 10);
    return ds >= s.toISOString().slice(0, 10) && ds <= e.toISOString().slice(0, 10);
  };

  const anyBusyInRange = (s, e) => {
    const cur = new Date(s);
    while (cur <= e) {
      if (isInRanges(cur.toISOString().slice(0, 10), busy)) return true;
      cur.setDate(cur.getDate() + 1);
    }
    return false;
  };

  const prevMonth = () => { const d = new Date(month); d.setMonth(d.getMonth() - 1); setMonth(d); };
  const nextMonth = () => { const d = new Date(month); d.setMonth(d.getMonth() + 1); setMonth(d); };

  const buildCalendar = () => {
    const year = month.getFullYear();
    const mon = month.getMonth();
    const first = new Date(year, mon, 1);
    const last = new Date(year, mon + 1, 0);
    const cells = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(null);
    for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, mon, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const removeBlock = async (bid) => {
    try { await staysAPI.removeBlocked(id, bid); load(); }
    catch { toast.error('Failed to remove'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="animate-spin" size={20} /> Loading…
        </div>
      </div>
    );
  }

  const calendar = buildCalendar();

  return (
    <div className="dashboard-theme min-h-screen bg-gray-50 pb-8">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-[#0C3B2E] md:bg-white md:border-b md:border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 md:py-4 max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white md:text-gray-600 hover:text-gray-900 transition font-medium text-sm"
          >
            <ArrowLeft size={18} />
            <span className="hidden md:inline">Back</span>
          </button>
          <h1 className="text-base font-bold text-white md:text-gray-900">Manage Availability</h1>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 md:bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-white/30 md:hover:bg-[#0a3226] transition"
          >
            <Plus size={14} /> Block
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Listing summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="font-bold text-gray-900">{listing?.title}</p>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">
            {listing?.listing_type?.replace('_', ' ')} · ₦{Number(listing?.nightly_rate || 0).toLocaleString()}/night
          </p>
        </div>

        {/* Add blocked dates (collapsible) */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Block a date range</h3>
            <form onSubmit={addBlocked} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start</label>
                  <input type="date" className="input w-full" value={start} onChange={(e) => setStart(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">End</label>
                  <input type="date" className="input w-full" value={end} onChange={(e) => setEnd(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Note (optional)</label>
                <input className="input w-full" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Maintenance, personal use…" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition">
                  Block Dates
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <button onClick={prevMonth} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <h3 className="text-sm font-bold text-gray-900">
              {month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={nextMonth} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
          <div className="p-3">
            <p className="text-[10px] text-gray-400 mb-2 text-center">Tap to toggle a day. Drag to select range. Hold Alt + drag to unblock.</p>
            <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-400 mb-1 text-center">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendar.map((cell, idx) => {
                if (!cell) return <div key={idx} className="aspect-square" />;
                const ds = cell.toISOString().slice(0, 10);
                const isBlocked = isInRanges(ds, blocked);
                const isBusy = isInRanges(ds, busy);
                const isSelected = inDragRange(cell);
                const isPast = cell < new Date(new Date().setHours(0, 0, 0, 0));
                let cls = 'bg-white text-gray-700 hover:bg-gray-50';
                if (isPast) cls = 'bg-gray-50 text-gray-300 cursor-not-allowed';
                else if (isBusy) cls = 'bg-red-100 text-red-700 cursor-not-allowed';
                else if (isBlocked) cls = 'bg-amber-100 text-amber-700';
                else if (isSelected) cls = 'bg-[#0C3B2E]/20 text-[#0C3B2E] ring-1 ring-[#0C3B2E]';
                return (
                  <button
                    key={idx}
                    className={`aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition select-none ${cls}`}
                    onMouseDown={() => {
                      if (isBusy || isPast) return;
                      setDragging(true);
                      setDragStart(new Date(cell));
                      setDragEnd(new Date(cell));
                    }}
                    onMouseEnter={() => { if (dragging) setDragEnd(new Date(cell)); }}
                    onMouseUp={async (evt) => {
                      if (!dragging) return;
                      const s = dragStart < (dragEnd || dragStart) ? dragStart : (dragEnd || dragStart);
                      const e = (dragEnd || dragStart) > dragStart ? (dragEnd || dragStart) : dragStart;
                      setDragging(false);
                      const ss = s.toISOString().slice(0, 10);
                      const es = e.toISOString().slice(0, 10);
                      if (evt.altKey) {
                        try {
                          const toRemove = blocked.filter(b => b.start_date >= ss && b.end_date <= es).map(b => b.id);
                          for (const bid of toRemove) await staysAPI.removeBlocked(id, bid);
                          await load();
                        } catch { toast.error('Failed to unblock'); }
                        return;
                      }
                      if (anyBusyInRange(s, e)) { toast.error('Selected range includes a confirmed booking'); return; }
                      try { await staysAPI.addBlocked(id, ss, es, ''); await load(); }
                      catch { toast.error('Failed'); }
                    }}
                    onClick={async () => {
                      if (isBusy || isPast || dragging) return;
                      try {
                        if (isBlocked) {
                          const match = blocked.find(b => ds >= b.start_date && ds <= b.end_date);
                          if (match) { await staysAPI.removeBlocked(id, match.id); await load(); }
                        } else {
                          await staysAPI.addBlocked(id, ds, ds, '');
                          await load();
                        }
                      } catch { toast.error('Failed'); }
                    }}
                  >
                    {cell.getDate()}
                  </button>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-3 rounded bg-amber-100" /> Blocked
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-3 rounded bg-red-100" /> Confirmed booking
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-3 rounded bg-gray-100" /> Unavailable
              </div>
            </div>
          </div>
        </div>

        {/* Current blocks */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Blocked Ranges ({blocked.length})</h3>
          </div>
          {blocked.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">No blocked dates. Tap calendar days or use the Block button.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {blocked.map(b => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {b.start_date === b.end_date ? b.start_date : `${b.start_date} → ${b.end_date}`}
                    </p>
                    {b.note && <p className="text-xs text-gray-400">{b.note}</p>}
                  </div>
                  <button
                    onClick={() => removeBlock(b.id)}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmed bookings */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Confirmed Bookings ({busy.length})</h3>
          </div>
          {busy.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">No confirmed bookings yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {busy.map((r, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-gray-900">{r.start_date} → {r.end_date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostListingAvailability;
