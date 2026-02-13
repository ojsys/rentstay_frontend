import { useEffect, useState } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell';
import { paymentAPI, dashboardAPI } from '../services/api';
import { CreditCard, Loader2, Calendar, CalendarDays, CheckCircle, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PaystackPop from '@paystack/inline-js';

const Payments = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [agreement, setAgreement] = useState(null);
  const [caution, setCaution] = useState(null);
  const [paymentFrequency, setPaymentFrequency] = useState('annual');
  const [paying, setPaying] = useState(false);
  const { user } = useAuthStore();

  const loadData = async () => {
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

  useEffect(() => {
    loadData();
  }, [user?.user_type]);

  if (user?.user_type === 'landlord') return <Navigate to="/dashboard/payments" replace />;

  // Calculate amounts based on frequency and rent_term
  const rentTerm = agreement?.rent_term || 'annual';
  const baseRent = Number(agreement?.rent_amount || 0);
  const cautionFee = Number(agreement?.caution_fee || 0);

  // Convert the base rent to annual and monthly equivalents
  let annualRent, monthlyRent;
  if (rentTerm === 'monthly') {
    monthlyRent = baseRent;
    annualRent = baseRent * 12;
  } else if (rentTerm === 'biannual') {
    annualRent = baseRent * 2;
    monthlyRent = Math.round((baseRent / 6) * 100) / 100;
  } else {
    // annual (default)
    annualRent = baseRent;
    monthlyRent = Math.round((baseRent / 12) * 100) / 100;
  }

  const selectedAmount = paymentFrequency === 'annual' ? annualRent : monthlyRent;
  const frequencyLabel = paymentFrequency === 'annual' ? 'Yearly' : 'Monthly';

  const handlePayRent = async () => {
    if (!agreement?.id) return;
    setPaying(true);
    try {
      const res = await paymentAPI.preparePayment({
        payment_type: 'rent',
        agreement_id: agreement.id,
        amount: selectedAmount,
        description: `Rent payment (${frequencyLabel.toLowerCase()})`,
      });
      const { reference, amount, email, publicKey } = res.data || {};
      if (!reference || !amount || !publicKey) {
        toast.error('Failed to prepare payment.');
        setPaying(false);
        return;
      }
      const popup = new PaystackPop();
      popup.newTransaction({
        key: publicKey,
        email,
        amount,
        reference,
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        onSuccess: async (transaction) => {
          try {
            await paymentAPI.verifyPayment(transaction.reference || reference);
            toast.success('Payment successful!');
            loadData();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
          setPaying(false);
        },
        onCancel: () => {
          toast('Payment cancelled.');
          setPaying(false);
        },
      });
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to initialize payment');
      setPaying(false);
    }
  };

  const handlePayCaution = async () => {
    if (!agreement?.id) return;
    setPaying(true);
    try {
      const res = await paymentAPI.preparePayment({
        payment_type: 'caution_fee',
        agreement_id: agreement.id,
      });
      const { reference, amount, email, publicKey } = res.data || {};
      if (!reference || !amount || !publicKey) {
        toast.error('Failed to prepare payment.');
        setPaying(false);
        return;
      }
      const popup = new PaystackPop();
      popup.newTransaction({
        key: publicKey,
        email,
        amount,
        reference,
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        onSuccess: async (transaction) => {
          try {
            await paymentAPI.verifyPayment(transaction.reference || reference);
            toast.success('Caution fee paid successfully!');
            loadData();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
          setPaying(false);
        },
        onCancel: () => {
          toast('Payment cancelled.');
          setPaying(false);
        },
      });
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to initialize payment');
      setPaying(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex items-center mb-4">
        <CreditCard className="text-primary mr-2" />
        <h1 className="text-2xl font-display font-bold text-dark-900">Payments</h1>
      </div>

      {agreement && (
        <>
          {/* Current Agreement Info */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-2">Current Agreement</h3>
            <p className="text-sm text-dark-700">
              <span className="font-medium">Property:</span> {agreement.property?.title}
            </p>
            <p className="text-sm text-dark-700">
              <span className="font-medium">Period:</span> {agreement.start_date} to {agreement.end_date}
            </p>
          </div>

          {/* Payment Frequency Selection */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">Pay Rent</h3>

            {/* Frequency Toggle */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-dark-700 mb-2">Payment Frequency</label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  onClick={() => setPaymentFrequency('annual')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    paymentFrequency === 'annual'
                      ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300 text-dark-700'
                  }`}
                >
                  <Calendar size={20} />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Yearly</div>
                    <div className="text-xs opacity-70">Pay once a year</div>
                  </div>
                </button>
                <button
                  onClick={() => setPaymentFrequency('monthly')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    paymentFrequency === 'monthly'
                      ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300 text-dark-700'
                  }`}
                >
                  <CalendarDays size={20} />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Monthly</div>
                    <div className="text-xs opacity-70">Pay every month</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Amount Breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-dark-500 uppercase tracking-wide mb-1">Annual Rent</p>
                  <p className={`text-lg font-bold ${paymentFrequency === 'annual' ? 'text-primary' : 'text-dark-600'}`}>
                    ₦{annualRent.toLocaleString()}
                    <span className="text-xs font-normal text-dark-500 ml-1">/year</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-500 uppercase tracking-wide mb-1">Monthly Equivalent</p>
                  <p className={`text-lg font-bold ${paymentFrequency === 'monthly' ? 'text-primary' : 'text-dark-600'}`}>
                    ₦{monthlyRent.toLocaleString()}
                    <span className="text-xs font-normal text-dark-500 ml-1">/month</span>
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-dark-700">Amount to Pay ({frequencyLabel})</span>
                  <span className="text-xl font-bold text-primary">₦{selectedAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Pay Rent Button */}
            <button
              onClick={handlePayRent}
              disabled={paying || !agreement}
              className="btn btn-primary w-full md:w-auto inline-flex items-center justify-center gap-2"
            >
              {paying ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <CreditCard size={18} />
              )}
              {paying ? 'Processing...' : `Pay ₦${selectedAmount.toLocaleString()} (${frequencyLabel})`}
            </button>
          </div>

          {/* Caution Fee Section */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-3">Caution Fee</h3>
            {agreement.caution_fee_paid || caution?.paid ? (
              <>
                <div className="flex items-center gap-2 text-green-700 mb-3">
                  <CheckCircle size={18} />
                  <span className="text-sm font-medium">Caution fee paid</span>
                </div>
                {caution && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-dark-600">Principal</p>
                      <p className="font-semibold">₦{Number(caution.principal || caution.expected || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-dark-600">Interest Accrued</p>
                      <p className="font-semibold text-green-700">₦{Number(caution.interest_accrued || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-dark-600">Refundable Amount</p>
                      <p className="font-semibold text-primary">₦{Number(caution.refundable_amount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-amber-600 mb-3">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">Caution fee not yet paid</span>
                </div>
                <p className="text-sm text-dark-600 mb-3">
                  Caution fee of <span className="font-semibold">₦{cautionFee.toLocaleString()}</span> is required
                  (10% of annual rent). This deposit earns interest and is refundable at end of tenancy.
                </p>
                <button
                  onClick={handlePayCaution}
                  disabled={paying}
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  {paying ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <CreditCard size={18} />
                  )}
                  {paying ? 'Processing...' : `Pay Caution Fee — ₦${cautionFee.toLocaleString()}`}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Payment History */}
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
