import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Building2, LogIn, UserPlus, LayoutDashboard, LogOut, Menu, X, User as UserIcon, ChevronDown } from 'lucide-react';
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

  useEffect(() => {
    const onClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

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
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-dark-600 hover:bg-primary-50 hover:text-primary rounded-lg transition-colors"
                >
                  <link.icon size={18} />
                  <span>{link.label}</span>
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-dark-600 hover:bg-primary-50 hover:text-primary rounded-lg transition-colors"
                  >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/agreements"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-dark-600 hover:bg-primary-50 hover:text-primary rounded-lg transition-colors"
                  >
                    <UserIcon size={18} />
                    <span>Agreements</span>
                  </Link>
                  {user?.user_type === 'landlord' && (
                    <Link
                      to="/agreements/template"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-dark-600 hover:bg-primary-50 hover:text-primary rounded-lg transition-colors"
                    >
                      <UserIcon size={18} />
                      <span>Agreement Template</span>
                    </Link>
                  )}
                  <div className="px-4 py-2 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-dark-800">{user?.full_name || user?.email}</p>
                    <p className="text-xs text-dark-500 capitalize">{user?.user_type}</p>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="btn btn-secondary w-full justify-center"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-secondary w-full justify-center"
                  >
                    <LogIn size={18} />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-primary w-full justify-center"
                  >
                    <UserPlus size={18} />
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
