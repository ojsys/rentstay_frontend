import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, Upload, Image as ImageIcon, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { locationAPI, propertyAPI } from '../services/api';
import RichTextEditor from '../components/common/RichTextEditor';
import useAuthStore from '../store/authStore';
import { Navigate } from 'react-router-dom';

const AddPropertyForAgent = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [images, setImages] = useState([]);
  const [progress, setProgress] = useState({});

  const [form, setForm] = useState({
    landlord_email: '',
    title: '', description: '', property_type: 'apartment',
    address: '', area: '', state_id: '', lga_id: '',
    rent_amount: '', bedrooms: 1, bathrooms: 1, toilets: 1, square_feet: '',
    has_parking: false, has_kitchen: false, has_water: false, has_electricity: false,
    is_furnished: false, has_security: false, has_compound: false,
    has_agent_fee: true, // always true for agent-created properties
    has_legal_fee: false,
    available_from: '',
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.user_type !== 'agent') return <Navigate to="/dashboard" replace />;

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
    if (!form.landlord_email) { toast.error('Enter the landlord email'); return; }
    if (!form.title || !form.address || !form.state_id || !form.lga_id || !form.rent_amount) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        rent_amount: Number(form.rent_amount),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        toilets: Number(form.toilets),
        has_agent_fee: true,
        state_id: parseInt(form.state_id, 10),
        lga_id: parseInt(form.lga_id, 10),
      };
      if (!form.square_feet) delete payload.square_feet; else payload.square_feet = Number(form.square_feet);
      if (!form.available_from) delete payload.available_from;

      const res = await propertyAPI.create(payload);
      setCreatedId(res.data?.id);
      toast.success('Property created! Now upload images.');
    } catch (err) {
      const data = err?.response?.data;
      let msg = 'Failed to create property';
      if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        msg = Array.isArray(firstVal) ? `${firstKey}: ${firstVal[0]}` : `${firstKey}: ${firstVal}`;
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
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })), 'image/jpeg', quality);
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

  const uploadImages = async () => {
    if (!createdId || !images.length) { toast.error('Select images first'); return; }
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
      toast.success('Done! Property is live.');
      navigate('/agent/dashboard/properties');
    } catch {
      toast.error('Failed to upload images');
    }
  };

  return (
    <div className="container-custom py-8 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="text-primary" size={24} />
        <h1 className="text-2xl font-display font-bold text-dark-900">Add Property on Behalf of Landlord</h1>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6 text-sm text-amber-800">
        <Info size={18} className="mt-0.5 flex-shrink-0" />
        <p>
          You are adding this property as an <strong>agent</strong>. The landlord (identified by email below) will be the
          property owner. A <strong>5% agent fee</strong> will automatically be included in the tenant's move-in cost,
          and you will earn that commission when the property is rented.
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-5">
        {/* Landlord email — required */}
        <div>
          <label className="label">Landlord Email <span className="text-red-500">*</span></label>
          <input
            name="landlord_email"
            value={form.landlord_email}
            onChange={onChange}
            className="input"
            type="email"
            placeholder="landlord@example.com"
          />
          <p className="text-xs text-dark-400 mt-1">The landlord must already have a RentStay account.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Title <span className="text-red-500">*</span></label>
            <input name="title" value={form.title} onChange={onChange} className="input" placeholder="Beautiful 2-bedroom flat" />
          </div>
          <div>
            <label className="label">Property Type</label>
            <select name="property_type" value={form.property_type} onChange={onChange} className="input">
              {[['apartment','Apartment'],['house','House'],['duplex','Duplex'],['room','Single Room'],['self_contain','Self Contain'],['flat','Flat'],['bungalow','Bungalow']].map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <div className="border rounded-lg overflow-hidden">
              <RichTextEditor value={form.description} onChange={val => setForm(prev => ({ ...prev, description: val }))} />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="label">Address <span className="text-red-500">*</span></label>
            <input name="address" value={form.address} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Area / Neighbourhood</label>
            <input name="area" value={form.area} onChange={onChange} className="input" placeholder="e.g. Lekki Phase 1" />
          </div>
          <div>
            <label className="label">State <span className="text-red-500">*</span></label>
            <select value={form.state_id} onChange={onStateChange} className="input">
              <option value="">Select State</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">LGA <span className="text-red-500">*</span></label>
            <select name="lga_id" value={form.lga_id} onChange={onChange} className="input" disabled={!form.state_id}>
              <option value="">Select LGA</option>
              {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Rent Amount (₦) <span className="text-red-500">*</span></label>
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
            {[['has_parking','Parking'],['has_kitchen','Kitchen'],['has_water','Water'],['has_electricity','Electricity'],['is_furnished','Furnished'],['has_security','Security'],['has_compound','Compound']].map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2 text-sm text-dark-700">
                <input type="checkbox" name={key} checked={!!form[key]} onChange={onChange} /> {label}
              </label>
            ))}
          </div>

          {/* Legal fee option */}
          <div className="md:col-span-2">
            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" name="has_legal_fee" checked={!!form.has_legal_fee} onChange={onChange} className="mt-0.5 w-4 h-4" />
              <div>
                <p className="text-sm font-medium text-dark-800">Legal Service Fee (10%)</p>
                <p className="text-xs text-dark-500">Adds 10% of rent for legal documentation and tenancy agreement structuring.</p>
              </div>
            </label>
          </div>

          {/* Cost preview */}
          {form.rent_amount > 0 && (
            <div className="md:col-span-2 bg-gray-50 border rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium text-dark-700 mb-1">Tenant Cost Preview</p>
              <div className="flex justify-between text-dark-600"><span>Base Rent</span><span>₦{Number(form.rent_amount).toLocaleString()}</span></div>
              <div className="flex justify-between text-dark-600"><span>Caution Fee (10%)</span><span>₦{(Number(form.rent_amount) * 0.1).toLocaleString()}</span></div>
              <div className="flex justify-between text-amber-700"><span>Agent Affiliate Fee (5%)</span><span>₦{(Number(form.rent_amount) * 0.05).toLocaleString()}</span></div>
              {form.has_legal_fee && <div className="flex justify-between text-blue-700"><span>Legal Service Fee (10%)</span><span>₦{(Number(form.rent_amount) * 0.10).toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold border-t pt-1 text-dark-900">
                <span>Tenant Total</span>
                <span>₦{(Number(form.rent_amount) * (1.15 + (form.has_legal_fee ? 0.10 : 0))).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><Loader2 className="animate-spin mr-2" size={16} />Saving…</> : 'Create Property'}
          </button>
        </div>
      </form>

      {createdId && (
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-dark-900 mb-2">Upload Images</h3>
          <div className="border-2 border-dashed rounded-lg p-4 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer" onDragOver={e => e.preventDefault()} onDrop={onDrop}>
            Drag images here
            <div className="mt-2">
              <label className="btn btn-secondary inline-flex items-center">
                <Upload size={16} className="mr-2" /> Select Images
                <input type="file" multiple accept="image/*" onChange={onSelect} hidden />
              </label>
            </div>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {images.map((file, idx) => (
                <div key={idx} className="relative border rounded-lg overflow-hidden">
                  <div className="absolute top-1 left-1 text-xs bg-primary text-white px-1 rounded">{idx === 0 ? 'Primary' : `#${idx+1}`}</div>
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-28 object-cover" />
                  {progress[idx] > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                      <div className="h-1 bg-primary" style={{ width: `${progress[idx]}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-3">
            <button className="btn btn-primary inline-flex items-center" onClick={uploadImages}>
              <ImageIcon size={16} className="mr-2" /> Upload & Finish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPropertyForAgent;
