import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staysAPI } from '../../services/api';
import { Loader2, Upload, Plus, Eye, Edit, Bed } from 'lucide-react';
import toast from 'react-hot-toast';

const LandlordDashboardStays = () => {
  const [activeSection, setActiveSection] = useState('listings');

  // Listings state
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', status: '', type: '' });
  const [uploading, setUploading] = useState({});

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

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

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (activeSection === 'bookings') loadBookings();
  }, [activeSection]);

  const publish = async (id) => { try { await staysAPI.publish(id); loadListings(); toast.success('Published'); } catch { toast.error('Failed'); } };
  const unpublish = async (id) => { try { await staysAPI.unpublish(id); loadListings(); toast.success('Unpublished'); } catch { toast.error('Failed'); } };
  const approve = async (id) => { try { await staysAPI.approveBooking(id); toast.success('Approved'); loadBookings(); } catch { toast.error('Failed'); } };

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

  const sections = [
    { key: 'listings', label: 'My Listings' },
    { key: 'bookings', label: 'Bookings' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark-900">Short-Term Stays</h2>
        <Link to="/stays/listings/new" className="btn btn-primary btn-sm inline-flex items-center gap-1"><Plus size={14} /> New Listing</Link>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${activeSection === s.key ? 'bg-white shadow-sm text-dark-900' : 'text-dark-600 hover:text-dark-900'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* My Listings */}
      {activeSection === 'listings' && (
        <>
          {/* Filter bar */}
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
                    <img
                      src={l.primary_image || '/placeholder-property.jpg'}
                      alt={l.title}
                      className="w-full h-full object-cover"
                    />
                    <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full ${l.is_published ? 'bg-green-600 text-white' : 'bg-dark-200 text-dark-700'}`}>
                      {l.is_published ? 'Published' : (l.status || 'Draft')}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="font-semibold text-dark-900 line-clamp-1">{l.title}</p>
                    <p className="text-xs text-dark-600 mb-3">
                      {l.listing_type?.replace('_', ' ')} &middot; ₦{Number(l.nightly_rate).toLocaleString()}/night
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
                      <div className="flex items-center gap-2">
                        <label className="btn btn-secondary btn-sm inline-flex items-center cursor-pointer">
                          <Upload size={14} className="mr-1" /> Upload Image
                          <input type="file" accept="image/*" hidden onChange={(e) => uploadImage(l.id, e.target.files?.[0], !l.primary_image)} />
                        </label>
                        {uploading[l.id] && <span className="text-xs text-dark-600">Uploading...</span>}
                      </div>
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
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Guest Bookings</h3>
          {bookingsLoading ? (
            <div className="flex items-center justify-center py-8 text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <p className="text-dark-600 text-sm">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-dark-600">
                    <th className="py-2 pr-4">Listing</th>
                    <th className="py-2 pr-4">Guest</th>
                    <th className="py-2 pr-4">Dates</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-t border-gray-100">
                      <td className="py-2 pr-4">{b.listing?.title}</td>
                      <td className="py-2 pr-4">{b.guest?.full_name || b.guest?.email}</td>
                      <td className="py-2 pr-4">{b.check_in} &mdash; {b.check_out}</td>
                      <td className="py-2 pr-4">₦{Number(b.amount_total).toLocaleString()}</td>
                      <td className="py-2 pr-4 capitalize">{(b.status || '').replace('_', ' ')}</td>
                      <td className="py-2 pr-4">
                        {b.status === 'pending' && (
                          <button className="btn btn-primary btn-sm" onClick={() => approve(b.id)}>Approve</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LandlordDashboardStays;
