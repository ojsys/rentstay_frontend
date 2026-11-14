import { useEffect, useState } from 'react';
import {
  Loader2, Banknote, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2,
  Clock, RefreshCw, Undo2, User as UserIcon, Lock, Copy, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staffAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';

/**
 * Withdrawals queue — landlord, host and agent requests in one place.
 *
 * Every one of these previously required a trip through Django admin. Two
 * things this screen must not become: a faster way to send money to the wrong
 * account, or a faster way to send money someone is no longer owed. So the
 * name check and the live balance are shown on every row, and the server
 * refuses both cases regardless of what this page renders.
 */

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-sky-100 text-sky-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-600',
};

const KIND_STYLES = {
  rental: 'bg-sky-50 text-sky-700',
  stays: 'bg-amber-50 text-amber-700',
  agent: 'bg-violet-50 text-violet-700',
};

const naira = (value) => `₦${Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
})}`;

/** The bank's answer about who owns the destination account. */
const NameCheck = ({ destination }) => {
  if (!destination) {
    return (
      <p className="text-xs text-red-700 flex items-center gap-1.5">
        <AlertTriangle size={12} /> No bank account is linked to this request.
      </p>
    );
  }
  const ok = destination.name_acceptable;
  return (
    <div className={`rounded-xl p-3 text-xs ${ok ? 'bg-emerald-50' : 'bg-red-50'}`}>
      <p className={`font-semibold flex items-center gap-1.5 ${ok ? 'text-emerald-800' : 'text-red-800'}`}>
        {ok ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
        Account name {String(destination.name_check || '').toLowerCase()}
        {destination.name_check_source === 'stored' && (
          <span className="font-normal text-dark-500">(not confirmed with the bank just now)</span>
        )}
      </p>
      <p className="text-dark-600 mt-1">{destination.name_check_detail}</p>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-dark-700">
        <p><span className="text-dark-500">Bank:</span> {destination.bank_name}</p>
        <p><span className="text-dark-500">Account:</span> {destination.account_number}</p>
        <p className="sm:col-span-2">
          <span className="text-dark-500">In the name of:</span>{' '}
          <strong>{destination.account_name}</strong>
        </p>
      </div>
    </div>
  );
};

const StaffPayouts = () => {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [failedIds, setFailedIds] = useState([]);
  const [canDisburse, setCanDisburse] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [kind, setKind] = useState('');
  const [busy, setBusy] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [closeReasons, setCloseReasons] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (kind) params.kind = kind;
      const { data } = await staffAPI.listPayouts(params);
      setRows(data.results || []);
      setSummary(data.summary || {});
      setFailedIds(data.failed_ids || []);
      setCanDisburse(Boolean(data.can_disburse));
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not load withdrawals'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status, kind]);

  const act = async (row, action) => {
    setBusy(row.id);
    try {
      const { data } = await staffAPI.actOnPayout({
        payout_id: row.id,
        kind: row.kind,
        action,
        override_reason:
          action === 'disburse' ? (overrides[row.id] || '')
          : action === 'close' ? (closeReasons[row.id] || '')
          : undefined,
      });
      toast.success(data.detail);
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not update this withdrawal'));
    } finally {
      setBusy(null);
    }
  };

  const STATUS_TABS = [
    { key: 'pending', label: 'Awaiting release' },
    { key: 'processing', label: 'In flight' },
    { key: 'completed', label: 'Paid' },
    { key: 'failed', label: 'Failed' },
    { key: 'closed', label: 'Closed' },
    { key: '', label: 'All' },
  ];

  const KIND_TABS = [
    { key: '', label: 'Everyone' },
    { key: 'rental', label: 'Landlords' },
    { key: 'stays', label: 'Hosts' },
    { key: 'agent', label: 'Agents' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
          <Banknote size={22} /> Withdrawals
        </h1>
        <p className="text-sm text-dark-500 mt-1">
          Landlord, host and agent requests. The account name is confirmed with the
          bank and the balance re-checked before anything is sent.
        </p>
      </div>

      {!canDisburse && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
          <Lock size={17} className="text-dark-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-dark-600">
            You can review this queue but not release money. Ask an administrator for
            the <strong>disburse payouts</strong> permission.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-dark-500">Awaiting release</p>
          <p className="text-2xl font-bold text-amber-600">{summary.awaiting_count ?? '—'}</p>
          <p className="text-xs text-dark-400 mt-0.5">{naira(summary.awaiting_amount)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-dark-500">In flight</p>
          <p className="text-2xl font-bold text-sky-600">{summary.processing ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-dark-500">Longest wait</p>
          <p className={`text-2xl font-bold ${(summary.oldest_waiting_days || 0) > 2 ? 'text-red-600' : 'text-dark-900'}`}>
            {summary.oldest_waiting_days ?? 0}<span className="text-base font-medium"> days</span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                status === t.key ? 'bg-[#0C3B2E] text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {KIND_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setKind(t.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition border ${
                kind === t.key ? 'border-[#0C3B2E] text-[#0C3B2E]' : 'border-gray-200 text-dark-500 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {failedIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            {failedIds.length} request{failedIds.length !== 1 ? 's' : ''} could not be
            displayed ({failedIds.join(', ')}). The rest are shown below — check Error
            Logs in the admin for the cause.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-dark-400 text-sm p-4">
          <Loader2 size={15} className="animate-spin" /> Loading withdrawals…
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-8 text-center">
          <CheckCircle2 size={30} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-dark-600 font-medium">Nothing waiting</p>
          <p className="text-sm text-dark-400 mt-1">No withdrawals match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => {
            const nameOk = r.destination?.name_acceptable;
            const blocked = (r.blockers || []).length > 0;
            return (
              <div key={`${r.kind}-${r.id}`} className="card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${KIND_STYLES[r.kind] || 'bg-gray-100 text-gray-600'}`}>
                        {r.kind_label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[r.status]}`}>
                        {r.status_display}
                      </span>
                      {r.status === 'pending' && r.waiting_days > 2 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700">
                          waiting {r.waiting_days} days
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-dark-400">{r.reference.slice(0, 8)}</span>
                    </div>
                    <p className="font-semibold text-dark-900 mt-1.5 flex items-center gap-1.5">
                      <UserIcon size={12} className="text-dark-400" />
                      {r.recipient.name}
                      {r.recipient.is_verified && <ShieldCheck size={11} className="text-emerald-600" />}
                    </p>
                    <p className="text-xs text-dark-500">{r.recipient.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-dark-900">{naira(r.amount)}</p>
                    <p className="text-[11px] text-dark-400">
                      of {naira(r.available_balance)} available
                    </p>
                  </div>
                </div>

                {/* Two rows for one pot of money. The balance re-check only
                    stops the second when the balance cannot cover both. */}
                {r.other_pending?.length > 0 && (
                  <div className={`rounded-xl p-3 text-xs ${r.likely_duplicate ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <p className={`font-semibold flex items-center gap-1.5 ${r.likely_duplicate ? 'text-red-800' : 'text-amber-800'}`}>
                      <Copy size={12} />
                      {r.likely_duplicate
                        ? 'Looks like a duplicate request'
                        : `${r.other_pending.length} other request${r.other_pending.length !== 1 ? 's' : ''} also waiting`}
                    </p>
                    <ul className="mt-1.5 space-y-0.5 text-dark-700">
                      {r.other_pending.map(o => (
                        <li key={o.id}>
                          {naira(o.amount)} · {o.reference.slice(0, 8)} ·
                          {' '}requested {new Date(o.created_at).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                    {r.likely_duplicate && (
                      <p className="text-dark-600 mt-1.5">
                        Same amount from the same person. Pay one and close the other.
                      </p>
                    )}
                  </div>
                )}

                <NameCheck destination={r.destination} />

                {blocked && r.status === 'pending' && (
                  <p className="text-xs text-amber-700 flex items-start gap-1.5">
                    <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                    {r.blockers.join(' · ')}
                  </p>
                )}

                {r.approved_by && (
                  <p className="text-xs text-dark-500 flex items-center gap-1">
                    <Clock size={10} /> Released by {r.approved_by}
                    {r.approved_at && ` on ${new Date(r.approved_at).toLocaleString()}`}
                  </p>
                )}
                {r.failure_reason && (
                  <p className="text-xs text-red-700 bg-red-50 rounded-lg p-2">{r.failure_reason}</p>
                )}

                {canDisburse && r.status === 'pending' && (
                  <div className="space-y-2 pt-1">
                    {r.destination && !nameOk && (
                      <div>
                        <label className="block text-[11px] font-semibold text-red-700 uppercase tracking-wider mb-1">
                          Override reason (required — the name does not match)
                        </label>
                        <input
                          className="input py-2 text-sm w-full"
                          placeholder="Why is it safe to pay this account?"
                          value={overrides[r.id] || ''}
                          onChange={e => setOverrides(o => ({ ...o, [r.id]: e.target.value }))}
                        />
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap items-center">
                      <button
                        onClick={() => act(r, 'disburse')}
                        disabled={busy === r.id || blocked}
                        className="px-5 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-40 flex items-center gap-1.5"
                      >
                        {busy === r.id ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
                        Send {naira(r.amount)}
                      </button>
                      <button
                        onClick={() => act(r, 'close')}
                        disabled={busy === r.id || !(closeReasons[r.id] || '').trim()}
                        title={(closeReasons[r.id] || '').trim()
                          ? 'Dismiss without sending money'
                          : 'Give a reason first — it is sent to the requester'}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-dark-600 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-40 flex items-center gap-1.5"
                      >
                        <XCircle size={14} /> Close
                      </button>
                    </div>

                    {/* Its own field: the name-override box means something
                        different, and sending that text to the requester as an
                        explanation would be nonsense. */}
                    <input
                      className="input py-2 text-sm w-full"
                      placeholder={r.likely_duplicate
                        ? 'Reason to close — e.g. duplicate of the earlier request'
                        : 'Reason to close (sent to the requester)'}
                      value={closeReasons[r.id] || ''}
                      onChange={e => setCloseReasons(v => ({ ...v, [r.id]: e.target.value }))}
                    />
                  </div>
                )}

                {canDisburse && r.status === 'closed' && (
                  <button
                    onClick={() => act(r, 'reopen')}
                    disabled={busy === r.id}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-dark-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-60 flex items-center gap-1.5 w-fit"
                  >
                    <Undo2 size={13} /> Reopen
                  </button>
                )}

                {canDisburse && r.status === 'processing' && (
                  <div className="flex gap-2 flex-wrap pt-1">
                    <button
                      onClick={() => act(r, 'check')}
                      disabled={busy === r.id}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-dark-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {busy === r.id ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                      Check with Paystack
                    </button>
                    <button
                      onClick={() => act(r, 'reset')}
                      disabled={busy === r.id}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-dark-500 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-60 flex items-center gap-1.5"
                      title="Use when a transfer never actually reached Paystack"
                    >
                      <Undo2 size={13} /> Reset to pending
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-dark-400 flex items-center gap-1">
                  <Clock size={10} /> Requested {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StaffPayouts;
