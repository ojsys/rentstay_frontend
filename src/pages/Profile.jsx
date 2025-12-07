import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { authAPI, locationAPI } from '../services/api';
import DashboardShell from '../components/dashboard/DashboardShell';
import UpgradeToLandlord from '../components/profile/UpgradeToLandlord';
import { getMediaUrl, getInitials } from '../utils/imageUtils';
import { User, MapPin, Shield, Upload, Camera, FileText, Loader2, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, fetchUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone_number: '', date_of_birth: '', address: '', state: '', lga: '', id_type: '', id_number: ''
  });
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [idDoc, setIdDoc] = useState(null);
  const [idDocName, setIdDocName] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await locationAPI.getStates();
        setStates(res.data);
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        date_of_birth: user.date_of_birth || '',
        address: user.address || '',
        state: user.state?.id || '',
        lga: user.lga?.id || '',
        id_type: user.id_type || '',
        id_number: user.id_number || ''
      });
      if (user.state?.id) {
        locationAPI.getLGAs(user.state.id).then(r => setLgas(r.data));
      }
    }
  }, [user]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onStateChange = async (e) => {
    const stateId = e.target.value;
    setForm(prev => ({ ...prev, state: stateId, lga: '' }));
    if (stateId) {
      const res = await locationAPI.getLGAs(stateId);
      setLgas(res.data);
    } else {
      setLgas([]);
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdDocChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdDoc(file);
      setIdDocName(file.name);
    }
  };

  const removeProfilePic = () => {
    setProfilePic(null);
    setProfilePicPreview(null);
  };

  const removeIdDoc = () => {
    setIdDoc(null);
    setIdDocName('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') fd.append(k, v);
      });
      if (profilePic) fd.append('profile_picture', profilePic);
      if (idDoc) fd.append('id_document', idDoc);

      await authAPI.updateProfile(fd, true);
      toast.success('Profile updated successfully!');
      await fetchUser();
      setTimeout(() => {
        navigate('/profile/view');
      }, 1000);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const currentProfilePic = profilePicPreview || getMediaUrl(user?.profile_picture);

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-6">
        <Link to="/profile/view" className="inline-flex items-center text-primary hover:text-primary-dark mb-4">
          <ArrowLeft size={20} className="mr-2" />
          Back to Profile
        </Link>
        <h1 className="text-3xl font-display font-bold text-dark-900">Edit Profile</h1>
        <p className="text-dark-600 mt-2">Update your personal information and settings</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6" encType="multipart/form-data">
        {/* Profile Picture Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Camera className="text-primary" size={24} />
            <h2 className="text-xl font-semibold text-dark-900">Profile Picture</h2>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Current/Preview Picture */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-primary-100 overflow-hidden flex-shrink-0 border-4 border-white shadow-lg">
                {currentProfilePic ? (
                  <img
                    src={currentProfilePic}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary text-4xl font-semibold">
                    {getInitials(user?.full_name || user?.email)}
                  </div>
                )}
              </div>
              {profilePicPreview && (
                <button
                  type="button"
                  onClick={removeProfilePic}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex-1">
              <label className="btn btn-secondary cursor-pointer inline-flex items-center gap-2">
                <Upload size={18} />
                Choose New Picture
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleProfilePicChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-dark-500 mt-2">
                JPG, PNG or JPEG. Max size 5MB. Recommended: Square image, at least 400x400px
              </p>
              {profilePic && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  ✓ New picture selected: {profilePic.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <User className="text-primary" size={24} />
            <h2 className="text-xl font-semibold text-dark-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">First Name *</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={onChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={onChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Phone Number *</label>
              <input
                name="phone_number"
                value={form.phone_number}
                onChange={onChange}
                className="input"
                placeholder="+234 XXX XXX XXXX"
                required
              />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth || ''}
                onChange={onChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="text-primary" size={24} />
            <h2 className="text-xl font-semibold text-dark-900">Location</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="label">Address</label>
              <input
                name="address"
                value={form.address}
                onChange={onChange}
                className="input"
                placeholder="Street address, apartment, suite, etc."
              />
            </div>
            <div>
              <label className="label">State *</label>
              <select value={form.state} onChange={onStateChange} className="input" required>
                <option value="">Select State</option>
                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">LGA *</label>
              <select
                value={form.lga}
                onChange={onChange}
                name="lga"
                className="input"
                disabled={!form.state}
                required
              >
                <option value="">Select LGA</option>
                {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              {!form.state && (
                <p className="text-xs text-dark-500 mt-1">Select a state first</p>
              )}
            </div>
          </div>
        </div>

        {/* Identity Information */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="text-primary" size={24} />
            <h2 className="text-xl font-semibold text-dark-900">Identity Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">ID Type</label>
              <select name="id_type" value={form.id_type} onChange={onChange} className="input">
                <option value="">Select ID Type</option>
                <option value="NIN">National Identity Number (NIN)</option>
                <option value="Driver's License">Driver's License</option>
                <option value="International Passport">International Passport</option>
                <option value="Voter's Card">Voter's Card</option>
              </select>
            </div>
            <div>
              <label className="label">ID Number</label>
              <input
                name="id_number"
                value={form.id_number}
                onChange={onChange}
                className="input"
                placeholder="Enter your ID number"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                ID Document
                <span className="text-xs text-dark-500 font-normal">(JPEG, PNG, or PDF - Max 5MB)</span>
              </label>
              <div className="mt-2">
                <label className="btn btn-secondary cursor-pointer inline-flex items-center gap-2">
                  <Upload size={18} />
                  {idDocName ? 'Change Document' : 'Upload Document'}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleIdDocChange}
                    className="hidden"
                  />
                </label>
                {idDocName && (
                  <div className="mt-3 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <span className="text-sm text-green-800 flex items-center gap-2">
                      <FileText size={16} />
                      {idDocName}
                    </span>
                    <button
                      type="button"
                      onClick={removeIdDoc}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-dark-500 mt-2">
                Upload a clear copy of your ID document for verification
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <Link
            to="/profile/view"
            className="btn btn-secondary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Saving Changes...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>

      {/* Account Upgrade Section */}
      {user?.user_type === 'tenant' && (
        <div className="mt-8">
          <UpgradeToLandlord />
        </div>
      )}
    </DashboardShell>
  );
};

export default Profile;

