import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI } from '../../services/api';
import { Plus, Trash2, Star, Building2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const BankAccountsManager = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bank_name: '', account_number: '', account_name: '', is_primary: false });
  const [saving, setSaving] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => dashboardAPI.getBankAccounts().then(res => res.data?.results || res.data || []),
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.bank_name || !form.account_number || !form.account_name) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);
    try {
      await dashboardAPI.createBankAccount(form);
      toast.success('Bank account added');
      setShowForm(false);
      setForm({ bank_name: '', account_number: '', account_name: '', is_primary: false });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['landlord-payments-dashboard'] });
    } catch {
      toast.error('Failed to add bank account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this bank account?')) return;
    try {
      await dashboardAPI.deleteBankAccount(id);
      toast.success('Bank account removed');
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await dashboardAPI.updateBankAccount(id, { is_primary: true });
      toast.success('Set as primary');
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    } catch {
      toast.error('Failed');
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-dark-900">Bank Accounts</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm inline-flex items-center gap-1">
          <Plus size={14} /> Add Account
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Bank Name</label>
              <input className="input" value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} placeholder="e.g. GTBank" />
            </div>
            <div>
              <label className="label">Account Number</label>
              <input className="input" value={form.account_number} onChange={e => setForm(p => ({ ...p, account_number: e.target.value }))} placeholder="0123456789" maxLength={10} />
            </div>
            <div>
              <label className="label">Account Name</label>
              <input className="input" value={form.account_name} onChange={e => setForm(p => ({ ...p, account_name: e.target.value }))} placeholder="John Doe" />
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-dark-700">
            <input type="checkbox" checked={form.is_primary} onChange={e => setForm(p => ({ ...p, is_primary: e.target.checked }))} /> Set as primary account
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {accounts.length === 0 ? (
        <p className="text-dark-600 text-sm">No bank accounts added yet.</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((acc) => (
            <div key={acc.id} className={`flex items-center justify-between p-3 rounded-lg border ${acc.is_primary ? 'border-primary bg-primary-50/30' : 'bg-white'}`}>
              <div className="flex items-center gap-3">
                <Building2 size={20} className="text-dark-400" />
                <div>
                  <p className="font-medium text-dark-900 text-sm">{acc.bank_name} - {acc.account_number}</p>
                  <p className="text-xs text-dark-600">{acc.account_name}</p>
                </div>
                {acc.is_primary && <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full font-medium">Primary</span>}
              </div>
              <div className="flex gap-2">
                {!acc.is_primary && (
                  <button onClick={() => handleSetPrimary(acc.id)} className="text-dark-400 hover:text-primary" title="Set as primary"><Star size={16} /></button>
                )}
                <button onClick={() => handleDelete(acc.id)} className="text-dark-400 hover:text-red-600" title="Remove"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BankAccountsManager;
