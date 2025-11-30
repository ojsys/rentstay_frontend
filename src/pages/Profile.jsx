import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { authAPI, locationAPI } from '../services/api';
import DashboardShell from '../components/dashboard/DashboardShell';
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
  const [idDoc, setIdDoc] = useState(null);

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
      // Redirect to profile view page after 1 second
      setTimeout(() => {
        navigate('/profile/view');
      }, 1000);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell>
      <h1 className="text-3xl font-display font-bold text-dark-900 mb-6">Your Profile</h1>
      <form onSubmit={onSubmit} className="card space-y-4" encType="multipart/form-data">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">First Name</label>
            <input name="first_name" value={form.first_name} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input name="last_name" value={form.last_name} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input name="phone_number" value={form.phone_number} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <input type="date" name="date_of_birth" value={form.date_of_birth || ''} onChange={onChange} className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Address</label>
            <input name="address" value={form.address} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">State</label>
            <select value={form.state} onChange={onStateChange} className="input">
              <option value="">Select State</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">LGA</label>
            <select value={form.lga} onChange={onChange} name="lga" className="input" disabled={!form.state}>
              <option value="">Select LGA</option>
              {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">ID Type</label>
            <input name="id_type" value={form.id_type} onChange={onChange} className="input" placeholder="NIN, Driver's License, etc." />
          </div>
          <div>
            <label className="label">ID Number</label>
            <input name="id_number" value={form.id_number} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Profile Picture</label>
            <input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files?.[0] || null)} className="input" />
          </div>
          <div>
            <label className="label">ID Document</label>
            <input type="file" onChange={(e) => setIdDoc(e.target.files?.[0] || null)} className="input" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </DashboardShell>
  );
};

export default Profile;

