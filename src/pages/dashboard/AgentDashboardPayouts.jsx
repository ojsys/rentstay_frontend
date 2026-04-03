import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { agentAPI, dashboardAPI } from '../../services/api';
import BankAccountsManager from '../../components/dashboard/BankAccountsManager';

const StatusBadge = ({ status }) => {
  const map = {
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const AgentDashboardPayouts = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');

  const { data: dashData } = useQuery({
    queryKey: ['agent-dashboard'],
    queryFn: () => agentAPI.getDashboard().then(r => r.data),
  });

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ['agent-payouts'],
    queryFn: () => agentAPI.getPayouts().then(r => r.data),
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => dashboardAPI.getBankAccounts().then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data) => agentAPI.requestPayout(data),
    onSuccess: () => {
      toast.success('Payout request submitted!');
      setShowForm(false);
      setAmount('');
      setBankAccountId('');
      queryClient.invalidateQueries(['agent-payouts']);
      queryClient.invalidateQueries(['agent-dashboard']);
    },
    onError: (err) => {
      const msg = err?.response?.data?.amount?.[0]
        || err?.response?.data?.detail
        || 'Payout request failed';
      toast.error(msg);
    },
  });

  const availableBalance = Number(dashData?.metrics?.available_balance || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !bankAccountId) {
      toast.error('Please enter an amount and select a bank account.');
      return;
    }
    mutation.mutate({ amount: Number(amount), bank_account_id: Number(bankAccountId) });
  };

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <div className="card bg-primary text-white">
        <p className="text-sm opacity-80">Available Balance</p>
        <p className="text-3xl font-bold mt-1">₦{availableBalance.toLocaleString()}</p>
        <p className="text-xs opacity-70 mt-1">Total Earned: ₦{Number(dashData?.metrics?.total_earned || 0).toLocaleString()} · Withdrawn: ₦{Number(dashData?.metrics?.total_withdrawn || 0).toLocaleString()}</p>
      </div>

      {/* Bank Accounts */}
      <div>
        <h2 className="text-base font-semibold text-dark-900 mb-3">Bank Accounts</h2>
        <BankAccountsManager />
      </div>

      {/* Request payout */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-dark-900">Request Payout</h2>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary text-sm inline-flex items-center gap-2">
              <Plus size={16} /> New Request
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg border">
            <div>
              <label className="label">Amount (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="input"
                placeholder="Enter amount"
                min="1"
                max={availableBalance}
              />
              <p className="text-xs text-dark-400 mt-1">Available: ₦{availableBalance.toLocaleString()}</p>
            </div>
            <div>
              <label className="label">Bank Account</label>
              <select value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} className="input">
                <option value="">Select bank account</option>
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bank_name} — {b.account_number} ({b.account_name})
                  </option>
                ))}
              </select>
              {bankAccounts.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Add a bank account above before requesting a payout.</p>
              )}
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Submitting…' : 'Submit Request'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        )}

        {isLoading && <div className="text-center py-8 text-dark-500">Loading…</div>}

        {!isLoading && payouts.length === 0 && !showForm && (
          <div className="text-center py-8">
            <Wallet className="mx-auto text-dark-300 mb-2" size={36} />
            <p className="text-dark-500 text-sm">No payout requests yet.</p>
          </div>
        )}

        {!isLoading && payouts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-dark-500">
                  <th className="text-left py-2 font-medium">Reference</th>
                  <th className="text-left py-2 font-medium">Bank Account</th>
                  <th className="text-right py-2 font-medium">Amount</th>
                  <th className="text-center py-2 font-medium">Status</th>
                  <th className="text-right py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payouts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-2 font-mono text-xs text-dark-500">{p.reference?.slice(0, 12)}…</td>
                    <td className="py-2 text-dark-600">
                      {p.bank_account ? `${p.bank_account.bank_name} · ${p.bank_account.account_number}` : '—'}
                    </td>
                    <td className="py-2 text-right font-semibold text-dark-800">₦{Number(p.amount).toLocaleString()}</td>
                    <td className="py-2 text-center"><StatusBadge status={p.status} /></td>
                    <td className="py-2 text-right text-xs text-dark-400">
                      {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboardPayouts;
