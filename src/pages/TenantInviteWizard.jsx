import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertyAPI, inviteAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2, User, FileText, CheckCircle, ChevronRight, ChevronLeft,
  Send, Loader2, Home,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Property', icon: Building2 },
  { id: 2, label: 'Tenant', icon: User },
  { id: 3, label: 'Lease Terms', icon: FileText },
  { id: 4, label: 'Review & Send', icon: Send },
];

const RENT_TERMS = [
  { value: 'annual', label: 'Annual' },
  { value: 'biannual', label: 'Biannual (every 6 months)' },
  { value: 'monthly', label: 'Monthly' },
];

const formatAmount = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? '—' : `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
};

export default function TenantInviteWizard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    property_id: '',
    tenant_email: '',
    tenant_first_name: '',
    tenant_last_name: '',
    rent_amount: '',
    rent_term: 'annual',
    caution_fee: '',
    lease_start: '',
    lease_end: '',
    rent_due_day: '1',
    agreement_notes: '',
  });

  // All hooks must come before any conditional return
  const { data: propertiesData, isLoading: propsLoading } = useQuery({
    queryKey: ['my-properties-invite'],
    queryFn: () => propertyAPI.list({ mine: 'true' }).then(r => r.data),
    enabled: user?.user_type === 'landlord',
  });

  if (user?.user_type !== 'landlord') {
    return <Navigate to="/dashboard" replace />;
  }

  const properties = propertiesData?.results || propertiesData || [];

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const selectedProp = properties.find(p => String(p.id) === String(form.property_id));

  // Auto-fill caution fee from property if empty
  const handlePropertySelect = (propId) => {
    const prop = properties.find(p => String(p.id) === String(propId));
    set('property_id', propId);
    if (prop) {
      if (!form.rent_amount) set('rent_amount', prop.rent_amount || '');
      if (!form.caution_fee) set('caution_fee', prop.caution_fee || '');
      if (!form.rent_term) set('rent_term', prop.rent_term || 'annual');
    }
  };

  const canGoNext = () => {
    if (step === 1) return !!form.property_id;
    if (step === 2) return !!form.tenant_email;
    if (step === 3) return form.rent_amount && form.lease_start && form.lease_end && form.rent_due_day;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await inviteAPI.send({
        property_id: parseInt(form.property_id),
        tenant_email: form.tenant_email,
        tenant_first_name: form.tenant_first_name,
        tenant_last_name: form.tenant_last_name,
        rent_amount: parseFloat(form.rent_amount),
        rent_term: form.rent_term,
        caution_fee: parseFloat(form.caution_fee) || 0,
        lease_start: form.lease_start,
        lease_end: form.lease_end,
        rent_due_day: parseInt(form.rent_due_day),
        agreement_notes: form.agreement_notes,
      });
      toast.success('Invitation sent! The tenant will receive an email shortly.');
      navigate('/dashboard/leases');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to send invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => navigate('/dashboard/leases')} className="inline-flex items-center gap-1 text-sm text-dark-500 hover:text-dark-900 mb-4">
          <ChevronLeft size={16} /> Back to Leases
        </button>
        <h1 className="text-2xl font-bold text-dark-900">Invite Existing Tenant</h1>
        <p className="text-dark-500 mt-1">Onboard a tenant you're already renting to — skip the listing and application process.</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-primary/10 text-primary' : isDone ? 'text-green-600' : 'text-dark-400'}`}>
                {isDone ? <CheckCircle size={18} className="text-green-500" /> : <Icon size={18} />}
                <span className="text-sm font-medium whitespace-nowrap hidden sm:block">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && <ChevronRight size={14} className="text-dark-300 mx-1 flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="card space-y-5">
        {/* STEP 1: Property */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-dark-900">Select a Property</h2>
            <p className="text-sm text-dark-500">Choose which property this tenant is renting.</p>
            {propsLoading ? (
              <div className="flex items-center gap-2 text-dark-500 py-4"><Loader2 size={18} className="animate-spin" /> Loading properties...</div>
            ) : properties.length === 0 ? (
              <div className="text-center py-8 text-dark-500">
                <Home size={40} className="mx-auto mb-3 text-dark-300" />
                <p>You have no properties yet.</p>
                <button onClick={() => navigate('/properties/new/wizard')} className="btn btn-primary mt-3">Add a Property</button>
              </div>
            ) : (
              <div className="space-y-2">
                {properties.map(prop => (
                  <label key={prop.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${String(form.property_id) === String(prop.id) ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="property_id"
                      value={prop.id}
                      checked={String(form.property_id) === String(prop.id)}
                      onChange={() => handlePropertySelect(prop.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-dark-900 truncate">{prop.title}</p>
                      <p className="text-sm text-dark-500 truncate">{prop.address || `${prop.area}, ${prop.lga_name}`}</p>
                      <p className="text-xs text-dark-400 mt-0.5 capitalize">{prop.property_type} · {prop.bedrooms} bed · {prop.status}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </>
        )}

        {/* STEP 2: Tenant Info */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-dark-900">Tenant Details</h2>
            <p className="text-sm text-dark-500">Enter the tenant's information. They'll receive an email invitation.</p>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Tenant Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                className="input"
                placeholder="tenant@email.com"
                value={form.tenant_email}
                onChange={e => set('tenant_email', e.target.value)}
              />
              <p className="text-xs text-dark-400 mt-1">The invitation will be sent here.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">First Name</label>
                <input className="input" placeholder="First name" value={form.tenant_first_name} onChange={e => set('tenant_first_name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Last Name</label>
                <input className="input" placeholder="Last name" value={form.tenant_last_name} onChange={e => set('tenant_last_name', e.target.value)} />
              </div>
            </div>
          </>
        )}

        {/* STEP 3: Lease Terms */}
        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-dark-900">Lease Terms</h2>
            <p className="text-sm text-dark-500">Set up the rental terms for this tenancy.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Rent Amount (₦) <span className="text-red-500">*</span></label>
                <input type="number" className="input" placeholder="e.g. 1200000" min="0" value={form.rent_amount} onChange={e => set('rent_amount', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Rent Frequency <span className="text-red-500">*</span></label>
                <select className="input" value={form.rent_term} onChange={e => set('rent_term', e.target.value)}>
                  {RENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Caution Fee (₦)</label>
              <input type="number" className="input" placeholder="Auto-calculated if left empty" min="0" value={form.caution_fee} onChange={e => set('caution_fee', e.target.value)} />
              <p className="text-xs text-dark-400 mt-1">Security deposit held in trust. Leave empty to use 10% of rent.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Lease Start <span className="text-red-500">*</span></label>
                <input type="date" className="input" value={form.lease_start} onChange={e => set('lease_start', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Lease End <span className="text-red-500">*</span></label>
                <input type="date" className="input" value={form.lease_end} min={form.lease_start} onChange={e => set('lease_end', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Rent Due Day (day of month) <span className="text-red-500">*</span></label>
              <input type="number" className="input" min="1" max="28" value={form.rent_due_day} onChange={e => set('rent_due_day', e.target.value)} />
              <p className="text-xs text-dark-400 mt-1">The day of the month rent is due (1–28).</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Notes / Special Terms</label>
              <textarea className="input min-h-[80px] resize-none" placeholder="Any additional terms or notes for the tenant..." value={form.agreement_notes} onChange={e => set('agreement_notes', e.target.value)} />
            </div>
          </>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <>
            <h2 className="text-lg font-semibold text-dark-900">Review & Send Invitation</h2>
            <p className="text-sm text-dark-500">Confirm the details before sending the invitation email.</p>

            <div className="space-y-3">
              {/* Property */}
              <div className="rounded-xl bg-gray-50 p-4 space-y-1">
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-2">Property</p>
                <p className="font-semibold text-dark-900">{selectedProp?.title}</p>
                <p className="text-sm text-dark-500">{selectedProp?.address || `${selectedProp?.area}, ${selectedProp?.lga_name}`}</p>
              </div>

              {/* Tenant */}
              <div className="rounded-xl bg-gray-50 p-4 space-y-1">
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-2">Tenant</p>
                <p className="font-semibold text-dark-900">{[form.tenant_first_name, form.tenant_last_name].filter(Boolean).join(' ') || '—'}</p>
                <p className="text-sm text-dark-500">{form.tenant_email}</p>
              </div>

              {/* Lease */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-2">Lease Terms</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><span className="text-dark-400">Rent</span><p className="font-medium text-dark-900">{formatAmount(form.rent_amount)} <span className="text-dark-400 font-normal">/ {form.rent_term}</span></p></div>
                  <div><span className="text-dark-400">Caution Fee</span><p className="font-medium text-dark-900">{formatAmount(form.caution_fee)}</p></div>
                  <div><span className="text-dark-400">Start Date</span><p className="font-medium text-dark-900">{form.lease_start || '—'}</p></div>
                  <div><span className="text-dark-400">End Date</span><p className="font-medium text-dark-900">{form.lease_end || '—'}</p></div>
                  <div><span className="text-dark-400">Due Day</span><p className="font-medium text-dark-900">{form.rent_due_day ? `${form.rent_due_day}${['st','nd','rd'][form.rent_due_day - 1] || 'th'} of month` : '—'}</p></div>
                </div>
                {form.agreement_notes && <p className="text-xs text-dark-500 mt-2 border-t pt-2">{form.agreement_notes}</p>}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 border border-blue-100">
              An invitation email will be sent to <strong>{form.tenant_email}</strong>. The tenant will need to create or log in to their RentStay account to accept. The invitation expires in 7 days.
            </div>
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/dashboard/leases')}
          className="btn btn-outline"
        >
          <ChevronLeft size={16} className="mr-1" /> {step === 1 ? 'Cancel' : 'Back'}
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canGoNext()}
            className="btn btn-primary"
          >
            Continue <ChevronRight size={16} className="ml-1" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? <><Loader2 size={16} className="animate-spin mr-2" />Sending...</> : <><Send size={16} className="mr-2" />Send Invitation</>}
          </button>
        )}
      </div>
    </div>
  );
}
