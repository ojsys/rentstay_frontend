import { useEffect, useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { staysAPI, propertyAPI } from '../../services/api';
import { Loader2, Home, CheckCircle } from 'lucide-react';
import RichTextEditor from '../../components/common/RichTextEditor';
import toast from 'react-hot-toast';

const HostNewListing = () => {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    listing_type: 'entire',
    capacity_adults: 1,
    beds: 1,
    bathrooms: 1,
    nightly_rate: '',
    cleaning_fee: 0,
    service_fee_rate: 5,
    min_nights: 1,
    max_nights: 30,
    instant_book: true,
    property_id: '',
  });
  const [created, setCreated] = useState(null);

  useEffect(() => {
    const loadProps = async () => {
      try {
        const res = await propertyAPI.getAll({ mine: 1, ordering: '-created_at' });
        setProperties(res.data.results || res.data || []);
      } catch { setProperties([]); }
    };
    loadProps();
  }, []);

  const onChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
      payload.service_fee_rate = Number(payload.service_fee_rate || 5);
      payload.min_nights = Number(payload.min_nights || 1);
      payload.max_nights = Number(payload.max_nights || 30);
      if (!payload.property_id) delete payload.property_id; else payload.property_id = Number(payload.property_id);

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
            <label className="label">Service Fee (%)</label>
            <input name="service_fee_rate" value={form.service_fee_rate} onChange={onChange} type="number" min="0" className="input" />
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
