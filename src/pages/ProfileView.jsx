import DashboardShell from '../components/dashboard/DashboardShell';
import useAuthStore from '../store/authStore';
import { getMediaUrl, getInitials } from '../utils/imageUtils';

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b last:border-b-0">
    <span className="text-dark-600">{label}</span>
    <span className="font-medium text-dark-900">{value || '—'}</span>
  </div>
);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h1 className="text-2xl font-display font-bold text-dark-900 mb-4">Profile</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="First Name" value={user?.first_name} />
            <InfoRow label="Last Name" value={user?.last_name} />
            <InfoRow label="Email" value={user?.email} />
            <InfoRow label="Phone" value={user?.phone_number} />
            <InfoRow label="Date of Birth" value={user?.date_of_birth} />
            <InfoRow label="User Type" value={user?.user_type} />
            <InfoRow label="Address" value={user?.address} />
            <InfoRow label="State" value={user?.state?.name} />
            <InfoRow label="LGA" value={user?.lga?.name} />
            <InfoRow label="ID Type" value={user?.id_type} />
            <InfoRow label="ID Number" value={user?.id_number} />
          </div>
          <div className="mt-6">
            <a href="/profile" className="btn btn-primary">Edit Profile</a>
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-dark-900 mb-3">Profile Summary</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-24 h-24 rounded-full bg-primary-100 overflow-hidden flex-shrink-0">
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
              <div className={`w-full h-full flex items-center justify-center text-primary text-2xl font-semibold ${user?.profile_picture ? 'hidden' : ''}`}>
                {getInitials(user?.full_name || user?.email)}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-dark-900 font-semibold">{user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`}</p>
              <p className="text-sm text-dark-600 break-all">{user?.email}</p>
              <p className="text-xs text-dark-500 capitalize">{user?.user_type}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <InfoRow label="Phone" value={user?.phone_number} />
            <InfoRow label="Address" value={user?.address} />
            <InfoRow label="State" value={user?.state?.name} />
            <InfoRow label="LGA" value={user?.lga?.name} />
            <InfoRow label="ID Type" value={user?.id_type} />
            <InfoRow label="ID Number" value={maskLastSixDigits(user?.id_number)} />
            <InfoRow label="Verified" value={user?.is_verified ? 'Yes' : 'No'} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default ProfileView;
