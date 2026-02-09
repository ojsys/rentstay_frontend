import { NavLink, useLocation } from 'react-router-dom';
import { Home, Building2, FileText, CreditCard, Wrench, Mail, BarChart3 } from 'lucide-react';

const tabs = [
  { to: '/dashboard/home', icon: Home, label: 'Home' },
  { to: '/dashboard/properties', icon: Building2, label: 'Properties' },
  { to: '/dashboard/leases', icon: FileText, label: 'Leases' },
  { to: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
  { to: '/dashboard/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/dashboard/messages', icon: Mail, label: 'Messages' },
  { to: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
];

const DashboardTabNav = ({ badges = {} }) => {
  const location = useLocation();

  return (
    <nav className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
      {/* Desktop tabs */}
      <div className="hidden md:flex gap-1 p-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to || location.pathname.startsWith(tab.to + '/');
          const badge = badges[tab.label.toLowerCase()];
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap relative ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-dark-600 hover:bg-gray-50 hover:text-dark-900'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {typeof badge === 'number' && badge > 0 && (
                <span className={`ml-1 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                }`}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Mobile scrollable tabs */}
      <div className="md:hidden flex gap-1 p-1.5 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to || location.pathname.startsWith(tab.to + '/');
          const badge = badges[tab.label.toLowerCase()];
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all min-w-[56px] relative ${
                isActive
                  ? 'bg-primary-50 text-primary'
                  : 'text-dark-600 hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <tab.icon size={20} />
                {typeof badge === 'number' && badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[52px]">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default DashboardTabNav;
