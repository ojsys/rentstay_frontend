import { useEffect, useState } from 'react';
import { applicationAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardShell from '../components/dashboard/DashboardShell';
import { Navigate } from 'react-router-dom';

const Applications = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const isLandlord = user?.user_type === 'landlord';

  const load = async () => {
    try {
      setLoading(true);
      const res = await (isLandlord ? applicationAPI.listLandlord() : applicationAPI.listTenant());
      setItems(res.data.results || res.data || []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.user_type]);

  if (isLandlord) return <Navigate to="/dashboard/leases" replace />;

  const approve = async (id) => {
    try {
      setActionLoading(id);
      await applicationAPI.approve(id, 'Approved');
      toast.success('Application approved');
      load();
    } catch (e) {
      toast.error('Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id) => {
    try {
      setActionLoading(id);
      await applicationAPI.reject(id, 'Rejected');
      toast.success('Application rejected');
      load();
    } catch (e) {
      toast.error('Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardShell>
      <h1 className="text-3xl font-display font-bold text-dark-900 mb-6">Applications</h1>
      <div className="card">
        {loading ? (
          <div className="text-dark-600 flex items-center"><Loader2 className="animate-spin mr-2" /> Loading applications...</div>
        ) : items.length === 0 ? (
          <p className="text-dark-600">No applications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-dark-600">
                  <th className="py-2 pr-4">Property</th>
                  <th className="py-2 pr-4">Applicant</th>
                  <th className="py-2 pr-4">Message</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Date</th>
                  {isLandlord && <th className="py-2 pr-4">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-t border-gray-100">
                    <td className="py-2 pr-4">{a.property?.title}</td>
                    <td className="py-2 pr-4">{a.tenant?.full_name || a.tenant?.email}</td>
                    <td className="py-2 pr-4 max-w-[320px] truncate" title={a.message}>{a.message || '—'}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${a.status === 'approved' ? 'bg-green-100 text-green-700' : a.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{new Date(a.created_at).toLocaleString()}</td>
                    {isLandlord && (
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <button disabled={actionLoading === a.id} onClick={() => approve(a.id)} className="btn btn-primary btn-sm inline-flex items-center"><CheckCircle size={14} className="mr-1" /> Approve</button>
                          <button disabled={actionLoading === a.id} onClick={() => reject(a.id)} className="btn btn-secondary btn-sm inline-flex items-center"><XCircle size={14} className="mr-1" /> Reject</button>
                        </div>
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

export default Applications;
