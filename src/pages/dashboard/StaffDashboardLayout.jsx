import { Navigate, Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Home, Building2, Bed, ShieldCheck, Bell, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import MobileBottomNav from '../../components/dashboard/MobileBottomNav';

const TABS = [
  { to: '/staff/dashboard/home', icon: Home, label: 'Home', badgeKey: null },
  { to: '/staff/dashboard/rentals', icon: Building2, label: 'Rentals', badgeKey: null },
  { to: '/staff/dashboard/stays', icon: Bed, label: 'Short-stays', badgeKey: null },
];

const StaffDashboardLayout = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_staff && user?.user_type !== 'admin') return <Navigate to="/dashboard" replace />;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-theme min-h-screen bg-gray-50">

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
          <Link to="/notifications" className="p-2 rounded-lg bg-white/10 text-white" aria-label="Notifications">
            <Bell size={20} />
          </Link>
        </div>
        <p className="text-white/70 text-sm font-medium">Staff workspace</p>
        <h1 className="text-white text-2xl font-bold leading-tight">
          {user?.first_name || 'Staff'}
        </h1>
      </div>

      {/* ── Mobile: Slide-in sidebar ────────────────────────────── */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0C3B2E] md:hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
              <span className="text-white font-bold text-lg">RentStay</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg bg-white/10 text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm">
                  {(user?.first_name || 'S')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{user?.first_name} {user?.last_name}</p>
                  <p className="text-white/60 text-xs">Staff</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {TABS.map((tab) => (
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
              <Link
                to="/admin/kyc"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
              >
                <ShieldCheck size={18} /> KYC Requests
              </Link>
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

      {/* ── Desktop: Header & tab nav ────────────────────────────── */}
      <div className="hidden md:block bg-white border-b shadow-sm">
        <div className="container-custom py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-dark-900">Staff Dashboard</h1>
            <p className="text-sm text-dark-500">Review and publish listings, {user?.first_name}</p>
          </div>
          <NavLink to="/admin/kyc" className="btn btn-secondary inline-flex items-center gap-2 text-sm">
            <ShieldCheck size={16} /> KYC Requests
          </NavLink>
        </div>
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

      {/* ── Page content ─────────────────────────────────────────── */}
      <div className="container-custom py-4 md:py-6 pb-24 md:pb-6">
        <Outlet />
      </div>

      {/* ── Mobile Bottom Navigation ─────────────────────────────── */}
      <MobileBottomNav primaryTabs={TABS} moreTabs={[]} />
    </div>
  );
};

export default StaffDashboardLayout;
