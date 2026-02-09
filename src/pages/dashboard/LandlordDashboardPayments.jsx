import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI } from '../../services/api';
import { Loader2, CreditCard, Wallet, TrendingUp, Building2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import BankAccountsManager from '../../components/dashboard/BankAccountsManager';
import CautionWalletView from '../../components/dashboard/CautionWalletView';
import PayoutRequestForm from '../../components/dashboard/PayoutRequestForm';

const LandlordDashboardPayments = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading } = useQuery({
    queryKey: ['landlord-payments-dashboard'],
    queryFn: () => dashboardAPI.getLandlordPaymentsDashboard().then(res => res.data),
  });

  const summary = data?.summary || {};
  const recentPayments = data?.recent_payments || [];
  const payoutHistory = data?.payout_history || [];
  const cautionWallet = data?.caution_wallet || [];

  const subTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'rent', label: 'Rent Payments' },
    { key: 'caution', label: 'Caution Wallet' },
    { key: 'payouts', label: 'Payouts & Banks' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-dark-900">Payments & Finances</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Received', value: summary.total_received, icon: TrendingUp, color: 'text-green-600' },
          { label: 'Pending Rent', value: summary.pending_rent, icon: CreditCard, color: 'text-amber-600' },
          { label: 'Caution Held', value: summary.caution_held, icon: Wallet, color: 'text-indigo-600' },
          { label: 'Interest Earned', value: summary.interest_earned, icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Commissions', value: summary.commissions, icon: Building2, color: 'text-purple-600' },
          { label: 'Payouts', value: summary.payouts_total, icon: CreditCard, color: 'text-blue-600' },
        ].map((card) => (
          <div key={card.label} className="card p-3 text-center">
            <card.icon size={18} className={`mx-auto mb-1 ${card.color}`} />
            <p className="text-lg font-bold text-dark-900">₦{Number(card.value || 0).toLocaleString()}</p>
            <p className="text-xs text-dark-600">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {subTabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${activeTab === t.key ? 'bg-white shadow-sm text-dark-900' : 'text-dark-600 hover:text-dark-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">Recent Rent Payments</h3>
            {recentPayments.length === 0 ? (
              <p className="text-dark-600 text-sm">No payments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead><tr className="text-left text-dark-600"><th className="py-2 pr-3">Tenant</th><th className="py-2 pr-3">Property</th><th className="py-2 pr-3">Due</th><th className="py-2 pr-3">Amount</th><th className="py-2">Status</th></tr></thead>
                  <tbody>
                    {recentPayments.slice(0, 10).map((p, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="py-2 pr-3">{p.rental_agreement__tenant__first_name} {p.rental_agreement__tenant__last_name}</td>
                        <td className="py-2 pr-3 truncate max-w-[150px]">{p.rental_agreement__property__title}</td>
                        <td className="py-2 pr-3">{new Date(p.due_date).toLocaleDateString()}</td>
                        <td className="py-2 pr-3">₦{Number(p.amount).toLocaleString()}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.is_paid ? 'bg-green-100 text-green-700' : p.is_late ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.is_paid ? 'Paid' : p.is_late ? 'Late' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rent Payments */}
      {activeTab === 'rent' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">All Rent Payments</h3>
          {recentPayments.length === 0 ? (
            <p className="text-dark-600 text-sm">No payments.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left text-dark-600"><th className="py-2 pr-3">Tenant</th><th className="py-2 pr-3">Property</th><th className="py-2 pr-3">Due Date</th><th className="py-2 pr-3">Paid Date</th><th className="py-2 pr-3">Amount</th><th className="py-2">Status</th></tr></thead>
                <tbody>
                  {recentPayments.map((p, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="py-2 pr-3">{p.rental_agreement__tenant__first_name} {p.rental_agreement__tenant__last_name}</td>
                      <td className="py-2 pr-3 truncate max-w-[150px]">{p.rental_agreement__property__title}</td>
                      <td className="py-2 pr-3">{new Date(p.due_date).toLocaleDateString()}</td>
                      <td className="py-2 pr-3">{p.paid_date ? new Date(p.paid_date).toLocaleDateString() : '-'}</td>
                      <td className="py-2 pr-3">₦{Number(p.amount).toLocaleString()}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.is_paid ? 'bg-green-100 text-green-700' : p.is_late ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.is_paid ? 'Paid' : p.is_late ? 'Late' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Caution Wallet */}
      {activeTab === 'caution' && <CautionWalletView pools={cautionWallet} />}

      {/* Payouts */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">Request Payout</h3>
            <PayoutRequestForm availableBalance={summary.available_balance || 0} />
          </div>
          <BankAccountsManager />
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">Payout History</h3>
            {payoutHistory.length === 0 ? (
              <p className="text-dark-600 text-sm">No payouts yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead><tr className="text-left text-dark-600"><th className="py-2 pr-3">Reference</th><th className="py-2 pr-3">Bank</th><th className="py-2 pr-3">Amount</th><th className="py-2 pr-3">Status</th><th className="py-2">Date</th></tr></thead>
                  <tbody>
                    {payoutHistory.map((p) => (
                      <tr key={p.id} className="border-t border-gray-100">
                        <td className="py-2 pr-3 font-mono text-xs">{String(p.reference).substring(0, 12)}...</td>
                        <td className="py-2 pr-3">{p.bank_account?.bank_name} - {p.bank_account?.account_number}</td>
                        <td className="py-2 pr-3">₦{Number(p.amount).toLocaleString()}</td>
                        <td className="py-2 pr-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>{p.status}</span>
                        </td>
                        <td className="py-2">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandlordDashboardPayments;
