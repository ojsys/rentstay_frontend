import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { staysAPI, propertyAPI, locationAPI } from '../../services/api';
import {
  Loader2, ArrowLeft, Save, Upload, Trash2, Star,
  ChevronLeft, ChevronRight, Image as ImageIcon,
  Home, DoorOpen, Users, MapPin, Shield, Clock,
  Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react';
import RichTextEditor from '../../components/common/RichTextEditor';
import toast from 'react-hot-toast';

const AMENITY_OPTIONS = [
  'WiFi', 'Air conditioning', 'Kitchen', 'Hot water', 'TV',
  'Generator/backup power', 'Parking', 'Security', 'Washing machine',
  'Swimming pool', 'Gym', 'Breakfast included', 'Pet friendly', 'Elevator',
];

const LISTING_TYPES = [
  { value: 'entire', icon: Home, label: 'Entire place', desc: 'Guests have the whole place to themselves' },
  { value: 'private_room', icon: DoorOpen, label: 'Private room', desc: 'Guests have their own room, shared common areas' },
  { value: 'shared_room', icon: Users, label: 'Shared room', desc: 'Guests sleep in a shared room' },
];

const CANCELLATION_OPTIONS = [
  { value: 'flexible', label: 'Flexible', desc: 'Full refund up to 24 hrs before check-in' },
  { value: 'moderate', label: 'Moderate', desc: 'Full refund up to 5 days before check-in' },
  { value: 'strict', label: 'Strict', desc: '50% refund up to 7 days before check-in' },
];

const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
      {Icon && <Icon size={16} className="text-[#0C3B2E]" />}
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="p-4 space-y-4">{children}</div>
  </div>
);

const FieldLabel = ({ children, optional }) => (
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
    {children}{optional && <span className="ml-1 text-gray-400 normal-case font-normal">(optional)</span>}
  </label>
);

