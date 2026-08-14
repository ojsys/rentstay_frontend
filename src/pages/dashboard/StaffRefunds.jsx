import { useEffect, useState } from 'react';
import {
  Loader2, ShieldCheck, ShieldAlert, AlertTriangle, Banknote, CheckCircle2,
  XCircle, Clock, User as UserIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staffAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-sky-100 text-sky-700',
  declined: 'bg-gray-100 text-gray-500',
  processed: 'bg-emerald-100 text-emerald-700',
};

// Only these two may be paid without a written override.
const NAME_OK = ['exact', 'match'];

const NameCheck = ({ destination }) => {
  if (!destination) {
    return (
      <p className="text-xs text-amber-700 flex items-center gap-1.5">
        <AlertTriangle size={12} /> Guest has not provided a refund account yet.
      </p>
    );
  }
  const ok = NAME_OK.includes(destination.name_check);
  return (
    <div className={`rounded-xl p-3 text-xs ${ok ? 'bg-emerald-50' : 'bg-red-50'}`}>
      <p className={`font-semibold flex items-center gap-1.5 ${ok ? 'text-emerald-800' : 'text-red-800'}`}>
        {ok ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
        Account name {destination.name_check_display.toLowerCase()}
      </p>
      <p className="text-dark-600 mt-1">{destination.name_check_detail}</p>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-dark-700">
        <p><span className="text-dark-500">Bank:</span> {destination.bank_name || '—'}</p>
        <p><span className="text-dark-500">Account:</span> {destination.account_number}</p>
        <p className="sm:col-span-2">
          <span className="text-dark-500">Account name:</span>{' '}
          <strong>{destination.account_name}</strong>
        </p>
      </div>
    </div>
  );
};

/**
 * Staff refund queue.
 *
 * Staff read the guest's own description of why they cancelled, approve an
 * amount, then pay it to an account whose name the bank confirms belongs to
 * that guest. A name that does not match blocks payout unless staff record a
 * written reason.
 */
const StaffRefunds = () => {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [busy, setBusy] = useState(null);
  const [amounts, setAmounts] = useState({});
  const [overrides, setOverrides] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const params = filter === 'open' ? { open: 1 } : filter ? { status: filter } : {};
      const { data } = await staffAPI.listRefunds(params);
      setRows(data.results || []);
      setSummary(data.summary || {});
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not load refunds'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  const act = async (row, action) => {
    setBusy(row.id);
    try {
      const { data } = await staffAPI.decideRefund({
        refund_id: row.id,
        action,
        amount: action === 'approve' ? (amounts[row.id] ?? row.eligible_amount) : undefined,
        override_reason: action === 'payout' ? (overrides[row.id] || '') : undefined,
      });
      toast.success(data.detail);
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not update this refund'));
    } finally {
      setBusy(null);
    }
  };

  const TABS = [
    { key: 'open', label: 'Needs action' },
    { key: 'pending', label: 'Awaiting decision' },
    { key: 'approved', label: 'Awaiting payout' },
    { key: 'processed', label: 'Paid' },
    { key: '', label: 'All' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
          <Banknote size={22} /> Guest Refunds
        </h1>
        <p className="text-sm text-dark-500 mt-1">
          Review the guest&apos;s reason, approve an amount, and pay it to an account in their name.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Awaiting decision', value: summary.pending, colour: 'text-amber-600' },
          { label: 'Awaiting payout', value: summary.approved_awaiting_payout, colour: 'text-sky-600' },
          { label: 'Paid out', value: summary.processed, colour: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-dark-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.colour}`}>{s.value ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              filter === t.key ? 'bg-[#0C3B2E] text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-dark-400 text-sm p-4">
          <Loader2 size={15} className="animate-spin" /> Loading refunds…
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-8 text-center">
          <CheckCircle2 size={30} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-dark-600 font-medium">Nothing here</p>
          <p className="text-sm text-dark-400 mt-1">No refunds match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => {
            const nameOk = NAME_OK.includes(r.destination?.name_check);
            return (
              <div key={r.id} className="card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-dark-400">Booking #{r.booking_id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[r.status]}`}>
                        {r.status_display}
                      </span>
                    </div>
                    <p className="font-semibold text-dark-900 mt-1">{r.listing.title}</p>
                    <p className="text-xs text-dark-500 flex items-center gap-1 mt-0.5">
                      <UserIcon size={11} /> {r.guest.legal_name} · {r.guest.email}
                      {r.guest.is_verified && <ShieldCheck size={11} className="text-emerald-600" />}
                    </p>
                    <p className="text-xs text-dark-400 mt-0.5">
                      {r.stay.check_in} → {r.stay.check_out} · host {r.host_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-dark-500">Paid ₦{Number(r.amount_paid).toLocaleString()}</p>
                    <p className="text-lg font-bold text-dark-900">
                      ₦{Number(r.status === 'pending' ? r.eligible_amount : r.amount_approved).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-dark-400">
                      {r.status === 'pending' ? 'eligible' : 'approved'}
                    </p>
                  </div>
                </div>

                {/* The guest's own account of what happened */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[11px] font-semibold text-dark-500 uppercase tracking-wider">
                    Guest&apos;s reason
                  </p>
                  <p className="text-sm text-dark-800 mt-1">{r.reason || 'No reason given.'}</p>
                  <p className="text-xs text-dark-400 mt-2">{r.policy_label}</p>
                </div>

                <NameCheck destination={r.destination} />

                {r.blockers?.length > 0 && r.status !== 'processed' && (
                  <p className="text-xs text-amber-700 flex items-start gap-1.5">
                    <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                    {r.blockers.join(' · ')}
                  </p>
                )}

                {r.status === 'processed' && (
                  <p className="text-xs text-emerald-700">
                    Paid by {r.processed_by} · reference {r.transfer_reference || '—'}
                    {r.name_override_reason && ` · override: ${r.name_override_reason}`}
                  </p>
                )}

                {/* Actions */}
                {r.status === 'pending' && (
                  <div className="flex items-end gap-2 flex-wrap pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-dark-500 uppercase tracking-wider mb-1">
                        Amount to approve
                      </label>
                      <input
                        className="input py-2 text-sm w-40"
                        value={amounts[r.id] ?? r.eligible_amount}
                        onChange={e => setAmounts(a => ({ ...a, [r.id]: e.target.value }))}
                      />
                    </div>
                    <button
                      onClick={() => act(r, 'approve')}
                      disabled={busy === r.id}
                      className="px-4 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => act(r, 'decline')}
                      disabled={busy === r.id}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-60 flex items-center gap-1.5"
                    >
                      <XCircle size={14} /> Decline
                    </button>
                  </div>
                )}

                {r.status === 'approved' && (
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
                    <button
                      onClick={() => act(r, 'payout')}
                      disabled={busy === r.id || !r.destination}
                      className="px-5 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-40 flex items-center gap-1.5"
                    >
                      {busy === r.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Banknote size={14} />}
                      Pay ₦{Number(r.amount_approved).toLocaleString()}
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-dark-400 flex items-center gap-1">
                  <Clock size={10} /> Requested {new Date(r.created_at).toLocaleString()}
                  {r.decided_by && ` · decided by ${r.decided_by}`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StaffRefunds;
