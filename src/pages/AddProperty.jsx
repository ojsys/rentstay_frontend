import { useEffect, useState } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell';
import { locationAPI, propertyAPI } from '../services/api';
import { Building2, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import RichTextEditor from '../components/common/RichTextEditor';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AddProperty = () => {
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [images, setImages] = useState([]); // local File list
  const [progress, setProgress] = useState({});
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', property_type: 'apartment',
    address: '', area: '', state_id: '', lga_id: '',
    rent_amount: '', bedrooms: 1, bathrooms: 1, toilets: 1, square_feet: '',
    latitude: '', longitude: '',
    has_parking: false, has_kitchen: false, has_water: false, has_electricity: false,
    is_furnished: false, has_security: false, has_compound: false,
    available_from: ''
  });

  useEffect(() => {
    locationAPI.getStates().then(res => setStates(res.data)).catch(() => setStates([]));
  }, []);

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
      } catch { setLgas([]); }
    } else {
      setLgas([]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.address || !form.state_id || !form.lga_id || !form.rent_amount) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        rent_amount: form.rent_amount === '' ? null : Number(form.rent_amount),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        toilets: Number(form.toilets),
      };
      // Coerce optional numeric fields and coordinates to null if empty
      if (!form.square_feet) delete payload.square_feet; else payload.square_feet = Number(form.square_feet);
      if (!form.latitude) delete payload.latitude; else payload.latitude = parseFloat(form.latitude);
      if (!form.longitude) delete payload.longitude; else payload.longitude = parseFloat(form.longitude);
      if (!form.available_from) delete payload.available_from;
      // Ensure IDs are integers
      payload.state_id = parseInt(form.state_id, 10);
      payload.lga_id = parseInt(form.lga_id, 10);

      const res = await propertyAPI.create(payload);
      const id = res.data?.id;
      setCreatedId(id);
      toast.success('Property created');
    } catch (err) {
      const data = err?.response?.data;
      let msg = 'Failed to create property';
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
      setLoading(false);
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
    if (!createdId) return;
    if (!images || images.length === 0) { toast.error('Select images'); return; }
    try {
      const nextProgress = {};
      for (let i = 0; i < images.length; i++) {
        const file = await compressImage(images[i]);
        const fd = new FormData();
        fd.append('image', file);
        if (i === 0) fd.append('is_primary', 'true');
        await propertyAPI.uploadImage(createdId, fd, {
          onUploadProgress: (evt) => {
            nextProgress[i] = Math.round((evt.loaded / (evt.total || 1)) * 100);
            setProgress({ ...nextProgress });
          }
        });
      }
      toast.success('Images uploaded');
      navigate(`/properties/${createdId}`);
    } catch (err) {
      toast.error('Failed to upload images');
    }
  };

  return (
    <DashboardShell>
      <div className="flex items-center mb-4">
        <Building2 className="text-primary mr-2" />
        <h1 className="text-2xl font-display font-bold text-dark-900">Add Property</h1>
      </div>

      <form onSubmit={submit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Title</label>
            <input name="title" value={form.title} onChange={onChange} className="input" placeholder="Beautiful 2-bedroom apartment" />
          </div>
          <div>
            <label className="label">Property Type</label>
            <select name="property_type" value={form.property_type} onChange={onChange} className="input">
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
              <RichTextEditor
                value={form.description}
                onChange={(val) => setForm(prev => ({ ...prev, description: val }))}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="label">Address</label>
            <input name="address" value={form.address} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Area</label>
            <input name="area" value={form.area} onChange={onChange} className="input" placeholder="Neighborhood/Area" />
          </div>
          <div>
            <label className="label">State</label>
            <select value={form.state_id} onChange={onStateChange} className="input">
              <option value="">Select State</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">LGA</label>
            <select name="lga_id" value={form.lga_id} onChange={onChange} className="input" disabled={!form.state_id}>
              <option value="">Select LGA</option>
              {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Rent Amount (₦)</label>
            <input name="rent_amount" value={form.rent_amount} onChange={onChange} className="input" type="number" min="0" />
          </div>
          <div>
            <label className="label">Available From</label>
            <input name="available_from" value={form.available_from} onChange={onChange} className="input" type="date" />
          </div>

          <div>
            <label className="label">Bedrooms</label>
            <input name="bedrooms" value={form.bedrooms} onChange={onChange} className="input" type="number" min="0" />
          </div>
          <div>
            <label className="label">Bathrooms</label>
            <input name="bathrooms" value={form.bathrooms} onChange={onChange} className="input" type="number" min="0" />
          </div>
          <div>
            <label className="label">Toilets</label>
            <input name="toilets" value={form.toilets} onChange={onChange} className="input" type="number" min="0" />
          </div>
          <div>
            <label className="label">Square Feet</label>
            <input name="square_feet" value={form.square_feet} onChange={onChange} className="input" type="number" min="0" />
          </div>

          {/* Amenities */}
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['has_parking', 'Parking'], ['has_kitchen', 'Kitchen'], ['has_water', 'Water'], ['has_electricity', 'Electricity'],
              ['is_furnished', 'Furnished'], ['has_security', 'Security'], ['has_compound', 'Compound']
            ].map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2 text-sm text-dark-700">
                <input type="checkbox" name={key} checked={!!form[key]} onChange={onChange} /> {label}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Latitude</label>
            <input name="latitude" value={form.latitude} onChange={onChange} className="input" placeholder="e.g., 9.0765" />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input name="longitude" value={form.longitude} onChange={onChange} className="input" placeholder="e.g., 7.3986" />
          </div>
        </div>
        {form.latitude && form.longitude && (
          <div className="rounded-xl overflow-hidden border">
            <iframe
              title="map"
              width="100%"
              height="220"
              scrolling="no"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(form.longitude)-0.01}%2C${Number(form.latitude)-0.01}%2C${Number(form.longitude)+0.01}%2C${Number(form.latitude)+0.01}&layer=mapnik&marker=${form.latitude}%2C${form.longitude}`}
            />
          </div>
        )}
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (<><Loader2 className="animate-spin mr-2" size={16} /> Saving...</>) : 'Create Property'}
          </button>
        </div>
      </form>

      {createdId && (
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-dark-900 mb-2">Upload Images</h3>
          <p className="text-sm text-dark-600 mb-3">Drag & drop images below (first will be primary), or select from your device. Images are compressed before upload.</p>
          <div
            className="border-2 border-dashed rounded-lg p-4 text-center text-dark-600 bg-gray-50 hover:bg-gray-100 cursor-pointer"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {images.map((file, idx) => (
                <div key={idx} className="relative bg-white rounded-lg border overflow-hidden">
                  <div className="absolute top-1 left-1 text-xs bg-primary text-white px-1 rounded">{idx === 0 ? 'Primary' : `#${idx+1}`}</div>
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-28 object-cover" />
                  <div className="p-2 text-xs text-dark-600 truncate">{file.name}</div>
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
          <div className="mt-3">
            <button className="btn btn-primary inline-flex items-center" onClick={uploadImages}>
              <ImageIcon size={16} className="mr-2" /> Upload
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default AddProperty;
