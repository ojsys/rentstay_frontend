import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Home as HomeIcon, DollarSign, Shield, TrendingUp, CheckCircle, ArrowRight, ChevronDown, BedDouble } from 'lucide-react';

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

const Home = () => {
  const navigate = useNavigate();
  const [where, setWhere] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

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
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 min-h-[85vh] flex items-center">
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
      </section>

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
