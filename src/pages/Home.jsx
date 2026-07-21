import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Home as HomeIcon, DollarSign, Shield, TrendingUp, CheckCircle, ArrowRight, ChevronDown, BedDouble, Sparkles, Calendar, Users } from 'lucide-react';
import { staysAPI } from '../services/api';
import StayCard from '../components/stays/StayCard';

const HERO_ROTATE_MS = 10000; // each hero slide is shown for ~10s before auto-advancing
const todayStr = () => new Date().toISOString().split('T')[0];
const tomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const PROPERTY_TYPES = [
  { value: '', label: 'Any Type' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'room', label: 'Room' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'bungalow', label: 'Bungalow' },
];

const BEDROOMS = [
  { value: '', label: 'Any Beds' },
  { value: '1', label: '1 Bed' },
  { value: '2', label: '2 Beds' },
  { value: '3', label: '3 Beds' },
  { value: '4', label: '4+ Beds' },
];

const PRICE_RANGES = [
  { value: '', label: 'Any Price' },
  { value: '100000', label: 'Under ₦100k' },
  { value: '300000', label: 'Under ₦300k' },
  { value: '500000', label: 'Under ₦500k' },
  { value: '1000000', label: 'Under ₦1M' },
];

// Hero slides: Stays (0) is the default so short-stays get first impression.
const STAY_SLIDE = 0;
const RENT_SLIDE = 1;

