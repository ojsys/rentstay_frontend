import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Home as HomeIcon, DollarSign, Shield, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { locationAPI } from '../services/api';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [userLocation, setUserLocation] = useState('Jos'); // Default location display
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  // State and LGA data
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [lgas, setLGAs] = useState([]);
  const [selectedLGA, setSelectedLGA] = useState(null);
  const [loadingStates, setLoadingStates] = useState(true);

  // Load states on component mount
  useEffect(() => {
    const loadStates = async () => {
      try {
        console.log('Loading states from API...');
        const response = await locationAPI.getStates();
        console.log('States response:', response);

        // API now returns array directly (no pagination)
        const statesData = Array.isArray(response.data) ? response.data : (response.data.results || []);
        console.log(`Loaded ${statesData.length} states`);
        setStates(statesData);

        // Set default to Plateau state (Jos)
        const plateauState = statesData.find(s => s.name === 'Plateau');
        console.log('Plateau state:', plateauState);

        if (plateauState) {
          setSelectedState(plateauState);
          // Load LGAs for Plateau
          console.log('Loading LGAs for Plateau, ID:', plateauState.id);
          const lgaResponse = await locationAPI.getLGAs(plateauState.id);
          console.log('LGAs response:', lgaResponse);
          setLGAs(lgaResponse.data);

          // Find Jos North LGA
          const josNorth = lgaResponse.data.find(l => l.name === 'Jos North');
          if (josNorth) {
            setSelectedLGA(josNorth);
            setUserLocation('Jos North');
          }
        }
      } catch (error) {
        console.error('Error loading states:', error);
        console.error('Error details:', error.response?.data);
        console.error('Error status:', error.response?.status);
      } finally {
        setLoadingStates(false);
      }
    };

    loadStates();
  }, []);

  // Detect user's location on component mount
  useEffect(() => {
    const detectLocation = async () => {
      // Priority 1: Check if user is logged in and has a location
      if (isAuthenticated && user?.lga) {
        setUserLocation(user.lga.name);
        setSelectedState(user.state);
        setSelectedLGA(user.lga);
        localStorage.setItem('userLocation', user.lga.name);
        return;
      }

      // Priority 2: Try to get location from browser geolocation
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: true,
              maximumAge: 0
            });
          });

          try {
            const { latitude, longitude } = position.coords;
            const response = await locationAPI.reverseGeocode(latitude, longitude);
            const data = response.data;
            console.log('Geolocation data:', data);
            const detectedLocation = data.city || 'Jos';
            console.log('Detected location:', detectedLocation);
            setUserLocation(detectedLocation);
            localStorage.setItem('userLocation', detectedLocation);
            return;
          } catch (error) {
            console.error('Geocoding error:', error);
          }
        } catch (error) {
          console.log('Geolocation error:', error.message);
          if (error.code === 1) {
            setLocationDenied(true);
            setShowLocationSelector(true);
          }
        }
      }

      // Priority 3: Check localStorage
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        setUserLocation(savedLocation);
        return;
      }

      // Priority 4: Default to Jos
      console.log('Using default location: Jos');
      setShowLocationSelector(true);
    };

    if (!loadingStates) {
      detectLocation();
    }
  }, [isAuthenticated, user, loadingStates]);

  // Handle state selection
  const handleStateChange = async (stateId) => {
    const state = states.find(s => s.id === parseInt(stateId));
    setSelectedState(state);
    setSelectedLGA(null);

    // Load LGAs for selected state
    try {
      const response = await locationAPI.getLGAs(stateId);
      setLGAs(response.data);
    } catch (error) {
      console.error('Error loading LGAs:', error);
    }
  };

  // Handle LGA selection
  const handleLGAChange = (lgaId) => {
    const lga = lgas.find(l => l.id === parseInt(lgaId));
    setSelectedLGA(lga);
    setUserLocation(lga.name);
    localStorage.setItem('userLocation', lga.name);
    localStorage.setItem('userState', selectedState.name);
    setShowLocationSelector(false);
    setLocationDenied(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Navigate to properties with search params
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (location) params.append('city', location);
    window.location.href = `/properties?${params.toString()}`;
  };

  const features = [
    {
      icon: Shield,
      title: 'Verified Listings',
      description: 'All properties are verified and agent-free for your peace of mind'
    },
    {
      icon: DollarSign,
      title: 'Transparent Pricing',
      description: 'No hidden fees. See rent + refundable 10% caution fee upfront'
    },
    {
      icon: TrendingUp,
      title: 'Earn Interest',
      description: 'Your caution fee earns 5% annual interest while you rent'
    },
    {
      icon: HomeIcon,
      title: 'Easy Management',
      description: 'Track rent, maintenance, and communicate with landlords easily'
    }
  ];

  const howItWorks = [
    { step: 1, title: 'Search Properties', description: 'Browse verified listings in Jos with advanced filters' },
    { step: 2, title: 'Contact Landlord', description: 'Message landlords directly through our platform' },
    { step: 3, title: 'Secure Payment', description: 'Pay rent + refundable caution fee securely via Paystack' },
    { step: 4, title: 'Move In', description: 'Sign digital agreement and get your keys!' }
  ];

  const stats = [
    { number: '500+', label: 'Properties Listed' },
    { number: '1,000+', label: 'Happy Tenants' },
    { number: '₦50M+', label: 'Caution Fees Invested' },
    { number: '98%', label: 'Satisfaction Rate' }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 min-h-[85vh] flex items-center">
        {/* Decorative Elements */}
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

            {/* Location Selector */}
            {showLocationSelector && !loadingStates && (
              <div className="mb-6 max-w-2xl mx-auto">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                  {locationDenied ? (
                    <div className="flex items-start space-x-3 mb-3">
                      <MapPin className="text-amber-600 mt-1 flex-shrink-0" size={20} />
                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-1">
                          Location access denied
                        </p>
                        <p className="text-xs text-amber-700">
                          Please select your state and LGA manually
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 mb-3">
                      <MapPin className="text-primary" size={18} />
                      <p className="text-sm font-medium text-dark-700">
                        Select your location
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* State Selector */}
                    <div>
                      <label className="block text-xs font-medium text-dark-600 mb-1">
                        State
                      </label>
                      <select
                        value={selectedState?.id || ''}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      >
                        <option value="">Select State</option>
                        {states.map(state => (
                          <option key={state.id} value={state.id}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* LGA Selector */}
                    <div>
                      <label className="block text-xs font-medium text-dark-600 mb-1">
                        LGA
                      </label>
                      <select
                        value={selectedLGA?.id || ''}
                        onChange={(e) => handleLGAChange(e.target.value)}
                        disabled={!selectedState}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select LGA</option>
                        {lgas.map(lga => (
                          <option key={lga.id} value={lga.id}>
                            {lga.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setShowLocationSelector(false)}
                      className="text-dark-500 hover:text-dark-700 text-sm font-medium"
                    >
                      Close ✕
                    </button>
                  </div>
                </div>
              </div>
            )}

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-dark-900 mb-6 leading-tight">
              Find Your Perfect Home in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{userLocation}</span>
            </h1>

            {/* Change Location Button */}
            <button
              onClick={() => setShowLocationSelector(true)}
              className="inline-flex items-center space-x-2 text-primary hover:text-primary-600 font-medium text-sm mb-6 transition-colors"
            >
              <MapPin size={16} />
              <span>Change location</span>
            </button>
            <p className="text-xl md:text-2xl text-dark-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Discover verified rental properties with transparent pricing and{' '}
              <span className="text-primary font-semibold">earn 5% interest</span> on your caution fee
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-soft p-4 md:p-6 flex flex-col md:flex-row gap-4 max-w-4xl mx-auto border border-gray-100">
              <div className="flex-1 flex items-center space-x-3 px-4 border-r border-gray-200">
                <Search className="text-dark-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by property type, area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full outline-none text-dark-800 placeholder-dark-400"
                />
              </div>
              <div className="flex-1 flex items-center space-x-3 px-4">
                <MapPin className="text-dark-400" size={20} />
                <input
                  type="text"
                  placeholder="Location (e.g., Bukuru, Rayfield)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full outline-none text-dark-800 placeholder-dark-400"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg text-lg px-8 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                <Search size={20} />
                <span>Search Properties</span>
              </button>
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
            <h2 className="text-4xl font-display font-bold text-dark-900 mb-4">
              Why Choose RentStay?
            </h2>
            <p className="text-xl text-dark-600 max-w-2xl mx-auto">
              We're revolutionizing the rental market in Jos with transparency and technology
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
            <h2 className="text-4xl font-display font-bold text-dark-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-dark-600 max-w-2xl mx-auto">
              Finding your perfect home is easier than ever
            </p>
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
            <h2 className="text-4xl font-display font-bold mb-6">
              Your Caution Fee Works For You
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Unlike traditional deposits that sit idle, your 10% caution fee earns 5% annual interest while you rent.
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
                <h3 className="font-semibold text-lg mb-2">Earns 5% Interest</h3>
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
            <h2 className="text-4xl font-display font-bold mb-4">
              Ready to Find Your Home?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Join thousands of satisfied tenants in Jos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/properties" className="btn btn-lg bg-white text-primary hover:bg-gray-100">
                Browse Properties
              </Link>
              <Link to="/register" className="btn btn-lg bg-white/20 hover:bg-white/30 text-white border-2 border-white">
                List Your Property
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
