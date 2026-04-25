import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { staysAPI } from '../../services/api';
import { Loader2, Upload, Plus, Eye, Edit, Bed, TrendingUp, Calendar, CheckCircle, X, AlertCircle, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending:         { label: 'Pending',    cls: 'bg-yellow-100 text-yellow-800' },
  approved:        { label: 'Approved',   cls: 'bg-blue-100 text-blue-800' },
  confirmed:       { label: 'Confirmed',  cls: 'bg-green-100 text-green-800' },
  completed:       { label: 'Completed',  cls: 'bg-gray-100 text-gray-700' },
  cancelled_guest: { label: 'Cancelled',  cls: 'bg-red-100 text-red-700' },
  cancelled_host:  { label: 'Declined',   cls: 'bg-red-100 text-red-700' },
};

const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="card p-5 flex items-start gap-4">
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon size={18} className="text-primary" />
    </div>
    <div>
      <p className="text-xs text-dark-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-dark-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-dark-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const LandlordDashboardStays = () => {
  const [activeSection, setActiveSection] = useState('listings');

  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', status: '', type: '' });
  const [uploading, setUploading] = useState({});

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

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

  // Earnings computed from bookings
  const earnings = useMemo(() => {
    const paid = bookings.filter(b => ['confirmed', 'completed'].includes(b.status));
    const total = paid.reduce((sum, b) => sum + Number(b.amount_total || 0), 0);
    const nights = paid.reduce((sum, b) => sum + Number(b.nights || 0), 0);
    const completed = bookings.filter(b => b.status === 'completed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    // Revenue by listing
    const byListing = {};
    paid.forEach(b => {
      const title = b.listing?.title || `Listing #${b.listing?.id}`;
      byListing[title] = (byListing[title] || 0) + Number(b.amount_total || 0);
    });
    const topListings = Object.entries(byListing).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { total, nights, completed, pending, topListings };
  }, [bookings]);

  const sections = [
    { key: 'listings', label: 'My Listings' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'earnings', label: 'Earnings' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark-900">Short-Term Stays</h2>
        <Link to="/stays/listings/new" className="btn btn-primary btn-sm inline-flex items-center gap-1"><Plus size={14} /> New Listing</Link>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${activeSection === s.key ? 'bg-white shadow-sm text-dark-900' : 'text-dark-600 hover:text-dark-900'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* My Listings */}
      {activeSection === 'listings' && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <input className="input w-48" placeholder="Search title..." value={filters.q} onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))} />
            <select className="input w-40" value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}>
              <option value="">All types</option>
              <option value="entire">Entire place</option>
              <option value="private_room">Private room</option>
              <option value="shared_room">Shared room</option>
            </select>
            <select className="input w-40" value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {listingsLoading ? (
            <div className="flex items-center justify-center py-12 text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading listings...</div>
          ) : listings.length === 0 ? (
            <div className="card text-center py-12">
              <Bed size={48} className="mx-auto text-dark-300 mb-3" />
              <p className="text-dark-600">No listings yet.</p>
              <Link to="/stays/listings/new" className="btn btn-primary mt-4 inline-flex items-center gap-1"><Plus size={16} /> Create Your First Listing</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          )}
        </>
      )}

      {/* Bookings */}
      {activeSection === 'bookings' && (
        <div className="space-y-4">
          {bookingsLoading ? (
            <div className="flex items-center justify-center py-12 text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar size={40} className="mx-auto text-dark-300 mb-3" />
              <p className="text-dark-600">No bookings yet.</p>
            </div>
          ) : (
            bookings.map(b => {
              const s = STATUS_STYLES[b.status] || { label: b.status, cls: 'bg-gray-100 text-gray-700' };
              const nights = b.check_in && b.check_out ? Math.round((new Date(b.check_out) - new Date(b.check_in)) / 86400000) : null;
              return (
                <div key={b.id} className="card flex flex-col sm:flex-row gap-4">
                  <div className="flex-shrink-0 w-full sm:w-32 h-24 rounded-xl overflow-hidden bg-gray-100">
                    <img src={b.listing?.primary_image || '/placeholder-property.jpg'} alt={b.listing?.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="font-semibold text-dark-900 line-clamp-1">{b.listing?.title}</p>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${s.cls}`}>{s.label}</span>
                    </div>
                    <p className="text-sm text-dark-600 mt-0.5">
                      {b.guest?.full_name || b.guest?.email}
                      {b.guests && <> · {b.guests} guest{b.guests !== 1 ? 's' : ''}</>}
                    </p>
                    <p className="text-xs text-dark-500 mt-1">
                      {b.check_in} → {b.check_out}{nights ? ` (${nights} night${nights !== 1 ? 's' : ''})` : ''}
                    </p>
                    {b.guest_note && <p className="text-xs text-dark-400 italic mt-0.5">"{b.guest_note}"</p>}
                    <p className="font-semibold text-dark-900 mt-1">₦{Number(b.amount_total).toLocaleString()}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {b.status === 'pending' && (
                        <>
                          <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => approve(b.id)}><CheckCircle size={13} /> Approve</button>
                          <button className="btn btn-sm border border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-1" onClick={() => openDecline(b)}><X size={13} /> Decline</button>
                        </>
                      )}
                      {b.cancellation_reason && (
                        <p className="text-xs text-red-500 flex items-center gap-1 self-center"><AlertCircle size={12} /> {b.cancellation_reason}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Earnings */}
      {activeSection === 'earnings' && (
        <div className="space-y-6">
          {bookingsLoading ? (
            <div className="flex items-center justify-center py-12 text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={TrendingUp} label="Total Revenue" value={`₦${earnings.total.toLocaleString()}`} sub="Confirmed + completed bookings" />
                <StatCard icon={Calendar} label="Nights Booked" value={earnings.nights} sub="Paid bookings" />
                <StatCard icon={CheckCircle} label="Completed Stays" value={earnings.completed} />
                <StatCard icon={AlertCircle} label="Pending Requests" value={earnings.pending} sub="Awaiting approval" />
              </div>

              {earnings.topListings.length > 0 && (
                <div className="card">
                  <h3 className="text-base font-semibold text-dark-900 mb-4">Revenue by Listing</h3>
                  <div className="space-y-3">
                    {earnings.topListings.map(([title, rev]) => {
                      const pct = earnings.total > 0 ? (rev / earnings.total) * 100 : 0;
                      return (
                        <div key={title}>
                          <div className="flex items-center justify-between mb-1 text-sm">
                            <span className="text-dark-700 font-medium line-clamp-1 flex-1 mr-4">{title}</span>
                            <span className="font-semibold text-dark-900 flex-shrink-0">₦{rev.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="card">
                <h3 className="text-base font-semibold text-dark-900 mb-4">Recent Transactions</h3>
                {bookings.filter(b => ['confirmed', 'completed'].includes(b.status)).length === 0 ? (
                  <p className="text-sm text-dark-500">No paid bookings yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-dark-500 text-xs uppercase tracking-wide border-b border-gray-100">
                          <th className="pb-3 pr-4">Listing</th>
                          <th className="pb-3 pr-4">Guest</th>
                          <th className="pb-3 pr-4">Dates</th>
                          <th className="pb-3 pr-4">Amount</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.filter(b => ['confirmed', 'completed'].includes(b.status)).map(b => {
                          const s = STATUS_STYLES[b.status] || { label: b.status, cls: 'bg-gray-100 text-gray-700' };
                          return (
                            <tr key={b.id} className="border-t border-gray-50">
                              <td className="py-2.5 pr-4 font-medium text-dark-900 max-w-[150px] truncate">{b.listing?.title}</td>
                              <td className="py-2.5 pr-4 text-dark-600">{b.guest?.full_name || b.guest?.email}</td>
                              <td className="py-2.5 pr-4 text-dark-600 whitespace-nowrap">{b.check_in} → {b.check_out}</td>
                              <td className="py-2.5 pr-4 font-semibold text-dark-900">₦{Number(b.amount_total).toLocaleString()}</td>
                              <td className="py-2.5"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
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
              placeholder="Dates unavailable, property under maintenance…"
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
    </div>
  );
};

export default LandlordDashboardStays;
