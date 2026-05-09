import { Outlet, Navigate, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import DashboardTabNav from '../../components/dashboard/DashboardTabNav';
import MobileBottomNav from '../../components/dashboard/MobileBottomNav';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { dashboardAPI } from '../../services/api';
import {
  Plus, Home, Building2, Users, CreditCard, Wrench,
  Mail, Calendar, Bed, BarChart3, Bell, Menu, X,
  LogOut, User as UserIcon, Settings,
} from 'lucide-react';

const PRIMARY_TABS = [
  { to: '/dashboard/home', icon: Home, label: 'Dashboard', badgeKey: null },
  { to: '/dashboard/properties', icon: Building2, label: 'Properties', badgeKey: null },
  { to: '/dashboard/leases', icon: Users, label: 'Tenants', badgeKey: 'leases' },
];

const MORE_TABS = [
  { to: '/dashboard/payments', icon: CreditCard, label: 'Payments', badgeKey: null },
  { to: '/dashboard/maintenance', icon: Wrench, label: 'Maintenance', badgeKey: 'maintenance' },
  { to: '/dashboard/messages', icon: Mail, label: 'Messages', badgeKey: 'messages' },
  { to: '/dashboard/visits', icon: Calendar, label: 'Visits', badgeKey: null },
  { to: '/dashboard/stays', icon: Bed, label: 'Stays', badgeKey: null },
  { to: '/dashboard/reports', icon: BarChart3, label: 'Reports', badgeKey: null },
];

const LandlordDashboardLayout = () => {
  const { isAuthenticated, user, fetchUser, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: metadata } = useQuery({
    queryKey: ['dashboard-metadata'],
    queryFn: () => dashboardAPI.getDashboardMetadata().then(res => res.data),
    enabled: isAuthenticated && user?.user_type === 'landlord',
    refetchInterval: 60000,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.user_type !== 'landlord') {
    return <Navigate to="/dashboard" replace />;
  }

  const badges = {
    leases: metadata?.leases_expiring || 0,
    maintenance: metadata?.maintenance || 0,
    messages: metadata?.messages || 0,
    applications: metadata?.applications || 0,
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Mobile: Dark green header ───────────────────────────── */}
      <div className="md:hidden bg-[#0C3B2E] px-4 pt-4 pb-8">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-white/10 text-white"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <Link
            to="/notifications"
            className="p-2 rounded-lg bg-white/10 text-white"
            aria-label="Notifications"
          >
            {badges.messages > 0 ? (
              <div className="relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                  {badges.messages > 9 ? '9+' : badges.messages}
                </span>
              </div>
            ) : (
              <Bell size={20} />
            )}
          </Link>
        </div>
        <p className="text-white/70 text-sm font-medium">Welcome back,</p>
        <h1 className="text-white text-2xl font-bold leading-tight">
          {user.first_name || user.full_name || 'Landlord'}
        </h1>
      </div>

      {/* ── Mobile: Slide-in sidebar ────────────────────────────── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0C3B2E] md:hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
              <span className="text-white font-bold text-lg">RentStay</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm">
                  {(user.first_name || user.full_name || 'L')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-white/60 text-xs capitalize">{user.user_type}</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {[...PRIMARY_TABS, ...MORE_TABS].map((tab) => (
                <Link
                  key={tab.to}
                  to={tab.to}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
                >
                  <tab.icon size={18} />
                  {tab.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-white/10 space-y-1">
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
              >
                <UserIcon size={18} /> Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-300 hover:bg-white/10 hover:text-red-200 transition-colors text-sm font-medium w-full"
              >
                <LogOut size={18} /> Log out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="container-custom py-4 lg:py-6 pb-24 md:pb-6">
        {/* Desktop welcome header */}
        <div className="hidden md:flex mb-4 items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-dark-900">
              Welcome, {user.first_name || user.full_name || 'Landlord'}
            </h1>
            <p className="text-sm text-dark-500">Landlord Dashboard</p>
          </div>
          <Link to="/properties/new" className="btn btn-primary btn-sm inline-flex items-center gap-1">
            <Plus size={16} /> Add Property
          </Link>
        </div>

        <DashboardTabNav badges={badges} />

        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>

      {/* ── Mobile Bottom Navigation ─────────────────────────────── */}
      <MobileBottomNav
        primaryTabs={PRIMARY_TABS}
        moreTabs={MORE_TABS}
        badges={badges}
      />
    </div>
  );
};

export default LandlordDashboardLayout;
