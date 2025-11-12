import { useState, useEffect } from 'react';
import { Search, MapPin, SlidersHorizontal, Home as HomeIcon, Grid, List } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { propertyAPI } from '../services/api';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [status, setStatus] = useState('available');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Nigerian cities
  const nigerianCities = [
    'Abuja', 'Aba', 'Abeokuta', 'Akure', 'Benin City', 'Calabar',
    'Enugu', 'Ibadan', 'Ilorin', 'Jos', 'Kaduna', 'Kano',
    'Lagos', 'Maiduguri', 'Onitsha', 'Owerri', 'Port Harcourt',
    'Uyo', 'Warri', 'Zaria'
  ].sort();

  const propertyTypes = [
    'apartment',
    'house',
    'duplex',
    'bungalow',
    'studio',
    'penthouse',
    'mansion'
  ];

  // Fetch properties
  useEffect(() => {
    fetchProperties();
  }, [page, selectedCity, propertyType, minPrice, maxPrice, bedrooms, status]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        search: searchQuery,
        city: selectedCity,
        property_type: propertyType,
        min_price: minPrice,
        max_price: maxPrice,
        bedrooms,
        status,
      };

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await propertyAPI.getAll(params);
      setProperties(response.data.results || response.data);

      // Handle pagination if backend returns it
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 12)); // 12 per page
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      // For demo purposes, set empty array if API fails
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProperties();
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCity('');
    setPropertyType('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setStatus('available');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-display font-bold text-dark-900 mb-2">
                Browse Properties
              </h1>
              <p className="text-dark-600">
                {loading ? 'Loading...' : `${properties.length} properties available`}
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-dark-600 hover:bg-gray-100'}`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'text-dark-600 hover:bg-gray-100'}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center space-x-3 px-4 py-2 border border-gray-200 rounded-lg">
              <Search className="text-dark-400" size={20} />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full outline-none text-dark-800"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <SlidersHorizontal size={20} />
              <span>Filters</span>
            </button>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-xl shadow-sm p-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* City Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    <MapPin size={16} className="inline mr-1" />
                    City
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Cities</option>
                    {nigerianCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    <HomeIcon size={16} className="inline mr-1" />
                    Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Price */}
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    placeholder="₦0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Max Price
                  </label>
                  <input
                    type="number"
                    placeholder="₦10,000,000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Bedrooms
                  </label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="available">Available</option>
                    <option value="rented">Rented</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Reset Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleReset}
                  className="text-primary hover:text-primary-600 font-medium"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-dark-600">Loading properties...</p>
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-dark-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-4 py-2 rounded-lg ${
                      page === i + 1
                        ? 'bg-primary text-white'
                        : 'bg-white border border-gray-300 text-dark-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-dark-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl">
            <HomeIcon className="mx-auto text-dark-300 mb-4" size={64} />
            <h3 className="text-2xl font-semibold text-dark-900 mb-2">No Properties Found</h3>
            <p className="text-dark-600 mb-6">
              Try adjusting your search filters or browse all properties
            </p>
            <button onClick={handleReset} className="btn btn-primary">
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;
