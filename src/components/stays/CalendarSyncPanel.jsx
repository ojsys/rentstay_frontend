import { useEffect, useState } from 'react';
import {
  Link2, Plus, RefreshCw, Trash2, Copy, Check, AlertTriangle, Loader2, Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staysAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';

const STATUS_STYLES = {
  ok: 'bg-emerald-100 text-emerald-700',
  error: 'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-500',
};

const relative = (iso) => {
  if (!iso) return 'never';
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

/**
 * Two-way iCal sync for one listing.
 *
 * Import: subscribe to the .ics feeds Airbnb / Booking.com / Google publish, so
 * a guest booked elsewhere blocks those nights here.
 * Export: hand the other platforms this listing's feed so RentStay bookings
 * block the nights there.
 */
const CalendarSyncPanel = ({ listingId, onChanged }) => {
  const [exportUrl, setExportUrl] = useState('');
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const load = async () => {
    try {
      const { data } = await staysAPI.getCalendars(listingId);
      setExportUrl(data.export_url || '');
      setConnections(data.connections || []);
    } catch {
      toast.error('Could not load calendar settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [listingId]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — select the link and copy manually');
    }
  };

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) { toast.error('Give the calendar a name and URL'); return; }
    setAdding(true);
    try {
      const { data } = await staysAPI.addCalendar(listingId, name.trim(), url.trim());
      if (data.last_status === 'error') {
        toast.error(`Connected, but the first sync failed: ${data.last_error}`);
      } else {
        toast.success(`Connected — ${data.last_event_count} blocked range(s) imported`);
      }
      setName(''); setUrl(''); setShowForm(false);
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not connect that calendar'));
    } finally {
      setAdding(false);
    }
  };

  const syncNow = async (connectionId) => {
    setSyncing(true);
    try {
      const { data } = await staysAPI.syncCalendars(listingId, connectionId);
      const failed = (data.results || []).filter(r => r.error);
      if (failed.length) toast.error(`${failed.length} calendar(s) failed to sync`);
      else {
        const total = (data.results || []).reduce((n, r) => n + r.imported, 0);
        toast.success(`Synced — ${total} blocked range(s)`);
      }
      setConnections(data.connections || []);
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Sync failed'));
    } finally {
      setSyncing(false);
    }
  };

  const remove = async (connectionId, connName) => {
    try {
      await staysAPI.removeCalendar(listingId, connectionId);
      toast.success(`${connName} disconnected — its dates are free again`);
      await load();
      onChanged?.();
    } catch {
      toast.error('Could not disconnect');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-2 text-gray-400 text-sm">
        <Loader2 size={15} className="animate-spin" /> Loading calendar sync…
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Link2 size={14} /> Calendar sync
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Keep this listing in step with Airbnb, Booking.com or Google Calendar.
          </p>
        </div>
        {connections.length > 0 && (
          <button
            onClick={() => syncNow(null)}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} /> Sync now
          </button>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Export — give this to the other platforms */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            This listing&apos;s feed
          </p>
          <p className="text-xs text-gray-500 mb-2">
            Paste this into Airbnb or Booking.com so bookings taken here block the dates there.
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={exportUrl}
              onFocus={(e) => e.target.select()}
              className="input flex-1 text-xs font-mono bg-gray-50"
            />
            <button
              onClick={copy}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-xs font-semibold hover:bg-[#0a3226] transition flex-shrink-0"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            Anyone with this link can see which dates are taken — but not who booked them.
          </p>
        </div>

        {/* Import — subscribe to their feeds */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Connected calendars
            </p>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-[#0C3B2E] hover:underline"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {connections.length === 0 && !showForm && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
              No calendars connected. Add the .ics link from Airbnb or Booking.com to
              block dates booked there.
            </p>
          )}

          <div className="space-y-2">
            {connections.map(c => (
              <div key={c.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <Globe size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[c.last_status]}`}>
                        {c.last_status === 'ok' ? `${c.last_event_count} blocked` : c.last_status_display}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{c.url}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Synced {relative(c.last_synced_at)}</p>
                    {c.last_status === 'error' && c.last_error && (
                      <p className="text-[11px] text-red-600 mt-1 flex items-start gap-1">
                        <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
                        {c.last_error}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => syncNow(c.id)}
                      disabled={syncing}
                      title="Sync this calendar now"
                      className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40"
                    >
                      <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                    </button>
                    <button
                      onClick={() => remove(c.id, c.name)}
                      title="Disconnect"
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showForm && (
            <form onSubmit={add} className="border border-gray-200 rounded-xl p-3 mt-2 space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  className="input w-full text-sm"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Airbnb"
                  /* Matches the column. Hosts paste the feed URL in here, which
                     used to reach the database and fail with a 500. */
                  maxLength={100}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Just a label so you can tell your calendars apart — the link
                  goes below.
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Feed URL (.ics)
                </label>
                <input
                  className="input w-full text-sm font-mono"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.airbnb.com/calendar/ical/12345.ics?s=…"
                  maxLength={500}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-xs font-semibold hover:bg-[#0a3226] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {adding && <Loader2 size={12} className="animate-spin" />}
                  Connect &amp; sync
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarSyncPanel;
