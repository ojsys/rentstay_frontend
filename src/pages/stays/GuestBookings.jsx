import { useEffect, useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { staysAPI } from '../../services/api';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const GuestBookings = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await staysAPI.getBookingsGuest();
        setItems(res.data.results || res.data || []);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const pay = async (id) => {
    try {
      const res = await staysAPI.initBookingPayment(id);
      const url = res.data?.authorization_url;
      if (url) window.location.href = url;
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to init payment');
    }
  };

  return (
    <DashboardShell>
      <div className="card">
        <h1 className="text-xl font-semibold mb-3">My Stays</h1>
        {loading ? (
          <div className="text-dark-600 flex items-center"><Loader2 className="animate-spin mr-2"/> Loading…</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-dark-600">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr className="text-left text-dark-600"><th className="py-2 pr-4">Listing</th><th className="py-2 pr-4">Dates</th><th className="py-2 pr-4">Total</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Actions</th></tr></thead>
              <tbody>
                {items.map(b => (
                  <tr key={b.id} className="border-t border-gray-100">
                    <td className="py-2 pr-4">{b.listing?.title}</td>
                    <td className="py-2 pr-4">{b.check_in} — {b.check_out}</td>
                    <td className="py-2 pr-4">₦{Number(b.amount_total).toLocaleString()}</td>
                    <td className="py-2 pr-4 capitalize">{b.status.replace('_', ' ')}</td>
                    <td className="py-2 pr-4">
                      {b.status === 'approved' && (
                        <button className="btn btn-primary btn-sm" onClick={() => pay(b.id)}>Pay Now</button>
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

export default GuestBookings;
