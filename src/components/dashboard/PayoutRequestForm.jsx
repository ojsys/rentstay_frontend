import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI } from '../../services/api';

const PayoutRequestForm = ({ availableBalance = 0, onSuccess }) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => dashboardAPI.getBankAccounts().then(r => r.data?.results || r.data || []),
  });

  const payoutMutation = useMutation({
    mutationFn: (data) => dashboardAPI.requestPayout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-payments'] });
      setAmount('');
      setSelectedBank('');
      onSuccess?.();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !selectedBank) return;
    payoutMutation.mutate({
      amount: Number(amount),
      bank_account_id: Number(selectedBank),
    });
  };

  const primaryBank = bankAccounts.find(b => b.is_primary);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Available Balance</label>
        <p className="text-2xl font-bold text-emerald-600">
          &#8358;{Number(availableBalance).toLocaleString()}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
        {bankAccounts.length === 0 ? (
          <p className="text-sm text-gray-500">No bank accounts added. Please add a bank account first.</p>
        ) : (
          <select
            value={selectedBank}
            onChange={e => setSelectedBank(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          >
            <option value="">Select bank account</option>
            {bankAccounts.map(bank => (
              <option key={bank.id} value={bank.id}>
                {bank.bank_name} - {bank.account_number} ({bank.account_name})
                {bank.is_primary ? ' [Primary]' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&#8358;</span>
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
        {amount && Number(amount) > availableBalance && (
          <p className="text-red-500 text-xs mt-1">Amount exceeds available balance</p>
        )}
      </div>

      <button
        type="submit"
        disabled={payoutMutation.isPending || bankAccounts.length === 0 || !amount || Number(amount) > availableBalance}
        className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50"
      >
        {payoutMutation.isPending ? 'Requesting...' : 'Request Payout'}
      </button>

      {payoutMutation.isError && (
        <p className="text-red-500 text-sm">
          {payoutMutation.error?.response?.data?.error || 'Failed to request payout'}
        </p>
      )}
      {payoutMutation.isSuccess && (
        <p className="text-emerald-600 text-sm">Payout request submitted successfully!</p>
      )}
    </form>
  );
};

export default PayoutRequestForm;
