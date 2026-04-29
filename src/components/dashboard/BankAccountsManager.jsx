import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI } from '../../services/api';
import { Plus, Trash2, Star, Building2, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { bank_name: '', bank_code: '', account_number: '', account_name: '', is_primary: false };

const BankAccountsManager = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => dashboardAPI.getBankAccounts().then(res => res.data?.results || res.data || []),
  });

  const { data: banksList = [] } = useQuery({
    queryKey: ['banks-list'],
    queryFn: () => dashboardAPI.getBanksList().then(res => res.data || []),
    staleTime: 1000 * 60 * 60, // cache 1 hour
  });

  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return banksList.slice(0, 10);
    return banksList.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase())).slice(0, 10);
  }, [banksList, bankSearch]);

  const selectBank = (bank) => {
    setForm(p => ({ ...p, bank_name: bank.name, bank_code: bank.code }));
    setBankSearch(bank.name);
    setShowBankDropdown(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.bank_name || !form.bank_code || !form.account_number || !form.account_name) {
      toast.error('Please select a bank and fill all fields');
      return;
    }
    if (form.account_number.length !== 10) {
      toast.error('Account number must be 10 digits');
      return;
    }
    setSaving(true);
    try {
      await dashboardAPI.createBankAccount(form);
      toast.success('Bank account added');
      setShowForm(false);
      setForm(EMPTY_FORM);
      setBankSearch('');
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['landlord-payments-dashboard'] });
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to add bank account');
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
        <button onClick={() => { setShowForm(!showForm); setBankSearch(''); setForm(EMPTY_FORM); }} className="btn btn-primary btn-sm inline-flex items-center gap-1">
          <Plus size={14} /> Add Account
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
          {/* Bank selector */}
          <div className="relative">
            <label className="label">Bank</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                className="input pl-8"
                placeholder="Search for your bank…"
                value={bankSearch}
                onChange={e => { setBankSearch(e.target.value); setShowBankDropdown(true); setForm(p => ({ ...p, bank_name: '', bank_code: '' })); }}
                onFocus={() => setShowBankDropdown(true)}
                autoComplete="off"
              />
            </div>
            {showBankDropdown && filteredBanks.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {filteredBanks.map(bank => (
                  <li
                    key={bank.code}
                    className="px-4 py-2 text-sm hover:bg-primary/5 cursor-pointer text-dark-900"
                    onMouseDown={() => selectBank(bank)}
                  >
                    {bank.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {form.bank_code && (
            <p className="text-xs text-green-600 font-medium">✓ {form.bank_name} selected</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Account Number</label>
              <input
                className="input"
                value={form.account_number}
                onChange={e => setForm(p => ({ ...p, account_number: e.target.value.replace(/\D/g, '') }))}
                placeholder="0123456789"
                maxLength={10}
              />
            </div>
            <div>
              <label className="label">Account Name</label>
              <input
                className="input"
                value={form.account_name}
                onChange={e => setForm(p => ({ ...p, account_name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-dark-700">
            <input type="checkbox" checked={form.is_primary} onChange={e => setForm(p => ({ ...p, is_primary: e.target.checked }))} />
            Set as primary account
          </label>

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !form.bank_code}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setShowForm(false); setBankSearch(''); }}>Cancel</button>
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
                  <p className="font-medium text-dark-900 text-sm">{acc.bank_name} — {acc.account_number}</p>
                  <p className="text-xs text-dark-600">{acc.account_name}</p>
                  {!acc.bank_code && (
                    <p className="text-xs text-amber-600 mt-0.5">⚠ Missing bank code — please remove and re-add to enable withdrawals</p>
                  )}
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
