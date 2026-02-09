import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { propertyAPI } from '../../services/api';
import { Loader2, Plus, Eye, Edit, Home, Upload } from 'lucide-react';
import { useState } from 'react';

const statusColors = {
  available: 'bg-green-100 text-green-700',
  rented: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  maintenance: 'bg-red-100 text-red-700',
};

const LandlordDashboardProperties = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['my-properties', statusFilter],
    queryFn: () => propertyAPI.getAll({ mine: 1, ordering: '-created_at', status: statusFilter || undefined }).then(res => res.data),
  });

  const properties = data?.results || data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-dark-900">My Properties</h2>
        <div className="flex gap-2">
          <Link to="/properties/bulk-import" className="btn btn-secondary btn-sm inline-flex items-center gap-1"><Upload size={14} /> Bulk Import</Link>
          <Link to="/properties/new" className="btn btn-primary btn-sm inline-flex items-center gap-1"><Plus size={14} /> Add Property</Link>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {['', 'available', 'rented', 'pending', 'maintenance'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>
      ) : properties.length === 0 ? (
        <div className="card text-center py-12">
          <Home size={48} className="mx-auto text-dark-300 mb-3" />
          <p className="text-dark-600">No properties found.</p>
          <Link to="/properties/new" className="btn btn-primary mt-4 inline-flex items-center gap-1"><Plus size={16} /> Add Your First Property</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <div key={p.id} className="card p-0 overflow-hidden">
              {p.primary_image ? (
                <img src={p.primary_image} alt={p.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-dark-300"><Home size={32} /></div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-dark-900 truncate">{p.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize flex-shrink-0 ${statusColors[p.status] || 'bg-gray-100 text-dark-600'}`}>{p.status}</span>
                </div>
                <p className="text-sm text-dark-600 mt-1">{p.area}{p.lga_name ? `, ${p.lga_name}` : ''}{p.state_name ? `, ${p.state_name}` : ''}</p>
                <p className="text-lg font-bold text-primary mt-2">₦{Number(p.rent_amount).toLocaleString()}<span className="text-sm font-normal text-dark-500">/yr</span></p>
                <div className="flex items-center gap-2 mt-1 text-xs text-dark-500">
                  <span>{p.bedrooms} bed</span>
                  <span>{p.bathrooms} bath</span>
                  {p.is_verified && <span className="text-green-600 font-medium">Verified</span>}
                </div>
                <div className="flex gap-2 mt-3">
                  <Link to={`/properties/${p.id}`} className="btn btn-secondary btn-sm flex-1 inline-flex items-center justify-center gap-1"><Eye size={14} /> View</Link>
                  <Link to={`/properties/${p.id}/edit`} className="btn btn-primary btn-sm flex-1 inline-flex items-center justify-center gap-1"><Edit size={14} /> Edit</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LandlordDashboardProperties;
