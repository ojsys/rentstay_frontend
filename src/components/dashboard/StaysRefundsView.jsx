import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, AlertCircle, CheckCircle, XCircle, RotateCcw, Banknote, Ban,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staysAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { pendingRefundCount } from '../../utils/stayEarnings';

const CANCELLED = ['cancelled_guest', 'cancelled_host'];

// A host's refund trail is every cancelled booking plus any booking with a
// refund row, even if its status later moved on.
const isRefundRow = (b) => CANCELLED.includes(b.status) || !!b.refund;

const naira = (v) => `₦${Number(v || 0).toLocaleString()}`;
const day = (v) => (v ? new Date(v).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

const REFUND_BADGE = {
  pending:   { label: 'Needs your decision', cls: 'bg-amber-100 text-amber-800' },
  approved:  { label: 'Approved — awaiting payout', cls: 'bg-blue-100 text-blue-800' },
  processed: { label: 'Refunded', cls: 'bg-green-100 text-green-800' },
  declined:  { label: 'Declined', cls: 'bg-red-100 text-red-700' },
  closed:    { label: 'Closed by RentStay', cls: 'bg-gray-100 text-gray-700' },
};

const StatCard = ({ label, value, tone }) => (
  <div className="bg-white rounded-2xl p-3 md:p-4 shadow-sm">
    <p className="text-[11px] md:text-xs text-gray-500 font-medium">{label}</p>
    <p className={`text-lg md:text-xl font-bold leading-tight ${tone}`}>{value}</p>
  </div>
);

const TrailStep = ({ icon, tone, title, when, children }) => {
  const Icon = icon;
  return (
    <li className="flex gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${tone}`}>
        <Icon size={12} />
      </div>
      <div className="min-w-0 pb-3">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{title}</span>
          {when && <span className="text-xs text-gray-400 ml-2">{when}</span>}
        </p>
        {children && <div className="text-xs text-gray-500 mt-0.5">{children}</div>}
      </div>
    </li>
  );
};

const DecisionForm = ({ booking, onDone }) => {
  const r = booking.refund;
  const [amount, setAmount] = useState(Number(r.eligible_amount) > 0 ? r.eligible_amount : '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(null);

  const decide = async (decision) => {
    if (decision === 'approve' && !(Number(amount) > 0)) {
      toast.error('Enter the amount to refund');
      return;
    }
    if (decision === 'decline' && !note.trim()) {
      toast.error('Tell the guest why you are declining');
      return;
    }
    setBusy(decision);
    try {
      await staysAPI.decideRefund(booking.id, decision, decision === 'approve' ? Number(amount) : undefined, note.trim());
      toast.success(decision === 'approve' ? 'Refund approved' : 'Refund declined');
      onDone();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not update the refund'));
    } finally { setBusy(null); }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-3">
      <p className="text-xs text-amber-900">
        {Number(r.eligible_amount) > 0 ? (
          <>Under your policy ({r.policy_label.toLowerCase()}) the guest is entitled to <strong>{naira(r.eligible_amount)}</strong>. You can approve a different amount.</>
        ) : (
          <>The guest cancelled too close to check-in for a refund under your policy ({r.policy_label.toLowerCase()}). You may still approve one as a goodwill gesture.</>
        )}
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative sm:w-40">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
          <input
            type="number" min="1" max={booking.amount_total} step="0.01"
            value={amount} onChange={e => setAmount(e.target.value)}
            className="input pl-7 text-sm" placeholder="Amount"
          />
        </div>
        <input
          value={note} onChange={e => setNote(e.target.value)}
          className="input text-sm flex-1" placeholder="Note to the guest (required to decline)"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => decide('approve')} disabled={!!busy}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-700 disabled:opacity-60"
        >
          {busy === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve refund
        </button>
        <button
          onClick={() => decide('decline')} disabled={!!busy}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 border border-red-200 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-50 disabled:opacity-60"
        >
          {busy === 'decline' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Decline
        </button>
      </div>
    </div>
  );
};

const RefundCard = ({ b, onDecided }) => {
  const r = b.refund;
  const badge = r ? REFUND_BADGE[r.status] : null;
  const decidedBy = r?.decided_by_host ? 'you' : 'RentStay';

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{b.listing?.title}</p>
          <p className="text-xs text-gray-500">
            {b.guest?.full_name || b.guest_full_name || 'Guest'} · {b.check_in} → {b.check_out} · paid {naira(b.amount_total)}
          </p>
        </div>
        {badge && (
          <span className={`text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>

      <ol>
        {CANCELLED.includes(b.status) && (
          <TrailStep
            icon={Ban} tone="bg-gray-100 text-gray-600"
            title={b.status === 'cancelled_host' ? 'Declined by you' : 'Cancelled by guest'}
            when={day(r?.requested_at || b.updated_at)}
          >
            {(b.cancellation_reason || r?.reason) && <>“{b.cancellation_reason || r.reason}”</>}
          </TrailStep>
        )}

        {r ? (
          <>
            <TrailStep icon={RotateCcw} tone="bg-amber-100 text-amber-700" title="Refund requested" when={day(r.requested_at)}>
              Eligible under policy: {naira(r.eligible_amount)} · {r.policy_label}
            </TrailStep>

            {r.status === 'approved' || r.status === 'processed' ? (
              <TrailStep icon={CheckCircle} tone="bg-blue-100 text-blue-700"
                title={`${naira(r.amount_approved)} approved by ${decidedBy}`} when={day(r.decided_at)}>
                {r.decision_note && <>“{r.decision_note}”</>}
              </TrailStep>
            ) : r.status === 'declined' ? (
              <TrailStep icon={XCircle} tone="bg-red-100 text-red-600"
                title={`Declined by ${decidedBy}`} when={day(r.decided_at)}>
                {r.decision_note && <>“{r.decision_note}”</>}
              </TrailStep>
            ) : r.status === 'closed' ? (
              <TrailStep icon={XCircle} tone="bg-gray-100 text-gray-600"
                title="Closed by RentStay" when={day(r.decided_at)}>
                Filed in error or a duplicate — not a refusal.
              </TrailStep>
            ) : null}

            {r.status === 'processed' && (
              <TrailStep icon={Banknote} tone="bg-green-100 text-green-700"
                title={`${naira(r.amount_approved)} paid back to the guest`} when={day(r.processed_at)} />
            )}
            {r.status === 'approved' && (
              <TrailStep icon={Banknote} tone="bg-gray-100 text-gray-400" title="Waiting for RentStay to send the refund" />
            )}
          </>
        ) : (
          <TrailStep icon={AlertCircle} tone="bg-gray-100 text-gray-400" title="No refund on record">
            No payment had been taken, or the booking was cancelled before refunds were tracked.
          </TrailStep>
        )}
      </ol>

      {r?.status === 'pending' && <DecisionForm booking={b} onDone={onDecided} />}
    </div>
  );
};

/**
 * Cancelled stays and the refund trail for each: who cancelled, what the policy
 * allowed, who decided, and whether the money has gone back. Hosts also
 * approve or decline pending refunds here.
 */
const StaysRefundsView = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['host-stay-bookings'],
    queryFn: () => staysAPI.getBookingsHost().then(r => r.data?.results || r.data || []),
  });

  const rows = useMemo(() => {
    const all = bookings.filter(isRefundRow);
    // Anything awaiting the host first, then most recent.
    return all.sort((a, b) =>
      (b.refund?.status === 'pending') - (a.refund?.status === 'pending')
      || new Date(b.refund?.requested_at || b.updated_at) - new Date(a.refund?.requested_at || a.updated_at));
  }, [bookings]);

  const stats = useMemo(() => {
    const sum = (status) => rows
      .filter(b => b.refund?.status === status)
      .reduce((s, b) => s + Number(b.refund.amount_approved || 0), 0);
    return {
      pending: pendingRefundCount(rows),
      awaitingPayout: sum('approved'),
      refunded: sum('processed'),
      cancellations: rows.filter(b => CANCELLED.includes(b.status)).length,
    };
  }, [rows]);

  const visible = filter === 'pending' ? rows.filter(b => b.refund?.status === 'pending') : rows;

  const onDecided = () => {
    queryClient.invalidateQueries({ queryKey: ['host-stay-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['host-stays-earnings'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="animate-spin mr-2" /> Loading cancellations...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Needs your decision" value={stats.pending} tone={stats.pending ? 'text-amber-600' : 'text-gray-900'} />
        <StatCard label="Approved, not yet sent" value={naira(stats.awaitingPayout)} tone="text-blue-600" />
        <StatCard label="Refunded to guests" value={naira(stats.refunded)} tone="text-green-600" />
        <StatCard label="Cancellations" value={stats.cancellations} tone="text-gray-900" />
      </div>

      <div className="flex gap-2">
        {[['all', 'All'], ['pending', `Needs decision${stats.pending ? ` (${stats.pending})` : ''}`]].map(([key, label]) => (
          <button
            key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === key ? 'bg-[#0C3B2E] text-white' : 'bg-white text-gray-600 shadow-sm'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-sm text-gray-400">
          {filter === 'pending' ? 'No refunds waiting on you.' : 'No cancellations or refunds yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(b => <RefundCard key={b.id} b={b} onDecided={onDecided} />)}
        </div>
      )}
    </div>
  );
};

export default StaysRefundsView;
