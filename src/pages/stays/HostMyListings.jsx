import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { staysAPI } from '../../services/api';
import {
  Loader2, Upload, Plus, Search, Home, Eye, Edit3,
  CalendarClock, MoreVertical, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const STATUS_BADGE = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-500',
  suspended: 'bg-red-100 text-red-700',
};

const HostMyListings = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ q: '', status: '', type: '' });
  const [uploading, setUploading] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const load = async () => {
    try {
      const params = { mine: 1 };
      if (filters.q) params.q = filters.q;
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      const res = await staysAPI.listListings(params);
      setItems(res.data.results || res.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters]);

  if (user?.user_type === 'landlord') return <Navigate to="/dashboard/stays" replace />;

  const publish = async (id) => {
    try { await staysAPI.publish(id); load(); toast.success('Listing published'); }
    catch (e) { toast.error(e?.response?.data?.detail || 'Failed to publish'); }
  };

  const unpublish = async (id) => {
    try { await staysAPI.unpublish(id); load(); toast.success('Listing unpublished'); }
    catch { toast.error('Failed'); }
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
      load();
    } catch { toast.error('Upload failed'); }
    setUploading(u => ({ ...u, [listingId]: false }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-[#0C3B2E] md:bg-white md:border-b md:border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 md:py-4 max-w-5xl mx-auto">
          <h1 className="text-base font-bold text-white md:text-gray-900">My Listings</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 md:bg-gray-100 text-white md:text-gray-700 text-sm font-medium hover:bg-white/30 md:hover:bg-gray-200 transition"
            >
              <Search size={14} />
            </button>
            <button
              onClick={() => navigate('/stays/listings/new')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition"
            >
              <Plus size={14} /> New
            </button>
          </div>
        </div>
        {/* Filter bar */}
        {showFilters && (
          <div className="bg-white border-t border-gray-100 px-4 py-3 flex flex-wrap gap-2 max-w-5xl mx-auto">
            <div className="flex-1 min-w-[140px] relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-8 w-full py-2 text-sm"
                placeholder="Search title"
                value={filters.q}
                onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
              />
            </div>
            <select className="input py-2 text-sm" value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}>
              <option value="">All types</option>
              <option value="entire">Entire place</option>
              <option value="private_room">Private room</option>
              <option value="shared_room">Shared room</option>
            </select>
            <select className="input py-2 text-sm" value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Loading listings…
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Home size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-800 font-semibold mb-1">No listings yet</p>
            <p className="text-sm text-gray-400 mb-4">Create your first listing to start hosting</p>
            <button
              onClick={() => navigate('/stays/listings/new')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0C3B2E] text-white font-semibold text-sm hover:bg-[#0a3226] transition"
            >
              <Plus size={16} /> Create listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(l => {
              const statusKey = l.is_published ? 'published' : (l.status || 'draft');
              const statusLabel = l.is_published ? 'Published' : (l.status ? l.status.charAt(0).toUpperCase() + l.status.slice(1) : 'Draft');
              return (
                <div key={l.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  {/* Image */}
                  <div className="relative w-full h-44">
                    <img
                      src={l.primary_image || '/placeholder-property.jpg'}
                      alt={l.title}
                      className="w-full h-full object-cover"
                    />
                    <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[statusKey] || STATUS_BADGE.draft}`}>
                      {statusLabel}
                    </span>
                    {/* Menu button */}
                    <button
                      onClick={() => setMenuOpen(menuOpen === l.id ? null : l.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition"
                    >
                      {menuOpen === l.id ? <X size={14} /> : <MoreVertical size={14} />}
                    </button>
                    {/* Dropdown menu */}
                    {menuOpen === l.id && (
                      <div className="absolute top-12 right-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 min-w-[160px]">
                        <button
                          onClick={() => { navigate(`/stays/listings/${l.id}/edit`); setMenuOpen(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit3 size={14} /> Edit details
                        </button>
                        <button
                          onClick={() => { navigate(`/stays/listings/${l.id}/availability`); setMenuOpen(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <CalendarClock size={14} /> Availability
                        </button>
                        <button
                          onClick={() => { navigate(`/stays/listings/${l.id}`); setMenuOpen(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye size={14} /> View listing
                        </button>
                        <label className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                          <Upload size={14} />
                          {uploading[l.id] ? 'Uploading…' : 'Upload image'}
                          <input type="file" accept="image/*" hidden onChange={(e) => { uploadImage(l.id, e.target.files?.[0], !l.primary_image); setMenuOpen(null); }} />
                        </label>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          {l.is_published ? (
                            <button
                              onClick={() => { unpublish(l.id); setMenuOpen(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-600 hover:bg-amber-50"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              onClick={() => { publish(l.id); setMenuOpen(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                            >
                              Publish
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex-1 flex flex-col">
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1 mb-0.5">{l.title}</p>
                    <p className="text-xs text-gray-400 capitalize mb-2">
                      {l.listing_type?.replace('_', ' ')} · ₦{Number(l.nightly_rate).toLocaleString()}/night
                    </p>
                    {/* Quick action buttons */}
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => navigate(`/stays/listings/${l.id}/edit`)}
                        className="flex-1 py-2 rounded-xl bg-[#0C3B2E] text-white text-xs font-semibold hover:bg-[#0a3226] transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => navigate(`/stays/listings/${l.id}/availability`)}
                        className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
                      >
                        Availability
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  );
};

export default HostMyListings;
