import { useEffect, useState } from 'react';
import {
  User, Mail, Phone, Calendar, MapPin, CreditCard,
  Shield, Edit2, CheckCircle, XCircle, Home, Map, RefreshCw, Building2
} from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import useAuthStore from '../store/authStore';
import { getMediaUrl, getInitials } from '../utils/imageUtils';

const InfoCard = ({ icon: Icon, label, value, highlight = false }) => (
  <div className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
    highlight
      ? 'bg-primary-50 border-primary-200'
      : 'bg-white border-dark-200 hover:border-primary-300 hover:shadow-sm'
  }`}>
    <div className={`mt-0.5 ${highlight ? 'text-primary' : 'text-dark-500'}`}>
      <Icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-dark-600 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold truncate ${
        highlight ? 'text-primary' : 'text-dark-900'
      }`}>
        {value || '—'}
      </p>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary border-primary-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${colorClasses[color]}`}>
      <Icon size={24} />
      <div>
        <p className="text-xs font-medium opacity-80">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
};

const ProfileView = () => {
  const { user, fetchUser } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh user data when component mounts to get latest verification status
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUser();
    setTimeout(() => setIsRefreshing(false), 500); // Brief delay for visual feedback
  };

  const maskLastSixDigits = (val) => {
    if (!val) return '—';
    const chars = val.split('');
    let toMask = 6;
    for (let i = chars.length - 1; i >= 0 && toMask > 0; i--) {
      if (/\d/.test(chars[i])) {
        chars[i] = '•';
        toMask--;
      }
    }
    return chars.join('');
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header Section with Profile Picture */}
        <div className="relative overflow-hidden rounded-xl shadow-lg">
          {/* Extended gradient background covering both banner and info section */}
          <div className="relative bg-gradient-to-br from-primary via-primary-600 to-purple-700">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/3 -translate-x-1/4"></div>

            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/20"></div>

            {/* Action buttons - positioned on banner */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-20">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-lg border border-white/30 transition-all hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh profile data"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <a
                href="/profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold rounded-lg border border-white/30 transition-all hover:scale-105 shadow-lg"
              >
                <Edit2 size={16} />
                <span className="hidden sm:inline">Edit Profile</span>
              </a>
            </div>

            {/* Content area with profile pic and info */}
            <div className="relative z-10 px-6 pt-16 sm:pt-20 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                {/* Profile Picture */}
                <div className="relative flex-shrink-0">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-white p-2 shadow-2xl ring-4 ring-white/50">
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary-100 to-purple-100 overflow-hidden">
                      {user?.profile_picture ? (
                        <img
                          src={getMediaUrl(user.profile_picture)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center text-primary text-4xl font-bold ${user?.profile_picture ? 'hidden' : ''}`}>
                        {getInitials(user?.full_name || user?.email)}
                      </div>
                    </div>
                  </div>
                  {user?.is_verified && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2.5 border-4 border-white shadow-xl">
                      <CheckCircle size={20} className="text-white" />
                    </div>
                  )}
                </div>

                {/* User Info - White text on gradient */}
                <div className="flex-1 pb-2">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 drop-shadow-lg">
                    {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'}
                  </h1>
                  <p className="text-white/95 flex items-center gap-2 mb-3 drop-shadow">
                    <Mail size={16} />
                    <span className="text-sm">{user?.email}</span>
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/25 backdrop-blur-md text-white text-sm font-semibold rounded-lg border border-white/40 capitalize shadow-lg">
                      <User size={14} />
                      {user?.user_type || 'User'}
                    </span>
                    {user?.is_verified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/90 backdrop-blur-md text-white text-sm font-semibold rounded-lg border border-green-400/40 shadow-lg">
                        <CheckCircle size={14} />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/90 backdrop-blur-md text-white text-sm font-semibold rounded-lg border border-amber-400/40 shadow-lg">
                        <XCircle size={14} />
                        Unverified
                      </span>
                    )}
                    {user?.phone_number && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/25 backdrop-blur-md text-white text-sm font-medium rounded-lg border border-white/40 shadow-lg">
                        <Phone size={14} />
                        {user.phone_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Optional, shows verification and account type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={User}
            label="Account Type"
            value={user?.user_type?.charAt(0).toUpperCase() + user?.user_type?.slice(1) || 'User'}
            color="primary"
          />
          <StatCard
            icon={Shield}
            label="Verification Status"
            value={user?.is_verified ? 'Verified' : 'Pending'}
            color={user?.is_verified ? 'success' : 'warning'}
          />
          <StatCard
            icon={Calendar}
            label="Member Since"
            value={user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '—'}
            color="primary"
          />
        </div>

        {/* Upgrade to Landlord CTA */}
        {user?.user_type === 'tenant' && (
          <div className="card bg-gradient-to-r from-primary to-purple-600 text-white border-0">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Building2 size={32} className="text-white" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-display font-bold mb-1">Become a Landlord</h3>
                <p className="text-white/90 text-sm">
                  List your properties, manage tenants, and grow your rental business
                </p>
              </div>
              <a
                href="/profile"
                className="px-6 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors whitespace-nowrap"
              >
                Upgrade Account
              </a>
            </div>
          </div>
        )}

        {/* Information Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="card">
            <h2 className="text-lg font-display font-bold text-dark-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-primary" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoCard icon={User} label="First Name" value={user?.first_name} />
              <InfoCard icon={User} label="Last Name" value={user?.last_name} />
              <InfoCard icon={Calendar} label="Date of Birth" value={user?.date_of_birth} />
              <InfoCard icon={Phone} label="Phone Number" value={user?.phone_number} />
            </div>
          </div>

          {/* Contact & Location */}
          <div className="card">
            <h2 className="text-lg font-display font-bold text-dark-900 mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-primary" />
              Contact & Location
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <InfoCard icon={Mail} label="Email Address" value={user?.email} highlight />
              <InfoCard icon={Home} label="Address" value={user?.address} />
              <div className="grid grid-cols-2 gap-3">
                <InfoCard icon={Map} label="State" value={user?.state?.name} />
                <InfoCard icon={MapPin} label="LGA" value={user?.lga?.name} />
              </div>
            </div>
          </div>

          {/* Identification */}
          <div className="card lg:col-span-2">
            <h2 className="text-lg font-display font-bold text-dark-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-primary" />
              Identification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <InfoCard icon={CreditCard} label="ID Type" value={user?.id_type} />
              <InfoCard icon={Shield} label="ID Number" value={maskLastSixDigits(user?.id_number)} />
              <InfoCard
                icon={user?.is_verified ? CheckCircle : XCircle}
                label="Verification Status"
                value={user?.is_verified ? 'Verified' : 'Pending Verification'}
                highlight={user?.is_verified}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default ProfileView;
