import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Loader2, PiggyBank, Landmark, AlertTriangle, CheckCircle2, Clock, RefreshCw,
  Lock, Search, Send, ShieldCheck, ChevronDown, Pencil, X, FileCheck2, Undo2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staffAPI, dashboardAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';

/**
 * Caution deposits — every fee a tenant has paid on a rent, and the sweep to
 * the account they are held in.
 *
 * A caution fee is the tenant's money, not the platform's: held for the length
 * of a tenancy and owed back less whatever the landlord proves at move-out.
 * Until this screen there was no place that could answer "how much do we hold
 * on behalf of tenants", and the deposits sat in the same balance that funds
 * landlord withdrawals. So the numbers at the top are the point of the page,
 * and Send is what moves a deposit out of that balance into the designated
 * account.
 */

const naira = (value) => {
  // The part-sweep box is free text, so a half-typed amount must not render
  // the Send button as "₦NaN".
  const n = Number(value);
  return `₦${(Number.isFinite(n) ? n : 0).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;
};

const STATE_STYLES = {
  held: 'bg-amber-100 text-amber-700',
  part: 'bg-sky-100 text-sky-700',
  sent: 'bg-emerald-100 text-emerald-700',
};

const STATE_LABELS = {
  held: 'Held on platform',
  part: 'Partly sent',
  sent: 'Sent to deposit account',
};

const REMITTANCE_STYLES = {
  processing: 'text-sky-700',
  completed: 'text-emerald-700',
  failed: 'text-red-700',
  voided: 'text-dark-400 line-through',
};

/* ── Where the deposits go ──────────────────────────────────────────────── */

const DesignatedAccount = ({ account, canDisburse, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [banks, setBanks] = useState([]);
  const [bankSearch, setBankSearch] = useState('');
  const [showBanks, setShowBanks] = useState(false);
  const [form, setForm] = useState({ bank_code: '', bank_name: '', account_number: '', label: '' });
  const [resolvedName, setResolvedName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!editing || banks.length) return;
    dashboardAPI.getBanksList()
      .then(res => setBanks(res.data || []))
      .catch(() => toast.error('Could not load the bank list'));
  }, [editing, banks.length]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowBanks(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // The name shown is whatever the bank says, never what was typed — the same
  // rule the server enforces when it stores the account.
  useEffect(() => {
    if (!form.bank_code || form.account_number.length !== 10) {
      setResolvedName('');
      setResolveError('');
      return;
    }
    let cancelled = false;
    setResolving(true);
    setResolveError('');
    dashboardAPI.verifyBankAccount({
      account_number: form.account_number, bank_code: form.bank_code,
    })
      .then(res => { if (!cancelled) setResolvedName(res.data?.account_name || ''); })
      .catch(e => {
        if (!cancelled) {
          setResolvedName('');
          setResolveError(getErrorMessage(e, 'The bank could not confirm that account'));
        }
      })
      .finally(() => { if (!cancelled) setResolving(false); });
    return () => { cancelled = true; };
  }, [form.bank_code, form.account_number]);

  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return banks.slice(0, 8);
    return banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase())).slice(0, 8);
  }, [banks, bankSearch]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await staffAPI.setCautionAccount(form);
      toast.success(data.detail);
      setEditing(false);
      setForm({ bank_code: '', bank_name: '', account_number: '', label: '' });
      setResolvedName('');
      onSaved();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not set the deposit account'));
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className={`card p-5 ${account ? '' : 'border-amber-300 bg-amber-50'}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-dark-500 flex items-center gap-1.5">
              <Landmark size={13} /> Caution deposit account
            </p>
            {account ? (
              <>
                <p className="font-semibold text-dark-900 mt-1.5">{account.account_name}</p>
                <p className="text-sm text-dark-600">
                  {account.bank_name} · {account.account_number}
                  {account.label && <span className="text-dark-400"> · {account.label}</span>}
                </p>
                {account.set_by && (
                  <p className="text-[11px] text-dark-400 mt-1">
                    Designated by {account.set_by}
                    {account.set_at && ` on ${new Date(account.set_at).toLocaleDateString()}`}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-amber-900 mt-1.5 max-w-xl">
                No account has been designated, so nothing can be remitted yet. Deposits
                are sitting in the same balance that funds landlord withdrawals.
              </p>
            )}
          </div>
          {canDisburse && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-dark-700 text-sm font-semibold hover:bg-gray-50 transition flex items-center gap-1.5"
            >
              <Pencil size={13} /> {account ? 'Change' : 'Set account'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-dark-500 flex items-center gap-1.5">
          <Landmark size={13} /> Designate the caution deposit account
        </p>
        <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-dark-400">
          <X size={15} />
        </button>
      </div>

      {account && (
        <p className="text-xs text-amber-800 bg-amber-50 rounded-lg p-2.5">
          This replaces {account.account_name} ({account.bank_name} {account.account_number}).
          Deposits already sent stay recorded against the old account.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative" ref={dropdownRef}>
          <label className="label">Bank</label>
          <button
            type="button"
            onClick={() => setShowBanks(v => !v)}
            className="input py-2.5 text-sm w-full text-left flex items-center justify-between"
          >
            <span className={form.bank_name ? 'text-dark-900' : 'text-dark-400'}>
              {form.bank_name || 'Choose a bank'}
            </span>
            <ChevronDown size={15} className="text-dark-400" />
          </button>
          {showBanks && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 border-b">
                <input
                  autoFocus
                  className="input py-2 text-sm w-full"
                  placeholder="Search banks…"
                  value={bankSearch}
                  onChange={e => setBankSearch(e.target.value)}
                />
              </div>
              <ul className="max-h-56 overflow-y-auto">
                {filteredBanks.map(b => (
                  <li key={`${b.code}-${b.name}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(f => ({ ...f, bank_code: b.code, bank_name: b.name }));
                        setShowBanks(false);
                        setBankSearch('');
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {b.name}
                    </button>
                  </li>
                ))}
                {filteredBanks.length === 0 && (
                  <li className="px-3 py-2 text-sm text-dark-400">No bank matches that.</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div>
          <label className="label">Account number</label>
          <input
            className="input py-2.5 text-sm w-full"
            inputMode="numeric"
            maxLength={10}
            placeholder="10 digits"
            value={form.account_number}
            onChange={e => setForm(f => ({
              ...f, account_number: e.target.value.replace(/\D/g, '').slice(0, 10),
            }))}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Label (optional)</label>
          <input
            className="input py-2.5 text-sm w-full"
            placeholder="e.g. Caution deposit trust"
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          />
        </div>
      </div>

      {resolving && (
        <p className="text-xs text-dark-500 flex items-center gap-1.5">
          <Loader2 size={12} className="animate-spin" /> Checking with the bank…
        </p>
      )}
      {resolvedName && (
        <p className="text-sm text-emerald-800 bg-emerald-50 rounded-lg p-2.5 flex items-center gap-1.5">
          <ShieldCheck size={14} /> The bank says this account belongs to <strong>{resolvedName}</strong>
        </p>
      )}
      {resolveError && (
        <p className="text-sm text-red-700 bg-red-50 rounded-lg p-2.5 flex items-center gap-1.5">
          <AlertTriangle size={14} /> {resolveError}
        </p>
      )}

      <button
        onClick={save}
        disabled={saving || !resolvedName}
        title={resolvedName ? '' : 'The bank must confirm the account first'}
        className="px-5 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-40 flex items-center gap-1.5"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Landmark size={14} />}
        Use this account
      </button>
    </div>
  );
};


/* ── Already moved by hand ──────────────────────────────────────────────── */

/**
 * Recording a deposit that was transferred outside the platform.
 *
 * Offered even on rows the Send button refuses — a deposit refunded to the
 * tenant months after it was swept is exactly the case that needs recording,
 * and blocking it would leave the ledger permanently wrong about history.
 */
const RecordSentForm = ({ row, busy, onCancel, onSubmit }) => {
  const [form, setForm] = useState({
    amount: '', sent_at: '', bank_reference: '', note: '',
  });

  return (
    <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-dark-600 flex items-center gap-1.5">
          <FileCheck2 size={13} /> Record a transfer already made
        </p>
        <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-200 text-dark-400">
          <X size={14} />
        </button>
      </div>
      <p className="text-xs text-dark-500">
        No money moves. This says {naira(row.amount_outstanding)} of this deposit
        already left by bank transfer, so it stops showing as held.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Amount</label>
          <input
            className="input py-2 text-sm w-full"
            inputMode="decimal"
            placeholder={`Full: ${row.amount_outstanding}`}
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Date sent</label>
          <input
            type="date"
            className="input py-2 text-sm w-full"
            max={new Date().toISOString().slice(0, 10)}
            value={form.sent_at}
            onChange={e => setForm(f => ({ ...f, sent_at: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Bank reference</label>
          <input
            className="input py-2 text-sm w-full"
            placeholder="Optional"
            value={form.bank_reference}
            onChange={e => setForm(f => ({ ...f, bank_reference: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className="label">Where it went, and how you know *</label>
        <input
          className="input py-2 text-sm w-full"
          placeholder="e.g. Transferred to the trust account on 3 Aug — GTBank receipt in the finance drive"
          value={form.note}
          onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
        />
        <p className="text-[11px] text-dark-400 mt-1">
          This is the only evidence on the ledger that the deposit was sent, so it is required.
        </p>
      </div>

      <button
        onClick={() => onSubmit(row, form)}
        disabled={busy || !form.note.trim()}
        title={form.note.trim() ? '' : 'Say where it went first'}
        className="px-5 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-40 flex items-center gap-1.5"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <FileCheck2 size={14} />}
        Record as sent
      </button>
    </div>
  );
};

/* ── The ledger ─────────────────────────────────────────────────────────── */


const StaffCautionFees = () => {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [account, setAccount] = useState(null);
  const [failedIds, setFailedIds] = useState([]);
  const [canDisburse, setCanDisburse] = useState(false);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState('held');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null);
  const [selected, setSelected] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [recording, setRecording] = useState(null);
  const [voiding, setVoiding] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (state) params.state = state;
      if (query) params.search = query;
      const { data } = await staffAPI.listCautionFees(params);
      setRows(data.results || []);
      setSummary(data.summary || {});
      setAccount(data.account || null);
      setFailedIds(data.failed_ids || []);
      setCanDisburse(Boolean(data.can_disburse));
      setSelected([]);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not load caution deposits'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [state, query]);

  // Debounce the search box so typing a tenant's name is not one request a key.
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const sendOne = async (row) => {
    setBusy(`pool-${row.id}`);
    try {
      const amount = (amounts[row.id] || '').trim();
      const { data } = await staffAPI.actOnCautionFees({
        action: 'remit', pool_id: row.id, ...(amount ? { amount } : {}),
      });
      toast.success(data.detail);
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not send this deposit'));
    } finally {
      setBusy(null);
    }
  };

  const sendSelected = async () => {
    setBusy('batch');
    try {
      const { data } = await staffAPI.actOnCautionFees({
        action: 'remit', pool_ids: selected,
      });
      toast.success(data.detail);
      (data.failed || []).forEach(f => toast.error(f.detail));
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not send those deposits'));
    } finally {
      setBusy(null);
    }
  };

  const recordSent = async (row, form) => {
    setBusy(`record-${row.id}`);
    try {
      const { data } = await staffAPI.actOnCautionFees({
        action: 'record', pool_id: row.id, ...form,
      });
      toast.success(data.detail);
      setRecording(null);
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not record this deposit'));
    } finally {
      setBusy(null);
    }
  };

  const voidEntry = async (remittanceId) => {
    setBusy(`remit-${remittanceId}`);
    try {
      const { data } = await staffAPI.actOnCautionFees({
        action: 'void', remittance_id: remittanceId,
        reason: voiding[remittanceId] || '',
      });
      toast.success(data.detail);
      setVoiding(v => ({ ...v, [remittanceId]: '' }));
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not withdraw that entry'));
    } finally {
      setBusy(null);
    }
  };

  const checkTransfer = async (remittanceId) => {
    setBusy(`remit-${remittanceId}`);
    try {
      const { data } = await staffAPI.actOnCautionFees({
        action: 'check', remittance_id: remittanceId,
      });
      toast.success(data.detail);
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not check that transfer'));
    } finally {
      setBusy(null);
    }
  };

  const toggle = (id) => setSelected(s =>
    s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const sendable = rows.filter(r => (r.blockers || []).length === 0);
  const selectedTotal = rows
    .filter(r => selected.includes(r.id))
    .reduce((sum, r) => sum + Number(r.amount_outstanding || 0), 0);

  const STATE_TABS = [
    { key: 'held', label: 'Held on platform' },
    { key: 'part', label: 'Partly sent' },
    { key: 'sent', label: 'Sent' },
    { key: 'refunded', label: 'Refunded to tenant' },
    { key: '', label: 'All' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
          <PiggyBank size={22} /> Caution deposits
        </h1>
        <p className="text-sm text-dark-500 mt-1">
          Every caution fee paid on a rent. These are tenants' deposits held in trust —
          send them to the designated account so they are not mixed with platform funds.
        </p>
      </div>

      {!canDisburse && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
          <Lock size={17} className="text-dark-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-dark-600">
            You can review these deposits but not move money. Ask an administrator for
            the <strong>disburse payouts</strong> permission.
          </p>
        </div>
      )}

      <DesignatedAccount account={account} canDisburse={canDisburse} onSaved={load} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs text-dark-500">Collected from tenants</p>
          <p className="text-xl font-bold text-dark-900">{naira(summary.deposited)}</p>
          <p className="text-[11px] text-dark-400 mt-0.5">{summary.count ?? 0} deposits</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-dark-500">Still on the platform</p>
          <p className="text-xl font-bold text-amber-600">{naira(summary.sweepable)}</p>
          <p className="text-[11px] text-dark-400 mt-0.5">not yet remitted</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-dark-500">In the deposit account</p>
          <p className="text-xl font-bold text-emerald-600">{naira(summary.remitted)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-dark-500">Refunded to tenants</p>
          <p className="text-xl font-bold text-dark-900">{naira(summary.refunded)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {STATE_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setState(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                state === t.key ? 'bg-[#0C3B2E] text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            className="input py-2 pl-9 text-sm w-full"
            placeholder="Tenant, property or landlord"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {canDisburse && sendable.length > 0 && (
        <div className="card p-4 flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-dark-600">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={selected.length > 0 && selected.length === sendable.length}
              onChange={e => setSelected(e.target.checked ? sendable.map(r => r.id) : [])}
            />
            Select all {sendable.length} sendable on this page
          </label>
          <button
            onClick={sendSelected}
            disabled={busy === 'batch' || selected.length === 0 || !account}
            title={account ? '' : 'Designate a deposit account first'}
            className="px-5 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-40 flex items-center gap-1.5"
          >
            {busy === 'batch' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send {selected.length > 0 ? `${naira(selectedTotal)} (${selected.length})` : 'selected'}
          </button>
        </div>
      )}

      {failedIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            {failedIds.length} deposit{failedIds.length !== 1 ? 's' : ''} could not be
            displayed ({failedIds.join(', ')}). The rest are shown below — check Error
            Logs in the admin for the cause.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-dark-400 text-sm p-4">
          <Loader2 size={15} className="animate-spin" /> Loading caution deposits…
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-8 text-center">
          <CheckCircle2 size={30} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-dark-600 font-medium">Nothing here</p>
          <p className="text-sm text-dark-400 mt-1">No caution deposits match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => {
            const blocked = (r.blockers || []).length > 0;
            const rowBusy = busy === `pool-${r.id}`;
            return (
              <div key={r.id} className="card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex items-start gap-3">
                    {canDisburse && !blocked && (
                      <input
                        type="checkbox"
                        className="mt-1.5 rounded border-gray-300"
                        checked={selected.includes(r.id)}
                        onChange={() => toggle(r.id)}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATE_STYLES[r.state] || 'bg-gray-100 text-gray-600'}`}>
                          {STATE_LABELS[r.state] || r.state}
                        </span>
                        {r.is_refunded && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-dark-600">
                            Refunded to tenant
                          </span>
                        )}
                        {r.payment?.reference && (
                          <span className="font-mono text-[11px] text-dark-400">
                            {String(r.payment.reference).slice(0, 8)}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-dark-900 mt-1.5">{r.property.title}</p>
                      <p className="text-xs text-dark-500">
                        Tenant <strong className="text-dark-700">{r.tenant.name}</strong> · {r.tenant.email}
                      </p>
                      <p className="text-xs text-dark-500">
                        Landlord {r.landlord.name} · lease #{r.agreement_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-dark-900">{naira(r.amount_deposited)}</p>
                    <p className="text-[11px] text-dark-400">
                      {Number(r.amount_remitted) > 0
                        ? `${naira(r.amount_remitted)} remitted · ${naira(r.amount_outstanding)} held`
                        : 'none remitted yet'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs bg-gray-50 rounded-xl p-3">
                  <p><span className="text-dark-500">Interest:</span> {naira(r.interest_earned)}</p>
                  <p><span className="text-dark-500">Deductions:</span> {naira(r.deductions)}</p>
                  <p><span className="text-dark-500">Owed back:</span> {naira(r.total_amount)}</p>
                  <p><span className="text-dark-500">Paid:</span> {new Date(r.deposited_at).toLocaleDateString()}</p>
                </div>

                {r.remittances.length > 0 && (
                  <ul className="space-y-2">
                    {r.remittances.map(m => (
                      <li key={m.id} className="text-xs space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold ${REMITTANCE_STYLES[m.status] || 'text-dark-600'}`}>
                            {naira(m.amount)} · {m.status_display}
                          </span>
                          {/* A hand-recorded entry is evidence someone typed,
                              not a transfer this system made. Saying so on the
                              row is the difference between the two. */}
                          {m.is_external && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700">
                              Recorded by hand
                            </span>
                          )}
                          {m.account_name && (
                            <span className="text-dark-500">
                              to {m.account_name} ({m.bank_name} {m.account_number})
                            </span>
                          )}
                          {m.transfer_reference && (
                            <span className="font-mono text-dark-400">{m.transfer_reference}</span>
                          )}
                          {m.sent_by && <span className="text-dark-400">by {m.sent_by}</span>}
                          <span className="text-dark-400">
                            {new Date(m.completed_at || m.created_at).toLocaleDateString()}
                          </span>
                          {canDisburse && m.status === 'processing' && (
                            <button
                              onClick={() => checkTransfer(m.id)}
                              disabled={busy === `remit-${m.id}`}
                              className="px-2 py-1 rounded-lg border border-gray-200 text-dark-600 text-[11px] font-semibold hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-1"
                            >
                              {busy === `remit-${m.id}`
                                ? <Loader2 size={11} className="animate-spin" />
                                : <RefreshCw size={11} />}
                              Check with Paystack
                            </button>
                          )}
                        </div>
                        {m.note && <p className="text-dark-500">{m.note}</p>}
                        {m.failure_reason && (
                          <p className="text-red-700">{m.failure_reason}</p>
                        )}
                        {m.status === 'voided' && (
                          <p className="text-dark-500">
                            Withdrawn{m.voided_by && ` by ${m.voided_by}`}: {m.void_reason}
                          </p>
                        )}
                        {/* Only a hand-recorded entry can be withdrawn — a real
                            transfer moved money the bank knows about. */}
                        {canDisburse && m.can_be_voided && (
                          <div className="flex gap-2 flex-wrap items-center">
                            <input
                              className="input py-1.5 text-xs w-64"
                              placeholder="Reason to withdraw this entry"
                              value={voiding[m.id] || ''}
                              onChange={e => setVoiding(v => ({ ...v, [m.id]: e.target.value }))}
                            />
                            <button
                              onClick={() => voidEntry(m.id)}
                              disabled={busy === `remit-${m.id}` || !(voiding[m.id] || '').trim()}
                              title={(voiding[m.id] || '').trim()
                                ? 'Put this deposit back on the queue'
                                : 'Give a reason first — it stays on the ledger'}
                              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-dark-600 text-[11px] font-semibold hover:bg-gray-50 transition disabled:opacity-40 flex items-center gap-1"
                            >
                              <Undo2 size={11} /> Withdraw entry
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {blocked && (
                  <p className="text-xs text-amber-700 flex items-start gap-1.5">
                    <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                    {r.blockers.join(' · ')}
                  </p>
                )}

                {canDisburse && Number(r.amount_outstanding) > 0 && (
                  recording === r.id ? (
                    <RecordSentForm
                      row={r}
                      busy={busy === `record-${r.id}`}
                      onCancel={() => setRecording(null)}
                      onSubmit={recordSent}
                    />
                  ) : (
                    <div className="flex gap-2 flex-wrap items-center pt-1">
                      {!blocked && (
                        <>
                          <button
                            onClick={() => sendOne(r)}
                            disabled={rowBusy || !account}
                            title={account ? '' : 'Designate a deposit account first'}
                            className="px-5 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-40 flex items-center gap-1.5"
                          >
                            {rowBusy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            Send {naira(amounts[r.id] || r.amount_outstanding)}
                          </button>
                          {/* A part-sweep is occasionally needed when the
                              balance cannot cover the whole deposit at once. */}
                          <input
                            className="input py-2 text-sm w-40"
                            inputMode="decimal"
                            placeholder={`Full: ${r.amount_outstanding}`}
                            value={amounts[r.id] || ''}
                            onChange={e => setAmounts(a => ({ ...a, [r.id]: e.target.value }))}
                          />
                        </>
                      )}
                      {/* Offered even when Send is refused: a deposit already
                          refunded may well have been swept long before. */}
                      <button
                        onClick={() => setRecording(r.id)}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-dark-600 text-sm font-semibold hover:bg-gray-50 transition flex items-center gap-1.5"
                      >
                        <FileCheck2 size={13} /> Already sent by hand?
                      </button>
                    </div>
                  )
                )}

                <p className="text-[11px] text-dark-400 flex items-center gap-1">
                  <Clock size={10} /> Deposited {new Date(r.deposited_at).toLocaleString()}
                  {r.refunded_at && ` · refunded ${new Date(r.refunded_at).toLocaleString()}`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StaffCautionFees;
