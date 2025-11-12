import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardShell from '../components/dashboard/DashboardShell';
import { locationAPI, propertyAPI } from '../services/api';
import { Building2, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import RichTextEditor from '../components/common/RichTextEditor';
import toast from 'react-hot-toast';

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [form, setForm] = useState({});
  const [prop, setProp] = useState(null);
  const [images, setImages] = useState([]);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [stateRes, propRes] = await Promise.all([
          locationAPI.getStates(),
          propertyAPI.get(id)
        ]);
        setStates(stateRes.data || []);
        const p = propRes.data;
        setProp(p);
        setForm({
          title: p.title || '',
          description: p.description || '',
          property_type: p.property_type || 'apartment',
          address: p.address || '',
          area: p.area || '',
          state_id: p.state?.id || '',
          lga_id: p.lga?.id || '',
          rent_amount: p.rent_amount || '',
          available_from: p.available_from || '',
          bedrooms: p.bedrooms || 0,
          bathrooms: p.bathrooms || 0,
          toilets: p.toilets || 0,
          square_feet: p.square_feet || '',
          has_parking: p.has_parking,
          has_kitchen: p.has_kitchen,
          has_water: p.has_water,
          has_electricity: p.has_electricity,
          is_furnished: p.is_furnished,
          has_security: p.has_security,
          has_compound: p.has_compound,
          status: p.status || 'pending',
          is_premium: p.is_premium || false,
        });
        if (p.state?.id) {
          const lgaRes = await locationAPI.getLGAs(p.state.id);
          setLgas(lgaRes.data || []);
        }
      } catch (e) {
        toast.error('Failed to load property');
        navigate('/my-properties');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const onStateChange = async (e) => {
    const stateId = e.target.value;
    setForm(prev => ({ ...prev, state_id: stateId, lga_id: '' }));
    if (stateId) {
      try {
        const res = await locationAPI.getLGAs(stateId);
        setLgas(res.data);
      } catch {
        setLgas([]);
      }
    } else {
      setLgas([]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      // Coerce/cleanup fields
      if (payload.rent_amount !== undefined) {
        if (payload.rent_amount === '' || payload.rent_amount === null) delete payload.rent_amount;
        else payload.rent_amount = Number(payload.rent_amount);
      }
      if (payload.bedrooms !== undefined) payload.bedrooms = Number(payload.bedrooms);
      if (payload.bathrooms !== undefined) payload.bathrooms = Number(payload.bathrooms);
      if (payload.toilets !== undefined) payload.toilets = Number(payload.toilets);
      if (!payload.square_feet) delete payload.square_feet; else payload.square_feet = Number(payload.square_feet);
      if (!payload.available_from) delete payload.available_from;
      // State/LGA: only send if non-empty
      if (!payload.state_id) delete payload.state_id; else payload.state_id = parseInt(payload.state_id, 10);
      if (!payload.lga_id) delete payload.lga_id; else payload.lga_id = parseInt(payload.lga_id, 10);

      await propertyAPI.update(id, payload);
      toast.success('Property updated');
      navigate('/my-properties');
    } catch (err) {
      const data = err?.response?.data;
      let msg = 'Failed to update';
      if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        if (Array.isArray(firstVal) && firstVal.length) msg = `${firstKey}: ${firstVal[0]}`;
        else if (typeof firstVal === 'string') msg = `${firstKey}: ${firstVal}`;
      } else if (err?.response?.data?.detail) {
        msg = err.response.data.detail;
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const compressImage = (file, maxW = 1600, quality = 0.8) => new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', quality);
    };
    reader.readAsDataURL(file);
  });

  const onDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length) setImages(prev => [...prev, ...files]);
  };
  const onSelect = (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length) setImages(prev => [...prev, ...files]);
  };
  const removeLocal = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));
  const moveLocal = (from, to) => setImages(prev => {
    const arr = [...prev];
    const [it] = arr.splice(from, 1);
    arr.splice(to, 0, it);
    return arr;
  });

  const uploadImages = async () => {
    if (!images || images.length === 0) { toast.error('Select images'); return; }
    try {
      const next = {};
      for (let i = 0; i < images.length; i++) {
        const file = await compressImage(images[i]);
        const fd = new FormData();
        fd.append('image', file);
        if (i === 0 && (!prop.images || prop.images.length === 0)) fd.append('is_primary', 'true');
        await propertyAPI.uploadImage(id, fd, {
          onUploadProgress: (evt) => {
            next[i] = Math.round((evt.loaded / (evt.total || 1)) * 100);
            setProgress({ ...next });
          }
        });
      }
      toast.success('Images uploaded');
      const refreshed = await propertyAPI.get(id);
      setProp(refreshed.data);
      setImages([]);
      setProgress({});
    } catch { toast.error('Failed to upload images'); }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="text-dark-600 flex items-center"><Loader2 className="animate-spin mr-2" /> Loading...</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="flex items-center mb-4">
        <Building2 className="text-primary mr-2" />
        <h1 className="text-2xl font-display font-bold text-dark-900">Edit Property</h1>
      </div>

      <form onSubmit={submit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Title</label>
            <input name="title" value={form.title || ''} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Property Type</label>
            <select name="property_type" value={form.property_type || 'apartment'} onChange={onChange} className="input">
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="duplex">Duplex</option>
              <option value="room">Single Room</option>
              <option value="self_contain">Self Contain</option>
              <option value="flat">Flat</option>
              <option value="bungalow">Bungalow</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <div className="border rounded-lg overflow-hidden">
              <RichTextEditor value={form.description || ''} onChange={(val) => setForm(prev => ({ ...prev, description: val }))} />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="label">Address</label>
            <input name="address" value={form.address || ''} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Area</label>
            <input name="area" value={form.area || ''} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">State</label>
            <select value={form.state_id || ''} onChange={onStateChange} className="input">
              <option value="">Select State</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">LGA</label>
            <select name="lga_id" value={form.lga_id || ''} onChange={onChange} className="input" disabled={!form.state_id}>
              <option value="">Select LGA</option>
              {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Rent Amount (₦)</label>
            <input name="rent_amount" value={form.rent_amount || ''} onChange={onChange} className="input" type="number" min="0" />
          </div>
          <div>
            <label className="label">Available From</label>
            <input name="available_from" value={form.available_from || ''} onChange={onChange} className="input" type="date" />
          </div>
          <div>
            <label className="label">Bedrooms</label>
            <input name="bedrooms" value={form.bedrooms || 0} onChange={onChange} className="input" type="number" min="0" />
          </div>
          <div>
            <label className="label">Bathrooms</label>
            <input name="bathrooms" value={form.bathrooms || 0} onChange={onChange} className="input" type="number" min="0" />
          </div>
          <div>
            <label className="label">Toilets</label>
            <input name="toilets" value={form.toilets || 0} onChange={onChange} className="input" type="number" min="0" />
          </div>
          <div>
            <label className="label">Square Feet</label>
            <input name="square_feet" value={form.square_feet || ''} onChange={onChange} className="input" type="number" min="0" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:col-span-2">
            {[
              ['has_parking', 'Parking'], ['has_kitchen', 'Kitchen'], ['has_water', 'Water'], ['has_electricity', 'Electricity'],
              ['is_furnished', 'Furnished'], ['has_security', 'Security'], ['has_compound', 'Compound'], ['is_premium', 'Premium Listing']
            ].map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2 text-sm text-dark-700">
                <input type="checkbox" name={key} checked={!!form[key]} onChange={onChange} /> {label}
              </label>
            ))}
          </div>
          <div>
            <label className="label">Status</label>
            <select name="status" value={form.status || 'pending'} onChange={onChange} className="input">
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="pending">Pending</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (<><Loader2 className="animate-spin mr-2" size={16} /> Saving...</>) : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Images */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-dark-900 mb-2">Images</h3>
        {prop?.images?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {prop.images.map(img => (
              <div key={img.id} className="relative group">
                <img src={img.image} alt="" className="w-full h-24 object-cover rounded-lg border" />
                {img.is_primary && <span className="absolute top-1 left-1 text-xs bg-primary text-white px-1 rounded">Primary</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-600">No images yet.</p>
        )}
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
        {images && images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
            {images.map((file, idx) => (
              <div key={idx} className="relative bg-white rounded-lg border overflow-hidden">
                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-24 object-cover" />
                {progress[idx] > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                    <div className="h-1 bg-primary" style={{ width: `${progress[idx]}%` }} />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 hover:opacity-100 transition">
                  <button className="btn btn-secondary btn-sm" onClick={() => idx>0 && moveLocal(idx, idx-1)}>↑</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => idx<images.length-1 && moveLocal(idx, idx+1)}>↓</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => removeLocal(idx)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-2">
          <button className="btn btn-primary inline-flex items-center" onClick={uploadImages}>
            <ImageIcon size={16} className="mr-2" /> Upload
          </button>
        </div>
      </div>

      {/* Map preview */}
      {form.latitude && form.longitude && (
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-dark-900 mb-2">Location</h3>
          <div className="rounded-xl overflow-hidden border">
            <iframe
              title="map"
              width="100%"
              height="220"
              scrolling="no"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(form.longitude)-0.01}%2C${Number(form.latitude)-0.01}%2C${Number(form.longitude)+0.01}%2C${Number(form.latitude)+0.01}&layer=mapnik&marker=${form.latitude}%2C${form.longitude}`}
            />
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default EditProperty;
