// What a host keeps from a booking: the guest paid amount_total and the
// commission (service_fee) is deducted at source. Mirrors _stays_net in
// backend/stays/views.py — keep the two in step.
export const stayNet = (b) => Number(b.amount_total || 0) - Number(b.service_fee || 0);

// Refunds a guest has asked for that are waiting on the host.
export const pendingRefundCount = (bookings = []) =>
  bookings.filter(b => b.refund?.status === 'pending').length;
