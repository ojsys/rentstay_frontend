import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { inviteAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import {
  Building2, Calendar, Banknote, CheckCircle2, XCircle, Loader2,
  AlertTriangle, Clock, User, Home,
} from 'lucide-react';

const formatAmount = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? '—' : `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
};

const RENT_TERM_LABELS = { annual: 'Annual', biannual: 'Biannual', monthly: 'Monthly' };

export default function InviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [declined, setDeclined] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [agreementId, setAgreementId] = useState(null);

  const { data: invite, isLoading, error } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => inviteAPI.getByToken(token).then(r => r.data),
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () => inviteAPI.accept(token),
    onSuccess: (res) => {
      setAccepted(true);
      setAgreementId(res.data?.agreement?.id);
      toast.success('Invitation accepted! Your tenancy is now active.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || 'Failed to accept invitation.');
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => inviteAPI.decline(token),
    onSuccess: () => {
      setDeclined(true);
      toast('Invitation declined.', { icon: '👋' });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || 'Failed to decline invitation.');
    },
  });

  const isBusy = acceptMutation.isPending || declineMutation.isPending;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-dark-500">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading invitation...</span>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center py-12">
          <AlertTriangle size={48} className="mx-auto text-amber-400 mb-4" />
          <h2 className="text-xl font-bold text-dark-900 mb-2">Invitation Not Found</h2>
          <p className="text-dark-500 mb-6">This invitation link is invalid or has been removed.</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  if (invite.status === 'expired' || invite.is_expired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center py-12">
          <Clock size={48} className="mx-auto text-dark-300 mb-4" />
          <h2 className="text-xl font-bold text-dark-900 mb-2">Invitation Expired</h2>
          <p className="text-dark-500 mb-6">This invitation has expired. Please contact your landlord to send a new one.</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  // Accepted success screen
  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center py-12">
          <CheckCircle2 size={56} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-dark-900 mb-2">You're All Set!</h2>
          <p className="text-dark-500 mb-2">Your tenancy at <strong>{invite.property_title}</strong> is now active.</p>
          <p className="text-sm text-dark-400 mb-8">You can now track rent payments, submit maintenance requests, and message your landlord from your dashboard.</p>
          <div className="flex flex-col gap-3">
            {agreementId && (
              <Link to={`/agreements/${agreementId}`} className="btn btn-primary">View My Agreement</Link>
            )}
            <Link to="/dashboard" className="btn btn-outline">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  // Declined screen
  if (declined || invite.status === 'declined') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center py-12">
          <XCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-dark-900 mb-2">Invitation Declined</h2>
          <p className="text-dark-500 mb-6">You've declined this invitation. Contact your landlord if you change your mind.</p>
          <Link to="/" className="btn btn-outline">Go Home</Link>
        </div>
      </div>
    );
  }

  if (invite.status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center py-12">
          <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-dark-900 mb-2">Already Accepted</h2>
          <p className="text-dark-500 mb-6">This invitation has already been accepted.</p>
          <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Check auth and email match
  const isLoggedIn = !!user;
  const isTenant = user?.user_type === 'tenant';
  const emailMatches = user?.email?.toLowerCase() === invite.tenant_email?.toLowerCase();
  const canAct = isLoggedIn && isTenant && emailMatches;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Home size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark-900">Tenancy Invitation</h1>
          <p className="text-dark-500 mt-1">
            <strong>{invite.landlord_name}</strong> has invited you to manage your tenancy on RentStay.
          </p>
        </div>

        {/* Invite details card */}
        <div className="card space-y-5">
          {/* Property */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-dark-900">{invite.property_title}</p>
              <p className="text-sm text-dark-500">{invite.property_address}</p>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Lease terms grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Banknote size={16} className="text-dark-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-dark-400">Rent</p>
                <p className="font-semibold text-dark-900">{formatAmount(invite.rent_amount)}</p>
                <p className="text-xs text-dark-500 capitalize">{RENT_TERM_LABELS[invite.rent_term] || invite.rent_term}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Banknote size={16} className="text-dark-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-dark-400">Caution Fee</p>
                <p className="font-semibold text-dark-900">{formatAmount(invite.caution_fee)}</p>
                <p className="text-xs text-dark-500">Security deposit</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar size={16} className="text-dark-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-dark-400">Lease Start</p>
                <p className="font-semibold text-dark-900">{invite.lease_start}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar size={16} className="text-dark-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-dark-400">Lease End</p>
                <p className="font-semibold text-dark-900">{invite.lease_end}</p>
              </div>
            </div>
          </div>

          {invite.agreement_notes && (
            <>
              <hr className="border-gray-100" />
              <div>
                <p className="text-xs font-medium text-dark-400 mb-1">Special Terms</p>
                <p className="text-sm text-dark-600">{invite.agreement_notes}</p>
              </div>
            </>
          )}
        </div>

        {/* Auth / action section */}
        {!isLoggedIn ? (
          <div className="card text-center space-y-4">
            <User size={32} className="mx-auto text-dark-300" />
            <div>
              <p className="font-semibold text-dark-900">Sign in to accept this invitation</p>
              <p className="text-sm text-dark-500 mt-1">You'll need a RentStay account linked to <strong>{invite.tenant_email}</strong>.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link to={`/login?redirect=/invite/${token}`} className="btn btn-primary w-full">Log In</Link>
              <Link to={`/register?invite=${token}&email=${encodeURIComponent(invite.tenant_email)}&first_name=${encodeURIComponent(invite.tenant_first_name || '')}&last_name=${encodeURIComponent(invite.tenant_last_name || '')}`} className="btn btn-outline w-full">Create Account</Link>
            </div>
          </div>
        ) : !isTenant ? (
          <div className="card bg-amber-50 border border-amber-200 text-center py-6">
            <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
            <p className="font-semibold text-dark-900">Wrong account type</p>
            <p className="text-sm text-dark-500 mt-1">Invitations can only be accepted with a tenant account. You're logged in as a <strong>{user.user_type}</strong>.</p>
          </div>
        ) : !emailMatches ? (
          <div className="card bg-amber-50 border border-amber-200 text-center py-6">
            <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
            <p className="font-semibold text-dark-900">Email mismatch</p>
            <p className="text-sm text-dark-500 mt-1">
              This invitation was sent to <strong>{invite.tenant_email}</strong>, but you're logged in as <strong>{user.email}</strong>.
            </p>
            <Link to={`/login?redirect=/invite/${token}`} className="btn btn-outline mt-4 text-sm">Switch Account</Link>
          </div>
        ) : (
          <div className="card space-y-4">
            <p className="text-sm text-dark-600 text-center">
              Accepting will create your rental agreement and payment schedule for <strong>{invite.property_title}</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => declineMutation.mutate()}
                disabled={isBusy}
                className="btn btn-outline flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                {declineMutation.isPending ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Decline'}
              </button>
              <button
                onClick={() => acceptMutation.mutate()}
                disabled={isBusy}
                className="btn btn-primary flex-1"
              >
                {acceptMutation.isPending ? <Loader2 size={16} className="animate-spin mx-auto" /> : <>Accept Invitation <CheckCircle2 size={16} className="ml-1" /></>}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-dark-400">
          This invitation expires on {invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : '—'}
        </p>
      </div>
    </div>
  );
}
