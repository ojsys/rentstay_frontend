import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { staysAPI, dashboardAPI } from '../../services/api';
import {
  Loader2, Upload, Plus, Eye, Edit, Bed, TrendingUp, Calendar,
  CheckCircle, X, AlertCircle, Star, Banknote, ArrowDownToLine,
  Clock, Users, Home, ChevronRight, MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending:         { label: 'Pending',    cls: 'bg-yellow-100 text-yellow-800' },
  approved:        { label: 'Approved',   cls: 'bg-blue-100 text-blue-800' },
  confirmed:       { label: 'Confirmed',  cls: 'bg-green-100 text-green-800' },
  completed:       { label: 'Completed',  cls: 'bg-gray-100 text-gray-700' },
  cancelled_guest: { label: 'Cancelled',  cls: 'bg-red-100 text-red-700' },
  cancelled_host:  { label: 'Declined',   cls: 'bg-red-100 text-red-700' },
};

const EarningStatCard = ({ icon: Icon, label, value, iconColor = 'text-primary' }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
      <Icon size={18} className={iconColor} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
    </div>
  </div>
);

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
            <Link to={`/stays/listings/${listing.id}`} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
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

const LandlordDashboardStays = () => {
  const [activeSection, setActiveSection] = useState('listings');

  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', status: '', type: '' });
  const [uploading, setUploading] = useState({});

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingFilter, setBookingFilter] = useState('');

  const [declineModal, setDeclineModal] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);

  const [earningsData, setEarningsData] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

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

  const loadEarnings = async () => {
    setEarningsLoading(true);
    try {
      const [earnRes, bankRes] = await Promise.all([
        staysAPI.getHostEarnings(),
        dashboardAPI.getBankAccounts(),
      ]);
      setEarningsData(earnRes.data);
      setBankAccounts(bankRes.data.results || bankRes.data || []);
    } catch { /* silent */ }
    finally { setEarningsLoading(false); }
  };

  useEffect(() => { loadListings(); }, [filters]); // eslint-disable-line
  useEffect(() => { if (activeSection !== 'listings') loadBookings(); }, [activeSection]);
  useEffect(() => { if (activeSection === 'earnings') loadEarnings(); }, [activeSection]);

  const publish = async (id) => { try { await staysAPI.publish(id); loadListings(); toast.success('Published'); } catch { toast.error('Failed'); } };
  const unpublish = async (id) => { try { await staysAPI.unpublish(id); loadListings(); toast.success('Unpublished'); } catch { toast.error('Failed'); } };
  const approve = async (id) => { try { await staysAPI.approveBooking(id); toast.success('Approved'); loadBookings(); } catch { toast.error('Failed'); } };

  const requestWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAccount) { toast.error('Select a bank account'); return; }
    if (!withdrawAmount || Number(withdrawAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    const available = Number(earningsData?.available_balance || 0);
    if (Number(withdrawAmount) > available) { toast.error(`Amount exceeds available balance of ₦${available.toLocaleString()}`); return; }
    setWithdrawing(true);
    try {
      await staysAPI.requestHostPayout({ bank_account_id: Number(withdrawAccount), amount: Number(withdrawAmount) });
      toast.success('Withdrawal request submitted — we\'ll process it within 24 hours');
      setShowWithdrawForm(false);
      setWithdrawAmount('');
      loadEarnings();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to submit request');
    } finally { setWithdrawing(false); }
  };

  const openDecline = (b) => { setDeclineModal(b); setDeclineReason(''); };
  const confirmDecline = async () => {
    if (!declineReason.trim()) { toast.error('Provide a reason'); return; }
    setDeclining(true);
    try {
      await staysAPI.declineBooking(declineModal.id, declineReason.trim());
      toast.success('Booking declined');
      setDeclineModal(null);
      loadBookings();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
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

  const earnings = useMemo(() => {
    const paid = bookings.filter(b => ['confirmed', 'completed'].includes(b.status));
    const total = paid.reduce((sum, b) => sum + Number(b.amount_total || 0), 0);
    const nights = paid.reduce((sum, b) => sum + Number(b.nights || 0), 0);
    const completed = bookings.filter(b => b.status === 'completed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const byListing = {};
    paid.forEach(b => {
      const title = b.listing?.title || `Listing #${b.listing?.id}`;
      byListing[title] = (byListing[title] || 0) + Number(b.amount_total || 0);
    });
    const topListings = Object.entries(byListing).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { total, nights, completed, pending, topListings };
  }, [bookings]);

  const filteredBookings = bookingFilter
    ? bookings.filter(b => b.status === bookingFilter)
    : bookings;

  const sections = [
    { key: 'listings', label: 'My Listings' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'earnings', label: 'Earnings' },
  ];

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

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
            {s.label}
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
                      <p className="text-xs text-dark-600 mb-3">
                        {l.listing_type?.replace('_', ' ')} · ₦{Number(l.nightly_rate).toLocaleString()}/night
                        {l.review_count > 0 && <> · {l.review_count} review{l.review_count !== 1 ? 's' : ''}</>}
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── EARNINGS ─────────────────────────────────────────── */}
      {activeSection === 'earnings' && (
        <div className="space-y-4 md:space-y-6">
          {(bookingsLoading || earningsLoading) ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="animate-spin mr-2" /> Loading earnings...
            </div>
          ) : (
            <>
              {/* Stat cards — 2×2 */}
              <div className="grid grid-cols-2 gap-3">
                <EarningStatCard icon={TrendingUp} label="Total Revenue" value={`₦${earnings.total.toLocaleString()}`} iconColor="text-green-500" />
                <EarningStatCard icon={Calendar} label="Nights Booked" value={earnings.nights} iconColor="text-blue-500" />
                <EarningStatCard icon={CheckCircle} label="Completed" value={earnings.completed} iconColor="text-emerald-500" />
                <EarningStatCard icon={AlertCircle} label="Pending" value={earnings.pending} iconColor="text-amber-500" />
              </div>

              {/* Wallet card */}
              {earningsData && (
                <div className="bg-[#0C3B2E] rounded-2xl p-5 text-white">
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Available for Withdrawal</p>
                  <p className="text-4xl font-bold mb-1">₦{Number(earningsData.available_balance).toLocaleString()}</p>
                  <div className="flex gap-4 text-xs text-white/60 mb-4">
                    <span>Earned: ₦{Number(earningsData.total_earned).toLocaleString()}</span>
                    <span>Withdrawn: ₦{Number(earningsData.total_withdrawn).toLocaleString()}</span>
                  </div>
                  {Number(earningsData.available_balance) > 0 && (
                    <button
                      className="flex items-center gap-2 bg-amber-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-amber-600 transition"
                      onClick={() => setShowWithdrawForm(v => !v)}
                    >
                      <ArrowDownToLine size={16} />
                      {showWithdrawForm ? 'Cancel Withdrawal' : 'Withdraw Funds'}
                    </button>
                  )}

                  {showWithdrawForm && (
                    <form onSubmit={requestWithdraw} className="mt-4 pt-4 border-t border-white/20 space-y-3">
                      <div>
                        <label className="text-white/80 text-xs font-medium block mb-1.5">Bank Account</label>
                        {bankAccounts.length === 0 ? (
                          <p className="text-white/60 text-sm">
                            No bank accounts added.{' '}
                            <Link to="/dashboard/payments" className="underline text-amber-300">Add one here.</Link>
                          </p>
                        ) : (
                          <select
                            className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/40"
                            value={withdrawAccount}
                            onChange={e => setWithdrawAccount(e.target.value)}
                            required
                          >
                            <option value="" className="text-gray-800">— Select account —</option>
                            {bankAccounts.map(ba => (
                              <option key={ba.id} value={ba.id} className="text-gray-800">
                                {ba.bank_name} — {ba.account_number}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="text-white/80 text-xs font-medium block mb-1.5">
                          Amount (max ₦{Number(earningsData.available_balance).toLocaleString()})
                        </label>
                        <input
                          type="number"
                          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/40"
                          min="1"
                          max={earningsData.available_balance}
                          value={withdrawAmount}
                          onChange={e => setWithdrawAmount(e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <p className="text-white/50 text-xs">Processed within 24 hours to your bank account.</p>
                      <button
                        type="submit"
                        disabled={withdrawing || bankAccounts.length === 0}
                        className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-amber-600 transition disabled:opacity-60"
                      >
                        {withdrawing ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
                        Submit Request
                      </button>
                    </form>
                  )}

                  {/* Withdrawal history */}
                  {earningsData.recent_payouts?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <h4 className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3">Withdrawal History</h4>
                      <div className="space-y-2">
                        {earningsData.recent_payouts.map(p => {
                          const statusCls = {
                            pending: 'bg-yellow-400/20 text-yellow-300',
                            processing: 'bg-blue-400/20 text-blue-300',
                            completed: 'bg-green-400/20 text-green-300',
                            failed: 'bg-red-400/20 text-red-300',
                          }[p.status] || 'bg-white/10 text-white/60';
                          return (
                            <div key={p.id} className="flex items-center justify-between text-sm">
                              <div>
                                <p className="text-white font-medium">₦{Number(p.amount).toLocaleString()}</p>
                                <p className="text-white/50 text-xs">{new Date(p.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCls}`}>{p.status}</span>
                                <p className="text-white/40 text-xs mt-0.5">{p.bank_account?.bank_name}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Revenue by listing */}
              {earnings.topListings.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Listing</h3>
                  <div className="space-y-3">
                    {earnings.topListings.map(([title, rev]) => {
                      const pct = earnings.total > 0 ? (rev / earnings.total) * 100 : 0;
                      return (
                        <div key={title}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-gray-700 font-medium truncate flex-1 mr-4">{title}</span>
                            <span className="text-sm font-bold text-gray-900 flex-shrink-0">₦{rev.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#0C3B2E] rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Transactions */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Recent Transactions</h3>
                </div>
                {bookings.filter(b => ['confirmed', 'completed'].includes(b.status)).length === 0 ? (
                  <p className="text-sm text-gray-400 p-4">No paid bookings yet.</p>
                ) : (
                  <>
                    {/* Mobile transaction cards */}
                    <div className="md:hidden divide-y divide-gray-50">
                      {bookings.filter(b => ['confirmed', 'completed'].includes(b.status)).map(b => {
                        const s = STATUS_STYLES[b.status] || { label: b.status, cls: 'bg-gray-100 text-gray-700' };
                        const hostEarning = Number(b.amount_subtotal || 0) + Number(b.cleaning_fee || 0);
                        return (
                          <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <img src={b.listing?.primary_image || '/placeholder-property.jpg'} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{b.listing?.title}</p>
                              <p className="text-xs text-gray-400">{b.guest?.first_name || b.guest?.full_name || 'Guest'} · {b.check_in} → {b.check_out}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-gray-900">₦{hostEarning.toLocaleString()}</p>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                            <th className="pb-3 px-4 pt-3">Listing</th>
                            <th className="pb-3 pr-4">Guest</th>
                            <th className="pb-3 pr-4">Dates</th>
                            <th className="pb-3 pr-4">Host Earnings</th>
                            <th className="pb-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.filter(b => ['confirmed', 'completed'].includes(b.status)).map(b => {
                            const s = STATUS_STYLES[b.status] || { label: b.status, cls: 'bg-gray-100 text-gray-700' };
                            const hostEarning = Number(b.amount_subtotal || 0) + Number(b.cleaning_fee || 0);
                            return (
                              <tr key={b.id} className="border-t border-gray-50">
                                <td className="py-2.5 px-4 font-medium text-gray-900 max-w-[150px] truncate">{b.listing?.title}</td>
                                <td className="py-2.5 pr-4 text-gray-600">{b.guest?.first_name || b.guest?.full_name || b.guest?.email}</td>
                                <td className="py-2.5 pr-4 text-gray-500 whitespace-nowrap">{b.check_in} → {b.check_out}</td>
                                <td className="py-2.5 pr-4">
                                  <span className="font-semibold text-gray-900">₦{hostEarning.toLocaleString()}</span>
                                  <span className="text-xs text-gray-400 ml-1">(of ₦{Number(b.amount_total).toLocaleString()})</span>
                                </td>
                                <td className="py-2.5">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
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
