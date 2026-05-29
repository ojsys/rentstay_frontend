import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../../services/api';
import { Loader2, CreditCard, Wallet, TrendingUp, Building2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import BankAccountsManager from '../../components/dashboard/BankAccountsManager';
import CautionWalletView from '../../components/dashboard/CautionWalletView';
import PayoutRequestForm from '../../components/dashboard/PayoutRequestForm';

const PaymentStatusBadge = ({ isPaid, isLate }) => {
  if (isPaid) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Paid</span>;
  if (isLate) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Late</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Pending</span>;
};

const SUB_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'rent', label: 'Rent' },
  { key: 'caution', label: 'Caution' },
  { key: 'payouts', label: 'Payouts' },
];

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="animate-spin mr-2" /> Loading...
      </div>
    );
  }

  const summaryCards = [
    { label: 'Total Received', value: summary.total_received, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Pending Rent',   value: summary.pending_rent,   icon: CreditCard,  color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Caution Held',  value: summary.caution_held,   icon: Wallet,      color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Cashback',      value: summary.interest_earned, icon: TrendingUp,  color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Commissions',   value: summary.commissions,     icon: Building2,   color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Payouts',       value: summary.payouts_total,   icon: CreditCard,  color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-lg md:text-xl font-bold text-gray-900">Payments & Finances</h2>

      {/* Summary cards — 3 per row on mobile, 6 on desktop */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center gap-1 text-center">
            <div className={`w-7 h-7 ${card.bg} rounded-xl flex items-center justify-center`}>
              <card.icon size={14} className={card.color} />
            </div>
            <p className="text-sm md:text-base font-bold text-gray-900 leading-tight">
              ₦{Number(card.value || 0) >= 1000
                ? `${(Number(card.value || 0) / 1000).toFixed(0)}K`
                : Number(card.value || 0).toLocaleString()}
            </p>
            <p className="text-[9px] md:text-xs text-gray-400 leading-tight">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {SUB_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Recent Rent Payments</h3>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-gray-400 text-sm p-4">No payments yet.</p>
          ) : (
            <>
              {/* Mobile list */}
              <div className="md:hidden divide-y divide-gray-50">
                {recentPayments.slice(0, 10).map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {p.rental_agreement__tenant__first_name} {p.rental_agreement__tenant__last_name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{p.rental_agreement__property__title}</p>
                      <p className="text-xs text-gray-400">{new Date(p.due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">₦{Number(p.amount).toLocaleString()}</p>
                      <PaymentStatusBadge isPaid={p.is_paid} isLate={p.is_late} />
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                      <th className="py-2.5 px-4">Tenant</th>
                      <th className="py-2.5 pr-4">Property</th>
                      <th className="py-2.5 pr-4">Due</th>
                      <th className="py-2.5 pr-4">Amount</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.slice(0, 10).map((p, idx) => (
                      <tr key={idx} className="border-t border-gray-50">
                        <td className="py-2.5 px-4">{p.rental_agreement__tenant__first_name} {p.rental_agreement__tenant__last_name}</td>
                        <td className="py-2.5 pr-4 truncate max-w-[150px]">{p.rental_agreement__property__title}</td>
                        <td className="py-2.5 pr-4">{new Date(p.due_date).toLocaleDateString()}</td>
                        <td className="py-2.5 pr-4">₦{Number(p.amount).toLocaleString()}</td>
                        <td className="py-2.5"><PaymentStatusBadge isPaid={p.is_paid} isLate={p.is_late} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* All Rent Payments */}
      {activeTab === 'rent' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">All Rent Payments</h3>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-gray-400 text-sm p-4">No payments.</p>
          ) : (
            <>
              {/* Mobile list */}
              <div className="md:hidden divide-y divide-gray-50">
                {recentPayments.map((p, idx) => (
                  <div key={idx} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {p.rental_agreement__tenant__first_name} {p.rental_agreement__tenant__last_name}
                      </p>
                      <PaymentStatusBadge isPaid={p.is_paid} isLate={p.is_late} />
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-1">{p.rental_agreement__property__title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-3 text-xs text-gray-400">
                        <span>Due: {new Date(p.due_date).toLocaleDateString()}</span>
                        {p.paid_date && <span>Paid: {new Date(p.paid_date).toLocaleDateString()}</span>}
                      </div>
                      <p className="text-sm font-bold text-gray-900">₦{Number(p.amount).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                      <th className="py-2.5 px-4">Tenant</th>
                      <th className="py-2.5 pr-4">Property</th>
                      <th className="py-2.5 pr-4">Due Date</th>
                      <th className="py-2.5 pr-4">Paid Date</th>
                      <th className="py-2.5 pr-4">Amount</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((p, idx) => (
                      <tr key={idx} className="border-t border-gray-50">
                        <td className="py-2.5 px-4">{p.rental_agreement__tenant__first_name} {p.rental_agreement__tenant__last_name}</td>
                        <td className="py-2.5 pr-4 truncate max-w-[150px]">{p.rental_agreement__property__title}</td>
                        <td className="py-2.5 pr-4">{new Date(p.due_date).toLocaleDateString()}</td>
                        <td className="py-2.5 pr-4">{p.paid_date ? new Date(p.paid_date).toLocaleDateString() : '—'}</td>
                        <td className="py-2.5 pr-4">₦{Number(p.amount).toLocaleString()}</td>
                        <td className="py-2.5"><PaymentStatusBadge isPaid={p.is_paid} isLate={p.is_late} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Caution Wallet */}
      {activeTab === 'caution' && <CautionWalletView pools={cautionWallet} />}

      {/* Payouts & Banks */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Request Payout</h3>
            <PayoutRequestForm availableBalance={summary.available_balance || 0} />
          </div>

          <BankAccountsManager />

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Payout History</h3>
            </div>
            {payoutHistory.length === 0 ? (
              <p className="text-gray-400 text-sm p-4">No payouts yet.</p>
            ) : (
              <>
                {/* Mobile list */}
                <div className="md:hidden divide-y divide-gray-50">
                  {payoutHistory.map((p) => {
                    const statusCls = p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
                    return (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{p.bank_account?.bank_name}</p>
                          <p className="text-xs text-gray-400">{p.bank_account?.account_number} · {new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">₦{Number(p.amount).toLocaleString()}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusCls}`}>{p.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                        <th className="py-2.5 px-4">Reference</th>
                        <th className="py-2.5 pr-4">Bank</th>
                        <th className="py-2.5 pr-4">Amount</th>
                        <th className="py-2.5 pr-4">Status</th>
                        <th className="py-2.5">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutHistory.map((p) => (
                        <tr key={p.id} className="border-t border-gray-50">
                          <td className="py-2.5 px-4 font-mono text-xs">{String(p.reference).substring(0, 12)}…</td>
                          <td className="py-2.5 pr-4">{p.bank_account?.bank_name} — {p.bank_account?.account_number}</td>
                          <td className="py-2.5 pr-4 font-semibold">₦{Number(p.amount).toLocaleString()}</td>
                          <td className="py-2.5 pr-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5">{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandlordDashboardPayments;
