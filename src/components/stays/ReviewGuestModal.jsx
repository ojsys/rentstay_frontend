import { useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { staysAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';

// Host rates a guest after their stay. The rating feeds the guest's
// "stayer score", which other hosts see on future booking requests.
const ReviewGuestModal = ({ booking, onClose, onDone }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const guestName = booking.guest?.first_name || booking.guest?.full_name || 'your guest';

  const submit = async () => {
    if (!comment.trim()) { toast.error('Please write a comment'); return; }
    setSubmitting(true);
    try {
      await staysAPI.submitStayReview({
        booking_id: booking.id,
        review_type: 'host_to_guest',
        rating,
        comment: comment.trim(),
      });
      toast.success('Guest review submitted');
      onDone?.({ rating });
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Failed to submit review'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Review your guest</h3>
        <p className="text-sm text-gray-500 mb-4">
          How was <span className="font-medium text-gray-700">{guestName}</span> at{' '}
          <span className="font-medium text-gray-700">{booking.listing?.title}</span>?
          Other hosts will see your rating.
        </p>

        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Rating</label>
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n !== 1 ? 's' : ''}`}
              className={`transition-transform hover:scale-110 ${n <= rating ? 'text-amber-400' : 'text-gray-300'}`}
            >
              <Star size={28} className="fill-current" />
            </button>
          ))}
        </div>

        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Your feedback</label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="input min-h-[80px] mb-4"
          placeholder="Were they respectful? Did they follow house rules? Would you host them again?"
        />

        <div className="flex gap-3">
          <button
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-3 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={submitting}
            onClick={submit}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
            Submit review
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewGuestModal;
