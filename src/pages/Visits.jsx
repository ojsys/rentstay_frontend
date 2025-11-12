import { useEffect, useState } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell';
import { visitAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { CalendarClock, Check, X, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Visits = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(null);
  const [newDt, setNewDt] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await visitAPI.list();
      setItems(res.data.results || res.data || []);
    } catch (e) {
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, type) => {
    try {
      if (type === 'cancel') await visitAPI.setStatus(id, 'cancelled');
      if (type === 'approve') await visitAPI.setStatus(id, 'approved');
      if (type === 'decline') await visitAPI.setStatus(id, 'declined');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to update');
    }
  };

  const doReschedule = async (id) => {
    try {
      if (!newDt) { toast.error('Pick new date/time'); return; }
      await visitAPI.reschedule(id, new Date(newDt).toISOString());
      setRescheduling(null);
      setNewDt('');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to reschedule');
    }
  };

  return (
    <DashboardShell>
      <div className="flex items-center mb-4">
        <CalendarClock className="text-primary mr-2" />
        <h1 className="text-2xl font-display font-bold text-dark-900">Visits</h1>
      </div>
      <div className="card">
        {loading ? (
          <div className="flex items-center text-dark-600"><Loader2 className="animate-spin mr-2" /> Loading visits...</div>
        ) : items.length === 0 ? (
          <p className="text-dark-600 text-sm">No visits yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-dark-600">
                  <th className="py-2 pr-4">Property</th>
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Who</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(v => (
                  <tr key={v.id} className="border-t border-gray-100">
                    <td className="py-2 pr-4">{v.property?.title}</td>
                    <td className="py-2 pr-4">{new Date(v.scheduled_at).toLocaleString()}</td>
                    <td className="py-2 pr-4 capitalize">{v.status}</td>
                    <td className="py-2 pr-4">{user?.user_type === 'landlord' ? (v.tenant?.full_name || v.tenant?.email) : (v.landlord?.full_name || 'Landlord')}</td>
                    <td className="py-2 pr-4">
                      {user?.user_type === 'tenant' ? (
                        v.status === 'requested' || v.status === 'approved' ? (
                          <button className="btn btn-secondary btn-sm" onClick={() => act(v.id, 'cancel')}>Cancel</button>
                        ) : null
                      ) : (
                        <div className="flex items-center gap-2">
                          {v.status === 'requested' && <button className="btn btn-primary btn-sm inline-flex items-center" onClick={() => act(v.id, 'approve')}><Check size={14} className="mr-1" /> Approve</button>}
                          {v.status === 'requested' && <button className="btn btn-secondary btn-sm inline-flex items-center" onClick={() => act(v.id, 'decline')}><X size={14} className="mr-1" /> Decline</button>}
                          <button className="btn btn-light btn-sm inline-flex items-center" onClick={() => setRescheduling(v.id)}><RefreshCw size={14} className="mr-1" /> Reschedule</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                <button className="btn" onClick={() => setRescheduling(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => doReschedule(rescheduling)}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default Visits;

