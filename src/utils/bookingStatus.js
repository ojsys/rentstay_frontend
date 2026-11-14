/**
 * What a booking's status actually means, from each side.
 *
 * A host told us there was no way to tell whether a guest was waiting on
 * confirmation or on the host's approval. Both sides saw the same bare word —
 * "Pending" — which answers neither question. These helpers turn the status
 * into a sentence naming *whose turn it is*, which is the only thing either
 * party wants from that badge.
 *
 * Kept in one place because guest and host views must never disagree about
 * who is holding things up.
 */

/** True when the listing requires the host to approve before payment. */
const needsApproval = (booking) => booking?.listing?.instant_book === false;

/**
 * @param booking the booking object as returned by the API
 * @param role    'guest' or 'host' — whose screen this is
 * @returns {{label: string, detail: string, waitingOn: 'host'|'guest'|null, tone: string}}
 */
export const bookingState = (booking, role = 'guest') => {
  const status = booking?.status;
  const approval = needsApproval(booking);

  switch (status) {
    case 'pending':
      // Instant-book has no approval step, so "pending" here means unpaid.
      if (!approval) {
        return role === 'host'
          ? { label: 'Awaiting payment', detail: 'The guest has booked but not paid yet. The dates are not held until they do.', waitingOn: 'guest', tone: 'amber' }
          : { label: 'Payment needed', detail: 'Your dates are not held until you pay.', waitingOn: 'guest', tone: 'amber' };
      }
      return role === 'host'
        ? { label: 'Needs your approval', detail: 'The guest is waiting on you. They cannot pay until you approve.', waitingOn: 'host', tone: 'amber' }
        : { label: 'Waiting for the host', detail: 'The host is reviewing your request. You will be able to pay once they approve it.', waitingOn: 'host', tone: 'amber' };

    case 'approved':
      return role === 'host'
        ? { label: 'Awaiting payment', detail: 'You approved this. The guest still needs to pay before the dates are held.', waitingOn: 'guest', tone: 'blue' }
        : { label: 'Approved — pay now', detail: 'The host approved your request. Pay to confirm your dates.', waitingOn: 'guest', tone: 'blue' };

    case 'confirmed':
      return role === 'host'
        ? { label: 'Confirmed', detail: 'Paid and confirmed. Your earnings are released on the check-in date.', waitingOn: null, tone: 'green' }
        : { label: 'Confirmed', detail: 'Paid and confirmed. The address and your host’s number are on this booking.', waitingOn: null, tone: 'green' };

    case 'completed':
      return { label: 'Completed', detail: 'This stay has ended.', waitingOn: null, tone: 'gray' };

    case 'cancelled_guest':
      return role === 'host'
        ? { label: 'Cancelled by guest', detail: 'The guest cancelled this booking.', waitingOn: null, tone: 'red' }
        : { label: 'Cancelled', detail: 'You cancelled this booking.', waitingOn: null, tone: 'red' };

    case 'cancelled_host':
      return role === 'host'
        ? { label: 'Declined', detail: 'You declined this request.', waitingOn: null, tone: 'red' }
        : { label: 'Declined', detail: 'The host could not accept this request. You were not charged.', waitingOn: null, tone: 'red' };

    case 'expired':
      return { label: 'Expired', detail: 'This request was not actioned in time.', waitingOn: null, tone: 'gray' };

    case 'failed':
      return { label: 'Payment failed', detail: 'The payment did not go through.', waitingOn: 'guest', tone: 'red' };

    default:
      return { label: status || 'Unknown', detail: '', waitingOn: null, tone: 'gray' };
  }
};

export const TONE_CLASSES = {
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
};

export default bookingState;
