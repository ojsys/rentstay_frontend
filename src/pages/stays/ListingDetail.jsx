import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { staysAPI } from '../../services/api';
import {
  Loader2, Star, MapPin, Users, BedDouble, Bath, Home, DoorOpen, Wifi, Wind,
  ChefHat, Droplets, Tv, Zap, Car, Shield, WashingMachine, Waves, Dumbbell,
  Coffee, PawPrint, ArrowUpDown, ArrowLeft, ArrowRight, X, Upload, Trash2,
  CheckCircle, AlertCircle, Clock, Info, ChevronLeft, Grid3x3, CreditCard,
  Building2, Sofa, SquareStack, Navigation, BadgeCheck, CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const AMENITY_ICONS = {
  'WiFi': Wifi, 'Air conditioning': Wind, 'Kitchen': ChefHat, 'Hot water': Droplets,
  'TV': Tv, 'Generator': Zap, 'Parking': Car, 'Security': Shield,
  'Washing machine': WashingMachine, 'Swimming pool': Waves, 'Gym': Dumbbell,
  'Balcony': Home, 'Breakfast included': Coffee, 'Pet friendly': PawPrint,
  'Elevator': ArrowUpDown,
};

const CANCELLATION_LABELS = {
  flexible: { label: 'Flexible', color: 'text-green-700', bg: 'bg-green-50', desc: 'Full refund up to 24 hours before check-in.' },
  moderate: { label: 'Moderate', color: 'text-amber-700', bg: 'bg-amber-50', desc: 'Full refund up to 5 days before check-in.' },
  strict:   { label: 'Strict',   color: 'text-red-700',   bg: 'bg-red-50',   desc: '50% refund up to 7 days before check-in.' },
};

const TYPE_LABELS = { entire: 'Entire place', private_room: 'Private room', shared_room: 'Shared room' };

const PROP_TYPE_ICONS = { apartment: Building2, house: Home, duplex: SquareStack, flat: SquareStack, room: DoorOpen, self_contain: DoorOpen, bungalow: Home };

const today = () => new Date().toISOString().split('T')[0];

const StarRow = ({ score, size = 14 }) => (
  <span className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <Star key={n} size={size} className={n <= Math.round(score || 0) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'} />
    ))}
  </span>
);

const ScoreBadge = ({ score, count, label = 'reviews', className = '' }) => {
  if (!score) return <span className={`text-xs text-dark-400 ${className}`}>No reviews yet</span>;
  return (
    <span className={`flex items-center gap-1 text-sm ${className}`}>
      <Star size={13} className="fill-yellow-400 text-yellow-400" />
      <span className="font-semibold text-dark-900">{score}</span>
      <span className="text-dark-400">({count} {label})</span>
    </span>
  );
};

const ListingDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null);

  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests') || 1));
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [guestModal, setGuestModal] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ name: '', phone: '', note: '' });

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const [uploading, setUploading] = useState(false);

  const isOwner = listing && user && listing.owner?.id === user.id;

  const load = useCallback(async () => {
    try {
      const res = await staysAPI.getListing(id);
      setListing(res.data);
    } catch { toast.error('Listing not found'); }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (checkIn && checkOut && listing) getQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, guests]);

  const getQuote = async () => {
    if (!checkIn || !checkOut) return;
    setQuoteLoading(true);
    try {
      const res = await staysAPI.quote(id, { check_in: checkIn, check_out: checkOut, guests });
      setQuote(res.data);
    } catch (e) {
      setQuote(null);
      toast.error(e?.response?.data?.detail || 'Dates not available');
    } finally { setQuoteLoading(false); }
  };

  const handleBook = () => {
    if (!user) { toast.error('Please log in to book'); return; }
    if (!quote) { toast.error('Select dates first'); return; }
    setGuestInfo(g => ({ ...g, name: g.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() }));
    setGuestModal(true);
  };

  const submitBooking = async () => {
    if (!guestInfo.name || !guestInfo.phone) { toast.error('Name and phone are required'); return; }
    setBookingLoading(true);
    try {
      const payload = { listing_id: Number(id), check_in: checkIn, check_out: checkOut, guests, guest_full_name: guestInfo.name, guest_phone: guestInfo.phone, guest_note: guestInfo.note };
      const res = await staysAPI.createBooking(payload);
      setGuestModal(false);
      const booking = res.data?.booking;
      if (listing?.instant_book && booking?.id) {
        try {
          const pay = await staysAPI.initBookingPayment(booking.id);
          const url = pay.data?.authorization_url;
          if (url) { window.location.href = url; return; }
        } catch { /* fall through */ }
      }
      toast.success(listing?.instant_book ? 'Booking created! Check your bookings to pay.' : 'Request sent! The host will review and approve shortly.');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to create booking');
    } finally { setBookingLoading(false); }
  };

  const onUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const hadPrimary = !!listing?.primary_image;
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.append('image', files[i]);
      if (!hadPrimary && i === 0) fd.append('is_primary', 'true');
      try { await staysAPI.uploadImage(id, fd); } catch { toast.error(`Failed to upload ${files[i].name}`); }
    }
    await load();
    setUploading(false);
    toast.success('Images uploaded');
    e.target.value = '';
  };

  const removeImage = async (imgId) => {
    try { await staysAPI.deleteImage(id, imgId); await load(); } catch { toast.error('Delete failed'); }
  };

  const setPrimary = async (imgId) => {
    try { await staysAPI.setPrimary(id, imgId); await load(); } catch { toast.error('Failed'); }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl font-semibold text-dark-900 mb-4">Listing not found</p>
        <Link to="/stays" className="btn btn-primary">Browse stays</Link>
      </div>
    </div>
  );

  const images = listing.images || [];
  const policy = CANCELLATION_LABELS[listing.cancellation_policy] || CANCELLATION_LABELS.moderate;
  const nights = (checkIn && checkOut) ? Math.max(0, (new Date(checkOut) - new Date(checkIn)) / 86400000) : 0;
  const loc = listing.location;
  const propDetails = listing.property_details;
  const PropTypeIcon = propDetails ? (PROP_TYPE_ICONS[propDetails.type] || Building2) : Building2;

  const mapsUrl = loc?.latitude && loc?.longitude
    ? `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`
    : loc?.display
      ? `https://www.google.com/maps/search/${encodeURIComponent(loc.display)}`
      : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Back nav */}
      <div className="container-custom pt-4 pb-2">
        <Link to="/stays" className="inline-flex items-center gap-1.5 text-sm text-dark-600 hover:text-dark-900">
          <ChevronLeft size={16} /> Back to stays
        </Link>
      </div>

      {/* Title row */}
      <div className="container-custom pb-4">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-dark-900 mb-1">{listing.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-dark-600">
          {listing.avg_rating
            ? <span className="flex items-center gap-1"><Star size={13} className="fill-yellow-400 text-yellow-400" /> {listing.avg_rating} <span className="text-dark-500">({listing.review_count} review{listing.review_count !== 1 ? 's' : ''})</span></span>
            : <span className="flex items-center gap-1 text-dark-400"><Star size={13} /> New listing</span>
          }
          {loc?.display && (
            <span className="flex items-center gap-1"><MapPin size={13} /> {loc.display}</span>
          )}
          <span className="capitalize px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium">{TYPE_LABELS[listing.listing_type] || listing.listing_type}</span>
          {listing.instant_book && <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"><Zap size={11} /> Instant book</span>}
          {listing.require_guest_verification && <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium"><BadgeCheck size={11} /> Verification required</span>}
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="container-custom mb-8">
        {images.length === 0 && !isOwner ? (
          <div className="aspect-[16/7] bg-gray-100 rounded-2xl flex items-center justify-center text-dark-400">No photos yet</div>
        ) : (
          <div className="relative">
            {images.length >= 2 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-2 h-[320px] md:h-[420px] rounded-2xl overflow-hidden">
                <div className="col-span-2 row-span-2 cursor-pointer" onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}>
                  <img src={images[0]?.image || listing.primary_image} alt="" className="w-full h-full object-cover hover:opacity-95 transition-opacity" />
                </div>
                {images.slice(1, 5).map((img, i) => (
                  <div key={img.id} className="cursor-pointer overflow-hidden" onClick={() => { setGalleryIndex(i + 1); setGalleryOpen(true); }}>
                    <img src={img.image} alt="" className="w-full h-full object-cover hover:opacity-95 transition-opacity" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-[16/7] rounded-2xl overflow-hidden cursor-pointer" onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}>
                <img src={images[0]?.image || listing.primary_image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            {images.length > 0 && (
              <button onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }} className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-dark-800 hover:bg-gray-50 shadow-sm">
                <Grid3x3 size={14} /> Show all photos ({images.length})
              </button>
            )}
            {isOwner && (
              <div className="absolute top-3 left-3">
                <label className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-dark-800 cursor-pointer hover:bg-white shadow-sm">
                  <Upload size={14} /> {uploading ? 'Uploading…' : 'Add photos'}
                  <input type="file" multiple accept="image/*" hidden onChange={onUpload} />
                </label>
              </div>
            )}
          </div>
        )}
        {isOwner && images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {images.map(img => (
              <div key={img.id} className="relative group w-20 h-16 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors">
                <img src={img.image} alt="" className="w-full h-full object-cover" />
                {img.is_primary && <span className="absolute top-0.5 left-0.5 text-[9px] bg-primary text-white px-1 rounded">Primary</span>}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                  {!img.is_primary && <button onClick={() => setPrimary(img.id)} className="text-white text-[10px] font-bold bg-primary/80 px-1.5 py-0.5 rounded hover:bg-primary">★</button>}
                  <button onClick={() => removeImage(img.id)} className="text-white text-[10px] font-bold bg-red-500/80 px-1.5 py-0.5 rounded hover:bg-red-600">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content + Booking widget */}
      <div className="container-custom pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Capacity + property type row */}
            <div className="border-b border-gray-100 pb-6">
              <div className="flex flex-wrap gap-6 text-dark-700">
                <span className="flex items-center gap-2"><Users size={18} className="text-primary" /> <span className="font-medium">{listing.capacity_adults}</span> guest{listing.capacity_adults !== 1 ? 's' : ''}</span>
                <span className="flex items-center gap-2"><BedDouble size={18} className="text-primary" /> <span className="font-medium">{listing.beds}</span> bed{listing.beds !== 1 ? 's' : ''}</span>
                <span className="flex items-center gap-2"><Bath size={18} className="text-primary" /> <span className="font-medium">{listing.bathrooms}</span> bath{listing.bathrooms !== 1 ? 's' : ''}</span>
                {propDetails && (
                  <span className="flex items-center gap-2"><PropTypeIcon size={18} className="text-primary" /> {propDetails.label}</span>
                )}
                {propDetails?.is_furnished && (
                  <span className="flex items-center gap-2"><Sofa size={18} className="text-primary" /> Furnished</span>
                )}
              </div>
            </div>

            {/* Host profile card */}
            <HostCard owner={listing.owner} />

            {/* Location section */}
            {loc?.display && (
              <div className="border-b border-gray-100 pb-6">
                <h2 className="text-xl font-semibold text-dark-900 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-primary" /> Location
                </h2>
                <div className="flex flex-wrap gap-2 text-sm text-dark-700 mb-3">
                  {loc.area && (
                    <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                      <Navigation size={13} className="text-primary" /> {loc.area}
                    </span>
                  )}
                  {loc.lga && (
                    <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                      <MapPin size={13} className="text-dark-400" /> {loc.lga} LGA
                    </span>
                  )}
                  {loc.state && (
                    <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                      <MapPin size={13} className="text-dark-400" /> {loc.state} State
                    </span>
                  )}
                </div>

                {/* Embedded map */}
                {loc.latitude && loc.longitude ? (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 mb-3" style={{ height: '280px' }}>
                    <iframe
                      title="listing-location"
                      className="w-full h-full"
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(loc.longitude)-0.015},${Number(loc.latitude)-0.015},${Number(loc.longitude)+0.015},${Number(loc.latitude)+0.015}&layer=mapnik&marker=${loc.latitude},${loc.longitude}`}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 h-40 flex items-center justify-center mb-3">
                    <div className="text-center text-dark-400">
                      <MapPin size={28} className="mx-auto mb-1 opacity-40" />
                      <p className="text-sm">{loc.display}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-dark-500">Exact address provided after booking confirmation.</p>
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium flex-shrink-0">
                      <Navigation size={14} /> Open in Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="border-b border-gray-100 pb-6">
                <h2 className="text-xl font-semibold text-dark-900 mb-3">About this place</h2>
                <div className="text-dark-700 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: listing.description }} />
              </div>
            )}

            {/* Amenities */}
            {listing.amenities?.length > 0 && (
              <div className="border-b border-gray-100 pb-6">
                <h2 className="text-xl font-semibold text-dark-900 mb-4">What this place offers</h2>
                <div className="grid grid-cols-2 gap-3">
                  {listing.amenities.map(name => {
                    const Icon = AMENITY_ICONS[name] || CheckCircle;
                    return (
                      <div key={name} className="flex items-center gap-3 text-dark-700">
                        <Icon size={18} className="text-dark-500 flex-shrink-0" />
                        <span className="text-sm">{name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* House rules */}
            {listing.house_rules && (
              <div className="border-b border-gray-100 pb-6">
                <h2 className="text-xl font-semibold text-dark-900 mb-3">House rules</h2>
                <div className="text-dark-700 text-sm leading-relaxed whitespace-pre-line">{listing.house_rules}</div>
              </div>
            )}

            {/* Check-in / Check-out */}
            {(listing.check_in_instructions || listing.check_out_instructions) && (
              <div className="border-b border-gray-100 pb-6 space-y-4">
                {listing.check_in_instructions && (
                  <div>
                    <h3 className="font-semibold text-dark-900 mb-2 flex items-center gap-2"><Clock size={15} className="text-primary" /> Check-in</h3>
                    <p className="text-sm text-dark-700 whitespace-pre-line">{listing.check_in_instructions}</p>
                  </div>
                )}
                {listing.check_out_instructions && (
                  <div>
                    <h3 className="font-semibold text-dark-900 mb-2 flex items-center gap-2"><Clock size={15} className="text-primary" /> Check-out</h3>
                    <p className="text-sm text-dark-700 whitespace-pre-line">{listing.check_out_instructions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Cancellation policy */}
            <div className="border-b border-gray-100 pb-6">
              <h2 className="text-xl font-semibold text-dark-900 mb-3">Cancellation policy</h2>
              <div className={`inline-flex items-start gap-3 ${policy.bg} rounded-xl p-4`}>
                <Info size={16} className={`${policy.color} mt-0.5 flex-shrink-0`} />
                <div>
                  <p className={`font-semibold text-sm ${policy.color}`}>{policy.label}</p>
                  <p className="text-sm text-dark-700 mt-0.5">{policy.desc}</p>
                </div>
              </div>
            </div>

            {/* Min/max nights */}
            <div className="text-sm text-dark-600 border-b border-gray-100 pb-6">
              <span className="font-medium">{listing.min_nights}</span> night{listing.min_nights !== 1 ? 's' : ''} min
              {listing.max_nights < 365 && <> · <span className="font-medium">{listing.max_nights}</span> nights max</>}
            </div>

            {/* Guest reviews section */}
            <ReviewsSection listingId={listing.id} avgRating={listing.avg_rating} reviewCount={listing.review_count} />
          </div>

          {/* Right column — Booking widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="border border-gray-200 rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-2xl font-bold text-dark-900">₦{Number(listing.nightly_rate).toLocaleString()}</span>
                  <span className="text-dark-500 text-sm">/ night</span>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                  <div className="grid grid-cols-2">
                    <div className="p-3 border-r border-gray-200">
                      <label className="text-[10px] font-bold text-dark-600 uppercase tracking-wider block mb-1">Check-in</label>
                      <input type="date" value={checkIn} min={today()} onChange={(e) => setCheckIn(e.target.value)} className="text-sm text-dark-800 outline-none w-full bg-transparent" />
                    </div>
                    <div className="p-3">
                      <label className="text-[10px] font-bold text-dark-600 uppercase tracking-wider block mb-1">Check-out</label>
                      <input type="date" value={checkOut} min={checkIn || today()} onChange={(e) => setCheckOut(e.target.value)} className="text-sm text-dark-800 outline-none w-full bg-transparent" />
                    </div>
                  </div>
                  <div className="p-3 border-t border-gray-200">
                    <label className="text-[10px] font-bold text-dark-600 uppercase tracking-wider block mb-1.5">Guests</label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setGuests(g => Math.max(1, g - 1))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-dark-600 hover:border-dark-500 font-bold text-sm">−</button>
                      <span className="text-sm font-medium text-dark-800">{guests} guest{guests !== 1 ? 's' : ''}</span>
                      <button type="button" onClick={() => setGuests(g => Math.min(listing.capacity_adults, g + 1))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-dark-600 hover:border-dark-500 font-bold text-sm">+</button>
                      <span className="text-xs text-dark-400 ml-1">(max {listing.capacity_adults})</span>
                    </div>
                  </div>
                </div>

                {quoteLoading && <div className="flex items-center gap-2 text-sm text-dark-500 mb-3"><Loader2 size={14} className="animate-spin" /> Checking availability…</div>}
                {quote && !quoteLoading && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
                    <div className="flex justify-between text-dark-700">
                      <span>₦{Number(listing.nightly_rate).toLocaleString()} × {quote.nights} night{quote.nights !== 1 ? 's' : ''}</span>
                      <span>₦{Number(quote.amount_subtotal).toLocaleString()}</span>
                    </div>
                    {Number(quote.cleaning_fee) > 0 && <div className="flex justify-between text-dark-700"><span>Cleaning fee</span><span>₦{Number(quote.cleaning_fee).toLocaleString()}</span></div>}
                    {Number(quote.service_fee) > 0 && <div className="flex justify-between text-dark-700"><span>Service fee</span><span>₦{Number(quote.service_fee).toLocaleString()}</span></div>}
                    <div className="flex justify-between font-bold text-dark-900 border-t border-gray-200 pt-2 mt-2"><span>Total</span><span>₦{Number(quote.amount_total).toLocaleString()}</span></div>
                  </div>
                )}

                {!isOwner ? (
                  <button onClick={handleBook} disabled={bookingLoading || !checkIn || !checkOut} className="btn btn-primary w-full py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                    {bookingLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : listing.instant_book ? <span className="flex items-center justify-center gap-2"><Zap size={16} /> Reserve</span> : 'Request to book'}
                  </button>
                ) : (
                  <Link to={`/stays/listings/${id}/edit`} className="btn btn-secondary w-full py-3 text-center font-semibold block">Edit listing</Link>
                )}

                {listing.require_guest_verification && !user?.is_verified && !isOwner && (
                  <p className="mt-3 text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 p-2 rounded-lg">
                    <BadgeCheck size={13} className="flex-shrink-0" /> This host requires verified guests. <Link to="/profile" className="underline font-medium">Get verified</Link>
                  </p>
                )}

                {(!checkIn || !checkOut) ? (
                  <p className="text-center text-xs text-dark-400 mt-3">Add dates to see pricing</p>
                ) : (
                  <p className="text-center text-xs text-dark-400 mt-3">{listing.instant_book ? "You won't be charged yet" : 'Host approval required before payment'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guest detail modal */}
      {guestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-dark-900">Confirm your booking</h3>
              <button onClick={() => setGuestModal(false)} className="text-dark-400 hover:text-dark-700 p-1"><X size={20} /></button>
            </div>
            <div className="p-5 bg-gray-50 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <img src={listing.primary_image || '/placeholder-property.jpg'} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                <div>
                  <p className="font-semibold text-dark-900 text-sm line-clamp-1">{listing.title}</p>
                  <p className="text-xs text-dark-500 mt-0.5">{checkIn} → {checkOut} · {nights} night{nights !== 1 ? 's' : ''} · {guests} guest{guests !== 1 ? 's' : ''}</p>
                  {quote && <p className="text-sm font-bold text-dark-900 mt-1">₦{Number(quote.amount_total).toLocaleString()} total</p>}
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Full name <span className="text-red-500">*</span></label>
                <input className="input" value={guestInfo.name} onChange={(e) => setGuestInfo(g => ({ ...g, name: e.target.value }))} placeholder="Your full name" />
              </div>
              <div>
                <label className="label">Phone number <span className="text-red-500">*</span></label>
                <input className="input" value={guestInfo.phone} onChange={(e) => setGuestInfo(g => ({ ...g, phone: e.target.value }))} placeholder="08012345678" />
              </div>
              <div>
                <label className="label">Note to host <span className="text-dark-400 font-normal text-xs">(optional)</span></label>
                <textarea className="input min-h-[70px] resize-none" value={guestInfo.note} onChange={(e) => setGuestInfo(g => ({ ...g, note: e.target.value }))} placeholder="Special requests, ETA, etc." />
              </div>
              <div className={`flex items-start gap-2 text-xs p-3 rounded-lg ${listing.instant_book ? 'bg-primary/5 text-primary' : 'bg-amber-50 text-amber-700'}`}>
                {listing.instant_book ? <Zap size={13} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />}
                <span>{listing.instant_book ? "This is an instant book — you'll be taken to payment immediately." : "The host will need to approve before you pay."}</span>
              </div>
              <div className="flex gap-3 pt-1">
                <button className="btn flex-1" onClick={() => setGuestModal(false)}>Cancel</button>
                <button className="btn btn-primary flex-1 flex items-center justify-center gap-2" onClick={submitBooking} disabled={bookingLoading}>
                  {bookingLoading ? <Loader2 size={16} className="animate-spin" /> : <><CreditCard size={15} /> {listing.instant_book ? 'Proceed to pay' : 'Send request'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {galleryOpen && images.length > 0 && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium">{galleryIndex + 1} / {images.length}</span>
            <button onClick={() => setGalleryOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition"><X size={22} /></button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 gap-4">
            <button onClick={() => setGalleryIndex(i => (i - 1 + images.length) % images.length)} className="text-white p-3 rounded-full hover:bg-white/10 flex-shrink-0 transition"><ArrowLeft size={24} /></button>
            <img src={images[galleryIndex]?.image} alt="" className="max-h-[80vh] max-w-full object-contain rounded-lg" />
            <button onClick={() => setGalleryIndex(i => (i + 1) % images.length)} className="text-white p-3 rounded-full hover:bg-white/10 flex-shrink-0 transition"><ArrowRight size={24} /></button>
          </div>
          <div className="flex justify-center gap-2 p-4 overflow-x-auto">
            {images.map((img, i) => (
              <button key={img.id} onClick={() => setGalleryIndex(i)} className={`flex-shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-all ${i === galleryIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                <img src={img.image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Host profile card ── */
const HostCard = ({ owner }) => {
  if (!owner) return null;
  const initials = `${owner.first_name?.[0] || ''}${owner.last_name?.[0] || ''}`.toUpperCase() || '?';
  return (
    <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50 border-b border-gray-100 pb-6">
      <h2 className="text-lg font-semibold text-dark-900 mb-4">Your host</h2>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {owner.profile_picture ? (
            <img src={owner.profile_picture} alt={owner.first_name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold shadow-sm">{initials}</div>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-dark-900">{owner.first_name} {owner.last_name?.[0]}.</p>
            {owner.is_verified && (
              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle size={11} /> Verified host
              </span>
            )}
            {owner.verification_tier === 'verified_plus' && (
              <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                <BadgeCheck size={11} /> Verified+
              </span>
            )}
          </div>
          {/* Host score */}
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            {owner.host_score ? (
              <span className="flex items-center gap-1 text-sm">
                <Star size={13} className="fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-dark-900">{owner.host_score}</span>
                <span className="text-dark-400 text-xs">({owner.host_review_count} review{owner.host_review_count !== 1 ? 's' : ''})</span>
              </span>
            ) : (
              <span className="text-xs text-dark-400">No host reviews yet</span>
            )}
            {owner.member_since && (
              <span className="flex items-center gap-1 text-xs text-dark-500">
                <CalendarDays size={11} /> Hosting since {owner.member_since}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Reviews section (guest → host/listing) ── */
const ReviewsSection = ({ listingId, avgRating, reviewCount }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staysAPI.getStayReviews({ listing: listingId })
      .then(r => setReviews(r.data.results || r.data || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [listingId]);

  if (loading) return null;
  if (!reviews.length) return (
    <div className="border-b border-gray-100 pb-6">
      <h2 className="text-xl font-semibold text-dark-900 mb-1">Guest reviews</h2>
      <p className="text-sm text-dark-400 mt-2">No reviews yet for this listing.</p>
    </div>
  );

  return (
    <div className="border-b border-gray-100 pb-6">
      <h2 className="text-xl font-semibold text-dark-900 mb-1 flex items-center gap-2">
        <Star size={18} className="fill-yellow-400 text-yellow-400" />
        {avgRating ? `${avgRating} · ` : ''}{reviewCount} Review{reviewCount !== 1 ? 's' : ''}
      </h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map(r => {
          const reviewer = r.reviewer;
          const initials = `${reviewer?.first_name?.[0] || ''}${reviewer?.last_name?.[0] || ''}`.toUpperCase() || '?';
          return (
            <div key={r.id} className="space-y-1">
              <div className="flex items-center gap-2">
                {reviewer?.profile_picture ? (
                  <img src={reviewer.profile_picture} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">{initials}</div>
                )}
                <div>
                  <p className="text-sm font-semibold text-dark-900">{reviewer?.first_name} {reviewer?.last_name?.[0]}.</p>
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <Star key={n} size={11} className={n <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'} />)}</div>
                </div>
              </div>
              <p className="text-sm text-dark-700 leading-relaxed pl-10">{r.comment}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListingDetail;
