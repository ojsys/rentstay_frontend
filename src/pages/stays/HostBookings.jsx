import { useEffect, useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { staysAPI } from '../../services/api';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const HostBookings = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      const res = await staysAPI.getBookingsHost();
      setItems(res.data.results || res.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    try { await staysAPI.approveBooking(id); toast.success('Approved'); load(); } catch { toast.error('Failed'); }
  };

  return (
    <DashboardShell>
      <div className="card">
        <h1 className="text-xl font-semibold mb-3">Guest Bookings</h1>
        {loading ? (
          <div className="text-dark-600 flex items-center"><Loader2 className="animate-spin mr-2"/> Loading…</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-dark-600">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr className="text-left text-dark-600"><th className="py-2 pr-4">Listing</th><th className="py-2 pr-4">Guest</th><th className="py-2 pr-4">Dates</th><th className="py-2 pr-4">Total</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Actions</th></tr></thead>
              <tbody>
                {items.map(b => (
                  <tr key={b.id} className="border-t border-gray-100">
                    <td className="py-2 pr-4">{b.listing?.title}</td>
                    <td className="py-2 pr-4">{b.guest?.full_name || b.guest?.email}</td>
                    <td className="py-2 pr-4">{b.check_in} — {b.check_out}</td>
                    <td className="py-2 pr-4">₦{Number(b.amount_total).toLocaleString()}</td>
                    <td className="py-2 pr-4 capitalize">{b.status.replace('_', ' ')}</td>
                    <td className="py-2 pr-4">
                      {b.status === 'pending' && (
                        <button className="btn btn-primary btn-sm" onClick={() => approve(b.id)}>Approve</button>
                      )}
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

export default HostBookings;
