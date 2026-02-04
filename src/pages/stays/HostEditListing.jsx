import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { staysAPI, propertyAPI } from '../../services/api';
import { Loader2, Home, Upload, Trash2, Star, ArrowLeft, ArrowRight, Image as ImageIcon } from 'lucide-react';
import RichTextEditor from '../../components/common/RichTextEditor';
import toast from 'react-hot-toast';

const HostEditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({});
  const [listing, setListing] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [ls, props] = await Promise.all([
          staysAPI.getListing(id),
          propertyAPI.getAll({ mine: 1, ordering: '-created_at' }),
        ]);
        setListing(ls.data);
        setForm({ ...ls.data, property_id: ls.data?.property?.id || '' });
        setProperties(props.data.results || props.data || []);
      } catch (e) {
        toast.error('Failed to load listing');
        navigate('/stays/host/listings');
      } finally { setLoading(false); }
    };
    load();
  }, [id, navigate]);

  const onChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      // Clean read-only fields
      delete payload.owner; delete payload.property; delete payload.images; delete payload.primary_image; delete payload.created_at; delete payload.updated_at; delete payload.status; delete payload.is_published;
      // Numeric coercion
      ['capacity_adults','beds','bathrooms','nightly_rate','cleaning_fee','service_fee_rate','min_nights','max_nights'].forEach(k => {
        if (payload[k] !== undefined && payload[k] !== null && payload[k] !== '') payload[k] = Number(payload[k]);
      });
      if (!payload.property_id) delete payload.property_id; else payload.property_id = Number(payload.property_id);
      await staysAPI.updateListing(id, payload);
      toast.success('Listing updated');
      navigate('/stays/host/listings');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to update');
    } finally { setSaving(false); }
  };

  const reload = async () => {
    try {
      const res = await staysAPI.getListing(id);
      setListing(res.data);
      setForm(prev => ({ ...prev, images: res.data?.images || [], primary_image: res.data?.primary_image || null }));
    } catch {}
  };

  // Existing images actions
  const setPrimary = async (imageId) => {
    try { await staysAPI.setPrimary(id, imageId); await reload(); } catch { toast.error('Failed to set primary'); }
  };
  const removeImage = async (imageId) => {
    try { await staysAPI.deleteImage(id, imageId); await reload(); } catch { toast.error('Failed to delete'); }
  };
  const moveImage = async (imageId, dir) => {
    const imgs = [...(listing?.images || [])];
    const idx = imgs.findIndex(i => i.id === imageId);
    if (idx < 0) return;
    const swapWith = dir === 'left' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= imgs.length) return;
    const tmp = imgs[idx];
    imgs[idx] = imgs[swapWith];
    imgs[swapWith] = tmp;
    const order = imgs.map(i => i.id);
    try { await staysAPI.reorderImages(id, order); await reload(); } catch { toast.error('Reorder failed'); }
  };

  // Local new images queue
  const onSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setNewImages(prev => [...prev, ...files]);
    e.target.value = '';
  };
  const onDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) setNewImages(prev => [...prev, ...files]);
  };
  const moveLocal = (from, to) => {
    setNewImages(prev => {
      const arr = [...prev];
      const item = arr.splice(from, 1)[0];
      arr.splice(to, 0, item);
      return arr;
    });
  };
  const removeLocal = (idx) => {
    setNewImages(prev => prev.filter((_, i) => i !== idx));
  };
  const uploadImages = async () => {
    if (!newImages.length) { toast.error('Select images'); return; }
    const hadPrimary = !!listing?.primary_image;
    for (let i = 0; i < newImages.length; i++) {
      const file = newImages[i];
      const fd = new FormData();
      fd.append('image', file);
      if (!hadPrimary && i === 0) fd.append('is_primary', 'true');
      try {
        await staysAPI.uploadImage(id, fd, {
          onUploadProgress: (evt) => {
            const pct = Math.round((evt.loaded / (evt.total || 1)) * 100);
            setProgress((p) => ({ ...p, [i]: pct }));
          }
        });
      } catch {
        toast.error('Failed to upload one of the images');
      }
    }
    setNewImages([]);
    setProgress({});
    await reload();
    toast.success('Images uploaded');
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center text-dark-600"><Loader2 className="animate-spin mr-2"/> Loading…</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="flex items-center mb-4"><Home className="text-primary mr-2"/><h1 className="text-2xl font-display font-bold text-dark-900">Edit Listing</h1></div>
      <form onSubmit={submit} className="card grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Title</label>
          <input name="title" value={form.title || ''} onChange={onChange} className="input" />
        </div>
        <div>
          <label className="label">Link to Property</label>
          <select name="property_id" value={form.property_id || ''} onChange={onChange} className="input">
            <option value="">— None —</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Description</label>
          <div className="border rounded-lg overflow-hidden">
            <RichTextEditor
              value={form.description || ''}
              onChange={(val) => setForm(prev => ({ ...prev, description: val }))}
            />
          </div>
        </div>
        <div>
          <label className="label">Type</label>
          <select name="listing_type" value={form.listing_type || 'entire'} onChange={onChange} className="input">
            <option value="entire">Entire place</option>
            <option value="private_room">Private room</option>
            <option value="shared_room">Shared room</option>
          </select>
        </div>
        <div>
          <label className="label">Adults</label>
          <input name="capacity_adults" value={form.capacity_adults || 1} onChange={onChange} type="number" min="1" className="input" />
        </div>
        <div>
          <label className="label">Beds</label>
          <input name="beds" value={form.beds || 1} onChange={onChange} type="number" min="1" className="input" />
        </div>
        <div>
          <label className="label">Bathrooms</label>
          <input name="bathrooms" value={form.bathrooms || 1} onChange={onChange} type="number" min="0" step="0.5" className="input" />
        </div>
        <div>
          <label className="label">Nightly Rate (₦)</label>
          <input name="nightly_rate" value={form.nightly_rate || 0} onChange={onChange} type="number" min="0" className="input" />
        </div>
        <div>
          <label className="label">Cleaning Fee (₦)</label>
          <input name="cleaning_fee" value={form.cleaning_fee || 0} onChange={onChange} type="number" min="0" className="input" />
        </div>
        <div>
          <label className="label">Service Fee (%)</label>
          <input name="service_fee_rate" value={form.service_fee_rate || 5} onChange={onChange} type="number" min="0" className="input" />
        </div>
        <div>
          <label className="label">Min Nights</label>
          <input name="min_nights" value={form.min_nights || 1} onChange={onChange} type="number" min="1" className="input" />
        </div>
        <div>
          <label className="label">Max Nights</label>
          <input name="max_nights" value={form.max_nights || 30} onChange={onChange} type="number" min="1" className="input" />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-dark-700">
          <input type="checkbox" name="instant_book" checked={!!form.instant_book} onChange={onChange} /> Instant Book
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-dark-700">
          <input type="checkbox" name="require_guest_verification" checked={!!form.require_guest_verification} onChange={onChange} /> Require Guest Verification
        </label>
        <div className="md:col-span-2">
          <label className="label">House Rules</label>
          <textarea name="house_rules" value={form.house_rules || ''} onChange={onChange} className="input min-h-[80px]" />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button className="btn btn-primary" disabled={saving}>{saving ? (<><Loader2 className="animate-spin mr-2" size={16}/> Saving…</>) : 'Save Changes'}</button>
        </div>
      </form>

      {/* Images manager */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-dark-900 mb-2">Images</h3>
        {(listing?.images?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {listing.images.map(img => (
              <div key={img.id} className="relative group">
                <img src={img.image} alt="" className="w-full h-24 object-cover rounded-lg border" />
                {img.is_primary && <span className="absolute top-1 left-1 text-xs bg-primary text-white px-1 rounded">Primary</span>}
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  {!img.is_primary && (
                    <button type="button" className="btn btn-light btn-sm inline-flex items-center" onClick={() => setPrimary(img.id)}><Star size={14} className="mr-1"/> Primary</button>
                  )}
                  <button type="button" className="btn btn-secondary btn-sm inline-flex items-center" onClick={() => removeImage(img.id)}><Trash2 size={14} className="mr-1"/> Delete</button>
                  <button type="button" className="btn btn-light btn-sm inline-flex items-center" onClick={() => moveImage(img.id, 'left')}><ArrowLeft size={14} className="mr-1"/> Left</button>
                  <button type="button" className="btn btn-light btn-sm inline-flex items-center" onClick={() => moveImage(img.id, 'right')}><ArrowRight size={14} className="mr-1"/> Right</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-600">No images yet.</p>
        ))}
        <div
          className="border-2 border-dashed rounded-lg p-4 text-center text-dark-600 bg-gray-50 hover:bg-gray-100 cursor-pointer mt-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          Drag images here
          <div className="mt-2">
            <label className="btn btn-secondary inline-flex items-center">
              <Upload size={16} className="mr-2" /> Select Images
              <input type="file" multiple accept="image/*" onChange={onSelect} hidden />
            </label>
          </div>
        </div>
        {newImages && newImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
            {newImages.map((file, idx) => (
              <div key={idx} className="relative bg-white rounded-lg border overflow-hidden">
                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-24 object-cover" />
                {progress[idx] > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                    <div className="h-1 bg-primary" style={{ width: `${progress[idx]}%` }} />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 hover:opacity-100 transition">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => idx>0 && moveLocal(idx, idx-1)}>↑</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => idx<newImages.length-1 && moveLocal(idx, idx+1)}>↓</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeLocal(idx)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-2">
          <button type="button" className="btn btn-primary inline-flex items-center" onClick={uploadImages}>
            <ImageIcon size={16} className="mr-2" /> Upload
          </button>
        </div>
      </div>
    </DashboardShell>
  );
};

export default HostEditListing;
