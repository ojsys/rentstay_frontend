import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI } from '../../services/api';
import { Plus, Trash2, Star, Building2, Search, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { bank_name: '', bank_code: '', account_number: '', account_name: '', is_primary: false };

const BankAccountsManager = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [bankSearch, setBankSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef(null);

  const { data: accounts = [] } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => dashboardAPI.getBankAccounts().then(res => res.data?.results || res.data || []),
  });

  const { data: banksList = [], isLoading: banksLoading } = useQuery({
    queryKey: ['banks-list'],
    queryFn: () => dashboardAPI.getBanksList().then(res => res.data || []),
    staleTime: 1000 * 60 * 60,
  });

  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return banksList.slice(0, 8);
    return banksList
      .filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
      .slice(0, 8);
  }, [banksList, bankSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-verify when bank is selected and account number is 10 digits
  useEffect(() => {
    if (!form.bank_code || form.account_number.length !== 10) {
      setVerified(false);
      setVerifyError('');
      if (form.account_number.length < 10) {
        setForm(p => ({ ...p, account_name: '' }));
      }
      return;
    }

    let cancelled = false;
    const run = async () => {
      setVerifying(true);
      setVerified(false);
      setVerifyError('');
      try {
        const res = await dashboardAPI.verifyBankAccount({
          account_number: form.account_number,
          bank_code: form.bank_code,
        });
        if (!cancelled) {
          setForm(p => ({ ...p, account_name: res.data.account_name }));
          setVerified(true);
        }
      } catch {
        if (!cancelled) {
          setVerifyError('Account not found. Check the number and try again.');
          setForm(p => ({ ...p, account_name: '' }));
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    };

    // Small debounce so we don't fire on every keystroke
    const timer = setTimeout(run, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [form.bank_code, form.account_number]);

  const selectBank = (bank) => {
    setBankSearch(bank.name);
    setShowDropdown(false);
    setVerified(false);
    setVerifyError('');
    setForm(p => ({ ...p, bank_name: bank.name, bank_code: bank.code, account_name: '' }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setBankSearch('');
    setVerified(false);
    setVerifyError('');
    setShowForm(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!verified) { toast.error('Please wait for account verification'); return; }
    setSaving(true);
    try {
      await dashboardAPI.createBankAccount(form);
      toast.success('Bank account added');
      resetForm();
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
        <button
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className="btn btn-primary btn-sm inline-flex items-center gap-1"
        >
          <Plus size={14} /> Add Account
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-4 border border-gray-200">

          {/* Step 1 — Bank selector */}
          <div>
            <label className="label">Step 1 — Select your bank</label>
            <div className="relative" ref={dropdownRef}>
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
              <input
                className="input pl-8"
                placeholder={banksLoading ? 'Loading banks…' : 'Search for your bank…'}
                value={bankSearch}
                onChange={e => {
                  setBankSearch(e.target.value);
                  setShowDropdown(true);
                  setForm(p => ({ ...p, bank_name: '', bank_code: '', account_name: '' }));
                  setVerified(false);
                  setVerifyError('');
                }}
                onFocus={() => setShowDropdown(true)}
                autoComplete="off"
                disabled={banksLoading}
              />
              {showDropdown && filteredBanks.length > 0 && (
                <ul className="absolute z-30 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto">
                  {filteredBanks.map(bank => (
                    <li
                      key={bank.code}
                      onMouseDown={() => selectBank(bank)}
                      className="px-4 py-2.5 text-sm hover:bg-primary/5 cursor-pointer text-dark-900 border-b border-gray-50 last:border-0"
                    >
                      {bank.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {form.bank_code && (
              <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle size={12} /> {form.bank_name} selected
              </p>
            )}
          </div>

          {/* Step 2 — Account number (only show once bank is selected) */}
          {form.bank_code && (
            <div>
              <label className="label">Step 2 — Enter 10-digit account number</label>
              <input
                className="input font-mono tracking-widest"
                value={form.account_number}
                onChange={e => setForm(p => ({ ...p, account_number: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="0123456789"
                maxLength={10}
                inputMode="numeric"
              />
            </div>
          )}

          {/* Step 3 — Auto-verification result */}
          {form.bank_code && form.account_number.length === 10 && (
            <div>
              {verifying && (
                <div className="flex items-center gap-2 text-sm text-dark-600 bg-white border rounded-lg p-3">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  Verifying account…
                </div>
              )}
              {verified && (
                <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Account Verified</p>
                    <p className="font-semibold text-dark-900 text-base">{form.account_name}</p>
                  </div>
                </div>
              )}
              {verifyError && (
                <div className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                  <p className="text-red-700">{verifyError}</p>
                </div>
              )}
            </div>
          )}

          {/* Primary checkbox + actions */}
          {verified && (
            <>
              <label className="inline-flex items-center gap-2 text-sm text-dark-700">
                <input
                  type="checkbox"
                  checked={form.is_primary}
                  onChange={e => setForm(p => ({ ...p, is_primary: e.target.checked }))}
                />
                Set as primary account
              </label>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Account'}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {!verified && !verifying && form.bank_code && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      )}

      {accounts.length === 0 ? (
        <p className="text-dark-600 text-sm">No bank accounts added yet.</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${acc.is_primary ? 'border-primary bg-sky-50/30' : 'bg-white'}`}
            >
              <div className="flex items-center gap-3">
                <Building2 size={20} className="text-dark-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-dark-900 text-sm">{acc.bank_name} — {acc.account_number}</p>
                  <p className="text-xs text-dark-600">{acc.account_name}</p>
                  {!acc.bank_code && (
                    <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                      <AlertCircle size={10} /> Remove and re-add to enable withdrawals
                    </p>
                  )}
                </div>
                {acc.is_primary && (
                  <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full font-medium">Primary</span>
                )}
              </div>
              <div className="flex gap-2">
                {!acc.is_primary && (
                  <button onClick={() => handleSetPrimary(acc.id)} className="text-dark-400 hover:text-primary" title="Set as primary">
                    <Star size={16} />
                  </button>
                )}
                <button onClick={() => handleDelete(acc.id)} className="text-dark-400 hover:text-red-600" title="Remove">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BankAccountsManager;
