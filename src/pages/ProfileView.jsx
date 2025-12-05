import {
  User, Mail, Phone, Calendar, MapPin, CreditCard,
  Shield, Edit2, CheckCircle, XCircle, Home, Map
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
  const { user } = useAuthStore();

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
        <div className="card overflow-hidden">
          {/* Cover Background */}
          <div className="h-32 bg-gradient-to-r from-primary via-primary-600 to-purple-600 relative">
            <div className="absolute inset-0 bg-black/10"></div>
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 sm:-mt-12">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl bg-white p-1.5 shadow-xl">
                    <div className="w-full h-full rounded-xl bg-primary-100 overflow-hidden">
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
                      <div className={`w-full h-full flex items-center justify-center text-primary text-3xl font-bold ${user?.profile_picture ? 'hidden' : ''}`}>
                        {getInitials(user?.full_name || user?.email)}
                      </div>
                    </div>
                  </div>
                  {user?.is_verified && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-4 border-white shadow-lg">
                      <CheckCircle size={16} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Name and Basic Info */}
                <div className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-display font-bold text-dark-900">
                      {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'}
                    </h1>
                  </div>
                  <p className="text-dark-600 flex items-center gap-1.5 mb-1">
                    <Mail size={14} />
                    {user?.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 text-primary text-xs font-semibold rounded-full capitalize">
                      <User size={12} />
                      {user?.user_type || 'User'}
                    </span>
                    {user?.is_verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        <CheckCircle size={12} />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                        <XCircle size={12} />
                        Unverified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <a
                href="/profile"
                className="btn btn-primary flex items-center gap-2 mt-4 sm:mt-0 self-start sm:self-auto"
              >
                <Edit2 size={16} />
                Edit Profile
              </a>
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
