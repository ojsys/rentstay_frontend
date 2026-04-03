import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Building2, Loader2, Upload, Trash2, Star, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { locationAPI, propertyAPI } from '../services/api';
import RichTextEditor from '../components/common/RichTextEditor';
import useAuthStore from '../store/authStore';

const AgentEditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', property_type: 'apartment',
    address: '', area: '', state_id: '', lga_id: '',
    rent_amount: '', bedrooms: 1, bathrooms: 1, toilets: 1, square_feet: '',
    has_parking: false, has_kitchen: false, has_water: false, has_electricity: false,
    is_furnished: false, has_security: false, has_compound: false,
    has_legal_fee: false, available_from: '',
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.user_type !== 'agent') return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    const load = async () => {
      try {
        const [propRes, statesRes] = await Promise.all([
          propertyAPI.get(id),
          locationAPI.getStates(),
        ]);
        const p = propRes.data;
        setStates(statesRes.data);
        setExistingImages(p.images || []);

        const stateId = p.state?.id || '';
        setForm({
          title: p.title || '',
          description: p.description || '',
          property_type: p.property_type || 'apartment',
          address: p.address || '',
          area: p.area || '',
          state_id: String(stateId),
          lga_id: String(p.lga?.id || ''),
          rent_amount: p.rent_amount || '',
          bedrooms: p.bedrooms || 1,
          bathrooms: p.bathrooms || 1,
          toilets: p.toilets || 1,
          square_feet: p.square_feet || '',
          has_parking: !!p.has_parking,
          has_kitchen: !!p.has_kitchen,
          has_water: !!p.has_water,
          has_electricity: !!p.has_electricity,
          is_furnished: !!p.is_furnished,
          has_security: !!p.has_security,
          has_compound: !!p.has_compound,
          has_legal_fee: !!p.has_legal_fee,
          available_from: p.available_from || '',
        });

        if (stateId) {
          const lgaRes = await locationAPI.getLGAs(stateId);
          setLgas(lgaRes.data);
        }
      } catch {
        toast.error('Failed to load property');
        navigate('/agent/dashboard/properties');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
    if (!form.title || !form.address || !form.state_id || !form.lga_id || !form.rent_amount) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        rent_amount: Number(form.rent_amount),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        toilets: Number(form.toilets),
        state_id: parseInt(form.state_id, 10),
        lga_id: parseInt(form.lga_id, 10),
      };
      if (!form.square_feet) delete payload.square_feet; else payload.square_feet = Number(form.square_feet);
      if (!form.available_from) delete payload.available_from;

      await propertyAPI.update(id, payload);
      toast.success('Property updated!');
    } catch (err) {
      const data = err?.response?.data;
      let msg = 'Failed to update property';
      if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        msg = Array.isArray(firstVal) ? `${firstKey}: ${firstVal[0]}` : `${firstKey}: ${firstVal}`;
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
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        blob => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg', quality
      );
    };
    reader.readAsDataURL(file);
  });

  const onSelectNew = (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length) setNewImages(prev => [...prev, ...files]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length) setNewImages(prev => [...prev, ...files]);
  };

  const removeNewImage = (idx) => setNewImages(prev => prev.filter((_, i) => i !== idx));

  const uploadNewImages = async () => {
    if (!newImages.length) { toast.error('Select images first'); return; }
    setUploading(true);
    try {
      const nextProgress = {};
      for (let i = 0; i < newImages.length; i++) {
        const file = await compressImage(newImages[i]);
        const fd = new FormData();
        fd.append('image', file);
        await propertyAPI.uploadImage(id, fd, {
          onUploadProgress: (evt) => {
            nextProgress[i] = Math.round((evt.loaded / (evt.total || 1)) * 100);
            setUploadProgress({ ...nextProgress });
          },
        });
      }
      // Refresh existing images list
      const res = await propertyAPI.get(id);
      setExistingImages(res.data.images || []);
      setNewImages([]);
      setUploadProgress({});
      toast.success('Images uploaded!');
    } catch {
      toast.error('Failed to upload some images');
    } finally {
      setUploading(false);
    }
  };

  const deleteExistingImage = async (imageId) => {
    try {
      await propertyAPI.deleteImage(id, imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Image removed');
    } catch {
      toast.error('Failed to remove image');
    }
  };

  const setPrimaryImage = async (imageId) => {
    try {
      await propertyAPI.setPrimaryImage(id, imageId);
      setExistingImages(prev => prev.map(img => ({ ...img, is_primary: img.id === imageId })));
      toast.success('Primary image updated');
    } catch {
      toast.error('Failed to update primary image');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="container-custom py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/agent/dashboard/properties')} className="text-dark-400 hover:text-dark-700">
          <ArrowLeft size={20} />
        </button>
        <Building2 className="text-primary" size={24} />
        <h1 className="text-2xl font-display font-bold text-dark-900">Edit Property</h1>
      </div>

      {/* Details form */}
      <form onSubmit={submit} className="card space-y-5 mb-6">
        <h2 className="text-base font-semibold text-dark-800">Property Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Title <span className="text-red-500">*</span></label>
            <input name="title" value={form.title} onChange={onChange} className="input" />
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
              {states.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">LGA <span className="text-red-500">*</span></label>
            <select name="lga_id" value={form.lga_id} onChange={onChange} className="input" disabled={!form.state_id}>
              <option value="">Select LGA</option>
              {lgas.map(l => <option key={l.id} value={String(l.id)}>{l.name}</option>)}
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

          {/* Legal fee */}
          <div className="md:col-span-2">
            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" name="has_legal_fee" checked={!!form.has_legal_fee} onChange={onChange} className="mt-0.5 w-4 h-4" />
              <div>
                <p className="text-sm font-medium text-dark-800">Legal Service Fee (10%)</p>
                <p className="text-xs text-dark-500">Adds 10% of rent for legal documentation and tenancy agreement structuring.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><Loader2 className="animate-spin mr-2" size={16} />Saving…</> : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Image management */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-dark-800">Property Images</h2>

        {/* Existing images */}
        {existingImages.length > 0 && (
          <div>
            <p className="text-sm text-dark-500 mb-2">Current images — click the star to set as primary, trash to remove.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {existingImages.map(img => (
                <div key={img.id} className="relative group border rounded-lg overflow-hidden">
                  {img.is_primary && (
                    <div className="absolute top-1 left-1 text-xs bg-primary text-white px-1.5 py-0.5 rounded font-medium z-10">Primary</div>
                  )}
                  <img src={img.image} alt="property" className="w-full h-28 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!img.is_primary && (
                      <button
                        onClick={() => setPrimaryImage(img.id)}
                        title="Set as primary"
                        className="p-1.5 bg-white rounded-full text-amber-500 hover:text-amber-600"
                      >
                        <Star size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteExistingImage(img.id)}
                      title="Delete image"
                      className="p-1.5 bg-white rounded-full text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload new images */}
        <div>
          <p className="text-sm text-dark-500 mb-2">Add more images:</p>
          <div
            className="border-2 border-dashed rounded-lg p-4 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer text-sm text-dark-500"
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
          >
            Drag images here or
            <label className="ml-1 text-primary cursor-pointer hover:underline">
              browse
              <input type="file" multiple accept="image/*" onChange={onSelectNew} hidden />
            </label>
          </div>

          {newImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {newImages.map((file, idx) => (
                <div key={idx} className="relative border rounded-lg overflow-hidden">
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-28 object-cover" />
                  <button
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-white rounded-full text-red-500 hover:text-red-600 shadow"
                  >
                    <Trash2 size={12} />
                  </button>
                  {uploadProgress[idx] > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                      <div className="h-1 bg-primary" style={{ width: `${uploadProgress[idx]}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {newImages.length > 0 && (
            <div className="mt-3">
              <button
                className="btn btn-primary inline-flex items-center gap-2"
                onClick={uploadNewImages}
                disabled={uploading}
              >
                {uploading ? <><Loader2 className="animate-spin" size={16} /> Uploading…</> : <><Upload size={16} /> Upload {newImages.length} Image{newImages.length > 1 ? 's' : ''}</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentEditProperty;
