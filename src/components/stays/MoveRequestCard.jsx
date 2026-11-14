import { useState } from 'react';
import { ArrowRight, CalendarClock, Check, Loader2, X } from 'lucide-react';
import { staysAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errors';

/**
 * A guest's request to move their booking, for the host to decide on.
 *
 * Shared by the two places hosts triage bookings — /stays/host/bookings and the
 * landlord dashboard's Stays tab — because a request that appears in only one
 * of them is a request some hosts would never see. (That is exactly what
 * happened to refund decisions, which still only exist on the standalone page.)
 *
 * Approving re-checks availability on the server, so the dates being free when
 * this card rendered is not taken as proof they still are.
 */
const MoveRequestCard = ({ booking, onDone }) => {
  const [busy, setBusy] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState('');

  const change = booking?.date_change;
  if (!change || change.status !== 'pending') return null;

  const decide = async (decision) => {
    setBusy(true);
    try {
      await staysAPI.decideBookingMove(booking.id, decision, note.trim());
      toast.success(decision === 'approve' ? 'Dates moved' : 'Date change declined');
      setDeclining(false);
      setNote('');
      onDone?.();
    } catch (e) {
      // A 409 here means someone took the dates between the request and now —
      // worth reading, so it is surfaced verbatim rather than as "failed".
      toast.error(getErrorMessage(e, 'Could not update the date change'));
    } finally {
      setBusy(false);
    }
  };

  const guestName = booking.guest?.full_name
    || booking.guest?.first_name
    || booking.guest?.email
    || 'The guest';

  return (
    <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 mb-3">
      <p className="text-sm font-semibold text-sky-900 flex items-center gap-1.5">
        <CalendarClock size={14} /> Date change requested
      </p>

      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
        <span className="line-through text-gray-400">
          {change.previous_check_in} → {change.previous_check_out}
        </span>
        <ArrowRight size={13} className="text-gray-400" />
        <span className="font-semibold text-gray-900">
          {change.new_check_in} → {change.new_check_out}
        </span>
      </div>

      <p className="text-xs text-sky-800 mt-1.5">
        Same {change.nights} night{change.nights !== 1 ? 's' : ''}, same price — nothing
        to refund or re-charge. {guestName} keeps their current dates unless you approve.
      </p>

      {change.reason && (
        <p className="text-xs text-gray-500 italic mt-1.5">&ldquo;{change.reason}&rdquo;</p>
      )}

      {declining && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input w-full mt-2.5 min-h-[60px] text-sm"
          placeholder="Why can't you take those dates? (sent to the guest)"
        />
      )}

      <div className="flex gap-2 mt-2.5">
        {declining ? (
          <>
            <button
              onClick={() => { setDeclining(false); setNote(''); }}
              disabled={busy}
              className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-white transition disabled:opacity-60"
            >
              Back
            </button>
            <button
              onClick={() => decide('decline')}
              disabled={busy}
              className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
              Decline change
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => decide('approve')}
              disabled={busy}
              className="flex-1 py-2 rounded-xl bg-[#0C3B2E] text-white text-xs font-semibold hover:bg-[#0a3226] transition disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Approve new dates
            </button>
            <button
              onClick={() => setDeclining(true)}
              disabled={busy}
              className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-white transition disabled:opacity-60"
            >
              Can&apos;t do those dates
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MoveRequestCard;
