import { useEffect, useState } from 'react';
import { staysAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const StaysExplore = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', type: '', max_rate: '' });

  const load = async () => {
    try {
      setLoading(true);
      const res = await staysAPI.listListings(filters);
      setItems(res.data.results || res.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const onSubmit = (e) => { e.preventDefault(); load(); };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark-900">Explore Stays</h1>
          <p className="text-dark-600">Short-term rentals listed by hosts</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="input" placeholder="City" value={filters.city} onChange={(e) => setFilters(f => ({ ...f, city: e.target.value }))} />
          <select className="input" value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="">Any type</option>
            <option value="entire">Entire place</option>
            <option value="private_room">Private room</option>
            <option value="shared_room">Shared room</option>
          </select>
          <input className="input" type="number" min="0" placeholder="Max nightly rate (₦)" value={filters.max_rate} onChange={(e) => setFilters(f => ({ ...f, max_rate: e.target.value }))} />
          <button className="btn btn-primary">Search</button>
        </form>

        {loading ? (
          <div className="text-center text-dark-600">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-center bg-white rounded-xl p-6">No listings found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(l => (
              <div key={l.id} className="card p-0 overflow-hidden">
                <div className="w-full h-44 bg-gray-100">
                  <img
                    src={l.primary_image || '/placeholder-property.jpg'}
                    alt={l.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-dark-900 mb-1 line-clamp-1">{l.title}</h3>
                  <p className="text-sm text-dark-600 mb-2">
                    {l.listing_type?.replace('_', ' ')} • ₦{Number(l.nightly_rate).toLocaleString()} / night
                  </p>
                  <p className="text-sm text-dark-700 line-clamp-3" dangerouslySetInnerHTML={{ __html: l.description }} />
                  <Link to={`/stays/listings/${l.id}`} className="btn btn-primary w-full mt-3">View</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaysExplore;
