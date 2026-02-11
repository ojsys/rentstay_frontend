import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI, paymentAPI, maintenanceAPI } from '../../services/api';
import { Loader2, CalendarClock, Wallet, Wrench, Mail, FileText, CreditCard, Plus, Clipboard, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import LegalDocumentsCard from '../../components/dashboard/LegalDocumentsCard';

const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="card flex items-center space-x-4">
    <div className="w-12 h-12 bg-primary-100 text-primary rounded-xl flex items-center justify-center">
      <Icon size={24} />
    </div>
    <div>
      <p className="text-dark-600 text-sm">{label}</p>
      <p className="text-2xl font-semibold text-dark-900">{value}</p>
      {sub && <p className="text-xs text-dark-500 mt-1">{sub}</p>}
    </div>
  </div>
);

const SectionTitle = ({ children, action }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-dark-900">{children}</h3>
    {action}
  </div>
);

// (Reverted) MetricCard removed in favor of simpler inline layout

const TenantDashboard = () => {
  const queryClient = useQueryClient();
  // Hooks must be called unconditionally in the same order
  const [showRequest, setShowRequest] = useState(false);
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mPriority, setMPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['tenant-dashboard'],
    queryFn: () => dashboardAPI.getTenant().then(res => res.data),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const agreement = data?.agreement;
  const payments = data?.payments_recent || [];
  const maintenance = data?.maintenance_counts || { open: 0, in_progress: 0, closed: 0 };
  const balances = data?.balances || { outstanding: '0', next_payment_amount: '0' };
  const caution = data?.caution_fee || null;
  const appsCounts = data?.applications_counts || { total: 0, pending: 0, approved: 0, rejected: 0 };
  const appsRecent = data?.applications_recent || [];
  const { user } = useAuthStore();

  const profileComplete = useMemo(() => {
    if (!user) return false;
    const required = [user.first_name, user.last_name, user.phone_number, user.state, user.lga];
    return required.every(Boolean);
  }, [user]);

  const hasApplication = appsCounts.total > 0;
  const hasAgreement = Boolean(agreement);
  const cautionPaid = Boolean(agreement?.caution_fee_paid);

  const steps = [
    { key: 'profile', label: 'Complete Profile', done: profileComplete, link: '/profile' },
    { key: 'browse', label: 'Browse Properties', done: hasApplication || hasAgreement, link: '/properties' },
    { key: 'apply', label: 'Apply to Rent', done: hasApplication, link: '/applications' },
    { key: 'agreement', label: 'Agreement Approved', done: hasAgreement, link: '/dashboard' },
    { key: 'caution', label: 'Pay Caution Fee', done: cautionPaid, link: '/payments' },
  ];
  const completed = steps.filter(s => s.done).length;
  const progress = Math.round((completed / steps.length) * 100);

  const showGettingStarted = !agreement && (appsCounts.total === 0);

  const handlePay = async (type) => {
    if (!agreement) {
      toast.error('No active agreement found.');
      return;
    }
    try {
      const res = await paymentAPI.initializePayment({ payment_type: type, agreement_id: agreement.id });
      const { access_code, authorization_url, reference } = res.data || {};

      // Prefer inline popup (shows all payment channels) over redirect
      if (access_code && window.PaystackPop) {
        const popup = new window.PaystackPop();
        popup.resumeTransaction(access_code, {
          onSuccess: async (transaction) => {
            try {
              await paymentAPI.verifyPayment(transaction.reference || reference);
              toast.success('Payment successful!');
              queryClient.invalidateQueries({ queryKey: ['tenant-dashboard'] });
            } catch {
              toast.error('Payment verification failed. Contact support.');
            }
          },
          onCancel: () => {
            toast('Payment cancelled.');
          },
        });
      } else if (authorization_url) {
        window.location.href = authorization_url;
      } else {
        toast.error('Failed to start payment.');
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Payment initialization failed';
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-dark-500">
        <Loader2 className="animate-spin mr-2" /> Loading your dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-red-600">Failed to load dashboard. Please refresh.</div>
    );
  }

  const submitMaintenance = async (e) => {
    e.preventDefault();
    if (!agreement?.property?.id) {
      toast.error('No property found for your agreement.');
      return;
    }
    if (!mTitle.trim() || !mDesc.trim()) {
      toast.error('Please provide a title and description.');
      return;
    }
    setSubmitting(true);
    try {
      await maintenanceAPI.create({
        property_id: agreement.property.id,
        title: mTitle,
        description: mDesc,
        priority: mPriority,
      });
      toast.success('Maintenance request submitted');
      setShowRequest(false);
      setMTitle('');
      setMDesc('');
      setMPriority('medium');
      // Refresh dashboard to update maintenance counts
      queryClient.invalidateQueries({ queryKey: ['tenant-dashboard'] });
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to submit request';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {showGettingStarted && (
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-900 mb-2">Getting Started</h3>
          <p className="text-sm text-dark-600 mb-4">New to RentStay? Here are the basics to get you moving quickly:</p>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-dark-700">
            <li>Complete your profile details (name, phone, location).</li>
            <li>Browse properties and pick your favorites.</li>
            <li>Apply to rent properties you like from their detail pages.</li>
            <li>Message landlords to ask questions or schedule a viewing.</li>
            <li>When approved, pay rent and caution fee securely.</li>
          </ol>
          <div className="mt-4 flex gap-3">
            <a href="/properties" className="btn btn-primary btn-sm">Browse Properties</a>
            <a href="/applications" className="btn btn-secondary btn-sm">View Applications</a>
          </div>
        </div>
      )}
      {/* Top Cards - Redesigned (CTA at bottom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Next Rent */}
        <div className="rounded-xl p-4 shadow-card ring-1 ring-gray-100 bg-gradient-to-br from-primary-50 to-primary-100 h-full flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/80 text-primary rounded-xl flex items-center justify-center shadow-sm">
                <CalendarClock size={18} />
              </div>
              <p className="text-sm text-dark-700">Next Rent</p>
            </div>
          </div>
          <p className="text-2xl font-semibold text-dark-900 leading-tight">{agreement?.next_due_date ? new Date(agreement.next_due_date).toLocaleDateString() : '—'}</p>
          <div className="mt-2 inline-flex items-center text-xs px-2 py-1 rounded-full bg-white/80 text-dark-800 border border-white/60">
            ₦{Number(balances.next_payment_amount).toLocaleString()}
          </div>
          <div className="mt-auto pt-3 space-y-2">
            <button disabled={!agreement} onClick={() => handlePay('rent')} className="btn btn-primary btn-sm inline-flex items-center w-full justify-center">
              <CreditCard size={14} className="mr-1" /> Pay Now
            </button>
            {agreement && (
              <Link to={`/agreements/${agreement.id}`} className="text-primary text-xs font-medium inline-flex items-center justify-center w-full">
                View Schedule <ArrowRight size={12} className="ml-1" />
              </Link>
            )}
          </div>
        </div>

        {/* Outstanding */}
        <div className="rounded-xl p-4 shadow-card ring-1 ring-gray-100 bg-gradient-to-br from-amber-50 to-amber-100 h-full flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/80 text-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                <Wallet size={18} />
              </div>
              <p className="text-sm text-dark-700">Outstanding</p>
            </div>
          </div>
          <p className="text-2xl font-semibold text-dark-900 leading-tight">₦{Number(balances.outstanding).toLocaleString()}</p>
          <div className="mt-auto pt-3">
            <Link to="/payments" className="btn btn-secondary btn-sm inline-flex items-center w-full justify-center">
              View Payments <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>

        {/* Maintenance */}
        <div className="rounded-xl p-4 shadow-card ring-1 ring-gray-100 bg-gradient-to-br from-green-50 to-green-100 h-full flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/80 text-green-600 rounded-xl flex items-center justify-center shadow-sm">
                <Wrench size={18} />
              </div>
              <p className="text-sm text-dark-700">Maintenance</p>
            </div>
          </div>
          <p className="text-2xl font-semibold text-dark-900 leading-tight">{maintenance.open} open</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-white/80 text-dark-800 border border-white/60">{maintenance.in_progress} in progress</span>
            <span className="px-2 py-0.5 rounded-full bg-white/80 text-dark-800 border border-white/60">{maintenance.closed} closed</span>
          </div>
          <div className="mt-auto pt-3">
            <button onClick={() => setShowRequest(true)} className="btn btn-secondary btn-sm inline-flex items-center w-full justify-center">
              <Plus size={14} className="mr-1" /> New Request
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="rounded-xl p-4 shadow-card ring-1 ring-gray-100 bg-gradient-to-br from-indigo-50 to-indigo-100 h-full flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/80 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <Mail size={18} />
              </div>
              <p className="text-sm text-dark-700">Messages</p>
            </div>
          </div>
          <p className="text-2xl font-semibold text-dark-900 leading-tight">{data?.unread_messages || 0} unread</p>
          <div className="mt-2 inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-white/80 text-dark-800 border border-white/60">
            {data?.unread_notifications || 0} notifications
          </div>
          <div className="mt-auto pt-3">
            <Link to="/messages" className="btn btn-secondary btn-sm inline-flex items-center w-full justify-center">
              Open Messages <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Onboarding Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-dark-900">Your Setup Progress</h3>
          <span className="text-sm text-dark-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {steps.map(step => (
            <li key={step.key} className="flex items-center justify-between">
              <span className={`font-medium ${step.done ? 'text-dark-700' : 'text-dark-900'}`}>{step.label}</span>
              <a href={step.link} className={`text-sm ${step.done ? 'text-dark-500' : 'text-primary font-medium'}`}>{step.done ? 'Done' : 'Do it'}</a>
            </li>
          ))}
        </ul>
      </div>

      {/* Agreement & Caution Fee */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <SectionTitle>
            Rental Agreement
          </SectionTitle>
          {agreement ? (
            <div className="space-y-2 text-sm">
              <p className="text-dark-700"><span className="font-medium">Property:</span> {agreement.property.title}</p>
              <p className="text-dark-700"><span className="font-medium">Address:</span> {agreement.property.address}</p>
              <p className="text-dark-700"><span className="font-medium">Status:</span> <span className="capitalize">{agreement.status}</span></p>
              <p className="text-dark-700"><span className="font-medium">Period:</span> {new Date(agreement.start_date).toLocaleDateString()} — {new Date(agreement.end_date).toLocaleDateString()}</p>
              <div className="mt-3">
                <Link to={`/agreements/${agreement.id}`} className="inline-flex items-center text-primary hover:text-primary-600 font-medium">
                  <FileText size={16} className="mr-2" /> View Agreement
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-dark-600">No active rental agreement yet.</p>
          )}
        </div>

        <div className="card">
          <SectionTitle>Caution Fee</SectionTitle>
          {caution ? (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-dark-600">Principal</p>
                <p className="text-2xl font-semibold text-dark-900">₦{Number(caution.principal).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-dark-600">Interest</p>
                <p className="text-2xl font-semibold text-dark-900">₦{Number(caution.interest_accrued).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-dark-600">Refundable</p>
                <p className="text-2xl font-semibold text-dark-900">₦{Number(caution.refundable_amount).toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <p className="text-dark-600">No caution fee record yet.</p>
          )}
        </div>
      </div>

      {/* Legal Documents & Agreements */}
      <LegalDocumentsCard
        showRequired={true}
        title="Important Agreements"
      />

      {/* Quick Actions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-900">Quick Actions</h3>
          <div className="flex gap-3">
            <button onClick={() => handlePay('rent')} className="btn btn-primary inline-flex items-center">
              <CreditCard size={16} className="mr-2" /> Pay Rent
            </button>
            <button onClick={() => handlePay('caution_fee')} className="btn btn-secondary inline-flex items-center">
              <CreditCard size={16} className="mr-2" /> Pay Caution Fee
            </button>
            <button onClick={() => setShowRequest(true)} className="btn btn-accent inline-flex items-center">
              <Plus size={16} className="mr-2" /> Request Maintenance
            </button>
          </div>
        </div>

        {showRequest && (
          <form onSubmit={submitMaintenance} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="label">Title</label>
              <input value={mTitle} onChange={(e) => setMTitle(e.target.value)} className="input" placeholder="e.g., Leaking sink" />
            </div>
            <div className="md:col-span-1">
              <label className="label">Priority</label>
              <select value={mPriority} onChange={(e) => setMPriority(e.target.value)} className="input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="label">Description</label>
              <textarea value={mDesc} onChange={(e) => setMDesc(e.target.value)} className="input min-h-[100px]" placeholder="Describe the issue and location..." />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button type="button" onClick={() => setShowRequest(false)} className="btn">Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Recent Payments */}
      <div className="card">
        <SectionTitle>Recent Payments</SectionTitle>
        {payments.length === 0 ? (
          <p className="text-dark-600 text-sm">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-dark-600">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="py-2 pr-4">{new Date(p.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-4 capitalize">{p.payment_type?.replace('_', ' ')}</td>
                    <td className="py-2 pr-4">₦{Number(p.amount).toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${p.status === 'success' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Applications */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clipboard className="text-primary" size={18} />
            <h3 className="text-lg font-semibold text-dark-900">Applications</h3>
          </div>
          <a href="/applications" className="text-primary text-sm font-medium">View All</a>
        </div>
        <p className="text-sm text-dark-600 mb-3">
          Applications are requests you send to landlords to rent a property. Track your pending, approved, or rejected applications here.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard icon={Clipboard} label="Total" value={appsCounts.total} />
          <StatCard icon={Clipboard} label="Pending" value={appsCounts.pending} />
          <StatCard icon={Clipboard} label="Approved" value={appsCounts.approved} />
          <StatCard icon={Clipboard} label="Rejected" value={appsCounts.rejected} />
        </div>
        {appsCounts.total === 0 ? (
          <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm text-dark-700">You haven’t applied for any property yet.</p>
            <a href="/properties" className="btn btn-primary btn-sm">Browse Properties</a>
          </div>
        ) : appsRecent.length === 0 ? (
          <p className="text-dark-600 text-sm">No recent applications.</p>
        ) : (
          <ul className="text-sm space-y-2">
            {appsRecent.map(a => (
              <li key={a.id} className="flex items-center justify-between">
                <span className="text-dark-700">{a.property__title}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${a.status === 'approved' ? 'bg-green-100 text-green-700' : a.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;
