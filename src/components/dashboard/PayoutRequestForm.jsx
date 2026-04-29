import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI } from '../../services/api';
import { Clock, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  pending:    { label: 'Pending Review',  color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  icon: Clock },
  processing: { label: 'Transfer in Progress', color: 'text-blue-600', bg: 'bg-blue-50',  border: 'border-blue-200',  icon: Loader2 },
  completed:  { label: 'Paid',            color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  icon: CheckCircle },
  failed:     { label: 'Failed',          color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    icon: XCircle },
};

const PayoutStatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
      <Icon size={12} className={status === 'processing' ? 'animate-spin' : ''} />
      {cfg.label}
    </span>
  );
};

const PayoutRequestForm = ({ availableBalance = 0 }) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => dashboardAPI.getBankAccounts().then(r => r.data?.results || r.data || []),
  });

  // Pull payout history from the payments dashboard
  const { data: dashData } = useQuery({
    queryKey: ['landlord-payments-dashboard'],
    queryFn: () => dashboardAPI.getLandlordPaymentsDashboard().then(r => r.data),
  });
  const payoutHistory = dashData?.payout_history || [];

  const payoutMutation = useMutation({
    mutationFn: (data) => dashboardAPI.requestPayout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-payments-dashboard'] });
      setAmount('');
      setSelectedBank('');
    },
  });

  const validBanks = bankAccounts.filter(b => b.bank_code);
  const hasBanksWithoutCode = bankAccounts.some(b => !b.bank_code);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !selectedBank) return;
    payoutMutation.mutate({ amount: Number(amount), bank_account_id: Number(selectedBank) });
  };

  const pending = payoutHistory.filter(p => p.status === 'pending');
  const hasPending = pending.length > 0;

  return (
    <div className="space-y-6">
      {/* Available balance */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide mb-1">Available Balance</p>
        <p className="text-3xl font-bold text-emerald-700">₦{Number(availableBalance).toLocaleString()}</p>
        <p className="text-xs text-emerald-600 mt-1">Collected rent minus completed/pending withdrawals</p>
      </div>

      {hasBanksWithoutCode && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>Some bank accounts are missing a bank code. Remove and re-add them using the bank selector below to enable withdrawals.</span>
        </div>
      )}

      {hasPending && (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <Clock size={16} className="flex-shrink-0 mt-0.5" />
          <span>You have a pending withdrawal request. It will be reviewed and processed within 24 hours.</span>
        </div>
      )}

      {/* Request form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">Bank Account</label>
          {validBanks.length === 0 ? (
            <p className="text-sm text-dark-500">No eligible bank accounts. Add one below (must have bank code).</p>
          ) : (
            <select
              value={selectedBank}
              onChange={e => setSelectedBank(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">Select bank account</option>
              {validBanks.map(bank => (
                <option key={bank.id} value={bank.id}>
                  {bank.bank_name} — {bank.account_number} ({bank.account_name})
                  {bank.is_primary ? ' [Primary]' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">₦</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              max={availableBalance}
              min="100"
              step="0.01"
              placeholder="0.00"
              className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm"
              required
            />
          </div>
          {amount && Number(amount) > Number(availableBalance) && (
            <p className="text-red-500 text-xs mt-1">Amount exceeds available balance</p>
          )}
        </div>

        <button
          type="submit"
          disabled={payoutMutation.isPending || validBanks.length === 0 || !amount || Number(amount) > Number(availableBalance) || hasPending}
          className="w-full bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {payoutMutation.isPending ? 'Submitting…' : 'Request Withdrawal'}
        </button>

        {payoutMutation.isError && (
          <p className="text-red-500 text-sm">{payoutMutation.error?.response?.data?.detail || 'Failed to submit request'}</p>
        )}
        {payoutMutation.isSuccess && (
          <p className="text-emerald-600 text-sm font-medium">✓ Request submitted! You'll receive an email once it's processed (within 24 hours).</p>
        )}
      </form>

      {/* Withdrawal history */}
      {payoutHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-dark-900 mb-3">Withdrawal History</h4>
          <div className="space-y-2">
            {payoutHistory.map((p) => (
              <div key={p.id} className={`rounded-lg border p-3 ${STATUS_CONFIG[p.status]?.bg || 'bg-gray-50'} ${STATUS_CONFIG[p.status]?.border || 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-dark-900">₦{Number(p.amount).toLocaleString()}</span>
                  <PayoutStatusBadge status={p.status} />
                </div>
                <p className="text-xs text-dark-600">
                  {p.bank_account ? `${p.bank_account.bank_name} — ${p.bank_account.account_number}` : '—'}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-dark-500">
                  <span>Requested {new Date(p.created_at).toLocaleDateString()}</span>
                  {p.approved_at && <span>· Approved {new Date(p.approved_at).toLocaleDateString()}</span>}
                  {p.approved_by_name && <span>by {p.approved_by_name}</span>}
                </div>
                {p.status === 'failed' && p.failure_reason && (
                  <p className="text-xs text-red-600 mt-1">Reason: {p.failure_reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutRequestForm;
