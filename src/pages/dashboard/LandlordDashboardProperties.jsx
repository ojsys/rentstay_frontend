import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { propertyAPI } from '../../services/api';
import { Loader2, Plus, Eye, Edit, Home, Upload, Trash2, Image as ImageIcon, Star, BarChart2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const statusColors = {
  available: 'bg-green-100 text-green-700',
  rented: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  maintenance: 'bg-red-100 text-red-700',
};

const LandlordDashboardProperties = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [images, setImages] = useState({});
  const [detailCache, setDetailCache] = useState({});
  const [analytics, setAnalytics] = useState({});
  const [broadcastOpen, setBroadcastOpen] = useState(null);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-properties', statusFilter],
    queryFn: () => propertyAPI.getAll({ mine: 1, ordering: '-created_at', status: statusFilter || undefined }).then(res => res.data),
  });

  const properties = data?.results || data || [];

  const toggleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!detailCache[id]) {
      try {
        const res = await propertyAPI.get(id);
        setDetailCache(prev => ({ ...prev, [id]: res.data }));
      } catch {
        toast.error('Failed to load property details');
      }
    }
    if (!analytics[id]) {
      try {
        const res = await propertyAPI.analytics(id, { period: 30 });
        setAnalytics(prev => ({ ...prev, [id]: res.data }));
      } catch {}
    }
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ title: p.title, rent_amount: p.rent_amount, status: p.status, is_premium: p.is_premium });
  };

  const saveEdit = async (id) => {
    try {
      await propertyAPI.update(id, form);
      toast.success('Updated');
      setEditing(null);
      refetch();
    } catch { toast.error('Failed to update'); }
  };

  const delProp = async (id) => {
    if (!confirm('Delete this property?')) return;
    try {
      await propertyAPI.delete(id);
      toast.success('Deleted');
      refetch();
    } catch { toast.error('Failed to delete'); }
  };

  const upload = async (id) => {
    const files = images[id];
    if (!files || files.length === 0) { toast.error('Select images'); return; }
    try {
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append('image', files[i]);
        if (i === 0 && !detailCache[id]?.images?.length) fd.append('is_primary', 'true');
        await propertyAPI.uploadImage(id, fd);
      }
      toast.success('Images uploaded');
      setImages(prev => ({ ...prev, [id]: [] }));
      // Refresh detail cache
      const res = await propertyAPI.get(id);
      setDetailCache(prev => ({ ...prev, [id]: res.data }));
      refetch();
    } catch { toast.error('Upload failed'); }
  };

  const setPrimary = async (propId, imageId) => {
    try {
      await propertyAPI.setPrimaryImage(propId, imageId);
      toast.success('Primary updated');
      const res = await propertyAPI.get(propId);
      setDetailCache(prev => ({ ...prev, [propId]: res.data }));
      refetch();
    } catch { toast.error('Failed'); }
  };

  const deleteImage = async (propId, imageId) => {
    try {
      await propertyAPI.deleteImage(propId, imageId);
      toast.success('Image deleted');
      const res = await propertyAPI.get(propId);
      setDetailCache(prev => ({ ...prev, [propId]: res.data }));
      refetch();
    } catch { toast.error('Failed'); }
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-dark-900">My Properties</h2>
        <div className="flex gap-2">
          <Link to="/properties/bulk-import" className="btn btn-secondary btn-sm inline-flex items-center gap-1"><Upload size={14} /> Bulk Import</Link>
          <Link to="/properties/new" className="btn btn-primary btn-sm inline-flex items-center gap-1"><Plus size={14} /> Add Property</Link>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {['', 'available', 'rented', 'pending', 'maintenance'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>
      ) : properties.length === 0 ? (
        <div className="card text-center py-12">
          <Home size={48} className="mx-auto text-dark-300 mb-3" />
          <p className="text-dark-600">No properties found.</p>
          <Link to="/properties/new" className="btn btn-primary mt-4 inline-flex items-center gap-1"><Plus size={16} /> Add Your First Property</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <div key={p.id} className="card p-0 overflow-hidden">
              {p.primary_image ? (
                <img src={p.primary_image} alt={p.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-dark-300"><Home size={32} /></div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-dark-900 truncate">{p.title} {p.is_premium && <Star size={14} className="inline text-amber-500" />}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize flex-shrink-0 ${statusColors[p.status] || 'bg-gray-100 text-dark-600'}`}>{p.status}</span>
                </div>
                <p className="text-sm text-dark-600 mt-1">{p.area}{p.lga_name ? `, ${p.lga_name}` : ''}{p.state_name ? `, ${p.state_name}` : ''}</p>
                <p className="text-lg font-bold text-primary mt-2">₦{Number(p.rent_amount).toLocaleString()}<span className="text-sm font-normal text-dark-500">/yr</span></p>
                <div className="flex items-center gap-2 mt-1 text-xs text-dark-500">
                  <span>{p.bedrooms} bed</span>
                  <span>{p.bathrooms} bath</span>
                  {p.is_verified && <span className="text-green-600 font-medium">Verified</span>}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link to={`/properties/${p.id}`} className="btn btn-secondary btn-sm inline-flex items-center gap-1"><Eye size={14} /> View</Link>
                  <Link to={`/properties/${p.id}/edit`} className="btn btn-primary btn-sm inline-flex items-center gap-1"><Edit size={14} /> Edit</Link>
                  <button onClick={() => startEdit(p)} className="btn btn-secondary btn-sm inline-flex items-center gap-1"><Edit size={14} /> Quick</button>
                  <button onClick={() => delProp(p.id)} className="btn btn-secondary btn-sm inline-flex items-center gap-1 text-red-600"><Trash2 size={14} /></button>
                </div>

                {/* Quick Edit Form */}
                {editing === p.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                    <div>
                      <label className="label">Title</label>
                      <input className="input" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label">Rent</label>
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
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-primary btn-sm" onClick={() => saveEdit(p.id)}>Save</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Manage toggle */}
                <button
                  onClick={() => toggleExpand(p.id)}
                  className="mt-3 w-full text-sm text-primary font-medium inline-flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  {expandedId === p.id ? <><ChevronUp size={16} /> Hide Manage</> : <><ChevronDown size={16} /> Manage</>}
                </button>

                {/* Expanded manage section */}
                {expandedId === p.id && (
                  <div className="mt-3 space-y-4 border-t pt-3">
                    {/* Image Management */}
                    <div>
                      <h4 className="text-sm font-semibold text-dark-900 mb-2">Images</h4>
                      {detailCache[p.id]?.images?.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {detailCache[p.id].images.map(img => (
                            <div key={img.id} className="relative group">
                              <img src={img.image} alt="" className="w-full h-20 object-cover rounded-lg border" />
                              {img.is_primary && <span className="absolute top-1 left-1 text-[10px] bg-primary text-white px-1 rounded">Primary</span>}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 rounded-lg">
                                {!img.is_primary && <button className="text-white text-[10px] bg-primary/80 px-1.5 py-0.5 rounded" onClick={() => setPrimary(p.id, img.id)}>Primary</button>}
                                <button className="text-white text-[10px] bg-red-500/80 px-1.5 py-0.5 rounded" onClick={() => deleteImage(p.id, img.id)}>Del</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-dark-500">No images yet.</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <label className="btn btn-secondary btn-sm inline-flex items-center cursor-pointer">
                          <ImageIcon size={14} className="mr-1" /> Select
                          <input type="file" multiple accept="image/*" onChange={(e) => setImages(prev => ({ ...prev, [p.id]: Array.from(e.target.files || []) }))} hidden />
                        </label>
                        {images[p.id]?.length > 0 && (
                          <button className="btn btn-primary btn-sm" onClick={() => upload(p.id)}>Upload ({images[p.id].length})</button>
                        )}
                      </div>
                    </div>

                    {/* Analytics */}
                    {analytics[p.id] && (
                      <div>
                        <h4 className="text-sm font-semibold text-dark-900 mb-2">Analytics (30d)</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-dark-600 mb-1">Views</p>
                            <div className="flex items-end gap-0.5 h-16">
                              {(analytics[p.id].views || []).map((v, i) => {
                                const max = Math.max(...(analytics[p.id].views || [1]), 1);
                                const h = Math.max(4, Math.round((Number(v || 0) / max) * 60));
                                return <div key={i} className="w-1 bg-primary rounded-t flex-1" style={{ height: `${h}px` }} />;
                              })}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-dark-600 mb-1">Inquiries</p>
                            <div className="flex items-end gap-0.5 h-16">
                              {(analytics[p.id].inquiries || []).map((v, i) => {
                                const max = Math.max(...(analytics[p.id].inquiries || [1]), 1);
                                const h = Math.max(4, Math.round((Number(v || 0) / max) * 60));
                                return <div key={i} className="w-1 bg-amber-500 rounded-t flex-1" style={{ height: `${h}px` }} />;
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Broadcast */}
                    <div>
                      <button
                        onClick={() => setBroadcastOpen(broadcastOpen === p.id ? null : p.id)}
                        className="btn btn-secondary btn-sm inline-flex items-center"
                      >
                        <Send size={14} className="mr-1" /> Broadcast
                      </button>
                      {broadcastOpen === p.id && (
                        <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-2">
                          <div>
                            <label className="label">Title (optional)</label>
                            <input className="input" value={broadcastForm.title} onChange={(e) => setBroadcastForm(prev => ({ ...prev, title: e.target.value }))} placeholder={`Update: ${p.title}`} />
                          </div>
                          <div>
                            <label className="label">Message</label>
                            <textarea className="input min-h-[80px]" value={broadcastForm.message} onChange={(e) => setBroadcastForm(prev => ({ ...prev, message: e.target.value }))} placeholder="Announcement to tenants" />
                          </div>
                          <div className="flex gap-2">
                            <button className="btn btn-primary btn-sm" onClick={() => sendBroadcast(p.id)}><Send size={14} className="mr-1" /> Send</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setBroadcastOpen(null)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LandlordDashboardProperties;