const Home = () => {
  const navigate = useNavigate();
  const [where, setWhere] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Hero slider
  const [heroSlide, setHeroSlide] = useState(STAY_SLIDE);
  const [stayWhere, setStayWhere] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  // Auto-advance between the two heroes every ~10s. Re-keying on heroSlide means
  // a manual switch also resets the 10s timer.
  useEffect(() => {
    const t = setTimeout(
      () => setHeroSlide((s) => (s === STAY_SLIDE ? RENT_SLIDE : STAY_SLIDE)),
      HERO_ROTATE_MS,
    );
    return () => clearTimeout(t);
  }, [heroSlide]);

  const handleStaySearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (stayWhere) params.append('city', stayWhere);
    if (checkIn) params.append('check_in', checkIn);
    if (checkOut) params.append('check_out', checkOut);
    if (guests > 1) params.append('guests', guests);
    navigate(`/stays${params.toString() ? `?${params.toString()}` : ''}`);
  };

  // Featured short-stay listings for the homepage (up to 10)
  const { data: featuredStays = [], isLoading: staysLoading } = useQuery({
    queryKey: ['home-featured-stays'],
    queryFn: async () => {
      const res = await staysAPI.listListings({ page_size: 10 });
      const results = res.data.results || res.data || [];
      return results.slice(0, 10);
    },
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (where) params.append('search', where);
    if (propertyType) params.append('property_type', propertyType);
    if (bedrooms) params.append('bedrooms', bedrooms);
    if (maxPrice) params.append('max_price', maxPrice);
    navigate(`/properties?${params.toString()}`);
  };

  const features = [
    { icon: Shield, title: 'Verified Listings', description: 'All properties are verified and agent-free for your peace of mind' },
    { icon: DollarSign, title: 'Transparent Pricing', description: 'No hidden fees. See rent + refundable 10% caution fee upfront' },
    { icon: TrendingUp, title: 'Earn Cashback', description: 'Your caution fee earns 5% annual cashback while you rent' },
    { icon: HomeIcon, title: 'Easy Management', description: 'Track rent, maintenance, and communicate with landlords easily' },
  ];

  const howItWorks = [
    { step: 1, title: 'Search Properties', description: 'Browse verified listings in your location with advanced filters' },
    { step: 2, title: 'Contact Landlord', description: 'Message landlords directly through our platform' },
    { step: 3, title: 'Secure Payment', description: 'Pay rent + refundable caution fee securely via Paystack' },
    { step: 4, title: 'Move In', description: 'Sign digital agreement and get your keys!' },
  ];

  const stats = [
    { number: '5+', label: 'Properties Listed' },
    { number: '10+', label: 'Happy Tenants' },
    { number: '₦0M+', label: 'Caution Fees Invested' },
    { number: '98%', label: 'Satisfaction Rate' },
  ];

  return (
    <div>
      {/* Hero Slider — Stays (default) and Long-term Rentals */}
      <section className="relative overflow-hidden">
        {/* Slide switcher — makes the Stays vs Rent distinction explicit */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-md">
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md rounded-full p-1 shadow-soft border border-white/60">
            <button
              type="button"
              onClick={() => setHeroSlide(STAY_SLIDE)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                heroSlide === STAY_SLIDE ? 'bg-accent text-white shadow-sm' : 'text-dark-600 hover:text-dark-900'
              }`}
            >
              <Sparkles size={15} /> Short Stays
            </button>
            <button
              type="button"
              onClick={() => setHeroSlide(RENT_SLIDE)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                heroSlide === RENT_SLIDE ? 'bg-primary text-white shadow-sm' : 'text-dark-600 hover:text-dark-900'
              }`}
            >
              <HomeIcon size={15} /> Long-term Rentals
            </button>
          </div>
        </div>

        <div key={heroSlide} className="animate-hero-fade">
          {heroSlide === STAY_SLIDE ? (
            /* ─── STAYS HERO ─── */
            <div className="relative bg-gradient-to-br from-accent-50 via-white to-primary-50 min-h-[85vh] flex items-center">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-24 right-12 w-72 h-72 bg-accent-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
                <div className="absolute bottom-8 left-12 w-72 h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
              </div>

              <div className="container-custom relative z-10 py-24">
                <div className="max-w-5xl mx-auto text-center">
                  {/* Badge */}
                  <div className="flex items-center justify-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-700 rounded-full px-4 py-2 shadow-sm">
                      <Sparkles size={16} className="text-accent" />
                      <span className="text-sm font-semibold">Short-term stays · Book by the night</span>
                    </div>
                  </div>

                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-dark-900 mb-6 leading-tight">
                    Book a{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Short Stay</span>
                  </h1>

                  <p className="text-xl md:text-2xl text-dark-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                    Verified homes for travel, relocation & getaways —{' '}
                    <span className="text-accent font-semibold">stay by the night</span>, feel at home
                  </p>

                  {/* Stays search bar */}
                  <form onSubmit={handleStaySearch} className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row">
                      {/* Where */}
                      <div className="flex-1 flex items-center gap-3 px-5 py-4 border-b md:border-b-0 md:border-r border-gray-100">
                        <MapPin size={18} className="text-accent flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <p className="text-[10px] font-semibold text-dark-500 uppercase tracking-wider mb-0.5">Where</p>
                          <input
                            type="text"
                            placeholder="City, area, neighbourhood..."
                            value={stayWhere}
                            onChange={(e) => setStayWhere(e.target.value)}
                            className="w-full outline-none text-dark-800 text-sm placeholder-dark-400 bg-transparent"
                          />
                        </div>
                      </div>

                      {/* Check in */}
                      <div className="flex items-center gap-3 px-5 py-4 border-b md:border-b-0 md:border-r border-gray-100 text-left">
                        <Calendar size={16} className="text-dark-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-dark-500 uppercase tracking-wider mb-0.5">Check in</p>
                          <input
                            type="date"
                            value={checkIn}
                            min={todayStr()}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className="outline-none text-dark-800 text-sm bg-transparent cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Check out */}
                      <div className="flex items-center gap-3 px-5 py-4 border-b md:border-b-0 md:border-r border-gray-100 text-left">
                        <Calendar size={16} className="text-dark-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-dark-500 uppercase tracking-wider mb-0.5">Check out</p>
                          <input
                            type="date"
                            value={checkOut}
                            min={checkIn || tomorrowStr()}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className="outline-none text-dark-800 text-sm bg-transparent cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Guests */}
                      <div className="flex items-center gap-3 px-5 py-4 border-b md:border-b-0 md:border-r border-gray-100 text-left">
                        <Users size={16} className="text-dark-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-dark-500 uppercase tracking-wider mb-0.5">Guests</p>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-dark-600 hover:border-dark-400 text-sm font-bold">−</button>
                            <span className="text-sm font-medium text-dark-800 w-4 text-center">{guests}</span>
                            <button type="button" onClick={() => setGuests((g) => Math.min(20, g + 1))} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-dark-600 hover:border-dark-400 text-sm font-bold">+</button>
                          </div>
                        </div>
                      </div>

                      {/* Search Button */}
                      <div className="flex items-center justify-center p-3">
                        <button
                          type="submit"
                          className="w-full md:w-auto bg-accent hover:bg-accent-600 text-white rounded-xl px-6 py-3.5 flex items-center justify-center gap-2 font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        >
                          <Search size={18} />
                          <span>Search</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Trust points */}
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-dark-600">
                    <span className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-accent" /> Verified hosts</span>
                    <span className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-accent" /> Instant book available</span>
                    <span className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-accent" /> Secure payments</span>
                  </div>

                  <div className="mt-8">
                    <Link to="/stays" className="inline-flex items-center gap-2 font-semibold text-accent hover:text-accent-600 transition-colors">
                      Explore all stays <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ─── LONG-TERM RENTAL HERO (original design) ─── */
            <div className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 min-h-[85vh] flex items-center">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-accent-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
              </div>

              <div className="container-custom relative z-10 py-20">
                <div className="max-w-5xl mx-auto text-center">
                  {/* Badge */}
                  <div className="flex items-center justify-center mb-8">
                    <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-sm font-medium text-dark-700">Over 500+ properties available</span>
                    </div>
                  </div>

                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-dark-900 mb-6 leading-tight">
                    Find Your{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Perfect Home</span>
                  </h1>

                  <p className="text-xl md:text-2xl text-dark-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                    Discover verified rental properties with transparent pricing and{' '}
                    <span className="text-primary font-semibold">earn 5% cashback</span> on your caution fee
                  </p>

                  {/* Airbnb-style Search Bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden max-w-4xl mx-auto">
              {/* Main row */}
              <div className="flex flex-col md:flex-row">
                {/* Where */}
                <div className="flex-1 flex items-center gap-3 px-5 py-4 border-b md:border-b-0 md:border-r border-gray-100">
                  <MapPin size={18} className="text-primary flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <p className="text-[10px] font-semibold text-dark-500 uppercase tracking-wider mb-0.5">Where</p>
                    <input
                      type="text"
                      placeholder="Search city, area, neighbourhood..."
                      value={where}
                      onChange={(e) => setWhere(e.target.value)}
                      className="w-full outline-none text-dark-800 text-sm placeholder-dark-400 bg-transparent"
                    />
                  </div>
                </div>

                {/* Property Type */}
                <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100">
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-semibold text-dark-500 uppercase tracking-wider mb-0.5">Property Type</p>
                    <div className="relative flex items-center">
                      <HomeIcon size={14} className="text-dark-400 mr-2 flex-shrink-0" />
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="appearance-none w-full outline-none bg-transparent text-dark-800 text-sm cursor-pointer pr-5"
                      >
                        {PROPERTY_TYPES.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-0 text-dark-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Bedrooms */}
                <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100">
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-semibold text-dark-500 uppercase tracking-wider mb-0.5">Bedrooms</p>
                    <div className="relative flex items-center">
                      <BedDouble size={14} className="text-dark-400 mr-2 flex-shrink-0" />
                      <select
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        className="appearance-none w-full outline-none bg-transparent text-dark-800 text-sm cursor-pointer pr-5"
                      >
                        {BEDROOMS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-0 text-dark-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Max Price */}
                <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100">
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-semibold text-dark-500 uppercase tracking-wider mb-0.5">Max Price</p>
                    <div className="relative flex items-center">
                      <DollarSign size={14} className="text-dark-400 mr-2 flex-shrink-0" />
                      <select
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="appearance-none w-full outline-none bg-transparent text-dark-800 text-sm cursor-pointer pr-5"
                      >
                        {PRICE_RANGES.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-0 text-dark-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex items-center justify-center p-3">
                  <button
                    type="submit"
                    className="w-full md:w-auto bg-primary hover:bg-primary-600 text-white rounded-xl px-6 py-3.5 flex items-center justify-center gap-2 font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    <Search size={18} />
                    <span>Search</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-6 hover:bg-white/80 transition-all">
                  <p className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{stat.number}</p>
                  <p className="text-sm md:text-base text-dark-600 mt-2 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {[STAY_SLIDE, RENT_SLIDE].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setHeroSlide(i)}
              aria-label={i === STAY_SLIDE ? 'Show short stays' : 'Show long-term rentals'}
              className={`h-2 rounded-full transition-all ${
                heroSlide === i
                  ? `w-8 ${i === STAY_SLIDE ? 'bg-accent' : 'bg-primary'}`
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Featured Short Stays */}
      {(staysLoading || featuredStays.length > 0) && (
        <section className="py-20 bg-gray-50">
          <div className="container-custom">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-accent-50 text-accent-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  <Sparkles size={13} /> Short-term stays
                </div>
                <h2 className="text-4xl font-display font-bold text-dark-900 mb-2">Book a Short Stay</h2>
                <p className="text-lg text-dark-600 max-w-2xl">
                  Verified short-term homes for travel, relocation & getaways — book by the night.
                </p>
              </div>
              <Link
                to="/stays"
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary-600 transition-colors flex-shrink-0"
              >
                View all stays <ArrowRight size={18} />
              </Link>
            </div>

            {staysLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/3] rounded-2xl bg-gray-100 mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredStays.map((listing) => (
                  <StayCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold text-dark-900 mb-4">Why Choose RentStay?</h2>
            <p className="text-xl text-dark-600 max-w-2xl mx-auto">
              We're revolutionizing the property rental market with transparency and technology
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="text-primary" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-dark-900 mb-2">{feature.title}</h3>
                <p className="text-dark-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold text-dark-900 mb-4">How It Works</h2>
            <p className="text-xl text-dark-600 max-w-2xl mx-auto">Finding your perfect home is easier than ever</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="card">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-dark-900 mb-2">{item.title}</h3>
                  <p className="text-dark-600">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-primary" size={24} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Caution Fee Benefit */}
      <section className="py-20 bg-primary text-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-display font-bold mb-6">Your Caution Fee Works For You</h2>
            <p className="text-xl mb-8 text-primary-100">
              Unlike traditional deposits that sit idle, your 10% caution fee earns 5% annual cashback while you rent.
              It's fully refundable when you move out!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <CheckCircle className="mx-auto mb-4" size={48} />
                <h3 className="font-semibold text-lg mb-2">Fully Refundable</h3>
                <p className="text-primary-100">Get your full caution fee back at lease end</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <TrendingUp className="mx-auto mb-4" size={48} />
                <h3 className="font-semibold text-lg mb-2">Earns 5% Cashback</h3>
                <p className="text-primary-100">Your deposit grows while you live comfortably</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <Shield className="mx-auto mb-4" size={48} />
                <h3 className="font-semibold text-lg mb-2">Secure & Transparent</h3>
                <p className="text-primary-100">Managed safely with full tracking</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-12 text-center text-white">
            <h2 className="text-4xl font-display font-bold mb-4">Ready to Find Your Home?</h2>
            <p className="text-xl mb-8 text-white/90">Join thousands of tenants looking for the right place to call home.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/properties" className="btn btn-lg bg-white text-primary hover:bg-gray-100">Browse Properties</Link>
              <Link to="/register" className="btn btn-lg bg-white/20 hover:bg-white/30 text-white border-2 border-white">List Your Property</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
