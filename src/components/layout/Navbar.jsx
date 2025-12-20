import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home, Building2, LogIn, UserPlus, LayoutDashboard, LogOut, Menu, X,
  User as UserIcon, ChevronDown, Edit, Shield, FileText, Mail,
  Calendar, Bed, PlusCircle, List, Users, Bell, ChevronRight
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useSiteSettings from '../../hooks/useSiteSettings';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { isAuthenticated, user, logout } = useAuthStore();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const onClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/properties', label: 'Properties', icon: Building2 },
    { to: '/stays', label: 'Stays', icon: Building2 },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            {settings?.site_logo_url ? (
              <img
                src={settings.site_logo_url}
                alt={settings.site_name || 'RentStay'}
                className="h-10 object-contain"
              />
            ) : (
              <>
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="text-white" size={24} />
                </div>
                <span className="text-2xl font-display font-bold text-primary">
                  {settings?.site_name || 'Rent'}<span className="text-accent">Stay</span>
                </span>
              </>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center space-x-1 text-dark-600 hover:text-primary transition-colors font-medium"
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 text-dark-600 hover:text-primary transition-colors font-medium"
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-dark-700"
                    aria-haspopup="menu"
                    aria-expanded={isUserMenuOpen}
                  >
                    <UserIcon size={18} />
                    <ChevronDown size={16} className={`${isUserMenuOpen ? 'rotate-180' : ''} transition-transform`} />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <Link
                        to="/profile/view"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-3 hover:bg-gray-50"
                      >
                        <p className="text-sm font-semibold text-dark-900 truncate">{user?.full_name || user?.email}</p>
                        <p className="text-xs text-dark-500 capitalize">{user?.user_type}</p>
                      </Link>
                      <div className="border-t" />
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-dark-700 hover:bg-gray-50"
                      >
                        Edit Profile
                      </Link>
                      <Link
                        to="/verify"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-dark-700 hover:bg-gray-50"
                      >
                        Verification
                      </Link>
                      {user?.user_type === 'landlord' && (
                        <Link
                          to="/agreements/template"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-dark-700 hover:bg-gray-50"
                        >
                          Agreement Template
                        </Link>
                      )}
                      <Link
                        to="/applications"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-dark-700 hover:bg-gray-50"
                      >
                        Applications
                      </Link>
                      <Link
                        to="/visits"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-dark-700 hover:bg-gray-50"
                      >
                        Visits
                      </Link>
                      <Link
                        to="/agreements"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-dark-700 hover:bg-gray-50"
                      >
                        Agreements
                      </Link>
                      <Link
                        to="/messages"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-dark-700 hover:bg-gray-50"
                      >
                        Messages
                      </Link>
                      <Link
                        to="/stays/bookings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-dark-700 hover:bg-gray-50"
                      >
                        My Stays
                      </Link>
                      {user?.user_type === 'landlord' && (
                        <>
                          <Link
                            to="/stays/listings/new"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-dark-700 hover:bg-gray-50"
                          >
                            Share Your Space
                          </Link>
                          <Link
                            to="/stays/host/listings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-dark-700 hover:bg-gray-50"
                          >
                            My Listings
                          </Link>
                          <Link
                            to="/stays/host/bookings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-dark-700 hover:bg-gray-50"
                          >
                            Guest Bookings
                          </Link>
                        </>
                      )}
                      {(user?.is_staff || user?.user_type === 'admin') && (
                        <Link
                          to="/admin/kyc"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-dark-700 hover:bg-gray-50"
                        >
                          KYC Requests
                        </Link>
                      )}
                      <Link
                        to="/notifications"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-dark-700 hover:bg-gray-50"
                      >
                        Notifications
                      </Link>
                      <div className="border-t" />
                      <button
                        onClick={() => { setIsUserMenuOpen(false); handleLogout(); }}
                        className="w-full text-left px-4 py-2 text-sm text-dark-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">
                  <LogIn size={18} />
                  <span>Login</span>
                </Link>
                <Link to="/register" className="btn btn-primary">
                  <UserPlus size={18} />
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
              {/* User Info Section (if authenticated) */}
              {isAuthenticated && (
                <div className="px-4 py-4 bg-gradient-to-r from-primary-50 to-accent-50 border-b border-gray-200">
                  <Link
                    to="/profile/view"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-lg">
                        {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark-900 truncate max-w-[200px]">
                          {user?.full_name || user?.email}
                        </p>
                        <p className="text-xs text-dark-600 capitalize flex items-center gap-1">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                          {user?.user_type}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-dark-400 group-hover:text-primary transition-colors" />
                  </Link>
                </div>
              )}

              <div className="py-2">
                {/* Main Navigation Links */}
                <div className="px-2 py-2">
                  <p className="px-3 text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                    Navigation
                  </p>
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                    >
                      <link.icon size={20} className="flex-shrink-0" />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  ))}
                </div>

                {isAuthenticated ? (
                  <>
                    {/* Dashboard */}
                    <div className="px-2 py-2 border-t border-gray-100">
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                      >
                        <LayoutDashboard size={20} className="flex-shrink-0" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                    </div>

                    {/* Account Section */}
                    <div className="px-2 py-2 border-t border-gray-100">
                      <p className="px-3 text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                        Account
                      </p>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                      >
                        <Edit size={20} className="flex-shrink-0" />
                        <span className="font-medium">Edit Profile</span>
                      </Link>
                      <Link
                        to="/verify"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                      >
                        <Shield size={20} className="flex-shrink-0" />
                        <span className="font-medium">Verification</span>
                      </Link>
                      <Link
                        to="/notifications"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                      >
                        <Bell size={20} className="flex-shrink-0" />
                        <span className="font-medium">Notifications</span>
                      </Link>
                    </div>

                    {/* Activity Section */}
                    <div className="px-2 py-2 border-t border-gray-100">
                      <p className="px-3 text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                        Activity
                      </p>
                      <Link
                        to="/applications"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                      >
                        <FileText size={20} className="flex-shrink-0" />
                        <span className="font-medium">Applications</span>
                      </Link>
                      <Link
                        to="/visits"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                      >
                        <Calendar size={20} className="flex-shrink-0" />
                        <span className="font-medium">Visits</span>
                      </Link>
                      <Link
                        to="/agreements"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                      >
                        <FileText size={20} className="flex-shrink-0" />
                        <span className="font-medium">Agreements</span>
                      </Link>
                      <Link
                        to="/messages"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                      >
                        <Mail size={20} className="flex-shrink-0" />
                        <span className="font-medium">Messages</span>
                      </Link>
                    </div>

                    {/* Stays Section */}
                    <div className="px-2 py-2 border-t border-gray-100">
                      <p className="px-3 text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                        Short-Term Stays
                      </p>
                      <Link
                        to="/stays/bookings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                      >
                        <Bed size={20} className="flex-shrink-0" />
                        <span className="font-medium">My Stays</span>
                      </Link>
                      {user?.user_type === 'landlord' && (
                        <>
                          <Link
                            to="/stays/listings/new"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                          >
                            <PlusCircle size={20} className="flex-shrink-0" />
                            <span className="font-medium">Share Your Space</span>
                          </Link>
                          <Link
                            to="/stays/host/listings"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                          >
                            <List size={20} className="flex-shrink-0" />
                            <span className="font-medium">My Listings</span>
                          </Link>
                          <Link
                            to="/stays/host/bookings"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                          >
                            <Users size={20} className="flex-shrink-0" />
                            <span className="font-medium">Guest Bookings</span>
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Landlord Section */}
                    {user?.user_type === 'landlord' && (
                      <div className="px-2 py-2 border-t border-gray-100">
                        <p className="px-3 text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                          Landlord Tools
                        </p>
                        <Link
                          to="/agreements/template"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                        >
                          <FileText size={20} className="flex-shrink-0" />
                          <span className="font-medium">Agreement Template</span>
                        </Link>
                      </div>
                    )}

                    {/* Admin Section */}
                    {(user?.is_staff || user?.user_type === 'admin') && (
                      <div className="px-2 py-2 border-t border-gray-100">
                        <p className="px-3 text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                          Admin
                        </p>
                        <Link
                          to="/admin/kyc"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-3 px-3 py-3 text-dark-700 hover:bg-primary-50 hover:text-primary rounded-lg transition-all active:scale-95"
                        >
                          <Shield size={20} className="flex-shrink-0" />
                          <span className="font-medium">KYC Requests</span>
                        </Link>
                      </div>
                    )}

                    {/* Logout Button */}
                    <div className="px-2 py-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all active:scale-95 font-medium"
                      >
                        <LogOut size={20} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* Guest Auth Buttons */
                  <div className="px-2 py-4 space-y-3 border-t border-gray-100">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-white border-2 border-primary text-primary hover:bg-primary-50 rounded-lg transition-all active:scale-95 font-medium"
                    >
                      <LogIn size={20} />
                      <span>Login</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-primary text-white hover:bg-primary-600 rounded-lg transition-all active:scale-95 font-medium"
                    >
                      <UserPlus size={20} />
                      <span>Sign Up</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
