import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, TrendingUp, Calendar, CheckCircle, AlertCircle, Banknote, ArrowDownToLine,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staysAPI, dashboardAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { stayNet } from '../../utils/stayEarnings';

// Only paid bookings appear here, so only the paid statuses need a style.
const PAID_STATUS = {
  confirmed: { label: 'Confirmed', cls: 'bg-green-100 text-green-800' },
  completed: { label: 'Completed', cls: 'bg-gray-100 text-gray-700' },
};

export const StayStatusBadge = ({ status, className = 'text-xs px-2' }) => {
  const s = PAID_STATUS[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`font-semibold py-0.5 rounded-full ${className} ${s.cls}`}>{s.label}</span>;
};

const isPaid = (b) => ['confirmed', 'completed'].includes(b.status);

const EarningStatCard = ({ icon, label, value, iconColor = 'text-primary' }) => {
  const Icon = icon;
  return (
  <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
      <Icon size={18} className={iconColor} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
    </div>
  </div>
  );
};

/**
 * A host's short-stay earnings: balance, withdrawals and paid bookings.
 * Rendered in both the Payments tab and the Stays tab so the two cannot drift.
 * `onAddBankAccount` replaces the default link to the Payments page, for when
 * this is already rendered there.
 */
const StaysEarningsView = ({ onAddBankAccount }) => {
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ['host-stays-earnings'],
    queryFn: () => staysAPI.getHostEarnings().then(r => r.data),
  });
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['host-stay-bookings'],
    queryFn: () => staysAPI.getBookingsHost().then(r => r.data?.results || r.data || []),
  });
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => dashboardAPI.getBankAccounts().then(r => r.data?.results || r.data || []),
  });

  const paidBookings = useMemo(() => bookings.filter(isPaid), [bookings]);

  const earnings = useMemo(() => {
    const total = paidBookings.reduce((sum, b) => sum + stayNet(b), 0);
    const nights = paidBookings.reduce((sum, b) => sum + Number(b.nights || 0), 0);
    const completed = bookings.filter(b => b.status === 'completed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const byListing = {};
    paidBookings.forEach(b => {
      const title = b.listing?.title || `Listing #${b.listing?.id}`;
      byListing[title] = (byListing[title] || 0) + stayNet(b);
    });
    const topListings = Object.entries(byListing).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { total, nights, completed, pending, topListings };
  }, [bookings, paidBookings]);

  const requestWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAccount) { toast.error('Select a bank account'); return; }
    if (!withdrawAmount || Number(withdrawAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    const available = Number(earningsData?.available_balance || 0);
    if (Number(withdrawAmount) > available) { toast.error(`Amount exceeds available balance of ₦${available.toLocaleString()}`); return; }
    setWithdrawing(true);
    try {
      await staysAPI.requestHostPayout({ bank_account_id: Number(withdrawAccount), amount: Number(withdrawAmount) });
      toast.success('Withdrawal requested. Our team reviews payouts before they are sent — usually the same working day.');
      setShowWithdrawForm(false);
      setWithdrawAmount('');
      queryClient.invalidateQueries({ queryKey: ['host-stays-earnings'] });
      queryClient.invalidateQueries({ queryKey: ['landlord-payments-dashboard'] });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to submit request'));
    } finally { setWithdrawing(false); }
  };

  if (bookingsLoading || earningsLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="animate-spin mr-2" /> Loading earnings...
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stat cards — 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        <EarningStatCard icon={TrendingUp} label="Net Earnings" value={`₦${earnings.total.toLocaleString()}`} iconColor="text-green-500" />
        <EarningStatCard icon={Calendar} label="Nights Booked" value={earnings.nights} iconColor="text-blue-500" />
        <EarningStatCard icon={CheckCircle} label="Completed" value={earnings.completed} iconColor="text-emerald-500" />
        <EarningStatCard icon={AlertCircle} label="Pending" value={earnings.pending} iconColor="text-amber-500" />
      </div>

      {/* Wallet card */}
      {earningsData && (
        <div className="bg-[#0C3B2E] rounded-2xl p-5 text-white">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Available for Withdrawal</p>
          <p className="text-4xl font-bold mb-1">₦{Number(earningsData.available_balance).toLocaleString()}</p>
          <div className="flex gap-4 text-xs text-white/60 mb-3">
            <span>Released: ₦{Number(earningsData.total_earned).toLocaleString()}</span>
            <span>Withdrawn: ₦{Number(earningsData.total_withdrawn).toLocaleString()}</span>
          </div>

          {/* Money that is earned but not yet withdrawable. Without
              this the balance just looks wrong to a host who knows a
              guest has paid. */}
          {Number(earningsData.pending_balance || 0) > 0 && (
            <div className="bg-white/10 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm font-semibold">
                ₦{Number(earningsData.pending_balance).toLocaleString()} on the way
              </p>
              <p className="text-xs text-white/70 mt-0.5">
                {earningsData.hold_policy || 'Released on the guest’s check-in date.'}
                {earningsData.next_release_date && (
                  <> Next release {new Date(earningsData.next_release_date + 'T00:00:00')
                    .toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}.</>
                )}
              </p>
            </div>
          )}

          {/* Commission-free allowance for new hosts */}
          {earningsData.free_bookings_total > 0 && (
            <div className="bg-white/10 rounded-xl px-4 py-3 mb-4">
              {earningsData.free_bookings_remaining > 0 ? (
                <>
                  <p className="text-sm font-semibold text-amber-300">
                    {earningsData.free_bookings_remaining} commission-free booking
                    {earningsData.free_bookings_remaining !== 1 ? 's' : ''} left
                  </p>
                  <p className="text-xs text-white/60 mt-0.5">
                    You keep 100% of your first {earningsData.free_bookings_total} bookings.
                    After that we take {Number(earningsData.commission_rate)}% per booking.
                  </p>
                </>
              ) : (
                <p className="text-xs text-white/60">
                  Commission: {Number(earningsData.commission_rate)}% per booking · your{' '}
                  {earningsData.free_bookings_total} free bookings have been used.
                </p>
              )}
            </div>
          )}
          {Number(earningsData.available_balance) > 0 && (
            <button
              className="flex items-center gap-2 bg-amber-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-amber-600 transition"
              onClick={() => setShowWithdrawForm(v => !v)}
            >
              <ArrowDownToLine size={16} />
              {showWithdrawForm ? 'Cancel Withdrawal' : 'Withdraw Funds'}
            </button>
          )}

          {showWithdrawForm && (
            <form onSubmit={requestWithdraw} className="mt-4 pt-4 border-t border-white/20 space-y-3">
              <div>
                <label className="text-white/80 text-xs font-medium block mb-1.5">Bank Account</label>
                {bankAccounts.length === 0 ? (
                  <p className="text-white/60 text-sm">
                    No bank accounts added.{' '}
                    {onAddBankAccount ? (
                      <button type="button" onClick={onAddBankAccount} className="underline text-amber-300">Add one here.</button>
                    ) : (
                      <Link to="/dashboard/payments" className="underline text-amber-300">Add one here.</Link>
                    )}
                  </p>
                ) : (
                  <select
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/40"
                    value={withdrawAccount}
                    onChange={e => setWithdrawAccount(e.target.value)}
                    required
                  >
                    <option value="" className="text-gray-800">— Select account —</option>
                    {bankAccounts.map(ba => (
                      <option key={ba.id} value={ba.id} className="text-gray-800">
                        {ba.bank_name} — {ba.account_number}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="text-white/80 text-xs font-medium block mb-1.5">
                  Amount (max ₦{Number(earningsData.available_balance).toLocaleString()})
                </label>
                <input
                  type="number"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/40"
                  min="1"
                  max={earningsData.available_balance}
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-white/50 text-xs">Reviewed by our team before it is sent — usually the same working day.</p>
              <button
                type="submit"
                disabled={withdrawing || bankAccounts.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-amber-600 transition disabled:opacity-60"
              >
                {withdrawing ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
                Submit Request
              </button>
            </form>
          )}

          {/* Withdrawal history */}
          {earningsData.recent_payouts?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <h4 className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3">Withdrawal History</h4>
              <div className="space-y-2">
                {earningsData.recent_payouts.map(p => {
                  const statusCls = {
                    pending: 'bg-yellow-400/20 text-yellow-300',
                    processing: 'bg-blue-400/20 text-blue-300',
                    completed: 'bg-green-400/20 text-green-300',
                    failed: 'bg-red-400/20 text-red-300',
                  }[p.status] || 'bg-white/10 text-white/60';
                  return (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-white font-medium">₦{Number(p.amount).toLocaleString()}</p>
                        <p className="text-white/50 text-xs">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCls}`}>{p.status}</span>
                        <p className="text-white/40 text-xs mt-0.5">{p.bank_account?.bank_name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revenue by listing */}
      {earnings.topListings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Earnings by Listing</h3>
          <div className="space-y-3">
            {earnings.topListings.map(([title, rev]) => {
              const pct = earnings.total > 0 ? (rev / earnings.total) * 100 : 0;
              return (
                <div key={title}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-700 font-medium truncate flex-1 mr-4">{title}</span>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">₦{rev.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0C3B2E] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">Stay Payments</h3>
        </div>
        {paidBookings.length === 0 ? (
          <p className="text-sm text-gray-400 p-4">No paid bookings yet.</p>
        ) : (
          <>
            {/* Mobile transaction cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {paidBookings.map(b => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={b.listing?.primary_image || '/placeholder-property.jpg'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{b.listing?.title}</p>
                    <p className="text-xs text-gray-400">{b.guest?.first_name || b.guest?.full_name || 'Guest'} · {b.check_in} → {b.check_out}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">₦{stayNet(b).toLocaleString()}</p>
                    <StayStatusBadge status={b.status} className="text-[10px] px-1.5" />
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                    <th className="pb-3 px-4 pt-3">Listing</th>
                    <th className="pb-3 pr-4">Guest</th>
                    <th className="pb-3 pr-4">Dates</th>
                    <th className="pb-3 pr-4">Host Earnings</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paidBookings.map(b => (
                    <tr key={b.id} className="border-t border-gray-50">
                      <td className="py-2.5 px-4 font-medium text-gray-900 max-w-[150px] truncate">{b.listing?.title}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{b.guest?.first_name || b.guest?.full_name || b.guest?.email}</td>
                      <td className="py-2.5 pr-4 text-gray-500 whitespace-nowrap">{b.check_in} → {b.check_out}</td>
                      <td className="py-2.5 pr-4">
                        <span className="font-semibold text-gray-900">₦{stayNet(b).toLocaleString()}</span>
                        <span className="text-xs text-gray-400 ml-1">(of ₦{Number(b.amount_total).toLocaleString()})</span>
                      </td>
                      <td className="py-2.5"><StayStatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StaysEarningsView;
