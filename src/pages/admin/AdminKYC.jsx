import { useEffect, useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { authAPI } from '../../services/api';
import { Loader2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const AdminKYC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [notes, setNotes] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const res = await authAPI.listVerificationRequests(filter);
      setItems(res.data || []);
    } catch (e) {
      toast.error('Failed to load KYC requests');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const decide = async (id, decision) => {
    try {
      await authAPI.decideVerification(id, decision, notes[id] || '');
      toast.success(`Request ${decision}`);
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  if (!user?.is_staff && user?.user_type !== 'admin') {
    return (
      <DashboardShell>
        <div className="card">Forbidden</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold">KYC Requests</h1>
          <select className="input w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {loading ? (
          <div className="text-dark-600 flex items-center"><Loader2 className="animate-spin mr-2"/> Loading…</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-dark-600">No requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr className="text-left text-dark-600"><th className="py-2 pr-4">User</th><th className="py-2 pr-4">ID Type</th><th className="py-2 pr-4">Number</th><th className="py-2 pr-4">Docs</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Notes</th><th className="py-2 pr-4">Actions</th></tr></thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="py-2 pr-4">{r.user?.full_name || r.user?.email}</td>
                    <td className="py-2 pr-4">{r.id_type || '—'}</td>
                    <td className="py-2 pr-4">{r.id_number || '—'}</td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        {r.id_document && <a className="text-primary" href={r.id_document} target="_blank" rel="noreferrer">ID Doc</a>}
                        {r.selfie && <a className="text-primary" href={r.selfie} target="_blank" rel="noreferrer">Selfie</a>}
                        {r.address_document && <a className="text-primary" href={r.address_document} target="_blank" rel="noreferrer">Address Doc</a>}
                      </div>
                    </td>
                    <td className="py-2 pr-4 capitalize">{r.status}</td>
                    <td className="py-2 pr-4">
                      <input className="input" placeholder="notes" value={notes[r.id] || ''} onChange={(e) => setNotes(n => ({ ...n, [r.id]: e.target.value }))} />
                    </td>
                    <td className="py-2 pr-4">
                      {r.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button className="btn btn-primary btn-sm inline-flex items-center" onClick={() => decide(r.id, 'approved')}><Check size={14} className="mr-1"/> Approve</button>
                          <button className="btn btn-secondary btn-sm inline-flex items-center" onClick={() => decide(r.id, 'rejected')}><X size={14} className="mr-1"/> Reject</button>
                        </div>
                      ) : '—'}
                    </td>
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

export default AdminKYC;

