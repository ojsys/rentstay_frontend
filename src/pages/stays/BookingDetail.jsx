import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Users, MapPin, CreditCard, Loader2, X, Lock,
  ShieldAlert, ShieldCheck, MessageSquare, KeyRound, Receipt, Info, Star,
  Download, FileText, Image as ImageIcon, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staysAPI, messagingAPI } from '../../services/api';
import { nightsBetween } from '../../utils/dates';
import { getErrorMessage } from '../../utils/errors';

const STATUS = {
  pending: { label: 'Awaiting host approval', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved — payment due', cls: 'bg-sky-100 text-sky-700' },
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Completed', cls: 'bg-gray-100 text-gray-600' },
  cancelled_guest: { label: 'Cancelled by you', cls: 'bg-red-100 text-red-700' },
  cancelled_host: { label: 'Cancelled by host', cls: 'bg-red-100 text-red-700' },
  expired: { label: 'Expired', cls: 'bg-gray-100 text-gray-500' },
  failed: { label: 'Payment failed', cls: 'bg-red-100 text-red-700' },
};

const CANCELLABLE = ['pending', 'approved', 'confirmed'];

const POLICY_TEXT = {
  flexible: 'Full refund up to 24 hours before check-in.',
  moderate: 'Full refund up to 5 days before check-in.',
  strict: '50% refund up to 7 days before check-in.',
};

const Row = ({ label, value, strong }) => (
  <div className="flex justify-between text-sm">
    <span className="text-dark-600">{label}</span>
    <span className={strong ? 'font-bold text-dark-900' : 'text-dark-800'}>{value}</span>
  </div>
);

/**
 * Everything a guest needs to manage one stay.
 *
 * Check-in instructions are deliberately withheld until the booking is
 * confirmed — they routinely contain door codes and key-safe locations, which
 * should not reach someone who has not paid.
 */
const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [paying, setPaying] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [refundQuote, setRefundQuote] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await staysAPI.getBooking(id);
      setBooking(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const pay = async () => {
    setPaying(true);
    try {
      const res = await staysAPI.initBookingPayment(booking.id);
      const url = res.data?.authorization_url;
      if (url) { window.location.href = url; return; }
      toast.error('Could not start payment');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not start payment'));
    } finally {
      setPaying(false);
    }
  };

  const messageHost = async () => {
    setMessaging(true);
    try {
      // Booking-scoped: a stay listing usually has no linked property, which
      // is why the old property-based call failed outright.
      const { data } = await messagingAPI.startConversationForBooking(booking.id);
      navigate(`/messages?conversation=${data.id}`);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not open the conversation'));
    } finally {
      setMessaging(false);
    }
  };

  // Blob download — the endpoint returns the file itself, not a URL, so the
  // object URL must be created and revoked here.
  const downloadReceipt = async (type) => {
    setDownloading(type);
    try {
      const res = await staysAPI.downloadReceipt(booking.id, type);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-booking-${booking.id}.${type}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // An error body arrives as a Blob because of responseType, so the JSON
      // has to be read back out before getErrorMessage can see it.
      let detail = null;
      try {
        detail = JSON.parse(await e?.response?.data?.text?.());
      } catch { /* not JSON — fall through */ }
      toast.error(
        detail?.detail || getErrorMessage(e, 'Could not download your receipt')
      );
    } finally {
      setDownloading(null);
    }
  };

  const refreshPayment = async () => {
    setRefreshing(true);
    try {
      const { data } = await staysAPI.refreshPayment(booking.id);
      setBooking(data.booking);
      toast[data.changed ? 'success' : 'info'](data.detail);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not check your payment just now'));
    } finally {
      setRefreshing(false);
    }
  };

  // Preview the refund before the guest commits — cancelling blind is how
  // people end up surprised by a strict policy.
  const openCancel = async () => {
    setCancelOpen(true);
    try {
      const { data } = await staysAPI.refundQuote(booking.id);
      setRefundQuote(data);
    } catch {
      setRefundQuote(null);
    }
  };

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      await staysAPI.cancelBooking(booking.id, cancelReason.trim());
      toast.success('Booking cancelled');
      setCancelOpen(false);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not cancel'));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="animate-spin" size={20} /> Loading booking…
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-sm">
          <Lock size={30} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-900">Booking not available</p>
          <p className="text-sm text-gray-500 mt-1">
            It may not exist, or it belongs to someone else.
          </p>
          <Link to="/stays/bookings" className="btn btn-secondary btn-sm mt-4 inline-block">
            Back to my stays
          </Link>
        </div>
      </div>
    );
  }

  const b = booking;
  const s = STATUS[b.status] || STATUS.pending;
  const listing = b.listing || {};
  const nights = b.nights || (b.check_in && b.check_out ? nightsBetween(b.check_in, b.check_out) : 0);
  const isConfirmed = ['confirmed', 'completed'].includes(b.status);
  const canCancel = CANCELLABLE.includes(b.status);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0C3B2E] md:bg-white md:border-b md:border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 md:py-4 max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/stays/bookings')}
            className="flex items-center gap-1.5 text-white md:text-gray-600 hover:text-gray-900 transition font-medium text-sm"
          >
            <ArrowLeft size={18} /> <span className="hidden md:inline">My stays</span>
          </button>
          <h1 className="text-base font-bold text-white md:text-gray-900">Booking details</h1>
          <span className="w-8" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Listing + status */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {listing.primary_image && (
            <div className="relative h-40 md:h-52">
              <img src={listing.primary_image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <Link to={`/stays/listings/${listing.id}`} className="text-white font-bold hover:underline">
                  {listing.title}
                </Link>
              </div>
            </div>
          )}
          <div className="p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
              <span className="font-mono text-xs text-gray-400">Booking #{b.id}</span>
            </div>
            {b.cancellation_reason && (
              <p className="text-xs text-red-600 mt-2">Reason: {b.cancellation_reason}</p>
            )}
          </div>
        </div>

        {/* Verification nudge */}
        {b.needs_guest_verification && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <ShieldAlert size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">Verify your identity</p>
              <p className="text-xs text-amber-800 mt-0.5">
                This host asks guests to verify before check-in. Your booking is not at risk —
                it takes about a minute.
              </p>
              <Link
                to="/verify"
                className="inline-flex items-center gap-1.5 mt-2.5 px-4 py-2 rounded-xl bg-[#0C3B2E] text-white text-xs font-semibold hover:bg-[#0a3226] transition"
              >
                <ShieldCheck size={13} /> Verify now
              </Link>
            </div>
          </div>
        )}

        {/* Stay details */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Your stay</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Check-in</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{b.check_in}</p>
            </div>
            <div className="border border-gray-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Check-out</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{b.check_out}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><CalendarDays size={12} /> {nights} night{nights !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1"><Users size={12} /> {b.guests} guest{b.guests !== 1 ? 's' : ''}</span>
          </div>

          <div className="pt-2 border-t border-gray-50">
            <p className="text-xs text-gray-500 flex items-start gap-1.5">
              <MapPin size={12} className="mt-0.5 flex-shrink-0" />
              <span>
                {isConfirmed
                  ? (listing.address || listing.location?.display || 'Address provided by your host')
                  : `${listing.location?.display || listing.area || 'Location'} — exact address shared once confirmed`}
              </span>
            </p>
          </div>
        </div>

        {/* Check-in instructions: only once paid — these carry door codes */}
        {isConfirmed && (listing.check_in_instructions || listing.check_out_instructions) && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <KeyRound size={14} /> Arrival details
            </h2>
            {listing.check_in_instructions && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Checking in</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{listing.check_in_instructions}</p>
              </div>
            )}
            {listing.check_out_instructions && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Checking out</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{listing.check_out_instructions}</p>
              </div>
            )}
          </div>
        )}
        {!isConfirmed && (listing.check_in_instructions || listing.check_out_instructions) && (
          <p className="text-xs text-gray-400 flex items-center gap-1.5 px-1">
            <Info size={12} /> Arrival details appear here once your booking is confirmed.
          </p>
        )}

        {/* Paid but still pending? Let them re-check rather than wait. */}
        {['pending', 'approved'].includes(b.status) && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3">
            <Info size={18} className="text-sky-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sky-900">Already paid?</p>
              <p className="text-xs text-sky-800 mt-0.5">
                If your payment went through but this still shows as
                {' '}{s.label.toLowerCase()}, check again with the payment provider.
              </p>
              <button
                onClick={refreshPayment}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 mt-2.5 px-4 py-2 rounded-xl bg-[#0C3B2E] text-white text-xs font-semibold hover:bg-[#0a3226] transition disabled:opacity-60"
              >
                {refreshing
                  ? <Loader2 size={13} className="animate-spin" />
                  : <RefreshCw size={13} />}
                Refresh payment status
              </button>
            </div>
          </div>
        )}

        {/* Refund status */}
        {b.refund && (
          <div className={`rounded-2xl p-4 border ${
            b.refund.status === 'approved' ? 'bg-emerald-50 border-emerald-200'
              : b.refund.status === 'declined' ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <h2 className="text-sm font-semibold text-gray-900">
              Refund {b.refund.status_display.toLowerCase()}
            </h2>
            <p className="text-xs text-gray-600 mt-1">{b.refund.policy_label}</p>
            {b.refund.status === 'pending' && (
              <p className="text-sm text-gray-800 mt-2">
                You are eligible for <strong>₦{Number(b.refund.eligible_amount).toLocaleString()}</strong>.
                Your host is reviewing the request.
              </p>
            )}
            {b.refund.status === 'approved' && (
              <p className="text-sm text-gray-800 mt-2">
                <strong>₦{Number(b.refund.amount_approved).toLocaleString()}</strong> will be
                returned to your original payment method.
              </p>
            )}
            {b.refund.status === 'declined' && (
              <p className="text-sm text-gray-800 mt-2">
                Your refund request was declined.
                {b.refund.decision_note && ` Reason: ${b.refund.decision_note}`}
              </p>
            )}
          </div>
        )}

        {/* Receipt — only once payment has actually succeeded */}
        {b.receipt_available && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mb-1">
              <Download size={14} /> Payment receipt
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Proof of payment for this stay — useful for expenses or reimbursement.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => downloadReceipt('pdf')}
                disabled={downloading === 'pdf'}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-60"
              >
                {downloading === 'pdf'
                  ? <Loader2 size={14} className="animate-spin" />
                  : <FileText size={14} />}
                Download PDF
              </button>
              <button
                onClick={() => downloadReceipt('png')}
                disabled={downloading === 'png'}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-60"
              >
                {downloading === 'png'
                  ? <Loader2 size={14} className="animate-spin" />
                  : <ImageIcon size={14} />}
                Download image
              </button>
            </div>
          </div>
        )}

        {/* Price */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mb-1">
            <Receipt size={14} /> Price
          </h2>
          <Row
            label={`₦${Number(listing.nightly_rate || 0).toLocaleString()} × ${nights} night${nights !== 1 ? 's' : ''}`}
            value={`₦${Number(b.amount_subtotal).toLocaleString()}`}
          />
          {Number(b.cleaning_fee) > 0 && (
            <Row label="Cleaning fee" value={`₦${Number(b.cleaning_fee).toLocaleString()}`} />
          )}
          <div className="pt-2 mt-1 border-t border-gray-100">
            <Row label="Total" value={`₦${Number(b.amount_total).toLocaleString()}`} strong />
          </div>
          <p className="text-[11px] text-gray-400 pt-1">
            {isConfirmed ? 'Paid in full.' : 'You are charged when the booking is confirmed.'}
          </p>
        </div>

        {/* Host */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Your host</h2>
          <div className="flex items-center gap-3">
            {listing.owner?.profile_picture ? (
              <img src={listing.owner.profile_picture} alt="" className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {(listing.owner?.first_name || 'H')[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">
                {[listing.owner?.first_name, listing.owner?.last_name].filter(Boolean).join(' ') || 'Host'}
              </p>
              {listing.owner?.host_score && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Star size={11} className="fill-yellow-400 text-yellow-400" />
                  {listing.owner.host_score} · {listing.owner.host_review_count} review(s)
                </p>
              )}
            </div>
            <button
              onClick={messageHost}
              disabled={messaging}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 flex-shrink-0"
            >
              {messaging ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
              Message
            </button>
          </div>
        </div>

        {/* Cancellation policy */}
        {listing.cancellation_policy && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Cancellation policy</h2>
            <p className="text-sm text-gray-600 capitalize">{listing.cancellation_policy}</p>
            <p className="text-xs text-gray-500 mt-0.5">{POLICY_TEXT[listing.cancellation_policy]}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          {b.status === 'approved' && (
            <button
              onClick={pay}
              disabled={paying}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-60"
            >
              {paying ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />} Pay now
            </button>
          )}
          {canCancel && (
            <button
              onClick={openCancel}
              className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
            >
              <X size={15} /> Cancel booking
            </button>
          )}
        </div>
      </div>

      {/* Cancel sheet */}
      {cancelOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setCancelOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-5 max-w-lg mx-auto">
            <h3 className="font-bold text-gray-900">Cancel this booking?</h3>
            <p className="text-sm text-gray-500 mt-1">
              {refundQuote?.policy_label
                || POLICY_TEXT[listing.cancellation_policy]
                || 'Refunds follow the host’s cancellation policy.'}
            </p>
            {refundQuote && (
              <div className={`mt-3 rounded-xl p-3 text-sm ${
                Number(refundQuote.eligible_amount) > 0
                  ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'
              }`}>
                {Number(refundQuote.eligible_amount) > 0 ? (
                  <>You would be eligible for{' '}
                    <strong>₦{Number(refundQuote.eligible_amount).toLocaleString()}</strong>
                    {refundQuote.is_full_refund ? ' — a full refund.' : ' of the amount you paid.'}
                    {' '}Your host reviews and approves refunds.</>
                ) : (
                  <>You are outside the free-cancellation window, so no refund is guaranteed.
                    You can still cancel and ask your host to consider a refund.</>
                )}
              </div>
            )}
            <textarea
              className="input w-full mt-3 min-h-[80px]"
              placeholder="Reason (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setCancelOpen(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold"
              >
                Keep booking
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {cancelling && <Loader2 size={14} className="animate-spin" />} Cancel booking
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BookingDetail;
