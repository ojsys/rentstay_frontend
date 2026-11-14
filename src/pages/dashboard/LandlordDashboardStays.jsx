import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { staysAPI } from '../../services/api';
import {
  Loader2, Upload, Plus, Eye, Edit, Bed, Calendar,
  CheckCircle, X, AlertCircle, Star,
  Clock, Users, Home, ChevronRight, MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errors';
import { listingPath } from '../../utils/links';
import MoveRequestCard from '../../components/stays/MoveRequestCard';
import ReviewGuestModal from '../../components/stays/ReviewGuestModal';
import StaysEarningsView from '../../components/dashboard/StaysEarningsView';
import StaysRefundsView from '../../components/dashboard/StaysRefundsView';
import { pendingRefundCount } from '../../utils/stayEarnings';

const STATUS_STYLES = {
  pending:         { label: 'Pending',    cls: 'bg-yellow-100 text-yellow-800' },
  approved:        { label: 'Approved',   cls: 'bg-blue-100 text-blue-800' },
  confirmed:       { label: 'Confirmed',  cls: 'bg-green-100 text-green-800' },
  completed:       { label: 'Completed',  cls: 'bg-gray-100 text-gray-700' },
  cancelled_guest: { label: 'Cancelled',  cls: 'bg-red-100 text-red-700' },
  cancelled_host:  { label: 'Declined',   cls: 'bg-red-100 text-red-700' },
};

const ListingActionMenu = ({ listing, onPublish, onUnpublish, onUpload, uploading }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg bg-black/30 text-white hover:bg-black/50 transition"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-xl border border-gray-100 min-w-[160px] py-1 overflow-hidden">
            {listing.is_published ? (
              <button className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50" onClick={() => { onUnpublish(); setOpen(false); }}>
                Unpublish
              </button>
            ) : (
              <button className="w-full px-4 py-2.5 text-sm text-left text-green-600 font-medium hover:bg-green-50" onClick={() => { onPublish(); setOpen(false); }}>
                Publish
              </button>
            )}
            <Link to={`/stays/listings/${listing.id}/edit`} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
              Edit listing
            </Link>
            <Link to={`/stays/listings/${listing.id}/availability`} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
              Manage availability
            </Link>
            <Link to={listingPath(listing)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
              Preview listing
            </Link>
            <label className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
              {uploading ? 'Uploading...' : 'Upload photo'}
              <input type="file" accept="image/*" hidden onChange={(e) => { onUpload(e.target.files?.[0]); setOpen(false); }} />
            </label>
          </div>
        </>
      )}
    </div>
  );
};

const SECTIONS = ['listings', 'bookings', 'earnings', 'refunds'];

