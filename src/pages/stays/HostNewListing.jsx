import { useEffect, useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { staysAPI, propertyAPI, locationAPI } from '../../services/api';
import { Loader2, Home, CheckCircle, MapPin } from 'lucide-react';
import RichTextEditor from '../../components/common/RichTextEditor';
import toast from 'react-hot-toast';

const AMENITY_OPTIONS = [
  'WiFi', 'Air conditioning', 'Kitchen', 'Hot water', 'TV',
  'Generator/backup power', 'Parking', 'Security', 'Washing machine',
  'Swimming pool', 'Gym', 'Breakfast included', 'Pet friendly', 'Elevator',
];

const HostNewListing = () => {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    listing_type: 'entire',
    capacity_adults: 1,
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
      toast.error('Fill required fields');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
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
      toast.success('Listing created');
    } catch (e) {
      const data = e?.response?.data;
      let msg = 'Failed to create listing';
      if (data && typeof data === 'object') {
        const key = Object.keys(data)[0];
        const val = data[key];
        if (Array.isArray(val) && val.length) msg = `${key}: ${val[0]}`;
        else if (typeof val === 'string') msg = `${key}: ${val}`;
      } else if (e?.response?.data?.detail) {
        msg = e.response.data.detail;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    try {
      const res = await staysAPI.publish(created.id);
      setCreated(res.data);
      toast.success('Published');
    } catch { toast.error('Failed to publish'); }
  };

  return (
    <DashboardShell>
      <div className="flex items-center mb-4">
        <Home className="text-primary mr-2" />
        <h1 className="text-2xl font-display font-bold text-dark-900">Share Your Space</h1>
      </div>

      <form onSubmit={submit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Title</label>
            <input name="title" value={form.title} onChange={onChange} className="input" placeholder="Cozy room in Ikeja" />
          </div>
          <div>
            <label className="label">Link to Property (optional)</label>
            <select name="property_id" value={form.property_id} onChange={onChange} className="input">
              <option value="">— None —</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
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
          <div>
            <label className="label">Type</label>
            <select name="listing_type" value={form.listing_type} onChange={onChange} className="input">
              <option value="entire">Entire place</option>
              <option value="private_room">Private room</option>
              <option value="shared_room">Shared room</option>
            </select>
          </div>
          <div>
            <label className="label">Adults</label>
            <input name="capacity_adults" value={form.capacity_adults} onChange={onChange} type="number" min="1" className="input" />
          </div>
          <div>
            <label className="label">Beds</label>
            <input name="beds" value={form.beds} onChange={onChange} type="number" min="1" className="input" />
          </div>
          <div>
            <label className="label">Bathrooms</label>
            <input name="bathrooms" value={form.bathrooms} onChange={onChange} type="number" min="0" step="0.5" className="input" />
          </div>
          <div>
            <label className="label">Nightly Rate (₦)</label>
            <input name="nightly_rate" value={form.nightly_rate} onChange={onChange} type="number" min="0" className="input" />
          </div>
          <div>
            <label className="label">Cleaning Fee (₦)</label>
            <input name="cleaning_fee" value={form.cleaning_fee} onChange={onChange} type="number" min="0" className="input" />
          </div>
          <div>
            <label className="label">Min Nights</label>
            <input name="min_nights" value={form.min_nights} onChange={onChange} type="number" min="1" className="input" />
          </div>
          <div>
            <label className="label">Max Nights</label>
            <input name="max_nights" value={form.max_nights} onChange={onChange} type="number" min="1" className="input" />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-dark-700">
            <input type="checkbox" name="instant_book" checked={!!form.instant_book} onChange={onChange} /> Instant Book
          </label>

          {/* Location */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3 mt-2">
              <MapPin size={16} className="text-primary" />
              <h3 className="font-semibold text-dark-900">Location</h3>
              <span className="text-xs text-dark-400">(used when not linked to a property)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="label">Street Address</label>
                <input name="address" value={form.address} onChange={onChange} className="input" placeholder="12 Adeola Odeku Street, Victoria Island" />
              </div>
              <div>
                <label className="label">Neighborhood / Area</label>
                <input name="area" value={form.area} onChange={onChange} className="input" placeholder="Victoria Island" />
              </div>
              <div>
                <label className="label">State</label>
                <select value={form.state_id} onChange={onStateChange} className="input">
                  <option value="">— Select state —</option>
                  {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">LGA</label>
                <select name="lga_id" value={form.lga_id} onChange={onChange} className="input" disabled={!form.state_id}>
                  <option value="">— Select LGA —</option>
                  {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Latitude <span className="text-dark-400 font-normal">(optional)</span></label>
                <input name="latitude" value={form.latitude} onChange={onChange} className="input" placeholder="6.431433" type="number" step="any" />
              </div>
              <div>
                <label className="label">Longitude <span className="text-dark-400 font-normal">(optional)</span></label>
                <input name="longitude" value={form.longitude} onChange={onChange} className="input" placeholder="3.421860" type="number" step="any" />
              </div>
            </div>
            {form.latitude && form.longitude && (
              <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 h-52">
                <iframe
                  title="listing-map"
                  className="w-full h-full"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(form.longitude)-0.01},${Number(form.latitude)-0.01},${Number(form.longitude)+0.01},${Number(form.latitude)+0.01}&layer=mapnik&marker=${form.latitude},${form.longitude}`}
                />
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="label">Cancellation Policy</label>
            <select name="cancellation_policy" value={form.cancellation_policy} onChange={onChange} className="input">
              <option value="flexible">Flexible – full refund up to 24 hrs before check-in</option>
              <option value="moderate">Moderate – full refund up to 5 days before check-in</option>
              <option value="strict">Strict – 50% refund up to 7 days before check-in</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITY_OPTIONS.map(a => (
                <label key={a} className="inline-flex items-center gap-2 text-sm text-dark-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(a)}
                    onChange={() => toggleAmenity(a)}
                    className="rounded"
                  />
                  {a}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="label">House Rules</label>
            <textarea name="house_rules" value={form.house_rules} onChange={onChange} className="input min-h-[80px]" placeholder="No smoking, no parties…" />
          </div>
          <div>
            <label className="label">Check-in Instructions</label>
            <textarea name="check_in_instructions" value={form.check_in_instructions} onChange={onChange} className="input min-h-[80px]" placeholder="Key lockbox at front gate, code: 1234…" />
          </div>
          <div>
            <label className="label">Check-out Instructions</label>
            <textarea name="check_out_instructions" value={form.check_out_instructions} onChange={onChange} className="input min-h-[80px]" placeholder="Leave keys on table, check out by 11am…" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
            <button className="btn btn-primary" disabled={loading}>{loading ? (<><Loader2 className="animate-spin mr-2" size={16} /> Saving...</>) : 'Create Listing'}</button>
        </div>
      </form>

      {created && (
        <div className="card mt-6">
          <div className="flex items-center">
            <CheckCircle className="text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-dark-900">Listing created</h3>
          </div>
          <p className="text-sm text-dark-600 mt-1">{created.title} — {created.is_published ? 'Published' : 'Draft'}</p>
          {!created.is_published && (
            <div className="mt-3">
              <button onClick={publish} className="btn btn-primary">Publish</button>
            </div>
          )}
          <div className="mt-3">
            <a className="text-primary text-sm font-medium" href={`/stays/listings/${created.id}/availability`}>Manage Availability</a>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default HostNewListing;
