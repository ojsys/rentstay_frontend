import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Compass, Loader2, Trash2, MapPin, Phone, MessageCircle, Star, X, CalendarDays, Users, Backpack,
} from 'lucide-react';
import { experiencesAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { naira, prettyDay, toAddOnPayload } from '../../utils/experiences';
import { StayExperiences } from './StayExperiences';

const STATUS_TONE = {
  held: 'bg-amber-50 text-amber-800',
  confirmed: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-50 text-red-700',
};

const waLink = (num) => `https://wa.me/${String(num).replace(/[^\d]/g, '').replace(/^0/, '234')}`;

const ReviewForm = ({ addon, onDone }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!comment.trim()) { toast.error('Say a few words about it'); return; }
    setBusy(true);
    try {
      const res = await experiencesAPI.reviewAddOn(addon.id, { rating, comment });
      toast.success('Thanks for the review');
      onDone(res.data);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not save the review'));
    } finally { setBusy(false); }
  };
  return (
    <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-2">
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-checked={rating === n} role="radio">
            <Star size={20} className={n <= rating ? 'fill-accent text-accent' : 'text-gray-300'} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="input text-sm" placeholder="How was it? Your review helps the next guest choose." />
      <button type="button" onClick={submit} disabled={busy} className="btn btn-primary btn-sm">{busy ? 'Saving…' : 'Post review'}</button>
    </div>
  );
};

/**
 * Experiences on a stay booking.
 *
 * Before payment this is the second door onto the shelf: the guest can still
 * add or remove experiences and the Pay button collects the new total. After
 * payment it becomes the practical bit — where to meet, who to call.
 */
