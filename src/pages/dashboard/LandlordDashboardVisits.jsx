import { useEffect, useState } from 'react';
import { visitAPI } from '../../services/api';
import { CalendarClock, Check, X, RefreshCw, Loader2, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors = {
  requested: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-dark-600',
};

const LandlordDashboardVisits = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [rescheduling, setRescheduling] = useState(null);
  const [newDt, setNewDt] = useState('');

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
    try {
      if (type === 'approve') await visitAPI.setStatus(id, 'approved');
      if (type === 'decline') await visitAPI.setStatus(id, 'declined');
      toast.success(`Visit ${type}d`);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to update');
    }
  };

  const doReschedule = async (id) => {
    try {
      if (!newDt) { toast.error('Pick new date/time'); return; }
      await visitAPI.reschedule(id, new Date(newDt).toISOString());
      toast.success('Rescheduled');
      setRescheduling(null);
      setNewDt('');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to reschedule');
    }
  };

  // Compute stats
  const stats = {
    requested: items.filter(v => v.status === 'requested').length,
    approved: items.filter(v => v.status === 'approved').length,
    completed: items.filter(v => v.status === 'completed').length,
    cancelled: items.filter(v => v.status === 'cancelled').length,
  };

  const filtered = statusFilter ? items.filter(v => v.status === statusFilter) : items;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-dark-900">Visits</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <Clock size={20} className="mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold text-dark-900">{stats.requested}</p>
          <p className="text-xs text-dark-600">Pending</p>
        </div>
        <div className="card text-center">
          <CheckCircle size={20} className="mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold text-dark-900">{stats.approved}</p>
          <p className="text-xs text-dark-600">Approved</p>
        </div>
        <div className="card text-center">
          <AlertTriangle size={20} className="mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold text-dark-900">{stats.completed}</p>
          <p className="text-xs text-dark-600">Completed</p>
        </div>
        <div className="card text-center">
          <XCircle size={20} className="mx-auto text-dark-400 mb-1" />
          <p className="text-2xl font-bold text-dark-900">{stats.cancelled}</p>
          <p className="text-xs text-dark-600">Cancelled</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {['', 'requested', 'approved', 'declined', 'completed', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Visit list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading visits...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <CalendarClock size={48} className="mx-auto text-dark-300 mb-3" />
          <p className="text-dark-600">No visits found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => (
            <div key={v.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-dark-900 truncate">{v.property?.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[v.status] || 'bg-gray-100 text-dark-600'}`}>{v.status}</span>
                  </div>
                  <p className="text-sm text-dark-600">
                    <span className="font-medium">When:</span> {new Date(v.scheduled_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-dark-600">
                    <span className="font-medium">Tenant:</span> {v.tenant?.full_name || v.tenant?.email || 'N/A'}
                  </p>
                  {v.note && <p className="text-xs text-dark-500 mt-0.5">Note: {v.note}</p>}
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  {v.status === 'requested' && (
                    <>
                      <button className="btn btn-primary btn-sm inline-flex items-center" onClick={() => act(v.id, 'approve')}><Check size={14} className="mr-1" /> Approve</button>
                      <button className="btn btn-secondary btn-sm inline-flex items-center" onClick={() => act(v.id, 'decline')}><X size={14} className="mr-1" /> Decline</button>
                    </>
                  )}
                  <button className="btn btn-light btn-sm inline-flex items-center" onClick={() => { setRescheduling(v.id); setNewDt(''); }}><RefreshCw size={14} className="mr-1" /> Reschedule</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduling && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl w-[92vw] max-w-md p-5">
            <h3 className="text-lg font-semibold text-dark-900 mb-3">Reschedule Visit</h3>
            <div className="space-y-3">
              <div>
                <label className="label">New Date & Time</label>
                <input type="datetime-local" className="input w-full" value={newDt} onChange={(e) => setNewDt(e.target.value)} />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button className="btn btn-secondary" onClick={() => setRescheduling(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => doReschedule(rescheduling)}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandlordDashboardVisits;
