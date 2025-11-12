import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { staysAPI } from '../../services/api';
import { CalendarClock, Loader2, Trash2, Star, Upload, ArrowLeft, ArrowRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const ListingDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [ci, setCi] = useState('');
  const [co, setCo] = useState('');
  const [quote, setQuote] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const { user } = useAuthStore();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [guest, setGuest] = useState({ name: '', phone: '', note: '' });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await staysAPI.getListing(id);
        setListing(res.data);
      } catch { toast.error('Listing not found'); }
      setLoading(false);
    };
    load();
  }, [id]);

  const getQuote = async () => {
    if (!ci || !co) { toast.error('Select dates'); return; }
    try {
      const res = await staysAPI.quote(id, { check_in: ci, check_out: co });
      setQuote(res.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Dates not available');
    }
  };

  const book = async () => {
    if (!quote) { toast.error('Get quote first'); return; }
    setBookingOpen(true);
  };

  const submitBooking = async () => {
    try {
      const payload = {
        listing_id: Number(id),
        check_in: ci,
        check_out: co,
        guest_full_name: guest.name,
        guest_phone: guest.phone,
        guest_note: guest.note,
      };
      const res = await staysAPI.createBooking(payload);
      setBookingOpen(false);
      const b = res.data?.booking;
      if (listing?.instant_book) {
        try {
          const pay = await staysAPI.initBookingPayment(b.id);
          const url = pay.data?.authorization_url;
          if (url) window.location.href = url;
          else toast.success('Booking created. Pay from your bookings.');
        } catch { toast.success('Booking created. Pay from your bookings.'); }
      } else {
        toast.success('Request sent. Host will approve before payment.');
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to request booking');
    }
  };

  const isOwner = listing && user && listing.owner && listing.owner.id === user.id;

  const reload = async () => {
    try { const res = await staysAPI.getListing(id); setListing(res.data); } catch {}
  };

  const onUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const hadPrimary = !!listing?.primary_image;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fd = new FormData();
        fd.append('image', file);
        if (!hadPrimary && i === 0) fd.append('is_primary', 'true');
        await staysAPI.uploadImage(id, fd, {
          onUploadProgress: (evt) => {
            const pct = Math.round((evt.loaded / (evt.total || 1)) * 100);
            setProgress((p) => ({ ...p, [file.name]: pct }));
          },
        });
      }
      await reload();
      toast.success('Images uploaded');
    } catch {
      toast.error('Upload failed');
    }
    setUploading(false);
    setProgress({});
    e.target.value = '';
  };

  const setPrimary = async (imageId) => {
    try { await staysAPI.setPrimary(id, imageId); await reload(); } catch { toast.error('Failed to set primary'); }
  };

  const removeImage = async (imageId) => {
    try { await staysAPI.deleteImage(id, imageId); await reload(); } catch { toast.error('Failed to delete'); }
  };

  const moveImage = async (imageId, dir) => {
    const imgs = [...(listing?.images || [])];
    const idx = imgs.findIndex(i => i.id === imageId);
    if (idx < 0) return;
    const swapWith = dir === 'left' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= imgs.length) return;
    const tmp = imgs[idx];
    imgs[idx] = imgs[swapWith];
    imgs[swapWith] = tmp;
    const order = imgs.map(i => i.id);
    try { await staysAPI.reorderImages(id, order); await reload(); } catch { toast.error('Reorder failed'); }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center text-dark-600"><Loader2 className="animate-spin mr-2"/> Loading…</div>
      </DashboardShell>
    );
  }

  if (!listing) {
    return (
      <DashboardShell>
        <div className="card">Listing not found</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="card">
        {/* Images Gallery */}
        {(listing?.images?.length > 0 || isOwner) && (
          <div className="mb-4">
            <img
              src={listing?.primary_image || '/placeholder-property.jpg'}
              alt="Primary"
              className="w-full h-64 object-cover rounded-lg border cursor-pointer"
              onClick={() => {
                setLightboxIndex(0);
                setLightboxOpen(true);
              }}
            />
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {(listing?.images || []).map(img => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.image}
                    alt=""
                    className="w-full h-24 object-cover rounded-md border cursor-pointer"
                    onClick={() => {
                      const idx = (listing?.images || []).findIndex(i => i.id === img.id);
                      setLightboxIndex(Math.max(0, idx));
                      setLightboxOpen(true);
                    }}
                  />
                  {isOwner && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      {!img.is_primary && (
                        <button className="btn btn-light btn-sm inline-flex items-center" onClick={() => setPrimary(img.id)}><Star size={14} className="mr-1"/> Primary</button>
                      )}
                      <button className="btn btn-secondary btn-sm inline-flex items-center" onClick={() => removeImage(img.id)}><Trash2 size={14} className="mr-1"/> Delete</button>
                      <button className="btn btn-light btn-sm inline-flex items-center" onClick={() => moveImage(img.id, 'left')}><ArrowLeft size={14} className="mr-1"/> Left</button>
                      <button className="btn btn-light btn-sm inline-flex items-center" onClick={() => moveImage(img.id, 'right')}><ArrowRight size={14} className="mr-1"/> Right</button>
                    </div>
                  )}
                  {img.is_primary && <span className="absolute top-1 left-1 text-xs bg-primary text-white px-1 rounded">Primary</span>}
                </div>
              ))}
            </div>
            {isOwner && (
              <div className="mt-3">
                <label className="btn btn-secondary inline-flex items-center">
                  <Upload size={16} className="mr-2"/> {uploading ? 'Uploading…' : 'Add Images'}
                  <input type="file" multiple accept="image/*" hidden onChange={onUpload} />
                </label>
                {Object.keys(progress).length > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-dark-600">
                    {Object.entries(progress).map(([name, pct]) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="w-40 truncate">{name}</span>
                        <div className="flex-1 h-1 bg-gray-200 rounded">
                          <div className="h-1 bg-primary rounded" style={{ width: `${pct}%` }} />
                        </div>
                        <span>{pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center mb-2"><CalendarClock className="text-primary mr-2"/> <h1 className="text-xl font-semibold">{listing.title}</h1></div>
        <p className="text-dark-700 mb-4" dangerouslySetInnerHTML={{ __html: listing.description }} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="label">Check-in</label>
            <input type="date" className="input" value={ci} onChange={(e) => setCi(e.target.value)} />
          </div>
          <div>
            <label className="label">Check-out</label>
            <input type="date" className="input" value={co} onChange={(e) => setCo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="btn btn-secondary w-full" onClick={getQuote}>Get Quote</button>
          </div>
          <div className="flex items-end">
            <button className="btn btn-primary w-full" onClick={book} disabled={!quote}>Book Now</button>
          </div>
        </div>
        {quote && (
          <div className="mt-4 text-sm text-dark-700">
            <p>Nights: {quote.nights}</p>
            <p>Subtotal: ₦{Number(quote.amount_subtotal).toLocaleString()}</p>
            <p>Cleaning Fee: ₦{Number(quote.cleaning_fee).toLocaleString()}</p>
            <p>Service Fee: ₦{Number(quote.service_fee).toLocaleString()}</p>
            <p className="font-semibold text-dark-900">Total: ₦{Number(quote.amount_total).toLocaleString()}</p>
          </div>
        )}
      </div>

      {bookingOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl w-[92vw] max-w-md p-5">
            <h3 className="text-lg font-semibold text-dark-900 mb-3">Guest Details</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={guest.name} onChange={(e)=>setGuest(g=>({...g, name: e.target.value}))} placeholder="John Doe" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={guest.phone} onChange={(e)=>setGuest(g=>({...g, phone: e.target.value}))} placeholder="08012345678" />
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <textarea className="input min-h-[80px]" value={guest.note} onChange={(e)=>setGuest(g=>({...g, note: e.target.value}))} placeholder="Any special requests or notes"/>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button className="btn" onClick={()=>setBookingOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={submitBooking}>Continue</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox viewer */}
      {lightboxOpen && (listing?.images?.length > 0) && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
          <div className="flex items-center justify-between p-3 text-white">
            <span className="text-sm">{lightboxIndex + 1} / {listing.images.length}</span>
            <button className="p-2" onClick={() => setLightboxOpen(false)} aria-label="Close"><X /></button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4">
            <button className="text-white p-3" onClick={() => setLightboxIndex(i => (i - 1 + listing.images.length) % listing.images.length)} aria-label="Previous"><ArrowLeft /></button>
            <div className="max-w-5xl w-full max-h-[80vh] mx-4">
              <img src={listing.images[lightboxIndex].image} alt="" className="w-full h-full object-contain" />
            </div>
            <button className="text-white p-3" onClick={() => setLightboxIndex(i => (i + 1) % listing.images.length)} aria-label="Next"><ArrowRight /></button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default ListingDetail;
