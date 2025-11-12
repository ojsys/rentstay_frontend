import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyAPI, messagingAPI, visitAPI } from '../services/api';
import { MapPin, Bed, Bath, Home, Shield, Car, Plug, Droplets, Sofa, CheckCircle, Loader2, MessageSquare } from 'lucide-react';
import { applicationAPI } from '../services/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b last:border-b-0">
    <span className="text-dark-600">{label}</span>
    <span className="font-medium text-dark-900">{value}</span>
  </div>
);

const Amenity = ({ icon: Icon, label, enabled }) => (
  <div className={`flex items-center space-x-2 ${enabled ? 'text-dark-800' : 'text-dark-400'}`}>
    <Icon size={18} className={enabled ? 'text-primary' : ''} />
    <span className="text-sm">{label}</span>
  </div>
);

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const load = async () => {
    try {
      setLoading(true);
      const res = await propertyAPI.get(id);
      setProperty(res.data);
    } catch (e) {
      setError('Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const loadSimilar = async () => {
      if (!property) return;
      try {
        const params = {
          status: 'available',
          property_type: property.property_type,
        };
        if (property.lga?.id) params.lga = property.lga.id;
        else if (property.state?.id) params.state = property.state.id;

        const res = await propertyAPI.getAll(params);
        const items = (res.data.results || res.data || []).filter(p => p.id !== property.id).slice(0, 6);
        setSimilar(items);
      } catch (_) {
        setSimilar([]);
      }
    };
    loadSimilar();
  }, [property]);

  const images = useMemo(() => {
    const imgs = property?.images || [];
    if (imgs.length === 0) return ['/placeholder-property.jpg'];
    return imgs.map(i => i.image);
  }, [property]);

  const messageLandlord = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setStarting(true);
    try {
      const res = await messagingAPI.startConversation(property.id);
      const convoId = res.data?.id;
      if (convoId) {
        navigate(`/messages?conversation=${convoId}`);
      } else {
        navigate('/messages');
      }
    } catch (e) {
      navigate('/messages');
    } finally {
      setStarting(false);
    }
  };

  const [visitOpen, setVisitOpen] = useState(false);
  const [visitDateTime, setVisitDateTime] = useState('');
  const [visitNote, setVisitNote] = useState('');
  const [visitLoading, setVisitLoading] = useState(false);

  const openVisit = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setVisitOpen(true);
  };

  const submitVisit = async (e) => {
    e.preventDefault();
    if (!visitDateTime) { toast.error('Please choose date and time'); return; }
    setVisitLoading(true);
    try {
      await visitAPI.create(property.id, new Date(visitDateTime).toISOString(), visitNote);
      toast.success('Visit requested! The landlord will confirm.');
      setVisitOpen(false);
      setVisitNote('');
      setVisitDateTime('');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to request visit');
    } finally {
      setVisitLoading(false);
    }
  };

  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  const submitApplication = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setApplyLoading(true);
      await applicationAPI.apply(property.id, applyMessage);
      toast.success('Application submitted');
      setApplyOpen(false);
      setApplyMessage('');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to apply');
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-dark-500">
        <Loader2 className="animate-spin mr-2" /> Loading property...
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-red-600">{error || 'Property not found'}</div>
    );
  }

  const locationText = [
    property.address,
    property.lga?.name,
    property.state?.name,
  ].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-dark-900 mb-2">{property.title}</h1>
          <div className="flex items-center text-dark-600">
            <MapPin size={18} className="text-primary mr-2" /> {locationText}
          </div>
        </div>

        {/* Gallery + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-4 h-80 md:h-[420px] bg-gray-100 rounded-xl overflow-hidden cursor-pointer" onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}>
                <img src={images[0]} alt={property.title} className="w-full h-full object-cover" />
              </div>
              {images.slice(1, 5).map((src, i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-lg overflow-hidden cursor-pointer" onClick={() => { setLightboxIndex(i + 1); setLightboxOpen(true); }}>
                  <img src={src} alt={`Image ${i + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-600">Rent (yearly)</p>
                  <p className="text-3xl font-bold text-primary">₦{Number(property.rent_amount).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-dark-600">Caution Fee</p>
                  <p className="text-xl font-semibold text-accent">₦{Number(property.caution_fee).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6 text-sm">
                <DetailRow label="Type" value={property.property_type} />
                <DetailRow label="Bedrooms" value={property.bedrooms} />
                <DetailRow label="Bathrooms" value={property.bathrooms} />
                {property.toilets ? <DetailRow label="Toilets" value={property.toilets} /> : null}
                {property.square_feet ? <DetailRow label="Sq Ft" value={property.square_feet} /> : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <button onClick={messageLandlord} className="btn btn-primary w-full inline-flex items-center justify-center" disabled={starting}>
                  <MessageSquare size={18} className="mr-2" /> {starting ? 'Opening...' : 'Message Landlord'}
                </button>
                <button onClick={openVisit} className="btn btn-secondary w-full inline-flex items-center justify-center">
                  <MessageSquare size={18} className="mr-2" /> Schedule Visit
                </button>
                <button onClick={() => setApplyOpen(true)} className="btn btn-accent w-full inline-flex items-center justify-center">
                  Apply to Rent
                </button>
              </div>
            </div>
            {/* Landlord Card */}
            {property.landlord && (
              <div className="card mt-4">
                <h3 className="text-lg font-semibold text-dark-900 mb-2">Listed By</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 text-primary flex items-center justify-center font-semibold">
                    {(property.landlord.first_name || property.landlord.email || 'L').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-dark-900">{property.landlord.full_name || property.landlord.first_name || 'Landlord'}</p>
                    {property.landlord.email && <p className="text-sm text-dark-600">{property.landlord.email}</p>}
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {visitOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl w-[92vw] max-w-md p-5">
            <h3 className="text-lg font-semibold text-dark-900 mb-3">Schedule a Visit</h3>
            <form onSubmit={submitVisit} className="space-y-3">
              <div>
                <label className="label">Preferred Date & Time</label>
                <input type="datetime-local" className="input w-full" value={visitDateTime} onChange={(e) => setVisitDateTime(e.target.value)} required />
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <textarea className="input w-full min-h-[90px]" value={visitNote} onChange={(e) => setVisitNote(e.target.value)} placeholder="Any notes for the landlord (e.g. your availability)" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="btn" onClick={() => setVisitOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={visitLoading}>{visitLoading ? 'Sending...' : 'Request Visit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <h2 className="text-xl font-semibold text-dark-900 mb-4">Description</h2>
            <p className="text-dark-700 leading-relaxed whitespace-pre-line">{property.description}</p>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-dark-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 gap-3">
              <Amenity icon={Car} label="Parking" enabled={property.has_parking} />
              <Amenity icon={Sofa} label="Furnished" enabled={property.is_furnished} />
              <Amenity icon={Droplets} label="Water" enabled={property.has_water} />
              <Amenity icon={Plug} label="Electricity" enabled={property.has_electricity} />
              <Amenity icon={Shield} label="Security" enabled={property.has_security} />
              <Amenity icon={Home} label="Compound" enabled={property.has_compound} />
              <Amenity icon={Home} label="Kitchen" enabled={property.has_kitchen} />
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        <div>
          <h2 className="text-2xl font-display font-bold text-dark-900 mb-4">Similar Properties</h2>
          {similar.length === 0 ? (
            <p className="text-dark-600">No similar properties found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((p) => (
                <div key={p.id} className="card">
                  <div className="h-40 w-full rounded-lg overflow-hidden mb-3">
                    <img src={p.primary_image || '/placeholder-property.jpg'} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-semibold text-dark-900 mb-1">{p.title}</h3>
                  <p className="text-sm text-dark-600 mb-2">{[p.area, p.lga_name, p.state_name].filter(Boolean).join(', ')}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-primary font-semibold">₦{Number(p.rent_amount).toLocaleString()}</p>
                    <button onClick={() => navigate(`/properties/${p.id}`)} className="btn btn-secondary btn-sm">View</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <button className="absolute top-6 right-6 text-white text-2xl" onClick={() => setLightboxOpen(false)}>×</button>
            <button className="absolute left-6 text-white text-3xl" onClick={() => setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)}>&lsaquo;</button>
            <img src={images[lightboxIndex]} alt="Preview" className="max-h-[80vh] max-w-[90vw] object-contain" />
            <button className="absolute right-6 text-white text-3xl" onClick={() => setLightboxIndex((lightboxIndex + 1) % images.length)}>&rsaquo;</button>
          </div>
        )}

        {/* Apply Modal */}
        {applyOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
              <h3 className="text-xl font-semibold text-dark-900 mb-4">Apply to Rent</h3>
              <form onSubmit={submitApplication} className="space-y-3">
                <div>
                  <label className="label">Message (optional)</label>
                  <textarea value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)} className="input min-h-[120px]" placeholder="Tell the landlord about yourself, preferred move-in date, etc." />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setApplyOpen(false)} className="btn">Cancel</button>
                  <button type="submit" disabled={applyLoading} className="btn btn-primary">{applyLoading ? 'Submitting...' : 'Submit Application'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyDetail;