const StepperInput = ({ label, name, value, onChange, min = 0, max = 99, step = 1 }) => {
  const num = Number(value) || min;
  const dec = () => onChange({ target: { name, value: Math.max(min, +(num - step).toFixed(1)) } });
  const inc = () => onChange({ target: { name, value: Math.min(max, +(num + step).toFixed(1)) } });
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700 font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={dec} className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 font-bold hover:border-[#0C3B2E] hover:text-[#0C3B2E] transition disabled:opacity-30" disabled={num <= min}>−</button>
        <span className="w-8 text-center text-sm font-semibold text-gray-900">{num}</span>
        <button type="button" onClick={inc} className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 font-bold hover:border-[#0C3B2E] hover:text-[#0C3B2E] transition disabled:opacity-30" disabled={num >= max}>+</button>
      </div>
    </div>
  );
};

const HostEditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [form, setForm] = useState({});
  const [listing, setListing] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [progress, setProgress] = useState({});
  const [showGps, setShowGps] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [ls, props, statesRes] = await Promise.all([
          staysAPI.getListing(id),
          propertyAPI.getAll({ mine: 1, ordering: '-created_at' }),
          locationAPI.getStates(),
        ]);
        const data = ls.data;
        setListing(data);
        setForm({
          ...data,
          property_id: data?.property?.id || '',
          state_id: data?.state_id || '',
          lga_id: data?.lga_id || '',
          latitude: data?.latitude || '',
          longitude: data?.longitude || '',
          address: data?.address || '',
          area: data?.area || '',
        });
        setProperties(props.data.results || props.data || []);
        setStates(statesRes.data.results || statesRes.data || []);
        if (data?.state_id) {
          try {
            const lgaRes = await locationAPI.getLGAs(data.state_id);
            setLgas(lgaRes.data.results || lgaRes.data || []);
          } catch { /* silent */ }
        }
        if (data?.latitude && data?.longitude) setShowGps(true);
      } catch {
        toast.error('Failed to load listing');
        navigate('/dashboard/stays');
      } finally { setLoading(false); }
    };
    load();
  }, [id, navigate]);

  const onChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const onStateChange = async (e) => {
    const stateId = e.target.value;
    setForm(prev => ({ ...prev, state_id: stateId, lga_id: '' }));
    if (stateId) {
      try {
        const res = await locationAPI.getLGAs(stateId);
        setLgas(res.data.results || res.data || []);
      } catch { setLgas([]); }
    } else { setLgas([]); }
  };

  const toggleAmenity = (amenity) => {
    setForm(prev => {
      const current = Array.isArray(prev.amenities) ? prev.amenities : [];
      return {
        ...prev,
        amenities: current.includes(amenity)
          ? current.filter(a => a !== amenity)
          : [...current, amenity],
      };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      delete payload.owner; delete payload.property; delete payload.images;
      delete payload.primary_image; delete payload.created_at; delete payload.updated_at;
      delete payload.status; delete payload.is_published;
      ['capacity_adults','beds','bathrooms','nightly_rate','cleaning_fee','min_nights','max_nights'].forEach(k => {
        if (payload[k] !== undefined && payload[k] !== null && payload[k] !== '') payload[k] = Number(payload[k]);
      });
      if (!payload.property_id) delete payload.property_id; else payload.property_id = Number(payload.property_id);
      if (!payload.state_id) payload.state_id = null; else payload.state_id = Number(payload.state_id);
      if (!payload.lga_id) payload.lga_id = null; else payload.lga_id = Number(payload.lga_id);
      if (!payload.latitude) payload.latitude = null;
      if (!payload.longitude) payload.longitude = null;
      delete payload.location; delete payload.lga_name; delete payload.state_name;
      delete payload.lga; delete payload.state;
      await staysAPI.updateListing(id, payload);
      toast.success('Listing updated!');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update');
    } finally { setSaving(false); }
  };

  const reload = async () => {
    try {
      const res = await staysAPI.getListing(id);
      setListing(res.data);
      setForm(prev => ({ ...prev, images: res.data?.images || [], primary_image: res.data?.primary_image || null }));
    } catch { /* silent */ }
  };

  const setPrimary = async (imageId) => {
    try { await staysAPI.setPrimary(id, imageId); await reload(); toast.success('Primary image set'); }
    catch { toast.error('Failed to set primary'); }
  };
  const removeImage = async (imageId) => {
    try { await staysAPI.deleteImage(id, imageId); await reload(); }
    catch { toast.error('Failed to delete'); }
  };
  const moveImage = async (imageId, dir) => {
    const imgs = [...(listing?.images || [])];
    const idx = imgs.findIndex(i => i.id === imageId);
    if (idx < 0) return;
    const swapWith = dir === 'left' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= imgs.length) return;
    const tmp = imgs[idx]; imgs[idx] = imgs[swapWith]; imgs[swapWith] = tmp;
    try { await staysAPI.reorderImages(id, imgs.map(i => i.id)); await reload(); }
    catch { toast.error('Reorder failed'); }
  };

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
  const removeLocal = (idx) => setNewImages(prev => prev.filter((_, i) => i !== idx));

  const uploadImages = async () => {
    if (!newImages.length) { toast.error('Select images first'); return; }
    setUploadLoading(true);
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
            setProgress(p => ({ ...p, [i]: pct }));
          }
        });
      } catch { toast.error('Failed to upload one image'); }
    }
    setNewImages([]);
    setProgress({});
    await reload();
    toast.success('Images uploaded');
    setUploadLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="animate-spin" size={20} /> Loading listing…
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-theme min-h-screen bg-gray-50 pb-32 md:pb-12">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-[#0C3B2E] md:bg-white md:border-b md:border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 md:py-4 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/dashboard/stays')}
            className="flex items-center gap-1.5 text-white md:text-gray-600 hover:text-gray-900 transition font-medium text-sm"
          >
            <ArrowLeft size={18} />
            <span className="hidden md:inline">Back</span>
          </button>
          <h1 className="text-base font-bold text-white md:text-gray-900">Edit Listing</h1>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 md:bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-white/30 md:hover:bg-[#0a3226] transition disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="max-w-4xl mx-auto px-4 pt-5 space-y-4">

        {/* Photos */}
        <SectionCard title="Photos" icon={ImageIcon}>
          {/* Existing images */}
          {listing?.images?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {listing.images.map((img, idx) => (
                <div key={img.id} className="relative rounded-xl overflow-hidden aspect-square">
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                  {img.is_primary && (
                    <span className="absolute top-2 left-2 bg-[#0C3B2E] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> Primary
                    </span>
                  )}
                  {/* Tap-accessible action bar at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => moveImage(img.id, 'left')}
                        disabled={idx === 0}
                        className="flex-1 flex items-center justify-center p-1.5 rounded-lg bg-white/20 text-white disabled:opacity-30 hover:bg-white/30 transition"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      {!img.is_primary && (
                        <button
                          type="button"
                          onClick={() => setPrimary(img.id)}
                          className="flex-1 flex items-center justify-center p-1.5 rounded-lg bg-amber-500/90 text-white hover:bg-amber-500 transition"
                        >
                          <Star size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="flex-1 flex items-center justify-center p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(img.id, 'right')}
                        disabled={idx === listing.images.length - 1}
                        className="flex-1 flex items-center justify-center p-1.5 rounded-lg bg-white/20 text-white disabled:opacity-30 hover:bg-white/30 transition"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No photos yet. Add some below.</p>
          )}

          {/* New images preview */}
          {newImages.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ready to upload ({newImages.length})</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {newImages.map((file, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden aspect-square bg-gray-100">
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    {progress[idx] > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
                        <div className="h-1 bg-[#0C3B2E] transition-all" style={{ width: `${progress[idx]}%` }} />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <div className="flex items-center justify-between gap-1">
                        <button type="button" onClick={() => idx > 0 && moveLocal(idx, idx - 1)} disabled={idx === 0}
                          className="flex-1 flex items-center justify-center p-1.5 rounded-lg bg-white/20 text-white disabled:opacity-30">
                          <ChevronLeft size={14} />
                        </button>
                        <button type="button" onClick={() => removeLocal(idx)}
                          className="flex-1 flex items-center justify-center p-1.5 rounded-lg bg-red-500/80 text-white">
                          <Trash2 size={12} />
                        </button>
                        <button type="button" onClick={() => idx < newImages.length - 1 && moveLocal(idx, idx + 1)} disabled={idx === newImages.length - 1}
                          className="flex-1 flex items-center justify-center p-1.5 rounded-lg bg-white/20 text-white disabled:opacity-30">
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={uploadImages}
                disabled={uploadLoading}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-60"
              >
                {uploadLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploadLoading ? 'Uploading…' : `Upload ${newImages.length} Photo${newImages.length > 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#0C3B2E] hover:bg-green-50/30 transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <label className="cursor-pointer flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload size={18} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Tap to add photos or drag &amp; drop</p>
              <span className="text-xs text-gray-400">JPG, PNG, WebP up to 10 MB each</span>
              <input type="file" multiple accept="image/*" onChange={onSelect} hidden />
            </label>
          </div>
        </SectionCard>

        {/* Basics */}
        <SectionCard title="Basics" icon={Home}>
          <div>
            <FieldLabel>Listing title</FieldLabel>
            <input
              name="title"
              value={form.title || ''}
              onChange={onChange}
              className="input w-full"
              placeholder="Cozy studio in Lekki Phase 1"
            />
          </div>
          <div>
            <FieldLabel optional>Link to long-term property</FieldLabel>
            <select name="property_id" value={form.property_id || ''} onChange={onChange} className="input w-full">
              <option value="">— None —</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <div className="border rounded-xl overflow-hidden">
              <RichTextEditor
                value={form.description || ''}
                onChange={(val) => setForm(prev => ({ ...prev, description: val }))}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Space type</FieldLabel>
            <div className="space-y-2">
              {LISTING_TYPES.map(({ value, icon: Icon, label, desc }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                    form.listing_type === value ? 'border-[#0C3B2E] bg-green-50/40' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input type="radio" name="listing_type" value={value} checked={form.listing_type === value} onChange={onChange} className="sr-only" />
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${form.listing_type === value ? 'bg-[#0C3B2E]' : 'bg-gray-100'}`}>
                    <Icon size={16} className={form.listing_type === value ? 'text-white' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${form.listing_type === value ? 'border-[#0C3B2E] bg-[#0C3B2E]' : 'border-gray-300'}`}>
                    {form.listing_type === value && (
                      <svg viewBox="0 0 20 20" fill="white" className="w-full h-full"><circle cx="10" cy="10" r="4" /></svg>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Capacity & Pricing */}
        <SectionCard title="Capacity & Pricing" icon={Users}>
          <div className="space-y-1">
            <StepperInput label="Guests" name="capacity_adults" value={form.capacity_adults || 1} onChange={onChange} min={1} max={30} />
            <StepperInput label="Beds" name="beds" value={form.beds || 1} onChange={onChange} min={1} max={20} />
            <StepperInput label="Bathrooms" name="bathrooms" value={form.bathrooms || 1} onChange={onChange} min={0} max={10} step={0.5} />
            <StepperInput label="Min nights" name="min_nights" value={form.min_nights || 1} onChange={onChange} min={1} max={365} />
            <StepperInput label="Max nights" name="max_nights" value={form.max_nights || 30} onChange={onChange} min={1} max={365} />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <FieldLabel>Nightly rate (₦)</FieldLabel>
              <input name="nightly_rate" value={form.nightly_rate || 0} onChange={onChange} type="number" min="0" className="input w-full" />
            </div>
            <div>
              <FieldLabel optional>Cleaning fee (₦)</FieldLabel>
              <input name="cleaning_fee" value={form.cleaning_fee || 0} onChange={onChange} type="number" min="0" className="input w-full" />
            </div>
          </div>
          {/* Instant Book toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-900">Instant Book</p>
              <p className="text-xs text-gray-400">Guests can book without approval</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, instant_book: !prev.instant_book }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.instant_book ? 'bg-[#0C3B2E]' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.instant_book ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </SectionCard>

        {/* Location */}
        <SectionCard title="Location" icon={MapPin}>
          <div>
            <FieldLabel>Street address</FieldLabel>
            <input name="address" value={form.address || ''} onChange={onChange} className="input w-full" placeholder="12 Adeola Odeku Street" />
          </div>
          <div>
            <FieldLabel optional>Neighborhood / Area</FieldLabel>
            <input name="area" value={form.area || ''} onChange={onChange} className="input w-full" placeholder="Victoria Island" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>State</FieldLabel>
              <select value={form.state_id || ''} onChange={onStateChange} className="input w-full">
                <option value="">— Select state —</option>
                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>LGA</FieldLabel>
              <select name="lga_id" value={form.lga_id || ''} onChange={onChange} className="input w-full" disabled={!form.state_id}>
                <option value="">— Select LGA —</option>
                {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          {/* GPS toggle */}
          <button
            type="button"
            onClick={() => setShowGps(v => !v)}
            className="flex items-center gap-2 text-sm text-[#0C3B2E] font-medium"
          >
            {showGps ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            GPS coordinates (optional)
          </button>
          {showGps && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel optional>Latitude</FieldLabel>
                <input name="latitude" value={form.latitude || ''} onChange={onChange} className="input w-full" placeholder="6.431433" type="number" step="any" />
              </div>
              <div>
                <FieldLabel optional>Longitude</FieldLabel>
                <input name="longitude" value={form.longitude || ''} onChange={onChange} className="input w-full" placeholder="3.421860" type="number" step="any" />
              </div>
              {form.latitude && form.longitude && (
                <div className="col-span-2 rounded-xl overflow-hidden border border-gray-200 h-44">
                  <iframe
                    title="listing-map"
                    className="w-full h-full"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(form.longitude)-0.01},${Number(form.latitude)-0.01},${Number(form.longitude)+0.01},${Number(form.latitude)+0.01}&layer=mapnik&marker=${form.latitude},${form.longitude}`}
                  />
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Policies */}
        <SectionCard title="Policies" icon={Shield}>
          <div>
            <FieldLabel>Cancellation policy</FieldLabel>
            <div className="space-y-2">
              {CANCELLATION_OPTIONS.map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                    form.cancellation_policy === value ? 'border-[#0C3B2E] bg-green-50/40' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input type="radio" name="cancellation_policy" value={value} checked={form.cancellation_policy === value} onChange={onChange} className="sr-only" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${form.cancellation_policy === value ? 'border-[#0C3B2E] bg-[#0C3B2E]' : 'border-gray-300'}`}>
                    {form.cancellation_policy === value && (
                      <svg viewBox="0 0 20 20" fill="white" className="w-full h-full"><circle cx="10" cy="10" r="4" /></svg>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-900">Require guest verification</p>
              <p className="text-xs text-gray-400">Only verified guests can book</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, require_guest_verification: !prev.require_guest_verification }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.require_guest_verification ? 'bg-[#0C3B2E]' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.require_guest_verification ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          <div>
            <FieldLabel optional>House rules</FieldLabel>
            <textarea name="house_rules" value={form.house_rules || ''} onChange={onChange} className="input w-full min-h-[80px]" placeholder="No smoking, no parties after 10pm…" />
          </div>
        </SectionCard>

        {/* Check-in / Check-out */}
        <SectionCard title="Check-in & Check-out" icon={Clock}>
          <div>
            <FieldLabel optional>Check-in instructions</FieldLabel>
            <textarea name="check_in_instructions" value={form.check_in_instructions || ''} onChange={onChange} className="input w-full min-h-[80px]" placeholder="Key lockbox at front gate, code: 1234…" />
          </div>
          <div>
            <FieldLabel optional>Check-out instructions</FieldLabel>
            <textarea name="check_out_instructions" value={form.check_out_instructions || ''} onChange={onChange} className="input w-full min-h-[80px]" placeholder="Leave keys on table, check out by 11am…" />
          </div>
        </SectionCard>

        {/* Amenities */}
        <SectionCard title="Amenities" icon={Sparkles}>
          <div className="grid grid-cols-2 gap-2">
            {AMENITY_OPTIONS.map(a => {
              const selected = Array.isArray(form.amenities) && form.amenities.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition ${
                    selected ? 'border-[#0C3B2E] bg-green-50/40' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center ${selected ? 'border-[#0C3B2E] bg-[#0C3B2E]' : 'border-gray-300'}`}>
                    {selected && (
                      <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" className="w-3 h-3">
                        <polyline points="2,6 5,9 10,3" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{a}</span>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Desktop save button */}
        <div className="hidden md:flex justify-end pb-6">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#0C3B2E] text-white font-semibold hover:bg-[#0a3226] transition disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving changes…' : 'Save changes'}
          </button>
        </div>
      </form>

      {/* Mobile sticky save button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-30">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#0C3B2E] text-white font-semibold text-sm hover:bg-[#0a3226] transition disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving changes…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
};

export default HostEditListing;
