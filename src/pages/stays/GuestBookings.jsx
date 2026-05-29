import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staysAPI } from '../../services/api';
import {
  Loader2, CalendarDays, Users, MapPin, X, CreditCard,
  AlertCircle, Star, MessageSquarePlus, ShieldCheck, Bed,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending:         { label: 'Pending',   cls: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400' },
  approved:        { label: 'Approved',  cls: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400' },
  confirmed:       { label: 'Confirmed', cls: 'bg-green-100 text-green-700',  dot: 'bg-green-400' },
  completed:       { label: 'Completed', cls: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  cancelled_guest: { label: 'Cancelled', cls: 'bg-red-100 text-red-700',      dot: 'bg-red-400' },
  cancelled_host:  { label: 'Declined',  cls: 'bg-red-100 text-red-700',      dot: 'bg-red-400' },
};

const FILTER_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled_guest', label: 'Cancelled' },
];

const CANCELLABLE = ['pending', 'approved', 'confirmed'];

const HostScoreBadge = ({ owner }) => {
  if (!owner) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      {owner.is_verified && (
        <span className="inline-flex items-center gap-0.5 text-sky-600 font-medium">
          <ShieldCheck size={11} /> Verified host
        </span>
      )}
      {owner.host_score ? (
        <span className="inline-flex items-center gap-0.5 text-amber-600 font-medium">
          <Star size={11} className="fill-amber-400 stroke-amber-400" />
          {owner.host_score} ({owner.host_review_count || 0})
        </span>
      ) : (
        <span className="text-gray-400 italic">New host</span>
      )}
    </span>
  );
};

const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} type="button" onClick={() => onChange(n)}
        className={`transition-transform hover:scale-110 ${n <= value ? 'text-amber-400' : 'text-gray-300'}`}>
        <Star size={28} className="fill-current" />
      </button>
    ))}
  </div>
);

