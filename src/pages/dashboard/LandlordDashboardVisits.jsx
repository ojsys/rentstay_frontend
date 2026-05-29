import { useEffect, useState } from 'react';
import { visitAPI } from '../../services/api';
import { CalendarClock, Check, X, RefreshCw, Loader2, Clock, CheckCircle, XCircle, MapPin, User } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  requested: { label: 'Pending',   cls: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  approved:  { label: 'Approved',  cls: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  declined:  { label: 'Declined',  cls: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
  completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400' },
};

const FILTERS = ['', 'requested', 'approved', 'declined', 'completed', 'cancelled'];

const LandlordDashboardVisits = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [rescheduling, setRescheduling] = useState(null);
  const [newDt, setNewDt] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const res = await visitAPI.list();
      setItems(res.data.results || res.data || []);
    } catch {
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, type) => {
    setActionLoading(l => ({ ...l, [id]: type }));
    try {
      if (type === 'approve') await visitAPI.setStatus(id, 'approved');
      if (type === 'decline') await visitAPI.setStatus(id, 'declined');
      toast.success(`Visit ${type}d`);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to update');
    } finally {
      setActionLoading(l => ({ ...l, [id]: null }));
    }
  };

  const doReschedule = async (id) => {
    if (!newDt) { toast.error('Pick new date/time'); return; }
    try {
      await visitAPI.reschedule(id, new Date(newDt).toISOString());
      toast.success('Rescheduled');
      setRescheduling(null);
      setNewDt('');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to reschedule');
    }
  };

  const stats = {
    requested: items.filter(v => v.status === 'requested').length,
    approved:  items.filter(v => v.status === 'approved').length,
    completed: items.filter(v => v.status === 'completed').length,
    cancelled: items.filter(v => v.status === 'cancelled').length,
  };

  const filtered = statusFilter ? items.filter(v => v.status === statusFilter) : items;

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-lg md:text-xl font-bold text-gray-900">Property Visits</h2>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {[
          { icon: Clock,       label: 'Pending',   value: stats.requested, color: 'text-amber-500', bg: 'bg-amber-50' },
          { icon: CheckCircle, label: 'Approved',  value: stats.approved,  color: 'text-green-500', bg: 'bg-green-50' },
          { icon: CalendarClock, label: 'Done',    value: stats.completed, color: 'text-blue-500',  bg: 'bg-blue-50' },
          { icon: XCircle,     label: 'Cancelled', value: stats.cancelled, color: 'text-gray-400',  bg: 'bg-gray-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center gap-1">
            <div className={`w-7 h-7 md:w-9 md:h-9 ${bg} rounded-xl flex items-center justify-center`}>
              <Icon size={14} className={`md:w-4 md:h-4 ${color}`} />
            </div>
            <p className="text-lg md:text-xl font-bold text-gray-900 leading-tight">{value}</p>
            <p className="text-[10px] text-gray-400 font-medium text-center leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              statusFilter === s ? 'bg-[#0C3B2E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'All' : STATUS_STYLES[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="animate-spin mr-2" /> Loading visits...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarClock size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No visits found</p>
          <p className="text-sm text-gray-400 mt-1">Visit requests from tenants will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => {
            const style = STATUS_STYLES[v.status] || { label: v.status, cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
            const scheduledDate = new Date(v.scheduled_at);
            const isLoading = actionLoading[v.id];
            const tenantName = v.tenant?.full_name || v.tenant?.email || 'N/A';
            const initial = tenantName[0]?.toUpperCase();

            return (
              <div key={v.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className={`h-1 w-full ${style.dot}`} />
                <div className="p-4">
                  {/* Property + status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                        <p className="font-semibold text-gray-900 truncate text-sm">{v.property?.title}</p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${style.cls}`}>
                      {style.label}
                    </span>
                  </div>

                  {/* Tenant + scheduled time */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#0C3B2E] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{tenantName}</p>
                      <p className="text-xs text-gray-400">
                        {scheduledDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {' · '}
                        {scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {v.note && (
                    <p className="text-xs text-gray-400 italic mb-3 pl-11">"{v.note}"</p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {v.status === 'requested' && (
                      <>
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-60"
                          onClick={() => act(v.id, 'approve')}
                          disabled={!!isLoading}
                        >
                          {isLoading === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          Approve
                        </button>
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition disabled:opacity-60"
                          onClick={() => act(v.id, 'decline')}
                          disabled={!!isLoading}
                        >
                          {isLoading === 'decline' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                          Decline
                        </button>
                      </>
                    )}
                    <button
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition"
                      onClick={() => { setRescheduling(v.id); setNewDt(''); }}
                    >
                      <RefreshCw size={14} /> Reschedule
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule bottom sheet */}
      {rescheduling && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setRescheduling(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl p-6">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reschedule Visit</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">New Date & Time</label>
                <input
                  type="datetime-local"
                  className="input w-full"
                  value={newDt}
                  onChange={(e) => setNewDt(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold"
                  onClick={() => setRescheduling(null)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-3 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226]"
                  onClick={() => doReschedule(rescheduling)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LandlordDashboardVisits;