const LandlordDashboardStays = () => {
  // ?section= lets notifications (e.g. a refund request) open the right tab.
  const [searchParams] = useSearchParams();
  const initialSection = searchParams.get('section');
  const [activeSection, setActiveSection] = useState(
    SECTIONS.includes(initialSection) ? initialSection : 'listings'
  );

  // Fetched up front, unlike the bookings list, so a refund waiting on the
  // host shows a badge without them having to open the tab first.
  const { data: hostBookings = [] } = useQuery({
    queryKey: ['host-stay-bookings'],
    queryFn: () => staysAPI.getBookingsHost().then(r => r.data?.results || r.data || []),
  });
  const refundCount = pendingRefundCount(hostBookings);

  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', status: '', type: '' });
  const [uploading, setUploading] = useState({});

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingFilter, setBookingFilter] = useState('');
  const [reviewModal, setReviewModal] = useState(null);

  const [declineModal, setDeclineModal] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);

  const loadListings = async () => {
    try {
      setListingsLoading(true);
      const params = { mine: 1 };
      if (filters.q) params.q = filters.q;
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      const res = await staysAPI.listListings(params);
      setListings(res.data.results || res.data || []);
    } finally { setListingsLoading(false); }
  };

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      const res = await staysAPI.getBookingsHost();
      setBookings(res.data.results || res.data || []);
    } finally { setBookingsLoading(false); }
  };

  useEffect(() => { loadListings(); }, [filters]); // eslint-disable-line
  useEffect(() => { if (activeSection !== 'listings') loadBookings(); }, [activeSection]);

  const publish = async (id) => { try { await staysAPI.publish(id); loadListings(); toast.success('Published'); } catch { toast.error('Failed'); } };
  const unpublish = async (id) => { try { await staysAPI.unpublish(id); loadListings(); toast.success('Unpublished'); } catch { toast.error('Failed'); } };
  const approve = async (id) => { try { await staysAPI.approveBooking(id); toast.success('Approved'); loadBookings(); } catch { toast.error('Failed'); } };

  const openDecline = (b) => { setDeclineModal(b); setDeclineReason(''); };
  const confirmDecline = async () => {
    if (!declineReason.trim()) { toast.error('Provide a reason'); return; }
    setDeclining(true);
    try {
      await staysAPI.declineBooking(declineModal.id, declineReason.trim());
      toast.success('Booking declined');
      setDeclineModal(null);
      loadBookings();
    } catch (e) { toast.error(getErrorMessage(e, 'Failed')); }
    finally { setDeclining(false); }
  };

  const uploadImage = async (listingId, file, makePrimary = false) => {
    if (!file) return;
    setUploading(u => ({ ...u, [listingId]: true }));
    try {
      const fd = new FormData();
      fd.append('image', file);
      if (makePrimary) fd.append('is_primary', 'true');
      await staysAPI.uploadImage(listingId, fd);
      toast.success('Image uploaded');
      loadListings();
    } catch { toast.error('Upload failed'); }
    setUploading(u => ({ ...u, [listingId]: false }));
  };

  const filteredBookings = bookingFilter
    ? bookings.filter(b => b.status === bookingFilter)
    : bookings;

  const sections = [
    { key: 'listings', label: 'My Listings' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'earnings', label: 'Earnings' },
    { key: 'refunds', label: 'Refunds', fullLabel: 'Cancellations & Refunds', badge: refundCount },
  ];

  // Anything waiting on the host, not just new requests — a date change on an
  // already-confirmed booking needs an answer just as much, and without this
  // the tab would show no badge at all for one.
  const pendingCount = bookings.filter(
    b => b.status === 'pending' || b.date_change?.status === 'pending'
  ).length;

  return (
    <div className="space-y-4 md:space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Short-Term Stays</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage your listings & bookings</p>
        </div>
        <Link
          to="/stays/listings/new"
          className="flex items-center gap-1.5 bg-[#0C3B2E] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#0a3226] transition"
        >
          <Plus size={16} /> New Listing
        </Link>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === s.key
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s.fullLabel ? (
              <><span className="md:hidden">{s.label}</span><span className="hidden md:inline">{s.fullLabel}</span></>
            ) : s.label}
            {s.badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {s.badge}
              </span>
            )}
            {s.key === 'bookings' && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── MY LISTINGS ──────────────────────────────────────── */}
      {activeSection === 'listings' && (
        <>
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <input
              className="input min-w-[160px] text-sm"
              placeholder="Search listings..."
              value={filters.q}
              onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
            />
            <select className="input min-w-[130px] text-sm" value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}>
              <option value="">All types</option>
              <option value="entire">Entire place</option>
              <option value="private_room">Private room</option>
              <option value="shared_room">Shared room</option>
            </select>
            <select className="input min-w-[130px] text-sm" value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {listingsLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="animate-spin mr-2" /> Loading listings...
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bed size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-1">No listings yet</p>
              <p className="text-sm text-gray-400 mb-5">Create your first listing to start hosting</p>
              <Link to="/stays/listings/new" className="inline-flex items-center gap-2 bg-[#0C3B2E] text-white text-sm font-medium px-5 py-2.5 rounded-xl">
                <Plus size={16} /> Create Listing
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile: stacked list */}
              <div className="md:hidden space-y-3">
                {listings.map(l => (
                  <div key={l.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {/* Image + overlay actions */}
                    <div className="relative h-44">
                      <img
                        src={l.primary_image || '/placeholder-property.jpg'}
                        alt={l.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      {/* Status + Rating badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${l.is_published ? 'bg-green-500 text-white' : 'bg-gray-800/80 text-gray-200'}`}>
                          {l.is_published ? 'Live' : (l.status || 'Draft')}
                        </span>
                      </div>
                      {l.avg_rating && (
                        <span className="absolute top-3 right-10 flex items-center gap-0.5 text-xs bg-white px-2 py-1 rounded-full font-semibold">
                          <Star size={11} className="fill-yellow-400 text-yellow-400" /> {l.avg_rating}
                        </span>
                      )}
                      {/* ⋮ Menu */}
                      <div className="absolute top-3 right-3">
                        <ListingActionMenu
                          listing={l}
                          onPublish={() => publish(l.id)}
                          onUnpublish={() => unpublish(l.id)}
                          onUpload={(file) => uploadImage(l.id, file, !l.primary_image)}
                          uploading={uploading[l.id]}
                        />
                      </div>
                      {/* Bottom info */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-semibold text-base line-clamp-1">{l.title}</p>
                        <p className="text-white/80 text-xs mt-0.5">
                          {l.listing_type?.replace('_', ' ')} · ₦{Number(l.nightly_rate).toLocaleString()}/night
                          {l.review_count > 0 && <> · {l.review_count} review{l.review_count !== 1 ? 's' : ''}</>}
                        </p>
                      </div>
                    </div>
                    {/* Quick action row */}
                    <div className="flex divide-x divide-gray-100">
                      <Link to={`/stays/listings/${l.id}/edit`} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-600 hover:bg-gray-50">
                        <Edit size={14} /> Edit
                      </Link>
                      <Link to={`/stays/listings/${l.id}/availability`} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-600 hover:bg-gray-50">
                        <Calendar size={14} /> Availability
                      </Link>
                      <Link to={`/stays/listings/${l.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-600 hover:bg-gray-50">
                        <Eye size={14} /> Preview
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: grid */}
              <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map(l => (
                  <div key={l.id} className="card p-0 overflow-hidden flex flex-col">
                    <div className="relative w-full h-40 bg-gray-100">
                      <img src={l.primary_image || '/placeholder-property.jpg'} alt={l.title} className="w-full h-full object-cover" />
                      <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full ${l.is_published ? 'bg-green-600 text-white' : 'bg-dark-200 text-dark-700'}`}>
                        {l.is_published ? 'Published' : (l.status || 'Draft')}
                      </span>
                      {l.avg_rating && (
                        <span className="absolute top-2 right-2 flex items-center gap-0.5 text-xs bg-white/90 px-2 py-0.5 rounded-full font-medium">
                          <Star size={11} className="fill-yellow-400 text-yellow-400" /> {l.avg_rating}
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <p className="font-semibold text-dark-900 line-clamp-1">{l.title}</p>
                      <p className="text-xs text-dark-600 mb-3 inline-flex items-center flex-wrap gap-x-1">
                        {l.listing_type?.replace('_', ' ')} · ₦{Number(l.nightly_rate).toLocaleString()}/night
                        {l.review_count > 0 && <> · {l.review_count} review{l.review_count !== 1 ? 's' : ''}</>}
                        <span className="inline-flex items-center gap-0.5">· <Eye size={11} /> {l.views_count || 0} view{(l.views_count || 0) !== 1 ? 's' : ''}</span>
                      </p>
                      <div className="mt-auto">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {l.is_published ? (
                            <button className="btn btn-secondary btn-sm" onClick={() => unpublish(l.id)}>Unpublish</button>
                          ) : (
                            <button className="btn btn-primary btn-sm" onClick={() => publish(l.id)}>Publish</button>
                          )}
                          <Link className="btn btn-light btn-sm inline-flex items-center gap-1" to={`/stays/listings/${l.id}/edit`}><Edit size={14} /> Edit</Link>
                          <Link className="btn btn-light btn-sm inline-flex items-center gap-1" to={`/stays/listings/${l.id}/availability`}>Availability</Link>
                          <Link className="btn btn-light btn-sm inline-flex items-center gap-1" to={`/stays/listings/${l.id}`}><Eye size={14} /> View</Link>
                        </div>
                        <label className="btn btn-secondary btn-sm inline-flex items-center cursor-pointer">
                          <Upload size={14} className="mr-1" /> Upload Image
                          <input type="file" accept="image/*" hidden onChange={(e) => uploadImage(l.id, e.target.files?.[0], !l.primary_image)} />
                        </label>
                        {uploading[l.id] && <span className="text-xs text-dark-600 ml-2">Uploading...</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ─── BOOKINGS ─────────────────────────────────────────── */}
      {activeSection === 'bookings' && (
        <div className="space-y-4">
          {/* Booking filter pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {['', 'pending', 'approved', 'confirmed', 'completed', 'cancelled_guest', 'cancelled_host'].map(s => {
              const count = s ? bookings.filter(b => b.status === s).length : bookings.length;
              return (
                <button
                  key={s}
                  onClick={() => setBookingFilter(s)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                    bookingFilter === s ? 'bg-[#0C3B2E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === '' ? 'All' : STATUS_STYLES[s]?.label || s}
                  {count > 0 && <span className={`text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 ${bookingFilter === s ? 'bg-white/20' : 'bg-gray-300 text-gray-600'}`}>{count}</span>}
                </button>
              );
            })}
          </div>

          {bookingsLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="animate-spin mr-2" /> Loading bookings...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No bookings found</p>
              <p className="text-sm text-gray-400 mt-1">Bookings will appear here when guests make requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map(b => {
                const s = STATUS_STYLES[b.status] || { label: b.status, cls: 'bg-gray-100 text-gray-700' };
                const nights = b.check_in && b.check_out
                  ? Math.round((new Date(b.check_out) - new Date(b.check_in)) / 86400000)
                  : null;
                const guestName = b.guest?.full_name || b.guest?.first_name || b.guest?.email || 'Guest';
                const initial = guestName[0]?.toUpperCase();

                return (
                  <div key={b.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {/* Listing image strip */}
                    <div className="relative h-28 md:h-36">
                      <img
                        src={b.listing?.primary_image || '/placeholder-property.jpg'}
                        alt={b.listing?.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>
                        {s.label}
                      </span>
                      <p className="absolute bottom-3 left-3 text-white font-semibold text-sm line-clamp-1 pr-20">
                        {b.listing?.title}
                      </p>
                    </div>

                    <div className="p-4">
                      {/* Guest + dates row */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-[#0C3B2E] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{guestName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {b.guests && `${b.guests} guest${b.guests !== 1 ? 's' : ''} · `}
                            {b.check_in} → {b.check_out}
                            {nights ? ` · ${nights} night${nights !== 1 ? 's' : ''}` : ''}
                          </p>
                          {b.guest_note && (
                            <p className="text-xs text-gray-400 italic mt-1">"{b.guest_note}"</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900 text-base">₦{Number(b.amount_total).toLocaleString()}</p>
                        </div>
                      </div>

                      {b.cancellation_reason && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mb-3">
                          <AlertCircle size={12} /> {b.cancellation_reason}
                        </p>
                      )}

                      {/* Landlords are redirected away from /stays/host/bookings,
                          so a date change they could only decide there would
                          never reach them. */}
                      <MoveRequestCard booking={b} onDone={loadBookings} />

                      {/* Pending actions — full width CTAs */}
                      {b.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition"
                            onClick={() => approve(b.id)}
                          >
                            <CheckCircle size={15} /> Approve
                          </button>
                          <button
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
                            onClick={() => openDecline(b)}
                          >
                            <X size={15} /> Decline
                          </button>
                        </div>
                      )}

                      {/* Stay is over: rate the guest. Feeds their stayer score. */}
                      {b.can_review && (
                        <button
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-[#0C3B2E] text-[#0C3B2E] text-sm font-semibold hover:bg-green-50 transition"
                          onClick={() => setReviewModal(b)}
                        >
                          <Star size={15} /> Review guest
                        </button>
                      )}
                      {b.my_review?.review_type === 'host_to_guest' && (
                        <p className="text-xs text-green-700 flex items-center gap-1 font-medium">
                          <Star size={12} className="fill-green-600 stroke-green-600" />
                          You rated this guest {b.my_review.rating}/5
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── EARNINGS ─────────────────────────────────────────── */}
      {/* Same view as Payments → Stays; hosts look for money in both places. */}
      {activeSection === 'earnings' && <StaysEarningsView />}

      {/* ─── CANCELLATIONS & REFUNDS ──────────────────────────── */}
      {activeSection === 'refunds' && <StaysRefundsView />}

      {reviewModal && (
        <ReviewGuestModal
          booking={reviewModal}
          onClose={() => setReviewModal(null)}
          onDone={loadBookings}
        />
      )}

      {/* ─── Decline modal ────────────────────────────────────── */}
      {declineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Decline booking</h3>
            <p className="text-sm text-gray-500 mb-4">
              Decline <span className="font-medium text-gray-700">{declineModal.guest?.full_name || declineModal.guest?.email}</span>'s
              request for <span className="font-medium text-gray-700">{declineModal.listing?.title}</span>?
            </p>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Reason (sent to guest)</label>
            <textarea
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              className="input min-h-[80px] mb-4"
              placeholder="Dates unavailable, property under maintenance…"
            />
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50" onClick={() => setDeclineModal(null)}>
                Cancel
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-60"
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
    </div>
  );
};

export default LandlordDashboardStays;
