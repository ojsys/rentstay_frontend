import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { staysAPI, propertyAPI, locationAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import {
  Loader2, CheckCircle, MapPin, ArrowLeft, Wifi, Coffee, Car,
  Shield, Waves, Dumbbell, ChevronDown, ChevronUp, Zap, Plus, Minus,
} from 'lucide-react';
import RichTextEditor from '../../components/common/RichTextEditor';
import toast from 'react-hot-toast';

const AMENITY_OPTIONS = [
  'WiFi', 'Air conditioning', 'Kitchen', 'Hot water', 'TV',
  'Generator/backup power', 'Parking', 'Security', 'Washing machine',
  'Swimming pool', 'Gym', 'Breakfast included', 'Pet friendly', 'Elevator',
];

const LISTING_TYPES = [
  { value: 'entire', label: 'Entire place', desc: 'Guests have the whole place to themselves' },
  { value: 'private_room', label: 'Private room', desc: 'Guests have their own room in a home' },
  { value: 'shared_room', label: 'Shared room', desc: 'Guests sleep in a shared space' },
];

const CANCELLATION_OPTIONS = [
  { value: 'flexible', label: 'Flexible', desc: 'Full refund up to 24 hrs before check-in' },
  { value: 'moderate', label: 'Moderate', desc: 'Full refund up to 5 days before check-in' },
  { value: 'strict', label: 'Strict', desc: '50% refund up to 7 days before check-in' },
];

const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-50">
      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{title}</h2>
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

const FieldLabel = ({ children, optional }) => (
  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
    {children} {optional && <span className="text-gray-400 font-normal">(optional)</span>}
  </label>
);

const StepperInput = ({ label, name, value, onChange, min = 0, max = 99, step = 1 }) => {
  const dec = () => onChange({ target: { name, value: Math.max(min, Number(value) - step), type: 'number' } });
  const inc = () => onChange({ target: { name, value: Math.min(max, Number(value) + step), type: 'number' } });
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <button type="button" onClick={dec} className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 transition">
          <Minus size={16} />
        </button>
        <span className="text-lg font-bold text-gray-900 w-8 text-center">{value}</span>
        <button type="button" onClick={inc} className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 transition">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

const HostNewListing = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSuperAgent = user?.user_type === 'super_agent';
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [showAdvancedLocation, setShowAdvancedLocation] = useState(false);
  const [form, setForm] = useState({
    owner_email: '',
    title: '',
    description: '',
    listing_type: 'entire',
    capacity_adults: 2,
    beds: 1,
    bathrooms: 1,
    nightly_rate: '',
    cleaning_fee: 0,
    min_nights: 1,
    max_nights: 30,
    instant_book: true,
    property_id: '',
    amenities: [],
    cancellation_policy: 'moderate',
    check_in_instructions: '',
    check_out_instructions: '',
    house_rules: '',
    address: '',
    area: '',
    state_id: '',
    lga_id: '',
    latitude: '',
    longitude: '',
  });
  const [created, setCreated] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [propsRes, statesRes] = await Promise.all([
          propertyAPI.getAll({ mine: 1, ordering: '-created_at' }),
          locationAPI.getStates(),
        ]);
        setProperties(propsRes.data.results || propsRes.data || []);
        setStates(statesRes.data.results || statesRes.data || []);
      } catch { setProperties([]); }
    };
    init();
  }, []);

  const onStateChange = async (e) => {
    const stateId = e.target.value;
    setForm(prev => ({ ...prev, state_id: stateId, lga_id: '' }));
    if (stateId) {
      try {
        const res = await locationAPI.getLGAs(stateId);
        setLgas(res.data.results || res.data || []);
      } catch { setLgas([]); }
    } else {
      setLgas([]);
    }
  };

  const onChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleAmenity = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.nightly_rate) {
      toast.error('Please fill in title, description, and nightly rate');
      return;
    }
    if (isSuperAgent && !form.owner_email) {
      toast.error('Owner email is required when creating as Super Agent');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!isSuperAgent) delete payload.owner_email;
      payload.capacity_adults = Number(payload.capacity_adults);
      payload.beds = Number(payload.beds);
      payload.bathrooms = Number(payload.bathrooms);
      payload.nightly_rate = Number(payload.nightly_rate);
      payload.cleaning_fee = Number(payload.cleaning_fee || 0);
      payload.min_nights = Number(payload.min_nights || 1);
      payload.max_nights = Number(payload.max_nights || 30);
      if (!payload.property_id) delete payload.property_id; else payload.property_id = Number(payload.property_id);
      if (!payload.state_id) delete payload.state_id; else payload.state_id = Number(payload.state_id);
      if (!payload.lga_id) delete payload.lga_id; else payload.lga_id = Number(payload.lga_id);
      if (!payload.latitude) delete payload.latitude;
      if (!payload.longitude) delete payload.longitude;

      const res = await staysAPI.createListing(payload);
      setCreated(res.data);
      toast.success('Listing created!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const data = err?.response?.data;
      let msg = 'Failed to create listing';
      if (data && typeof data === 'object') {
        const key = Object.keys(data)[0];
        const val = data[key];
        if (Array.isArray(val) && val.length) msg = `${key}: ${val[0]}`;
        else if (typeof val === 'string') msg = `${key}: ${val}`;
      } else if (err?.response?.data?.detail) {
        msg = err.response.data.detail;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    try {
      await staysAPI.publish(created.id);
      toast.success('Listing published!');
      navigate('/dashboard/stays');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to publish'); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-friendly sticky header */}
      <div className="sticky top-0 z-30 bg-[#0C3B2E] md:bg-white md:border-b md:border-gray-200 shadow-sm">
        <div className="container-custom flex items-center justify-between h-14 md:h-16">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/stays"
              className="p-2 rounded-xl bg-white/10 md:bg-gray-100 text-white md:text-gray-600 hover:bg-white/20 md:hover:bg-gray-200 transition"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-white md:text-gray-900 font-bold text-base md:text-lg">
              {created ? 'Listing Created!' : 'Share Your Space'}
            </h1>
          </div>
          {!created && (
            <button
              form="listing-form"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-amber-600 transition disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? 'Saving…' : 'Create'}
            </button>
          )}
        </div>
      </div>

      <div className="container-custom py-5 md:py-8 max-w-2xl mx-auto space-y-4">
        {/* Success state */}
        {created ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">"{created.title}" created!</h2>
            <p className="text-sm text-gray-500 mb-6">
              {created.is_published ? 'Your listing is now live.' : 'Your listing is saved as a draft.'}
            </p>
            <div className="flex flex-col gap-3">
              {!created.is_published && (
                <button
                  onClick={publish}
                  className="w-full py-3 bg-[#0C3B2E] text-white font-semibold rounded-xl hover:bg-[#0a3226] transition"
                >
                  Publish Listing
                </button>
              )}
              <Link
                to={`/stays/listings/${created.id}/availability`}
                className="w-full py-3 border-2 border-[#0C3B2E] text-[#0C3B2E] font-semibold rounded-xl text-center hover:bg-[#0C3B2E]/5 transition"
              >
                Manage Availability
              </Link>
              <Link
                to={`/stays/listings/${created.id}/edit`}
                className="w-full py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl text-center hover:bg-gray-50 transition"
              >
                Add Photos & Edit Details
              </Link>
              <Link to="/dashboard/stays" className="text-sm text-gray-400 hover:text-gray-600 mt-1">
                Back to Stays Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <form id="listing-form" onSubmit={submit} className="space-y-4">

            {/* ── Super Agent: owner ─────────────────────────── */}
            {isSuperAgent && (
              <SectionCard title="Listing Owner">
                <div>
                  <FieldLabel>Owner email address *</FieldLabel>
                  <input
                    name="owner_email"
                    type="email"
                    value={form.owner_email}
                    onChange={onChange}
                    className="input w-full"
                    placeholder="Enter the landlord/owner's email"
                  />
                  <p className="text-xs text-dark-400 mt-1">This listing will be created on behalf of that owner.</p>
                </div>
              </SectionCard>
            )}

            {/* ── Basics ─────────────────────────────────────── */}
            <SectionCard title="Basics">
              <div>
                <FieldLabel>Listing title *</FieldLabel>
                <input
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  className="input w-full"
                  placeholder="e.g. Cozy studio in Ikeja"
                />
              </div>

              <div>
                <FieldLabel>Listing type *</FieldLabel>
                <div className="space-y-2">
                  {LISTING_TYPES.map(t => (
                    <label
                      key={t.value}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                        form.listing_type === t.value
                          ? 'border-[#0C3B2E] bg-[#0C3B2E]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="listing_type"
                        value={t.value}
                        checked={form.listing_type === t.value}
                        onChange={onChange}
                        className="accent-[#0C3B2E]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                        <p className="text-xs text-gray-500">{t.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Description *</FieldLabel>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <RichTextEditor
                    value={form.description}
                    onChange={(val) => setForm(prev => ({ ...prev, description: val }))}
                  />
                </div>
              </div>

              {properties.length > 0 && (
                <div>
                  <FieldLabel optional>Link to existing property</FieldLabel>
                  <select name="property_id" value={form.property_id} onChange={onChange} className="input w-full">
                    <option value="">— None —</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              )}
            </SectionCard>

            {/* ── Capacity & Pricing ─────────────────────────── */}
            <SectionCard title="Capacity & Pricing">
              <div className="grid grid-cols-3 gap-4">
                <StepperInput label="Adults" name="capacity_adults" value={form.capacity_adults} onChange={onChange} min={1} />
                <StepperInput label="Beds" name="beds" value={form.beds} onChange={onChange} min={1} />
                <StepperInput label="Bathrooms" name="bathrooms" value={form.bathrooms} onChange={onChange} min={0} step={0.5} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Nightly rate (₦) *</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₦</span>
                    <input
                      name="nightly_rate"
                      value={form.nightly_rate}
                      onChange={onChange}
                      type="number"
                      min="0"
                      className="input w-full pl-8"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel optional>Cleaning fee (₦)</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₦</span>
                    <input
                      name="cleaning_fee"
                      value={form.cleaning_fee}
                      onChange={onChange}
                      type="number"
                      min="0"
                      className="input w-full pl-8"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Min nights</FieldLabel>
                  <input name="min_nights" value={form.min_nights} onChange={onChange} type="number" min="1" className="input w-full" />
                </div>
                <div>
                  <FieldLabel>Max nights</FieldLabel>
                  <input name="max_nights" value={form.max_nights} onChange={onChange} type="number" min="1" className="input w-full" />
                </div>
              </div>
            </SectionCard>

            {/* ── Location ───────────────────────────────────── */}
            <SectionCard title="Location">
              <div>
                <FieldLabel optional>Street address</FieldLabel>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input name="address" value={form.address} onChange={onChange} className="input w-full pl-9" placeholder="12 Adeola Odeku Street" />
                </div>
              </div>

              <div>
                <FieldLabel optional>Neighbourhood / Area</FieldLabel>
                <input name="area" value={form.area} onChange={onChange} className="input w-full" placeholder="e.g. Victoria Island" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel optional>State</FieldLabel>
                  <select value={form.state_id} onChange={onStateChange} className="input w-full">
                    <option value="">— Select state —</option>
                    {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel optional>LGA</FieldLabel>
                  <select name="lga_id" value={form.lga_id} onChange={onChange} className="input w-full" disabled={!form.state_id}>
                    <option value="">— Select LGA —</option>
                    {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvancedLocation(v => !v)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                {showAdvancedLocation ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                GPS coordinates (optional)
              </button>

              {showAdvancedLocation && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel optional>Latitude</FieldLabel>
                    <input name="latitude" value={form.latitude} onChange={onChange} className="input w-full" placeholder="6.431433" type="number" step="any" />
                  </div>
                  <div>
                    <FieldLabel optional>Longitude</FieldLabel>
                    <input name="longitude" value={form.longitude} onChange={onChange} className="input w-full" placeholder="3.421860" type="number" step="any" />
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

            {/* ── Policies ───────────────────────────────────── */}
            <SectionCard title="Policies">
              <div>
                <label className="flex items-center justify-between p-3.5 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Instant Book</p>
                    <p className="text-xs text-gray-500">Guests can book without waiting for approval</p>
                  </div>
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${form.instant_book ? 'bg-[#0C3B2E]' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.instant_book ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    <input type="checkbox" name="instant_book" checked={!!form.instant_book} onChange={onChange} className="sr-only" />
                  </div>
                </label>
              </div>

              <div>
                <FieldLabel>Cancellation policy</FieldLabel>
                <div className="space-y-2">
                  {CANCELLATION_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                        form.cancellation_policy === opt.value ? 'border-[#0C3B2E] bg-[#0C3B2E]/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancellation_policy"
                        value={opt.value}
                        checked={form.cancellation_policy === opt.value}
                        onChange={onChange}
                        className="accent-[#0C3B2E]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel optional>House rules</FieldLabel>
                <textarea
                  name="house_rules"
                  value={form.house_rules}
                  onChange={onChange}
                  className="input w-full min-h-[80px]"
                  placeholder="No smoking, no parties, quiet hours after 10pm…"
                />
              </div>
            </SectionCard>

            {/* ── Check-in / Check-out ───────────────────────── */}
            <SectionCard title="Check-in & Check-out">
              <div>
                <FieldLabel optional>Check-in instructions</FieldLabel>
                <textarea
                  name="check_in_instructions"
                  value={form.check_in_instructions}
                  onChange={onChange}
                  className="input w-full min-h-[80px]"
                  placeholder="Key lockbox at front gate, code: 1234…"
                />
              </div>
              <div>
                <FieldLabel optional>Check-out instructions</FieldLabel>
                <textarea
                  name="check_out_instructions"
                  value={form.check_out_instructions}
                  onChange={onChange}
                  className="input w-full min-h-[80px]"
                  placeholder="Leave keys on kitchen table, check out by 11am…"
                />
              </div>
            </SectionCard>

            {/* ── Amenities ──────────────────────────────────── */}
            <SectionCard title="Amenities">
              <div className="grid grid-cols-2 gap-2">
                {AMENITY_OPTIONS.map(a => (
                  <label
                    key={a}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition text-sm ${
                      form.amenities.includes(a)
                        ? 'border-[#0C3B2E] bg-[#0C3B2E]/5 text-[#0C3B2E] font-semibold'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.amenities.includes(a)}
                      onChange={() => toggleAmenity(a)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${form.amenities.includes(a) ? 'bg-[#0C3B2E] border-[#0C3B2E]' : 'border-gray-300'}`}>
                      {form.amenities.includes(a) && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    {a}
                  </label>
                ))}
              </div>
            </SectionCard>

            {/* ── Desktop submit button ──────────────────────── */}
            <div className="hidden md:flex justify-end pb-8">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-[#0C3B2E] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#0a3226] transition disabled:opacity-60"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Creating…' : 'Create Listing'}
              </button>
            </div>

            {/* Mobile: sticky bottom submit */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#0C3B2E] text-white font-semibold py-4 rounded-xl hover:bg-[#0a3226] transition disabled:opacity-60 text-base"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Creating…' : 'Create Listing'}
              </button>
            </div>
            {/* Spacer for sticky button */}
            <div className="h-24 md:hidden" />
          </form>
        )}
      </div>
    </div>
  );
};

export default HostNewListing;
