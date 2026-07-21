import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { staysAPI } from '../../services/api';
import {
  Loader2, CalendarDays, Users, Check, X, Star,
  ShieldCheck, MessageSquarePlus, AlertCircle, MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

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
  { key: 'approved', label: 'Approved' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
];

const StayerBadge = ({ guest }) => {
  if (!guest) return null;
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      {guest.is_verified && (
        <span className="inline-flex items-center gap-0.5 text-sky-600 text-xs font-medium">
          <ShieldCheck size={11} /> Verified
        </span>
      )}
      {guest.stayer_score ? (
        <span className="inline-flex items-center gap-0.5 text-amber-600 text-xs font-medium">
          <Star size={11} className="fill-amber-400 stroke-amber-400" />
          {guest.stayer_score} ({guest.stayer_review_count || 0})
        </span>
      ) : (
        <span className="text-xs text-gray-400 italic">New stayer</span>
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

const HostBookings = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [declineModal, setDeclineModal] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState(new Set());
  const [actionLoading, setActionLoading] = useState({});

  const load = async () => {
    try {
      const res = await staysAPI.getBookingsHost();
      setItems(res.data.results || res.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (user?.user_type === 'landlord') return <Navigate to="/dashboard/stays" replace />;

  const approve = async (id) => {
    setActionLoading(l => ({ ...l, [id]: 'approve' }));
    try { await staysAPI.approveBooking(id); toast.success('Booking approved'); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || 'Failed to approve'); }
    finally { setActionLoading(l => ({ ...l, [id]: null })); }
  };

  const confirmDecline = async () => {
    if (!declineReason.trim()) { toast.error('Please provide a reason'); return; }
    setDeclining(true);
    try {
      await staysAPI.declineBooking(declineModal.id, declineReason.trim());
      toast.success('Booking declined');
      setDeclineModal(null);
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to decline'); }
    finally { setDeclining(false); }
  };

  const submitReview = async () => {
    if (!reviewComment.trim()) { toast.error('Please write a comment'); return; }
    setSubmittingReview(true);
    try {
      await staysAPI.submitStayReview({
        booking_id: reviewModal.id,
        review_type: 'host_to_guest',
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      toast.success('Stayer review submitted');
      setReviewedBookings(prev => new Set([...prev, reviewModal.id]));
      setReviewModal(null);
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to submit review'); }
    finally { setSubmittingReview(false); }
  };

  const filtered = statusFilter ? items.filter(b => b.status === statusFilter) : items;

  const counts = FILTER_TABS.slice(1).reduce((acc, t) => {
    acc[t.key] = items.filter(b => b.status === t.key).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-[#0C3B2E] md:bg-white md:border-b md:border-gray-100 shadow-sm">
        <div className="px-4 py-3 md:py-4 max-w-4xl mx-auto">
          <h1 className="text-base font-bold text-white md:text-gray-900">Guest Bookings</h1>
          <p className="text-xs text-white/70 md:text-gray-400 mt-0.5">Manage booking requests for your listings</p>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 px-4 pb-2 md:pb-0 overflow-x-auto scrollbar-hide md:border-t md:border-gray-100 max-w-4xl mx-auto">
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                statusFilter === t.key
                  ? 'bg-white text-[#0C3B2E] md:bg-[#0C3B2E] md:text-white'
                  : 'text-white/70 md:text-gray-500 hover:text-white md:hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.key && counts[t.key] > 0 && (
                <span className={`ml-0.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                  statusFilter === t.key ? 'bg-[#0C3B2E] text-white md:bg-white md:text-[#0C3B2E]' : 'bg-white/30 md:bg-gray-100 text-white md:text-gray-600'
                }`}>{counts[t.key]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Loading bookings…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-800 font-semibold mb-1">No bookings{statusFilter ? ` with status "${STATUS_STYLES[statusFilter]?.label}"` : ''}</p>
            <p className="text-sm text-gray-400">Booking requests from guests will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b => {
              const s = STATUS_STYLES[b.status] || { label: b.status, cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
              const nights = b.check_in && b.check_out
                ? Math.round((new Date(b.check_out) - new Date(b.check_in)) / 86400000)
                : null;
              const guestName = b.guest?.full_name || `${b.guest?.first_name || ''} ${b.guest?.last_name || ''}`.trim() || b.guest?.email || 'Guest';
              const initial = guestName[0]?.toUpperCase();
              const isActing = actionLoading[b.id];
              const alreadyReviewed = reviewedBookings.has(b.id) || b.my_review;

              return (
                <div key={b.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className={`h-1 w-full ${s.dot}`} />
                  {/* Listing image banner */}
                  <div className="relative h-32 md:h-40 overflow-hidden">
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
                        {b.listing?.location?.display && (
                          <p className="text-white/70 text-xs flex items-center gap-1">
                            <MapPin size={10} /> {b.listing.location.display}
                          </p>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Guest info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-[#0C3B2E] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{guestName}</p>
                        <StayerBadge guest={b.guest} />
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">₦{Number(b.amount_total).toLocaleString()}</p>
                        {Number(b.service_fee) > 0 && (
                          <p className="text-[11px] text-green-600 font-medium">
                            You earn ₦{(Number(b.amount_total) - Number(b.service_fee)).toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">{nights ? `${nights} night${nights !== 1 ? 's' : ''}` : ''}</p>
                      </div>
                    </div>

                    {/* Dates + guests */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><CalendarDays size={12} /> {b.check_in} → {b.check_out}</span>
                      {b.guests && <span className="flex items-center gap-1"><Users size={12} /> {b.guests} guest{b.guests !== 1 ? 's' : ''}</span>}
                    </div>

                    {b.guest_note && (
                      <p className="text-xs text-gray-400 italic mb-3 pl-1">"{b.guest_note}"</p>
                    )}

                    {b.cancellation_reason && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mb-3">
                        <AlertCircle size={12} /> {b.cancellation_reason}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {b.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approve(b.id)}
                            disabled={!!isActing}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-60"
                          >
                            {isActing === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Approve
                          </button>
                          <button
                            onClick={() => { setDeclineModal(b); setDeclineReason(''); }}
                            disabled={!!isActing}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition disabled:opacity-60"
                          >
                            {isActing === 'decline' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                            Decline
                          </button>
                        </>
                      )}
                      {b.status === 'completed' && !alreadyReviewed && (
                        <button
                          onClick={() => { setReviewModal(b); setReviewRating(5); setReviewComment(''); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-[#0C3B2E] text-[#0C3B2E] text-sm font-semibold hover:bg-green-50 transition"
                        >
                          <MessageSquarePlus size={14} /> Review stayer
                        </button>
                      )}
                      {b.status === 'completed' && alreadyReviewed && (
                        <span className="text-xs text-green-600 flex items-center gap-1 font-medium py-2">
                          <Star size={12} className="fill-green-500 stroke-green-500" />
                          Reviewed ({b.my_review?.rating || reviewRating}★)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decline bottom sheet */}
      {declineModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setDeclineModal(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl p-6 max-w-lg mx-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Decline booking</h3>
            <p className="text-sm text-gray-500 mb-4">
              Declining <span className="font-medium">{declineModal.guest?.full_name || declineModal.guest?.email}</span>'s request
              for <span className="font-medium">{declineModal.listing?.title}</span>
            </p>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reason (sent to guest)</label>
            <textarea
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              className="input w-full min-h-[80px] mb-4"
              placeholder="Dates are no longer available, property under maintenance…"
            />
            <div className="flex gap-3">
              <button onClick={() => setDeclineModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold">
                Cancel
              </button>
              <button
                onClick={confirmDecline}
                disabled={declining}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {declining ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                Decline booking
              </button>
            </div>
          </div>
        </>
      )}

      {/* Review stayer bottom sheet */}
      {reviewModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setReviewModal(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl p-6 max-w-lg mx-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Review your stayer</h3>
            <p className="text-sm text-gray-500 mb-4">
              How was <span className="font-medium">{reviewModal.guest?.first_name}</span> at{' '}
              <span className="font-medium">{reviewModal.listing?.title}</span>?
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rating</label>
              <StarRating value={reviewRating} onChange={setReviewRating} />
            </div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Your feedback</label>
            <textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              className="input w-full min-h-[80px] mb-4"
              placeholder="Were they respectful? Did they follow house rules? Would you host again?"
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

export default HostBookings;
