import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Mail, Phone, MapPin, Calendar, ShieldCheck, ShieldAlert, MessageSquare,
  Home, Loader2, ArrowLeft, Lock, Edit2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardShell from '../components/dashboard/DashboardShell';
import { userAPI, messagingAPI } from '../services/api';
import { getInitials } from '../utils/imageUtils';
import { getErrorMessage } from '../utils/errors';

const Row = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-4 rounded-xl border border-dark-200 bg-white">
    <Icon size={18} className="text-dark-500 mt-0.5 flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-xs font-medium text-dark-600 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-dark-900 break-words">{value || '—'}</p>
    </div>
  </div>
);

const statusColors = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-600',
  terminated: 'bg-red-100 text-red-700',
};

/**
 * Shared profile page. Served to the user themselves and to a landlord who has
 * a tenancy with them — the backend decides which fields come back and returns
 * 403 to anyone else, so this page renders whatever it is given.
 */
const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => userAPI.getProfile(id).then(r => r.data),
    retry: false,
  });

  const startChat = async () => {
    setStarting(true);
    try {
      const { data: convo } = await messagingAPI.startConversationWithUser(Number(id));
      navigate(`/messages?conversation=${convo.id}`);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not open the conversation'));
    } finally {
      setStarting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center gap-2 text-dark-400 p-8">
          <Loader2 className="animate-spin" size={18} /> Loading profile…
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    const forbidden = error?.response?.status === 403;
    return (
      <DashboardShell>
        <div className="card p-8 text-center max-w-md mx-auto">
          <Lock size={30} className="text-dark-300 mx-auto mb-3" />
          <p className="font-semibold text-dark-900">
            {forbidden ? 'Profile not available' : 'Profile not found'}
          </p>
          <p className="text-sm text-dark-500 mt-1">
            {forbidden
              ? 'You can only view the profile of a tenant you have a tenancy with.'
              : 'This user does not exist.'}
          </p>
          <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm mt-4">
            Go back
          </button>
        </div>
      </DashboardShell>
    );
  }

  const p = data;
  const isSelf = p.is_self;
  const canMessage = !isSelf && (p.tenancies || []).length > 0;

  return (
    <DashboardShell>
      <div className="space-y-5 max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-dark-600 hover:text-dark-900"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header */}
        <div className="card p-6">
          <div className="flex items-start gap-4 flex-wrap">
            {p.profile_picture ? (
              <img
                src={p.profile_picture}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold flex-shrink-0">
                {getInitials(p.full_name || p.first_name || '?')}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-display font-bold text-dark-900">{p.full_name}</h1>
                {p.is_verified ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                    <ShieldCheck size={12} /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold">
                    <ShieldAlert size={12} /> Unverified
                  </span>
                )}
              </div>
              <p className="text-sm text-dark-500 mt-0.5 capitalize">
                {p.user_type}
                {p.verification_tier && p.verification_tier !== 'unverified' && ` · ${p.verification_tier} tier`}
              </p>

              <div className="flex gap-2 mt-4 flex-wrap">
                {canMessage && (
                  <button
                    onClick={startChat}
                    disabled={starting}
                    className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {starting
                      ? <Loader2 size={14} className="animate-spin" />
                      : <MessageSquare size={14} />}
                    Message
                  </button>
                )}
                {isSelf && (
                  <Link to="/profile" className="btn btn-secondary btn-sm flex items-center gap-1.5">
                    <Edit2 size={14} /> Edit profile
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-sm font-semibold text-dark-700 mb-2">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Row icon={Mail} label="Email" value={p.email} />
            <Row icon={Phone} label="Phone" value={p.phone_number} />
            <Row
              icon={MapPin}
              label="Location"
              value={[p.lga_name, p.state_name].filter(Boolean).join(', ')}
            />
            <Row
              icon={Calendar}
              label="Member since"
              value={p.member_since ? new Date(p.member_since).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : null}
            />
            {isSelf && p.address && <Row icon={Home} label="Address" value={p.address} />}
            {isSelf && p.date_of_birth && (
              <Row icon={Calendar} label="Date of birth" value={p.date_of_birth} />
            )}
          </div>
        </div>

        {/* Tenancies */}
        <div>
          <h2 className="text-sm font-semibold text-dark-700 mb-2">
            {isSelf ? 'Tenancies' : 'Tenancies with you'}
          </h2>
          {(p.tenancies || []).length === 0 ? (
            <p className="text-sm text-dark-400 bg-gray-50 rounded-xl p-4">No tenancies on record.</p>
          ) : (
            <div className="space-y-2">
              {p.tenancies.map(t => (
                <div key={t.id} className="card p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Home size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-dark-900 text-sm truncate">{t.property_title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColors[t.status] || ''}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-dark-500 mt-0.5 truncate">{t.property_address}</p>
                    <p className="text-xs text-dark-400 mt-1">
                      {t.start_date} → {t.end_date} · ₦{Number(t.rent_amount).toLocaleString()}
                      {t.rent_paid
                        ? <span className="text-emerald-600 font-medium"> · rent paid</span>
                        : <span className="text-amber-600 font-medium"> · rent outstanding</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isSelf && (
          <p className="text-xs text-dark-400">
            Identity documents are not shared. Verification status above reflects checks
            completed on RentStay.
          </p>
        )}
      </div>
    </DashboardShell>
  );
};

export default UserProfile;
