import { useEffect, useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { staysAPI } from '../../services/api';
import { Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const HostMyListings = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ q: '', status: '', type: '' });
  const [uploading, setUploading] = useState({});

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

  const publish = async (id) => { try { await staysAPI.publish(id); load(); } catch { toast.error('Failed'); } };
  const unpublish = async (id) => { try { await staysAPI.unpublish(id); load(); } catch { toast.error('Failed'); } };

  const uploadImage = async (listingId, file, makePrimary=false) => {
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
    <DashboardShell>
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold">My Listings</h1>
          <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex items-center gap-2">
            <input className="input" placeholder="Search title" value={filters.q} onChange={(e)=>setFilters(f=>({ ...f, q: e.target.value }))} />
            <select className="input" value={filters.type} onChange={(e)=>setFilters(f=>({ ...f, type: e.target.value }))}>
              <option value="">All types</option>
              <option value="entire">Entire place</option>
              <option value="private_room">Private room</option>
              <option value="shared_room">Shared room</option>
            </select>
            <select className="input" value={filters.status} onChange={(e)=>setFilters(f=>({ ...f, status: e.target.value }))}>
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="suspended">Suspended</option>
            </select>
            <button className="btn btn-primary">Filter</button>
          </form>
        </div>
        {loading ? (
          <div className="text-dark-600 flex items-center"><Loader2 className="animate-spin mr-2"/> Loading…</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-dark-600">No listings yet. <a className="text-primary" href="/stays/listings/new">Create one</a>.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(l => (
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
                    {l.listing_type?.replace('_',' ')} • ₦{Number(l.nightly_rate).toLocaleString()}/night
                  </p>

                  <div className="mt-auto">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {l.is_published ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => unpublish(l.id)}>Unpublish</button>
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => publish(l.id)}>Publish</button>
                      )}
                      <a className="btn btn-light btn-sm" href={`/stays/listings/${l.id}/availability`}>Availability</a>
                      <a className="btn btn-light btn-sm" href={`/stays/listings/${l.id}/edit`}>Edit</a>
                      <a className="btn btn-light btn-sm" href={`/stays/listings/${l.id}`}>View</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="btn btn-secondary btn-sm inline-flex items-center">
                        <Upload size={14} className="mr-1"/> Upload Image
                        <input type="file" accept="image/*" hidden onChange={(e) => uploadImage(l.id, e.target.files?.[0], !l.primary_image)} />
                      </label>
                      {uploading[l.id] && <span className="text-xs text-dark-600">Uploading…</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default HostMyListings;
