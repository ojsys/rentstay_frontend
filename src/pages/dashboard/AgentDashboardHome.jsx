import { useQuery } from '@tanstack/react-query';
import { Building2, DollarSign, TrendingUp, Wallet, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { agentAPI } from '../../services/api';

const Stat = ({ icon: Icon, label, value, sub, color = 'text-primary' }) => (
  <div className="card flex items-start gap-4">
    <div className={`p-3 rounded-xl bg-gray-100 ${color}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-sm text-dark-500">{label}</p>
      <p className="text-2xl font-bold text-dark-900">{value}</p>
      {sub && <p className="text-xs text-dark-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

const AgentDashboardHome = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['agent-dashboard'],
    queryFn: () => agentAPI.getDashboard().then(r => r.data),
  });

  if (isLoading) return <div className="text-center py-12 text-dark-500">Loading dashboard…</div>;

  const m = data?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Building2} label="Linked Properties" value={m.total_properties ?? 0} color="text-blue-600" />
        <Stat
          icon={Clock}
          label="Pending Commissions"
          value={m.pending_commissions_count ?? 0}
          sub={m.pending_commissions_amount > 0 ? `₦${Number(m.pending_commissions_amount).toLocaleString()} pending` : null}
          color="text-amber-600"
        />
        <Stat
          icon={TrendingUp}
          label="Total Earned"
          value={`₦${Number(m.total_earned || 0).toLocaleString()}`}
          color="text-green-600"
        />
        <Stat
          icon={Wallet}
          label="Available Balance"
          value={`₦${Number(m.available_balance || 0).toLocaleString()}`}
          sub={`${m.commission_rate}% commission rate`}
          color="text-primary"
        />
      </div>

      {/* Recent commissions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-dark-900">Recent Commissions</h2>
          <Link to="/agent/dashboard/commissions" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {(!data?.recent_commissions || data.recent_commissions.length === 0) ? (
          <p className="text-sm text-dark-500 py-4 text-center">No commissions yet. Add properties and start earning!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-dark-500">
                  <th className="text-left py-2 font-medium">Property</th>
                  <th className="text-left py-2 font-medium">Tenant</th>
                  <th className="text-right py-2 font-medium">Commission</th>
                  <th className="text-right py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.recent_commissions.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-2 text-dark-800 font-medium">{c.property_title}</td>
                    <td className="py-2 text-dark-600">{c.tenant_name || c.tenant_email || '—'}</td>
                    <td className="py-2 text-right font-semibold text-green-700">₦{Number(c.amount).toLocaleString()}</td>
                    <td className="py-2 text-right"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent properties */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-dark-900">Recent Properties</h2>
          <Link to="/agent/dashboard/properties" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {(!data?.recent_properties || data.recent_properties.length === 0) ? (
          <p className="text-sm text-dark-500 py-4 text-center">No properties linked yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.recent_properties.map(p => (
              <Link
                key={p.id}
                to={`/properties/${p.slug || p.id}`}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-dark-800 text-sm truncate">{p.title}</p>
                <p className="text-xs text-dark-500 mt-0.5">{p.area}, {p.state_name}</p>
                <p className="text-sm font-semibold text-primary mt-1">₦{Number(p.rent_amount).toLocaleString()}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                  p.status === 'available' ? 'bg-green-100 text-green-700' :
                  p.status === 'rented' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>{p.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboardHome;
