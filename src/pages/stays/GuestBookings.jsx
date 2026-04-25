import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { staysAPI } from '../../services/api';
import { Loader2, CalendarDays, Users, MapPin, X, CreditCard, AlertCircle, Star, MessageSquarePlus } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending:          { label: 'Pending',       cls: 'bg-yellow-100 text-yellow-800' },
  approved:         { label: 'Approved',      cls: 'bg-blue-100 text-blue-800' },
  confirmed:        { label: 'Confirmed',     cls: 'bg-green-100 text-green-800' },
  completed:        { label: 'Completed',     cls: 'bg-gray-100 text-gray-700' },
  cancelled_guest:  { label: 'Cancelled',     cls: 'bg-red-100 text-red-700' },
  cancelled_host:   { label: 'Declined',      cls: 'bg-red-100 text-red-700' },
};

const CANCELLABLE = ['pending', 'approved', 'confirmed'];

const GuestBookings = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [reviewModal, setReviewModal] = useState(null); // booking object
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState(new Set());

  const load = async () => {
    try {
      const res = await staysAPI.getBookingsGuest();
      setItems(res.data.results || res.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const pay = async (id) => {
    try {
      const res = await staysAPI.initBookingPayment(id);
      const url = res.data?.authorization_url;
      if (url) window.location.href = url;
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to initialise payment');
    }
  };

  const openCancel = (booking) => {
    setCancelModal(booking);
    setCancelReason('');
  };

  const openReview = (booking) => {
    setReviewModal(booking);
    setReviewRating(5);
    setReviewComment('');
  };

  const submitReview = async () => {
    if (!reviewComment.trim()) { toast.error('Please write a comment'); return; }
    setSubmittingReview(true);
    try {
      await staysAPI.submitReview({ booking_id: reviewModal.id, rating: reviewRating, comment: reviewComment.trim() });
      toast.success('Review submitted');
      setReviewedBookings(prev => new Set([...prev, reviewModal.id]));
      setReviewModal(null);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to submit review');
    } finally { setSubmittingReview(false); }
  };

  const confirmCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Please provide a reason'); return; }
    setCancelling(true);
    try {
      await staysAPI.cancelBooking(cancelModal.id, cancelReason.trim());
      toast.success('Booking cancelled');
      setCancelModal(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to cancel');
    } finally { setCancelling(false); }
  };

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-dark-900">My Stays</h1>
        <p className="text-sm text-dark-500 mt-1">Your short-stay booking history</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-dark-500">
          <Loader2 className="animate-spin mr-2" size={20} /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🛏️</div>
          <p className="text-xl font-semibold text-dark-900 mb-2">No bookings yet</p>
          <p className="text-dark-500 mb-4">Find a place to stay and book your first trip.</p>
          <Link to="/stays" className="btn btn-primary">Explore Stays</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(b => {
            const s = STATUS_STYLES[b.status] || { label: b.status, cls: 'bg-gray-100 text-gray-700' };
            const nights = b.check_in && b.check_out
              ? Math.round((new Date(b.check_out) - new Date(b.check_in)) / 86400000)
              : null;
            return (
              <div key={b.id} className="card flex flex-col sm:flex-row gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-full sm:w-40 h-32 rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={b.listing?.primary_image || '/placeholder-property.jpg'}
                    alt={b.listing?.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <Link
                      to={`/stays/listings/${b.listing?.id}`}
                      className="font-semibold text-dark-900 hover:text-primary line-clamp-1"
                    >
                      {b.listing?.title}
                    </Link>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${s.cls}`}>{s.label}</span>
                  </div>

                  {b.listing?.city && (
                    <div className="flex items-center gap-1 text-xs text-dark-500 mt-1">
                      <MapPin size={11} /> {b.listing.city}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dark-600 mt-2">
                    <span className="flex items-center gap-1"><CalendarDays size={12} /> {b.check_in} → {b.check_out}{nights ? ` (${nights} night${nights !== 1 ? 's' : ''})` : ''}</span>
                    {b.guests && <span className="flex items-center gap-1"><Users size={12} /> {b.guests} guest{b.guests !== 1 ? 's' : ''}</span>}
                  </div>

                  <p className="mt-2 font-semibold text-dark-900">₦{Number(b.amount_total).toLocaleString()}</p>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {b.status === 'approved' && (
                      <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => pay(b.id)}>
                        <CreditCard size={14} /> Pay Now
                      </button>
                    )}
                    {b.status === 'completed' && !reviewedBookings.has(b.id) && (
                      <button
                        className="btn btn-sm border border-primary text-primary hover:bg-primary/10 flex items-center gap-1"
                        onClick={() => openReview(b)}
                      >
                        <MessageSquarePlus size={14} /> Leave a Review
                      </button>
                    )}
                    {CANCELLABLE.includes(b.status) && (
                      <button
                        className="btn btn-sm border border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-1"
                        onClick={() => openCancel(b)}
                      >
                        <X size={14} /> Cancel
                      </button>
                    )}
                    {b.cancellation_reason && (
                      <p className="text-xs text-red-500 flex items-center gap-1 self-center">
                        <AlertCircle size={12} /> {b.cancellation_reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-1">Review your stay</h3>
            <p className="text-sm text-dark-500 mb-4">{reviewModal.listing?.title}</p>
            <div className="mb-4">
              <label className="label mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewRating(n)}
                    className={`p-1 transition-transform hover:scale-110 ${n <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star size={28} className="fill-current" />
                  </button>
                ))}
              </div>
            </div>
            <label className="label">Your experience</label>
            <textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              className="input min-h-[100px] mb-4"
              placeholder="How was your stay? Was the place as described? Would you recommend it?"
            />
            <div className="flex gap-3 justify-end">
              <button className="btn btn-sm" onClick={() => setReviewModal(null)}>Cancel</button>
              <button
                className="btn btn-sm btn-primary flex items-center gap-1"
                disabled={submittingReview}
                onClick={submitReview}
              >
                {submittingReview ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-1">Cancel booking</h3>
            <p className="text-sm text-dark-500 mb-4">
              Cancel <span className="font-medium">{cancelModal.listing?.title}</span> ({cancelModal.check_in} → {cancelModal.check_out})?
            </p>
            <label className="label">Reason for cancellation</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="input min-h-[80px] mb-4"
              placeholder="Change of plans, found another place…"
            />
            <div className="flex gap-3 justify-end">
              <button className="btn btn-sm" onClick={() => setCancelModal(null)}>Keep booking</button>
              <button
                className="btn btn-sm bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                disabled={cancelling}
                onClick={confirmCancel}
              >
                {cancelling ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default GuestBookings;
