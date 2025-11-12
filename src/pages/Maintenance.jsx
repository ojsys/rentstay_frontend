import { useEffect, useState } from 'react';
import { maintenanceAPI, dashboardAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import DashboardShell from '../components/dashboard/DashboardShell';
import { Wrench, Play, CheckCircle, Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const Maintenance = () => {
  const { user } = useAuthStore();
  const isLandlord = user?.user_type === 'landlord';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ property_id: '', title: '', description: '', priority: 'medium' });
  const [properties, setProperties] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await maintenanceAPI.list();
      setItems(res.data.results || res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    // For tenant create form, attempt to find property via dashboard agreement
    const loadAgreement = async () => {
      if (isLandlord) return;
      try {
        const res = await dashboardAPI.getTenant();
        const ag = res.data.agreement;
        if (ag?.property?.id) setForm(prev => ({ ...prev, property_id: ag.property.id }));
      } catch {}
    };
    loadAgreement();
  }, [isLandlord]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.property_id || !form.title || !form.description) {
      toast.error('Please fill all required fields');
      return;
    }
    setCreating(true);
    try {
      await maintenanceAPI.create(form);
      toast.success('Request submitted');
      setForm(prev => ({ ...prev, title: '', description: '', priority: 'medium' }));
      load();
    } catch {
      toast.error('Failed to submit');
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await maintenanceAPI.setStatus(id, status);
      toast.success(`Marked as ${status}`);
      load();
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <DashboardShell>
      <div className="flex items-center mb-4">
        <Wrench className="text-primary mr-2" />
        <h1 className="text-2xl font-display font-bold text-dark-900">Maintenance</h1>
      </div>

      {!isLandlord && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-dark-900 mb-3">New Request</h3>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Leaking roof" />
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="label">Description</label>
              <textarea className="input min-h-[100px]" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe the issue..." />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" disabled={creating} className="btn btn-primary">
                {creating ? 'Submitting...' : (<><Plus size={16} className="mr-1" /> Submit Request</>)}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold text-dark-900 mb-4">Requests</h3>
        {loading ? (
          <div className="text-dark-600 flex items-center"><Loader2 className="animate-spin mr-2" /> Loading...</div>
        ) : items.length === 0 ? (
          <p className="text-dark-600">No maintenance requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-dark-600">
                  <th className="py-2 pr-4">Property</th>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Created</th>
                  {isLandlord && <th className="py-2 pr-4">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id} className="border-t border-gray-100">
                    <td className="py-2 pr-4">{m.property?.title || m.property__title}</td>
                    <td className="py-2 pr-4">{m.title}</td>
                    <td className="py-2 pr-4 capitalize">{m.priority}</td>
                    <td className="py-2 pr-4 capitalize">{m.status}</td>
                    <td className="py-2 pr-4">{new Date(m.created_at).toLocaleString()}</td>
                    {isLandlord && (
                      <td className="py-2 pr-4 space-x-2">
                        <button onClick={() => updateStatus(m.id, 'in_progress')} className="btn btn-secondary btn-sm inline-flex items-center"><Play size={14} className="mr-1" /> Start</button>
                        <button onClick={() => updateStatus(m.id, 'completed')} className="btn btn-primary btn-sm inline-flex items-center"><CheckCircle size={14} className="mr-1" /> Complete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default Maintenance;

