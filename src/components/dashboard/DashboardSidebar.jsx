import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mail, Bell, Clipboard, Wrench, CreditCard, User, Home, Building2, Plus } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const NavItem = ({ to, icon: Icon, label, active, badge }) => (
  <Link
    to={to}
    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
      active ? 'bg-primary-50 text-primary' : 'text-dark-700 hover:bg-gray-50'
    }`}
  >
    <span className="inline-flex items-center gap-2">
      <Icon size={16} />
      <span className="text-sm font-medium">{label}</span>
    </span>
    {typeof badge === 'number' && badge > 0 && (
      <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full min-w-[20px] text-center">{badge}</span>
    )}
  </Link>
);

const DashboardSidebar = ({ counts = {} }) => {
  const location = useLocation();
  const { unread_messages = 0, unread_notifications = 0, applications_pending = 0 } = counts;
  const { user } = useAuthStore();

  const items = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/applications', icon: Clipboard, label: 'Applications', badge: applications_pending },
    { to: '/messages', icon: Mail, label: 'Messages', badge: unread_messages },
    { to: '/notifications', icon: Bell, label: 'Notifications', badge: unread_notifications },
    { to: '/payments', icon: CreditCard, label: 'Payments' },
    { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
    { to: '/profile/view', icon: User, label: 'Profile' },
    { to: '/properties', icon: Home, label: 'Browse Properties' },
  ];

  if (user?.user_type === 'landlord') {
    items.splice(1, 0, { to: '/properties/new', icon: Plus, label: 'Add Property' });
    items.splice(2, 0, { to: '/my-properties', icon: Building2, label: 'My Properties' });
    items.splice(3, 0, { to: '/properties/bulk-import', icon: Plus, label: 'Bulk Import' });
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-6 w-72">
        <div className="bg-white rounded-xl shadow-card p-4 border border-gray-100">
          <h3 className="text-sm font-semibold text-dark-900 mb-3">Dashboard Menu</h3>
          <nav className="space-y-2">
            {items.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.to}
                badge={item.badge}
              />
            ))}
          </nav>
          <div className="mt-4 border-t pt-4 text-xs text-dark-500">
            Tip: Use the menu to navigate your dashboard tools quickly.
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
