import { useEffect, useState } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell';
import { paymentAPI, dashboardAPI } from '../services/api';
import { CreditCard, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { Navigate } from 'react-router-dom';

const Payments = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [agreement, setAgreement] = useState(null);
  const [caution, setCaution] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const hist = await paymentAPI.getPaymentHistory();
        setItems(hist.data || []);

        if (user?.user_type === 'tenant') {
          const dash = await dashboardAPI.getTenant().catch(() => ({ data: {} }));
          const ag = dash.data?.agreement;
          setAgreement(ag || null);
          if (ag?.id) {
            const cf = await paymentAPI.getCautionFeeStatus(ag.id);
            setCaution(cf.data || null);
          }
        } else {
          setAgreement(null);
          setCaution(null);
        }
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.user_type]);

  if (user?.user_type === 'landlord') return <Navigate to="/dashboard/payments" replace />;

  return (
    <DashboardShell>
      <div className="flex items-center mb-4">
        <CreditCard className="text-primary mr-2" />
        <h1 className="text-2xl font-display font-bold text-dark-900">Payments</h1>
      </div>

      {agreement && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-dark-900 mb-2">Current Agreement</h3>
          <p className="text-sm text-dark-700"><span className="font-medium">Property:</span> {agreement.property.title}</p>
          <p className="text-sm text-dark-700"><span className="font-medium">Rent:</span> ₦{Number(agreement.rent_amount).toLocaleString()}</p>
          <p className="text-sm text-dark-700"><span className="font-medium">Caution Fee:</span> ₦{Number(agreement.caution_fee).toLocaleString()}</p>
          {caution && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-dark-600">Caution Principal</p>
                <p className="font-semibold">₦{Number(caution.principal || caution.expected || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-dark-600">Interest</p>
                <p className="font-semibold">₦{Number(caution.interest_accrued || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-dark-600">Refundable</p>
                <p className="font-semibold">₦{Number(caution.refundable_amount || 0).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold text-dark-900 mb-4">Payment History</h3>
        {loading ? (
          <div className="text-dark-600 flex items-center"><Loader2 className="animate-spin mr-2" /> Loading...</div>
        ) : items.length === 0 ? (
          <p className="text-dark-600">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-dark-600">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="py-2 pr-4">{new Date(p.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-4 capitalize">{p.payment_type?.replace('_', ' ')}</td>
                    <td className="py-2 pr-4">₦{Number(p.amount).toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${p.status === 'success' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {p.status}
                      </span>
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

export default Payments;
