import { useEffect, useState } from 'react';
import {
  Loader2, Search, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp,
  Receipt, Clock, Gift, Undo2, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staffAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';

/**
 * Payments desk: find a payment, ask Paystack what really happened, and see
 * what the platform earned.
 *
 * Built around one support question — "the guest says they paid but it shows
 * pending" — which previously needed Django admin and a Paystack login to
 * answer. The **Needs checking** view is the proactive half: stay payments
 * still pending long after they were created, so the mismatch is found before
 * the customer reports it.
 */

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-sky-100 text-sky-700',
  success: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const naira = (v) => `₦${Number(v || 0).toLocaleString(undefined, {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
})}`;

const PaymentRow = ({ row, onReconcile, busy }) => (
  <div className="card p-4 space-y-2.5">
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[row.status]}`}>
            {row.status_display}
          </span>
          <span className="text-[11px] text-dark-500">{row.type_display}</span>
          <span className="font-mono text-[11px] text-dark-400">
            {String(row.reference).slice(0, 8)}
          </span>
        </div>
        <p className="font-semibold text-dark-900 mt-1">{row.payer.name}</p>
        <p className="text-xs text-dark-500">{row.payer.email}</p>
      </div>
      <p className="text-lg font-bold text-dark-900">{naira(row.amount)}</p>
    </div>

    {row.booking && (
      <p className="text-xs text-dark-600">
        Booking #{row.booking.id} · {row.booking.listing} ·{' '}
        <span className="font-medium">{row.booking.status}</span> · from {row.booking.check_in}
      </p>
    )}

    {row.needs_attention && (
      <p className="text-xs text-red-800 bg-red-50 rounded-lg p-2.5 flex items-start gap-1.5">
        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
        <span>
          <strong>Paid, but the booking never confirmed.</strong> Reconcile to
          apply the payment and release the dates.
        </span>
      </p>
    )}

    <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
      <p className="text-[11px] text-dark-400 flex items-center gap-1">
        <Clock size={10} />
        {new Date(row.created_at).toLocaleString()}
        {row.paid_at && ` · paid ${new Date(row.paid_at).toLocaleString()}`}
      </p>
      <button
        onClick={() => onReconcile(row)}
        disabled={busy}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-dark-700 text-xs font-semibold hover:bg-gray-50 transition disabled:opacity-60 flex items-center gap-1.5"
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
        Check with Paystack
      </button>
    </div>
  </div>
);

const RevenuePanel = ({ data }) => {
  if (!data) return null;
  const months = data.monthly || [];
  const peak = Math.max(...months.map(m => Number(m.total)), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs text-dark-500">Net revenue</p>
          <p className="text-2xl font-bold text-emerald-600">{naira(data.net)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-dark-500">This month</p>
          <p className="text-2xl font-bold text-dark-900">{naira(data.month_to_date)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-dark-500 flex items-center gap-1">
            <Gift size={11} /> Waived for new hosts
          </p>
          <p className="text-2xl font-bold text-sky-600">{naira(data.waived_value)}</p>
          <p className="text-[11px] text-dark-400 mt-0.5">
            {data.waived_bookings} booking{data.waived_bookings !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-dark-500 flex items-center gap-1">
            <Undo2 size={11} /> Reversed
          </p>
          <p className="text-2xl font-bold text-red-600">{naira(data.reversed_amount)}</p>
        </div>
      </div>

      <div className="card p-4">
        <p className="text-sm font-semibold text-dark-900 mb-3">By segment</p>
        <div className="space-y-2">
          {[
            { key: 'rent', label: 'Rent', tone: 'bg-sky-400' },
            { key: 'stays', label: 'Short stays', tone: 'bg-amber-400' },
            { key: 'other', label: 'Other', tone: 'bg-gray-300' },
          ].map(seg => {
            const value = Number(data.by_segment?.[seg.key] || 0);
            const total = Number(data.net) || 1;
            return (
              <div key={seg.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-dark-600">{seg.label}</span>
                  <span className="font-semibold text-dark-900 tabular-nums">{naira(value)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full ${seg.tone}`}
                    style={{ width: `${Math.max(0, Math.min(100, (value / total) * 100))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {months.length > 0 && (
        <div className="card p-4">
          <p className="text-sm font-semibold text-dark-900 mb-3">Last {months.length} months</p>
          <div className="flex items-end gap-1.5 h-28 overflow-x-auto">
            {months.map(m => (
              <div key={m.month} className="flex-1 min-w-[24px] flex flex-col items-center gap-1">
                <div
                  className="w-full bg-[#0C3B2E] rounded-t"
                  style={{ height: `${Math.max(2, (Number(m.total) / peak) * 88)}px` }}
                  title={`${m.month}: ${naira(m.total)}`}
                />
                <span className="text-[9px] text-dark-400 whitespace-nowrap">
                  {new Date(m.month).toLocaleDateString(undefined, { month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StaffPayments = () => {
  const [view, setView] = useState('mismatches');
  const [rows, setRows] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [hint, setHint] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [sweeping, setSweeping] = useState(false);

  const load = async (searchTerm = query) => {
    setLoading(true);
    try {
      const params = view === 'search'
        ? { view: 'search', q: searchTerm }
        : { view };
      const { data } = await staffAPI.listPayments(params);
      if (view === 'revenue') {
        setRevenue(data);
        setRows([]);
      } else {
        setRows(data.results || []);
        setHint(data.hint || '');
      }
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not load payments'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [view]);

  const reconcile = async (row) => {
    setBusy(row.id);
    try {
      const { data } = await staffAPI.actOnPayment({
        payment_id: row.id, action: 'reconcile',
      });
      // The detail explains what Paystack said even when nothing changed,
      // which is the answer staff actually need.
      (data.changed ? toast.success : toast)(data.detail);
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not check that payment'));
    } finally {
      setBusy(null);
    }
  };

  const sweep = async () => {
    setSweeping(true);
    try {
      const { data } = await staffAPI.actOnPayment({ action: 'sweep' });
      toast.success(data.detail);
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not run the sweep'));
    } finally {
      setSweeping(false);
    }
  };

  const TABS = [
    { key: 'mismatches', label: 'Needs checking', icon: AlertTriangle },
    { key: 'search', label: 'Find a payment', icon: Search },
    { key: 'revenue', label: 'Revenue', icon: TrendingUp },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
          <Receipt size={22} /> Payments
        </h1>
        <p className="text-sm text-dark-500 mt-1">
          Find a payment, ask Paystack what really happened, and see what the
          platform earned.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition inline-flex items-center gap-1.5 ${
              view === t.key ? 'bg-[#0C3B2E] text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
            }`}
          >
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {view === 'search' && (
        <form
          onSubmit={(e) => { e.preventDefault(); load(query); }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input w-full pl-9"
              placeholder="Reference, Paystack reference, email or name"
            />
          </div>
          <button type="submit" className="btn btn-primary px-5">Search</button>
        </form>
      )}

      {view === 'mismatches' && (
        <div className="flex items-start justify-between gap-3 flex-wrap bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm text-amber-900 flex-1 min-w-[240px]">
            {hint || 'Stay payments still pending. Reconcile each one to ask Paystack what really happened.'}
          </p>
          <button
            onClick={sweep}
            disabled={sweeping || rows.length === 0}
            className="px-4 py-2 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-40 flex items-center gap-1.5"
          >
            {sweeping ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Check all
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-dark-400 text-sm p-4">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </div>
      ) : view === 'revenue' ? (
        <RevenuePanel data={revenue} />
      ) : rows.length === 0 ? (
        <div className="card p-8 text-center">
          <CheckCircle2 size={30} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-dark-600 font-medium">
            {view === 'mismatches' ? 'Nothing needs checking' : 'No payments found'}
          </p>
          <p className="text-sm text-dark-400 mt-1">
            {view === 'mismatches'
              ? 'Every stay payment has settled.'
              : 'Try a reference, email or name.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(row => (
            <PaymentRow
              key={row.id}
              row={row}
              busy={busy === row.id}
              onReconcile={reconcile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffPayments;
