import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import DashboardShell from '../components/dashboard/DashboardShell';
import { rentalAPI } from '../services/api';
import { FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const Agreements = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await rentalAPI.getAgreements();
        const data = res.data.results || res.data || [];
        setItems(data);
      } catch (e) {
        toast.error('Failed to load agreements');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (user?.user_type === 'landlord') return <Navigate to="/dashboard/leases" replace />;

  return (
    <DashboardShell>
      <div className="flex items-center mb-4">
        <FileText className="text-primary mr-2" />
        <h1 className="text-2xl font-display font-bold text-dark-900">Agreements</h1>
      </div>
      <div className="card">
        {loading ? (
          <div className="flex items-center text-dark-600"><Loader2 className="animate-spin mr-2" /> Loading agreements...</div>
        ) : items.length === 0 ? (
          <p className="text-dark-600 text-sm">No agreements found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-dark-600">
                  <th className="py-2 pr-4">Property</th>
                  <th className="py-2 pr-4">Tenant</th>
                  <th className="py-2 pr-4">Period</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((ag) => (
                  <tr key={ag.id} className="border-t border-gray-100">
                    <td className="py-2 pr-4">{ag.property?.title}</td>
                    <td className="py-2 pr-4">{ag.tenant?.full_name || ag.tenant?.email}</td>
                    <td className="py-2 pr-4">{ag.start_date} — {ag.end_date}</td>
                    <td className="py-2 pr-4 capitalize">{ag.status}</td>
                    <td className="py-2 pr-4"><Link className="text-primary" to={`/agreements/${ag.id}`}>View</Link></td>
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

export default Agreements;

