import { useEffect, useState } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell';
import { propertyAPI } from '../services/api';
import { Home, Edit2, Trash2, Image as ImageIcon, Star, BarChart2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const MyProperties = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [images, setImages] = useState({});
  const [analytics, setAnalytics] = useState({});
  const [showAnalytics, setShowAnalytics] = useState({});
  const [broadcastOpen, setBroadcastOpen] = useState(null);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '' });

  const load = async () => {
    try {
      setLoading(true);
      const res = await propertyAPI.getAll({ ordering: '-created_at', mine: 1 });
      const list = res.data.results || res.data || [];
      // Fetch details to get images and full info
      const details = await Promise.all(list.map(async (p) => {
        try { const d = await propertyAPI.get(p.id); return d.data; } catch { return p; }
      }));
      setItems(details);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (user?.user_type === 'landlord') return <Navigate to="/dashboard/properties" replace />;

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ title: p.title, rent_amount: p.rent_amount, status: p.status, is_premium: p.is_premium });
  };
  const saveEdit = async (id) => {
    try {
      await propertyAPI.update(id, form);
      toast.success('Updated');
      setEditing(null);
      load();
    } catch { toast.error('Failed to update'); }
  };
  const delProp = async (id) => {
    try { await propertyAPI.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed to delete'); }
  };
  const upload = async (id) => {
    const files = images[id];
    if (!files || files.length === 0) { toast.error('Select images'); return; }
    try {
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append('image', files[i]);
        if (i === 0) fd.append('is_primary', 'true');
        await propertyAPI.uploadImage(id, fd);
      }
      toast.success('Images uploaded');
      setImages(prev => ({ ...prev, [id]: [] }));
      load();
    } catch { toast.error('Upload failed'); }
  };
  const setPrimary = async (id, imageId) => {
    try { await propertyAPI.setPrimaryImage(id, imageId); toast.success('Primary updated'); load(); } catch { toast.error('Failed'); }
  };
  const deleteImage = async (id, imageId) => {
    try { await propertyAPI.deleteImage(id, imageId); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };
  const fetchAnalytics = async (id) => {
    try {
      const res = await propertyAPI.analytics(id, { period: 30 });
      setAnalytics(prev => ({ ...prev, [id]: res.data }));
      setShowAnalytics(prev => ({ ...prev, [id]: true }));
    } catch { toast.error('Failed to load analytics'); }
  };
  const sendBroadcast = async (id) => {
    if (!broadcastForm.message.trim()) { toast.error('Message is required'); return; }
    try {
      await propertyAPI.broadcast(id, broadcastForm);
      toast.success('Broadcast sent');
      setBroadcastOpen(null);
      setBroadcastForm({ title: '', message: '' });
    } catch { toast.error('Failed to send'); }
  };

  return (
    <DashboardShell>
      <div className="flex items-center mb-4">
        <Home className="text-primary mr-2" />
        <h1 className="text-2xl font-display font-bold text-dark-900">My Properties</h1>
      </div>
      {loading ? (
        <div className="text-dark-600">Loading...</div>
      ) : items.length === 0 ? (
        <div className="card">
          <p className="text-dark-600">No properties found.</p>
          <Link to="/properties/new" className="btn btn-primary mt-3">Add Property</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <div key={p.id} className="card relative">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2 md:pt-10">
                  <div className="h-40 w-full rounded-lg overflow-hidden bg-gray-100">
                    {(() => {
                      const fromImages = (p.images && p.images.length > 0) ? (p.images.find(i => i.is_primary)?.image || p.images[0].image) : null;
                      const src = p.primary_image || fromImages || '/placeholder-property.jpg';
                      return <img src={src} alt={p.title} className="w-full h-full object-cover" />;
                    })()}
                  </div>
                </div>
                <div className="md:col-span-3 md:pr-56">
                  {editing === p.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="label">Title</label>
                        <input className="input" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Rent (₦)</label>
                        <input className="input" type="number" value={form.rent_amount} onChange={e => setForm(prev => ({ ...prev, rent_amount: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Status</label>
                        <select className="input" value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}>
                          <option value="available">Available</option>
                          <option value="rented">Rented</option>
                          <option value="pending">Pending</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <label className="inline-flex items-center gap-2 text-sm text-dark-700">
                          <input type="checkbox" checked={!!form.is_premium} onChange={e => setForm(prev => ({ ...prev, is_premium: e.target.checked }))} /> Premium
                        </label>
                      </div>
                      <div className="md:col-span-4 flex gap-2">
                        <button className="btn btn-primary" onClick={() => saveEdit(p.id)}>Save</button>
                        <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 md:pt-10">
                        <h3 className="text-lg font-semibold text-dark-900 break-words whitespace-normal">{p.title} {p.is_premium && <Star size={16} className="inline text-amber-500" />}</h3>
                        <p className="text-sm text-dark-600">₦{Number(p.rent_amount).toLocaleString()} • {p.property_type} • {p.area} • {p.lga_name}, {p.state_name}</p>
                        <p className="text-xs text-dark-500 capitalize">Status: {p.status}</p>
                      </div>
                      <div className="mt-2 md:mt-0 md:absolute md:top-3 md:right-3 flex flex-wrap gap-2 z-10 justify-end">
                        <button className="btn btn-secondary btn-sm" onClick={() => startEdit(p)}><Edit2 size={14} className="mr-1" /> Quick Edit</button>
                        <Link className="btn btn-secondary btn-sm" to={`/properties/${p.id}/edit`}><Edit2 size={14} className="mr-1" /> Full Edit</Link>
                        <button className="btn btn-secondary btn-sm" onClick={() => delProp(p.id)}><Trash2 size={14} className="mr-1" /> Delete</button>
                        <Link className="btn btn-primary btn-sm" to={`/properties/${p.id}`}>View</Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Image manager */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-dark-900 mb-2">Images</h4>
                {p.images && p.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {p.images.map(img => (
                      <div key={img.id} className="relative group">
                        <img src={img.image} alt="" className="w-full h-24 object-cover rounded-lg border" />
                        {img.is_primary && <span className="absolute top-1 left-1 text-xs bg-primary text-white px-1 rounded">Primary</span>}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                          {!img.is_primary && <button className="btn btn-secondary btn-sm" onClick={() => setPrimary(p.id, img.id)}>Set Primary</button>}
                          <button className="btn btn-secondary btn-sm" onClick={() => deleteImage(p.id, img.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-dark-600">No images yet.</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <label className="btn btn-secondary inline-flex items-center">
                    <ImageIcon size={16} className="mr-1" /> Select Images
                    <input type="file" multiple accept="image/*" onChange={(e) => setImages(prev => ({ ...prev, [p.id]: Array.from(e.target.files || []) }))} hidden />
                  </label>
                  <button className="btn btn-primary" onClick={() => upload(p.id)}>Upload</button>
                </div>
              </div>

              {/* Analytics & Broadcast */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn btn-secondary inline-flex items-center" onClick={() => fetchAnalytics(p.id)}>
                  <BarChart2 size={16} className="mr-1" /> Analytics
                </button>
                <button className="btn btn-secondary inline-flex items-center" onClick={() => setBroadcastOpen(p.id)}>
                  <Send size={16} className="mr-1" /> Broadcast
                </button>
              </div>

              {showAnalytics[p.id] && analytics[p.id] && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold text-dark-900 mb-2">Last 30 days</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs text-dark-600 mb-1">Views</p>
                      <div className="flex items-end gap-1 h-24">
                        {analytics[p.id].views.map((v, idx) => {
                          const arr = analytics[p.id].views;
                          const max = Math.max(...arr, 1);
                          const h = Math.max(4, Math.round((Number(v || 0) / max) * 90));
                          return <div key={idx} className="w-2 bg-primary rounded-t" style={{ height: `${h}px` }} title={`${analytics[p.id].dates[idx]}: ${v}`} />;
                        })}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs text-dark-600 mb-1">Inquiries</p>
                      <div className="flex items-end gap-1 h-24">
                        {analytics[p.id].inquiries.map((v, idx) => {
                          const arr = analytics[p.id].inquiries;
                          const max = Math.max(...arr, 1);
                          const h = Math.max(4, Math.round((Number(v || 0) / max) * 90));
                          return <div key={idx} className="w-2 bg-amber-500 rounded-t" style={{ height: `${h}px` }} title={`${analytics[p.id].dates[idx]}: ${v}`} />;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {broadcastOpen === p.id && (
                <div className="mt-3 bg-gray-50 border rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-dark-900 mb-2">Broadcast Message</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Title (optional)</label>
                      <input className="input" value={broadcastForm.title} onChange={(e) => setBroadcastForm(prev => ({ ...prev, title: e.target.value }))} placeholder={`Update: ${p.title}`} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Message</label>
                      <textarea className="input min-h-[100px]" value={broadcastForm.message} onChange={(e) => setBroadcastForm(prev => ({ ...prev, message: e.target.value }))} placeholder="Type your announcement to current tenants of this property" />
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button className="btn btn-primary" onClick={() => sendBroadcast(p.id)}><Send size={16} className="mr-1" /> Send</button>
                    <button className="btn btn-secondary" onClick={() => setBroadcastOpen(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
};

export default MyProperties;
