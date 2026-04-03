import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, Plus, ExternalLink, Pencil } from 'lucide-react';
import { agentAPI } from '../../services/api';

const AgentDashboardProperties = () => {
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['agent-properties'],
    queryFn: () => agentAPI.getProperties().then(r => r.data),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark-900">My Linked Properties</h2>
        <Link to="/agent/add-property" className="btn btn-primary inline-flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Property for Landlord
        </Link>
      </div>

      {isLoading && <div className="text-center py-12 text-dark-500">Loading…</div>}

      {!isLoading && properties.length === 0 && (
        <div className="card text-center py-12">
          <Building2 className="mx-auto text-dark-300 mb-3" size={40} />
          <p className="text-dark-600 font-medium">No properties linked yet</p>
          <p className="text-dark-400 text-sm mt-1">Add a property on behalf of a landlord to get started.</p>
          <Link to="/agent/add-property" className="btn btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> Add First Property
          </Link>
        </div>
      )}

      {!isLoading && properties.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-dark-500">
                <th className="text-left py-3 font-medium">Property</th>
                <th className="text-left py-3 font-medium">Location</th>
                <th className="text-left py-3 font-medium">Landlord</th>
                <th className="text-right py-3 font-medium">Rent</th>
                <th className="text-center py-3 font-medium">Status</th>
                <th className="text-center py-3 font-medium">Agent Fee</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {properties.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <p className="font-medium text-dark-800">{p.title}</p>
                    <p className="text-xs text-dark-400 capitalize">{p.property_type}</p>
                  </td>
                  <td className="py-3 text-dark-600">{p.area}, {p.state_name}</td>
                  <td className="py-3 text-dark-600">{p.landlord_name || '—'}</td>
                  <td className="py-3 text-right font-semibold text-dark-800">
                    ₦{Number(p.rent_amount).toLocaleString()}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.status === 'available' ? 'bg-green-100 text-green-700' :
                      p.status === 'rented' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{p.status}</span>
                  </td>
                  <td className="py-3 text-center">
                    {p.has_agent_fee ? (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                        {p.agent_fee_percent}%
                      </span>
                    ) : (
                      <span className="text-xs text-dark-300">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-3">
                      <Link
                        to={`/agent/edit-property/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs text-dark-600 hover:text-primary hover:underline"
                      >
                        <Pencil size={12} /> Edit
                      </Link>
                      <Link
                        to={`/properties/${p.slug || p.id}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink size={12} /> View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AgentDashboardProperties;
