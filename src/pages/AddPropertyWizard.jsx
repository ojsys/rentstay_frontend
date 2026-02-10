import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { propertyAPI, locationAPI } from '../services/api';
import PhotoUploadStep from '../components/listing/PhotoUploadStep';
import ListingQualityScore, { calculateLocalQualityScore } from '../components/listing/ListingQualityScore';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'location', label: 'Location' },
  { key: 'details', label: 'Details' },
  { key: 'photos', label: 'Photos' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'rules', label: 'House Rules' },
  { key: 'review', label: 'Review' },
];

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'room', label: 'Single Room' },
  { value: 'self_contain', label: 'Self Contain' },
  { value: 'flat', label: 'Flat' },
  { value: 'bungalow', label: 'Bungalow' },
];

const AddPropertyWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    property_type: '',
    address: '',
    state_id: '',
    lga_id: '',
    area: '',
    latitude: '',
    longitude: '',
    bedrooms: 1,
    bathrooms: 1,
    toilets: 1,
    square_feet: '',
    has_parking: false,
    has_kitchen: false,
    has_water: false,
    has_electricity: false,
    is_furnished: false,
    has_security: false,
    has_compound: false,
    rent_amount: '',
    rent_term: 'annual',
    house_rules: '',
    status: 'draft',
  });

  const { data: states = [] } = useQuery({
    queryKey: ['states'],
    queryFn: () => locationAPI.getStates().then(r => r.data?.results || r.data || []),
  });

  const { data: lgas = [] } = useQuery({
    queryKey: ['lgas', form.state_id],
    queryFn: () => locationAPI.getLGAs(form.state_id).then(r => r.data?.results || r.data || []),
    enabled: !!form.state_id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await propertyAPI.create({
        ...form,
        state_id: Number(form.state_id),
        lga_id: Number(form.lga_id),
        rent_amount: Number(form.rent_amount),
        square_feet: form.square_feet ? Number(form.square_feet) : null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      });
      const propertyId = res.data.id;
      // Upload images
      for (const img of images) {
        if (img.file) {
          const fd = new FormData();
          fd.append('image', img.file);
          fd.append('is_primary', img.is_primary ? 'true' : 'false');
          await propertyAPI.uploadImage(propertyId, fd);
        }
      }
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Property created!');
      navigate(`/dashboard/properties`);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || 'Failed to create property');
    },
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const toggle = (key) => setForm(prev => ({ ...prev, [key]: !prev[key] }));

  const { score, tips } = calculateLocalQualityScore(form, images.length);

  const canProceed = () => {
    switch (step) {
      case 0: return form.title && form.description && form.property_type;
      case 1: return form.state_id && form.lga_id && form.area && form.address;
      case 2: return form.bedrooms >= 0 && form.bathrooms >= 0;
      case 3: return true;
      case 4: return form.rent_amount > 0;
      case 5: return true;
      case 6: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleSubmit = () => {
    createMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                i <= step ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-dark-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                i < step ? 'bg-primary text-white' : i === step ? 'bg-primary text-white' : 'bg-gray-300 text-white'
              }`}>
                {i < step ? <Check size={12} /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-0.5 ${i < step ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-6">
            {/* Step 0: Basic Info */}
            {step === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Title</label>
                  <input type="text" value={form.title} onChange={e => update('title', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Spacious 2-bedroom flat in Lekki" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Property Type</label>
                  <select value={form.property_type} onChange={e => update('property_type', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select type</option>
                    {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Describe the property features, neighborhood, and what makes it special..." />
                </div>
              </div>
            )}

            {/* Step 1: Location */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Location</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">State</label>
                    <select value={form.state_id} onChange={e => { update('state_id', e.target.value); update('lga_id', ''); }} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="">Select state</option>
                      {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">LGA</label>
                    <select value={form.lga_id} onChange={e => update('lga_id', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" disabled={!form.state_id}>
                      <option value="">Select LGA</option>
                      {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Area / Neighborhood</label>
                  <input type="text" value={form.area} onChange={e => update('area', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Lekki Phase 1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Full Address</label>
                  <textarea value={form.address} onChange={e => update('address', e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Street address" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Latitude (optional)</label>
                    <input type="number" step="any" value={form.latitude} onChange={e => update('latitude', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Longitude (optional)</label>
                    <input type="number" step="any" value={form.longitude} onChange={e => update('longitude', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Property Details</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Bedrooms</label>
                    <input type="number" min="0" value={form.bedrooms} onChange={e => update('bedrooms', parseInt(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Bathrooms</label>
                    <input type="number" min="0" value={form.bathrooms} onChange={e => update('bathrooms', parseInt(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Toilets</label>
                    <input type="number" min="0" value={form.toilets} onChange={e => update('toilets', parseInt(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Square Feet (optional)</label>
                  <input type="number" min="0" value={form.square_feet} onChange={e => update('square_feet', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">Amenities</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'has_parking', label: 'Parking' },
                      { key: 'has_kitchen', label: 'Kitchen' },
                      { key: 'has_water', label: 'Running Water' },
                      { key: 'has_electricity', label: 'Electricity' },
                      { key: 'is_furnished', label: 'Furnished' },
                      { key: 'has_security', label: 'Security' },
                      { key: 'has_compound', label: 'Compound' },
                    ].map(a => (
                      <button key={a.key} type="button" onClick={() => toggle(a.key)} className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${form[a.key] ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-200 text-dark-600 hover:border-gray-300'}`}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Photos */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Photos</h3>
                <PhotoUploadStep images={images} onImagesChange={setImages} maxImages={10} />
              </div>
            )}

            {/* Step 4: Pricing */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing</h3>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Rent Amount (&#8358;)</label>
                  <input type="number" min="0" step="1000" value={form.rent_amount} onChange={e => update('rent_amount', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 500000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Rent Term</label>
                  <div className="flex gap-2">
                    {['annual', 'biannual', 'monthly'].map(t => (
                      <button key={t} type="button" onClick={() => update('rent_term', t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${form.rent_term === t ? 'bg-primary text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {form.rent_amount > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-dark-600">Caution Fee (10%): <span className="font-medium">&#8358;{(Number(form.rent_amount) * 0.1).toLocaleString()}</span></p>
                    <p className="text-dark-600">Total for Tenant: <span className="font-bold">&#8358;{(Number(form.rent_amount) * 1.1).toLocaleString()}</span></p>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: House Rules */}
            {step === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">House Rules</h3>
                <textarea
                  value={form.house_rules}
                  onChange={e => update('house_rules', e.target.value)}
                  rows={6}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="List any rules or guidelines for tenants. e.g.&#10;- No pets&#10;- Quiet hours after 10 PM&#10;- No smoking indoors&#10;- Gate closes at 11 PM"
                />
              </div>
            )}

            {/* Step 6: Review */}
            {step === 6 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Review Your Listing</h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="text-dark-500">Title:</span> <span className="font-medium">{form.title}</span></div>
                    <div><span className="text-dark-500">Type:</span> <span className="font-medium capitalize">{form.property_type}</span></div>
                    <div><span className="text-dark-500">Area:</span> <span className="font-medium">{form.area}</span></div>
                    <div><span className="text-dark-500">Rent:</span> <span className="font-medium">&#8358;{Number(form.rent_amount).toLocaleString()}/{form.rent_term}</span></div>
                    <div><span className="text-dark-500">Rooms:</span> <span className="font-medium">{form.bedrooms}BR / {form.bathrooms}BA / {form.toilets}T</span></div>
                    <div><span className="text-dark-500">Photos:</span> <span className="font-medium">{images.length}</span></div>
                  </div>
                  {form.description && (
                    <div>
                      <span className="text-dark-500">Description:</span>
                      <p className="mt-1 text-dark-700">{form.description.substring(0, 200)}{form.description.length > 200 ? '...' : ''}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => { update('status', 'draft'); handleSubmit(); }}
                    disabled={createMutation.isPending}
                    className="flex-1 bg-gray-100 text-dark-700 py-2.5 rounded-lg hover:bg-gray-200 font-medium text-sm"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={() => { update('status', 'submitted'); handleSubmit(); }}
                    disabled={createMutation.isPending}
                    className="flex-1 bg-primary text-white py-2.5 rounded-lg hover:bg-primary/90 font-medium text-sm"
                  >
                    {createMutation.isPending ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Submit for Review'}
                  </button>
                </div>
                {createMutation.isError && (
                  <p className="text-red-500 text-sm text-center">
                    {createMutation.error?.response?.data?.detail || 'Failed to create listing'}
                  </p>
                )}
              </div>
            )}

            {/* Navigation */}
            {step < 6 && (
              <div className="flex justify-between mt-6 pt-4 border-t">
                <button
                  onClick={handleBack}
                  disabled={step === 0}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-dark-600 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quality score sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <ListingQualityScore score={score} tips={tips} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPropertyWizard;
