import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { Home, Building2, DollarSign, Wallet, Plus } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const TABS = [
  { to: '/agent/dashboard/home', icon: Home, label: 'Home' },
  { to: '/agent/dashboard/properties', icon: Building2, label: 'Properties' },
  { to: '/agent/dashboard/commissions', icon: DollarSign, label: 'Commissions' },
  { to: '/agent/dashboard/payouts', icon: Wallet, label: 'Payouts' },
];

const AgentDashboardLayout = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.user_type !== 'agent') return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container-custom py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-dark-900">Agent Dashboard</h1>
            <p className="text-sm text-dark-500">Welcome back, {user?.first_name}</p>
          </div>
          <NavLink
            to="/agent/add-property"
            className="btn btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Add Property
          </NavLink>
        </div>
        {/* Tab nav */}
        <div className="container-custom">
          <nav className="flex gap-1 overflow-x-auto pb-px">
            {TABS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-dark-500 hover:text-dark-800'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Page content */}
      <div className="container-custom py-6">
        <Outlet />
      </div>
    </div>
  );
};

export default AgentDashboardLayout;
