import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { staysAPI } from '../../services/api';
import StayCard from '../../components/stays/StayCard';
import { Search, MapPin, Calendar, Users, SlidersHorizontal, Zap, Loader2, X } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];
const tomorrow = () => {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const StaysExplore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const filtersRef = useRef(null);

  const [where, setWhere] = useState(searchParams.get('city') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests') || 1));
  const [type, setType] = useState(searchParams.get('type') || '');
  const [maxRate, setMaxRate] = useState(searchParams.get('max_rate') || '');
  const [instantOnly, setInstantOnly] = useState(false);

  const load = async (params) => {
    try {
      setLoading(true);
      const res = await staysAPI.listListings(params);
      setItems(res.data.results || res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ city: where, type, max_rate: maxRate || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    const params = {};
    if (where) params.city = where;
    if (type) params.type = type;
    if (maxRate) params.max_rate = maxRate;
    setSearchParams(params);
    load(params);
  };

  const clearFilters = () => {
    setWhere(''); setType(''); setMaxRate(''); setGuests(1); setInstantOnly(false); setCheckIn(''); setCheckOut('');
    setSearchParams({});
    load({});
  };

  const filteredItems = instantOnly ? items.filter(i => i.instant_book) : items;
  const hasFilters = where || type || maxRate || instantOnly || checkIn || checkOut || guests > 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="container-custom py-4">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center bg-white rounded-2xl border border-gray-200 shadow-soft overflow-hidden">
              {/* Where */}
              <div className="flex-1 flex items-center gap-2 px-4 py-3 border-b md:border-b-0 md:border-r border-gray-100">
                <MapPin size={16} className="text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-dark-500 uppercase tracking-wider">Where</p>
                  <input
                    type="text"
                    placeholder="City, area, neighbourhood…"
                    value={where}
                    onChange={(e) => setWhere(e.target.value)}
                    className="w-full outline-none text-dark-800 text-sm bg-transparent placeholder-dark-400"
                  />
                </div>
              </div>

              {/* Check-in */}
              <div className="flex items-center gap-2 px-4 py-3 border-b md:border-b-0 md:border-r border-gray-100">
                <Calendar size={16} className="text-dark-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-dark-500 uppercase tracking-wider">Check in</p>
                  <input
                    type="date"
                    value={checkIn}
                    min={today()}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="outline-none text-dark-800 text-sm bg-transparent cursor-pointer"
                  />
                </div>
              </div>

              {/* Check-out */}
              <div className="flex items-center gap-2 px-4 py-3 border-b md:border-b-0 md:border-r border-gray-100">
                <Calendar size={16} className="text-dark-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-dark-500 uppercase tracking-wider">Check out</p>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || tomorrow()}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="outline-none text-dark-800 text-sm bg-transparent cursor-pointer"
                  />
                </div>
              </div>

              {/* Guests */}
              <div className="flex items-center gap-3 px-4 py-3 border-b md:border-b-0 md:border-r border-gray-100">
                <Users size={16} className="text-dark-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-dark-500 uppercase tracking-wider">Guests</p>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setGuests(g => Math.max(1, g - 1))} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-dark-600 hover:border-dark-400 text-sm font-bold">−</button>
                    <span className="text-sm font-medium text-dark-800 w-4 text-center">{guests}</span>
                    <button type="button" onClick={() => setGuests(g => Math.min(20, g + 1))} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-dark-600 hover:border-dark-400 text-sm font-bold">+</button>
                  </div>
                </div>
              </div>

              {/* Search button */}
              <div className="px-3 py-2">
                <button type="submit" className="bg-primary hover:bg-primary-600 text-white rounded-xl px-5 py-3 flex items-center gap-2 font-semibold text-sm transition-all hover:shadow-md w-full md:w-auto justify-center">
                  <Search size={16} />
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Filter bar */}
        <div className="container-custom pb-3 flex items-center gap-3 overflow-x-auto">
          {/* Type pills */}
          {[['', 'All'], ['entire', 'Entire place'], ['private_room', 'Private room'], ['shared_room', 'Shared room']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => { setType(v); handleSearch(); }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${type === v ? 'bg-dark-900 text-white border-dark-900' : 'bg-white text-dark-700 border-gray-200 hover:border-dark-400'}`}
            >
              {l}
            </button>
          ))}

          <div className="h-5 w-px bg-gray-200 flex-shrink-0" />

          {/* Instant book */}
          <button
            onClick={() => setInstantOnly(v => !v)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${instantOnly ? 'bg-dark-900 text-white border-dark-900' : 'bg-white text-dark-700 border-gray-200 hover:border-dark-400'}`}
          >
            <Zap size={13} /> Instant book
          </button>

          {/* Price filter */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${showFilters ? 'bg-dark-900 text-white border-dark-900' : 'bg-white text-dark-700 border-gray-200 hover:border-dark-400'}`}
            >
              <SlidersHorizontal size={13} /> Filters
            </button>
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="flex-shrink-0 flex items-center gap-1 text-sm text-dark-500 hover:text-dark-800 underline ml-1">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div ref={filtersRef} className="container-custom pb-4">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="label">Max nightly rate (₦)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 50000"
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value)}
                  className="input w-40"
                />
              </div>
              <button className="btn btn-primary" onClick={handleSearch}>Apply</button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="container-custom py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-dark-500">
            <Loader2 className="animate-spin mr-2" size={20} /> Loading stays…
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-xl font-semibold text-dark-900 mb-2">No listings found</p>
            <p className="text-dark-500">Try adjusting your search or filters.</p>
            {hasFilters && <button onClick={clearFilters} className="btn btn-primary mt-4">Clear filters</button>}
          </div>
        ) : (
          <>
            <p className="text-sm text-dark-600 mb-6">{filteredItems.length} stay{filteredItems.length !== 1 ? 's' : ''} available</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map(listing => (
                <StayCard key={listing.id} listing={listing} checkIn={checkIn} checkOut={checkOut} guests={guests} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StaysExplore;