const GuestBookings = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState(new Set());
  const [payLoading, setPayLoading] = useState({});

  const load = async () => {
    try {
      const res = await staysAPI.getBookingsGuest();
      setItems(res.data.results || res.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const pay = async (id) => {
    setPayLoading(l => ({ ...l, [id]: true }));
    try {
      const res = await staysAPI.initBookingPayment(id);
      const url = res.data?.authorization_url;
      if (url) window.location.href = url;
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to initialise payment'); }
    finally { setPayLoading(l => ({ ...l, [id]: false })); }
  };

  const confirmCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Please provide a reason'); return; }
    setCancelling(true);
    try {
      await staysAPI.cancelBooking(cancelModal.id, cancelReason.trim());
      toast.success('Booking cancelled');
      setCancelModal(null);
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to cancel'); }
    finally { setCancelling(false); }
  };

  const submitReview = async () => {
    if (!reviewComment.trim()) { toast.error('Please write a comment'); return; }
    setSubmittingReview(true);
    try {
      await staysAPI.submitStayReview({
        booking_id: reviewModal.id,
        review_type: 'guest_to_host',
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      toast.success('Review submitted');
      setReviewedBookings(prev => new Set([...prev, reviewModal.id]));
      setReviewModal(null);
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to submit review'); }
    finally { setSubmittingReview(false); }
  };

  const filtered = statusFilter ? items.filter(b => b.status === statusFilter) : items;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-[#0C3B2E] md:bg-white md:border-b md:border-gray-100 shadow-sm">
        <div className="px-4 py-3 md:py-4 max-w-4xl mx-auto">
          <h1 className="text-base font-bold text-white md:text-gray-900">My Stays</h1>
          <p className="text-xs text-white/70 md:text-gray-400 mt-0.5">Your short-stay booking history</p>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide max-w-4xl mx-auto">
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                statusFilter === t.key
                  ? 'bg-white text-[#0C3B2E] md:bg-[#0C3B2E] md:text-white'
                  : 'text-white/70 md:text-gray-500 hover:text-white md:hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Loading stays…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bed size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-800 font-semibold mb-1">No bookings{statusFilter ? ' in this category' : ' yet'}</p>
            <p className="text-sm text-gray-400 mb-4">Find a place to stay and book your first trip</p>
            <Link to="/stays" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0C3B2E] text-white font-semibold text-sm hover:bg-[#0a3226] transition">
              Explore Stays
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b => {
              const s = STATUS_STYLES[b.status] || { label: b.status, cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
              const nights = b.check_in && b.check_out
                ? Math.round((new Date(b.check_out) - new Date(b.check_in)) / 86400000)
                : null;
              const alreadyReviewed = reviewedBookings.has(b.id) || b.my_review;

              return (
                <div key={b.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className={`h-1 w-full ${s.dot}`} />
                  {/* Listing image banner */}
                  <div className="relative h-36 md:h-44 overflow-hidden">
                    <img
                      src={b.listing?.primary_image || '/placeholder-property.jpg'}
                      alt={b.listing?.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <Link to={`/stays/listings/${b.listing?.id}`} className="text-white font-semibold text-sm hover:underline line-clamp-1">
                          {b.listing?.title}
                        </Link>
                        {(b.listing?.location?.display || b.listing?.city) && (
                          <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {b.listing.location?.display || b.listing.city}
                          </p>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Host info */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <HostScoreBadge owner={b.listing?.owner} />
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">₦{Number(b.amount_total).toLocaleString()}</p>
                        {nights && <p className="text-xs text-gray-400">{nights} night{nights !== 1 ? 's' : ''}</p>}
                      </div>
                    </div>

                    {/* Dates + guests */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><CalendarDays size={12} /> {b.check_in} → {b.check_out}</span>
                      {b.guests && <span className="flex items-center gap-1"><Users size={12} /> {b.guests} guest{b.guests !== 1 ? 's' : ''}</span>}
                    </div>

                    {b.cancellation_reason && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mb-3">
                        <AlertCircle size={12} /> {b.cancellation_reason}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {b.status === 'approved' && (
                        <button
                          onClick={() => pay(b.id)}
                          disabled={payLoading[b.id]}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-60"
                        >
                          {payLoading[b.id] ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                          Pay Now
                        </button>
                      )}
                      {b.status === 'completed' && !alreadyReviewed && (
                        <button
                          onClick={() => { setReviewModal(b); setReviewRating(5); setReviewComment(''); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-[#0C3B2E] text-[#0C3B2E] text-sm font-semibold hover:bg-green-50 transition"
                        >
                          <MessageSquarePlus size={14} /> Review this stay
                        </button>
                      )}
                      {b.status === 'completed' && alreadyReviewed && (
                        <span className="text-xs text-green-600 flex items-center gap-1 font-medium py-2">
                          <Star size={12} className="fill-green-500 stroke-green-500" />
                          Reviewed ({b.my_review?.rating || reviewRating}★)
                        </span>
                      )}
                      {CANCELLABLE.includes(b.status) && (
                        <button
                          onClick={() => { setCancelModal(b); setCancelReason(''); }}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
                        >
                          <X size={14} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel bottom sheet */}
      {cancelModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setCancelModal(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl p-6 max-w-lg mx-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Cancel booking</h3>
            <p className="text-sm text-gray-500 mb-4">
              Cancel <span className="font-medium">{cancelModal.listing?.title}</span>{' '}
              ({cancelModal.check_in} → {cancelModal.check_out})?
            </p>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reason for cancellation</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="input w-full min-h-[80px] mb-4"
              placeholder="Change of plans, found another place…"
            />
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold">
                Keep booking
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {cancelling ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                Yes, cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Review bottom sheet */}
      {reviewModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setReviewModal(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl p-6 max-w-lg mx-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Review your stay</h3>
            <p className="text-sm text-gray-500 mb-4">{reviewModal.listing?.title}</p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rating</label>
              <StarRating value={reviewRating} onChange={setReviewRating} />
            </div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Your experience</label>
            <textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              className="input w-full min-h-[80px] mb-4"
              placeholder="How was your stay? Was the place as described? Would you recommend it?"
            />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold">
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={submittingReview}
                className="flex-1 py-3 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submittingReview ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                Submit review
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GuestBookings;
