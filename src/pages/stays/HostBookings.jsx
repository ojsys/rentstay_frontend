import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { staysAPI } from '../../services/api';
import { Loader2, CalendarDays, Users, Check, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const STATUS_STYLES = {
  pending:          { label: 'Pending',       cls: 'bg-yellow-100 text-yellow-800' },
  approved:         { label: 'Approved',      cls: 'bg-blue-100 text-blue-800' },
  confirmed:        { label: 'Confirmed',     cls: 'bg-green-100 text-green-800' },
  completed:        { label: 'Completed',     cls: 'bg-gray-100 text-gray-700' },
  cancelled_guest:  { label: 'Cancelled',     cls: 'bg-red-100 text-red-700' },
  cancelled_host:   { label: 'Declined',      cls: 'bg-red-100 text-red-700' },
};

const HostBookings = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [declineModal, setDeclineModal] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);

  const load = async () => {
    try {
      const res = await staysAPI.getBookingsHost();
      setItems(res.data.results || res.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (user?.user_type === 'landlord') return <Navigate to="/dashboard/stays" replace />;

  const approve = async (id) => {
    try { await staysAPI.approveBooking(id); toast.success('Booking approved'); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || 'Failed to approve'); }
  };

  const openDecline = (booking) => {
    setDeclineModal(booking);
    setDeclineReason('');
  };

  const confirmDecline = async () => {
    if (!declineReason.trim()) { toast.error('Please provide a reason'); return; }
    setDeclining(true);
    try {
      await staysAPI.declineBooking(declineModal.id, declineReason.trim());
      toast.success('Booking declined');
      setDeclineModal(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to decline');
    } finally { setDeclining(false); }
  };

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-dark-900">Guest Bookings</h1>
        <p className="text-sm text-dark-500 mt-1">Manage incoming booking requests for your listings</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-dark-500">
          <Loader2 className="animate-spin mr-2" size={20} /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-xl font-semibold text-dark-900 mb-2">No bookings yet</p>
          <p className="text-dark-500">Bookings from guests will appear here.</p>
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

                  <p className="text-sm text-dark-600 mt-0.5">
                    Guest: <span className="font-medium">{b.guest?.full_name || b.guest?.email}</span>
                    {b.guest_phone && <> · {b.guest_phone}</>}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dark-600 mt-2">
                    <span className="flex items-center gap-1"><CalendarDays size={12} /> {b.check_in} → {b.check_out}{nights ? ` (${nights} night${nights !== 1 ? 's' : ''})` : ''}</span>
                    {b.guests && <span className="flex items-center gap-1"><Users size={12} /> {b.guests} guest{b.guests !== 1 ? 's' : ''}</span>}
                  </div>

                  {b.guest_note && (
                    <p className="text-xs text-dark-500 italic mt-1">"{b.guest_note}"</p>
                  )}

                  <p className="mt-2 font-semibold text-dark-900">₦{Number(b.amount_total).toLocaleString()}</p>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {b.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-primary btn-sm flex items-center gap-1"
                          onClick={() => approve(b.id)}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          className="btn btn-sm border border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-1"
                          onClick={() => openDecline(b)}
                        >
                          <X size={14} /> Decline
                        </button>
                      </>
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

      {/* Decline modal */}
      {declineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-1">Decline booking</h3>
            <p className="text-sm text-dark-500 mb-4">
              Decline <span className="font-medium">{declineModal.guest?.full_name || declineModal.guest?.email}</span>'s
              request for <span className="font-medium">{declineModal.listing?.title}</span>?
            </p>
            <label className="label">Reason (sent to guest)</label>
            <textarea
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              className="input min-h-[80px] mb-4"
              placeholder="Dates are no longer available, property under maintenance…"
            />
            <div className="flex gap-3 justify-end">
              <button className="btn btn-sm" onClick={() => setDeclineModal(null)}>Cancel</button>
              <button
                className="btn btn-sm bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                disabled={declining}
                onClick={confirmDecline}
              >
                {declining ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                Decline booking
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default HostBookings;