const BookingAddOns = ({ booking: b, canAdd, onChange }) => {
  const [busyId, setBusyId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [reason, setReason] = useState('');
  const [reviewing, setReviewing] = useState(null);
  const addons = b.experience_addons || [];
  const live = addons.filter(a => a.status !== 'cancelled');

  const add = async (item) => {
    setAdding(true);
    try {
      const res = await experiencesAPI.addToBooking(b.id, [toAddOnPayload(item)]);
      onChange(res.data);
      toast.success(`${item.experience.title} added to this stay`);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not add that experience'));
    } finally { setAdding(false); }
  };

  const remove = async (addon) => {
    setBusyId(addon.id);
    try {
      const res = await experiencesAPI.removeAddOn(addon.id);
      onChange(res.data);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not remove it'));
    } finally { setBusyId(null); }
  };

  const cancel = async () => {
    const addon = cancelling;
    setBusyId(addon.id);
    try {
      const res = await experiencesAPI.cancelAddOn(addon.id, reason);
      onChange(res.data);
      setCancelling(null);
      setReason('');
      toast.success('Experience cancelled');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not cancel it'));
    } finally { setBusyId(null); }
  };

  if (!addons.length && !canAdd) return null;

  const refundIfCancelledNow = (a) => (new Date(a.free_cancellation_until) > new Date() ? Number(a.amount) : 0);

  return (
    <>
      {addons.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mb-3"><Compass size={14} /> Experiences on this stay</h2>
          <ul className="space-y-4">
            {addons.map(a => (
              <li key={a.id} className={a.status === 'cancelled' ? 'opacity-70' : ''}>
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {a.experience.primary_image && <img src={a.experience.primary_image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/experiences/${a.experience.slug}`} className="text-sm font-semibold text-gray-900 hover:text-primary line-clamp-2">{a.experience.title}</Link>
                      <span className="text-sm font-semibold text-gray-900 flex-shrink-0">{naira(a.amount)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> {prettyDay(a.date)}{a.start_time ? ` · ${a.start_time.slice(0, 5)}` : ''}</span>
                      <span className="inline-flex items-center gap-1"><Users size={11} /> {a.guests}</span>
                      <span>by {a.experience.provider_name}</span>
                    </p>
                    <span className={`inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_TONE[a.status]}`}>
                      {a.status === 'held' ? 'Pay with your stay' : a.status_label}
                    </span>
                    {a.status === 'cancelled' && a.refund_status !== 'none' && (
                      <span className="ml-1.5 text-[11px] text-gray-600">
                        {a.refund_status === 'refunded' ? `${naira(a.refund_amount)} refunded` : `${naira(a.refund_amount)} refund on its way`}
                      </span>
                    )}
                  </div>
                </div>

                {a.meeting && a.status === 'confirmed' && (
                  <div className="mt-3 ml-[68px] bg-gray-50 rounded-xl p-3 text-sm space-y-1.5">
                    <p className="flex gap-1.5 text-gray-800"><MapPin size={14} className="flex-shrink-0 mt-0.5 text-primary" /> {a.meeting.meeting_point}</p>
                    {a.meeting.meeting_directions && <p className="text-xs text-gray-600 whitespace-pre-line">{a.meeting.meeting_directions}</p>}
                    {a.meeting.what_to_bring && <p className="text-xs text-gray-600 flex gap-1.5"><Backpack size={12} className="flex-shrink-0 mt-0.5" /> {a.meeting.what_to_bring}</p>}
                    <div className="flex gap-3 pt-1">
                      {a.meeting.provider_phone && <a href={`tel:${a.meeting.provider_phone}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><Phone size={12} /> Call</a>}
                      {a.meeting.provider_whatsapp && <a href={waLink(a.meeting.provider_whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><MessageCircle size={12} /> WhatsApp</a>}
                    </div>
                  </div>
                )}

                <div className="mt-2 ml-[68px] flex gap-3 text-xs">
                  {a.status === 'held' && canAdd && (
                    <button type="button" onClick={() => remove(a)} disabled={busyId === a.id} className="inline-flex items-center gap-1 font-semibold text-red-600 hover:underline">
                      {busyId === a.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Remove
                    </button>
                  )}
                  {a.can_cancel && (
                    <button type="button" onClick={() => setCancelling(a)} className="font-semibold text-gray-600 hover:text-red-600 hover:underline">Cancel this experience</button>
                  )}
                  {a.can_review && reviewing !== a.id && (
                    <button type="button" onClick={() => setReviewing(a.id)} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"><Star size={12} /> Review</button>
                  )}
                  {a.my_review && <span className="inline-flex items-center gap-1 text-gray-500"><Star size={12} className="fill-accent text-accent" /> You rated it {a.my_review.rating}/5</span>}
                </div>
                {reviewing === a.id && <ReviewForm addon={a} onDone={(data) => { setReviewing(null); onChange(data); }} />}
              </li>
            ))}
          </ul>
          {live.some(a => a.status === 'held') && (
            <p className="text-[11px] text-gray-400 mt-3">Seats are held while you check out. They are confirmed the moment your payment goes through.</p>
          )}
        </div>
      )}

      {canAdd && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <StayExperiences
            listing={b.listing}
            checkIn={b.check_in}
            checkOut={b.check_out}
            guests={b.guests}
            onPick={add}
            busy={adding}
            pickedIds={live.map(a => a.experience.id)}
            title="Add to your stay"
          />
        </div>
      )}

      {cancelling && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setCancelling(null)} />
          <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-gray-900">Cancel {cancelling.experience.title}?</h3>
              <button onClick={() => setCancelling(null)} className="p-1 text-gray-400" aria-label="Close"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {refundIfCancelledNow(cancelling) > 0
                ? `You'll get ${naira(cancelling.amount)} back — you're inside the free-cancellation window.`
                : `It's less than ${cancelling.experience.free_cancellation_hours} hours to go, so this one is not refundable.`}
              {' '}Your stay is not affected.
            </p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="input text-sm mt-3" placeholder="Reason (optional)" />
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setCancelling(null)} className="flex-1 btn btn-secondary">Keep it</button>
              <button type="button" onClick={cancel} disabled={busyId === cancelling.id} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-60">
                {busyId === cancelling.id ? 'Cancelling…' : 'Cancel experience'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BookingAddOns;
