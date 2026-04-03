import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign } from 'lucide-react';
import { agentAPI } from '../../services/api';

const FILTERS = ['all', 'pending', 'paid'];

const StatusBadge = ({ status }) => {
  const map = {
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const AgentDashboardCommissions = () => {
  const [filter, setFilter] = useState('all');

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['agent-commissions', filter],
    queryFn: () => agentAPI.getCommissions(filter !== 'all' ? { status: filter } : {}).then(r => r.data),
  });

  const total = commissions.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-dark-900">Commission History</h2>
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="text-center py-12 text-dark-500">Loading…</div>}

      {!isLoading && commissions.length === 0 && (
        <div className="card text-center py-12">
          <DollarSign className="mx-auto text-dark-300 mb-3" size={40} />
          <p className="text-dark-600 font-medium">No commissions found</p>
          <p className="text-dark-400 text-sm mt-1">
            {filter !== 'all' ? `No ${filter} commissions.` : 'Commissions are earned when a property you linked gets rented.'}
          </p>
        </div>
      )}

      {!isLoading && commissions.length > 0 && (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-dark-500">
                  <th className="text-left py-3 font-medium">Property</th>
                  <th className="text-left py-3 font-medium">Tenant</th>
                  <th className="text-right py-3 font-medium">Rent Amount</th>
                  <th className="text-right py-3 font-medium">My Commission ({commissions[0]?.commission_rate}%)</th>
                  <th className="text-center py-3 font-medium">Status</th>
                  <th className="text-right py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {commissions.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-dark-800">{c.property_title}</td>
                    <td className="py-3 text-dark-600">{c.tenant_name || c.tenant_email || '—'}</td>
                    <td className="py-3 text-right text-dark-700">₦{Number(c.rent_amount).toLocaleString()}</td>
                    <td className="py-3 text-right font-semibold text-green-700">₦{Number(c.amount).toLocaleString()}</td>
                    <td className="py-3 text-center"><StatusBadge status={c.status} /></td>
                    <td className="py-3 text-right text-dark-400 text-xs">
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-gray-50">
                  <td colSpan={3} className="py-3 pl-3 font-semibold text-dark-700">Total ({commissions.length} records)</td>
                  <td className="py-3 text-right font-bold text-green-700 pr-3">₦{total.toLocaleString()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AgentDashboardCommissions;
