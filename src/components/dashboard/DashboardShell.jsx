import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import { dashboardAPI } from '../../services/api';
import DashboardSidebar from './DashboardSidebar';
import { LayoutDashboard, Plus, Building2, Upload, Clipboard, Mail, CreditCard, Wrench, Bell, Home } from 'lucide-react';

const DashboardShell = ({ children }) => {
  const { user, fetchUser } = useAuthStore();

  // Refresh user profile to reflect role changes made in admin
  useEffect(() => {
    fetchUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: dashData } = useQuery({
    queryKey: ['dashboard-counts', user?.user_type],
    queryFn: async () => {
      try {
        const res = user?.user_type === 'landlord' ? await dashboardAPI.getLandlord() : await dashboardAPI.getTenant();
        return res.data;
      } catch (e) {
        return {};
      }
    }
  });

  const counts = user?.user_type === 'landlord'
    ? {
        unread_messages: dashData?.unread_messages || 0,
        unread_notifications: dashData?.unread_notifications || 0,
        applications_pending: dashData?.metrics?.applications_pending || 0,
      }
    : {
        unread_messages: dashData?.unread_messages || 0,
        unread_notifications: dashData?.unread_notifications || 0,
        applications_pending: dashData?.applications_counts?.pending || 0,
      };

  const location = useLocation();

  // Mobile navigation items - shown only on mobile/tablet
  const mobileNavItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/applications', icon: Clipboard, label: 'Applications', badge: counts.applications_pending },
    { to: '/messages', icon: Mail, label: 'Messages', badge: counts.unread_messages },
    { to: '/notifications', icon: Bell, label: 'Alerts', badge: counts.unread_notifications },
    { to: '/payments', icon: CreditCard, label: 'Payments' },
    { to: '/maintenance', icon: Wrench, label: 'Repairs' },
    { to: '/properties', icon: Home, label: 'Browse' },
  ];

  // Landlord-specific items
  const landlordItems = user?.user_type === 'landlord' ? [
    { to: '/properties/new', icon: Plus, label: 'Add Property', highlight: true },
    { to: '/my-properties', icon: Building2, label: 'My Properties' },
    { to: '/properties/bulk-import', icon: Upload, label: 'Bulk Import' },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 py-4 lg:py-8">
      {/* Mobile Dashboard Navigation */}
      <div className="lg:hidden mb-4">
        <div className="container-custom">
          {/* Landlord Quick Actions - prominent on mobile */}
          {user?.user_type === 'landlord' && (
            <div className="mb-3">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {landlordItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      item.highlight
                        ? 'bg-primary text-white shadow-md'
                        : location.pathname === item.to
                        ? 'bg-primary-100 text-primary border border-primary-200'
                        : 'bg-white text-dark-700 border border-gray-200 hover:border-primary-200'
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* General Navigation Pills */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {mobileNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all min-w-[64px] relative ${
                    location.pathname === item.to
                      ? 'bg-primary-50 text-primary'
                      : 'text-dark-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <item.icon size={20} />
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="truncate max-w-[56px]">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {children}
          </div>
          <DashboardSidebar counts={counts} />
        </div>
      </div>
    </div>
  );
};

export default DashboardShell;
