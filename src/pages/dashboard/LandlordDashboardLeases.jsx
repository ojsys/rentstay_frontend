import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardAPI, rentalAPI, inviteAPI } from '../../services/api';
import { Loader2, FileText, CalendarClock, AlertTriangle, Users, ArrowRight, UserPlus, Mail, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import EnhancedApplicationsInbox from '../../components/dashboard/EnhancedApplicationsInbox';
import MoveOutWorkflow from '../../components/dashboard/MoveOutWorkflow';
import toast from 'react-hot-toast';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-600',
  terminated: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const sampleData = {
  landlord: 'John Landlord',
  tenant: 'Jane Tenant',
  address: '123 Example Street, Lagos',
  start_date: '2025-01-01',
  end_date: '2025-12-31',
  rent_amount: '₦1,200,000.00',
  caution_fee: '₦120,000.00',
};

function renderPreview(template) {
  let text = template || '';
  Object.entries(sampleData).forEach(([k, v]) => {
    text = text.replaceAll(`{{${k}}}`, String(v));
  });
  return text;
}

const inviteStatusColors = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
};

const InviteStatusIcon = ({ status }) => {
  if (status === 'accepted') return <CheckCircle2 size={14} className="text-green-600" />;
  if (status === 'declined') return <XCircle size={14} className="text-red-500" />;
  if (status === 'expired') return <Clock size={14} className="text-gray-400" />;
  return <Mail size={14} className="text-amber-500" />;
};

const LandlordDashboardLeases = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('leases');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');

  const [templateBody, setTemplateBody] = useState('');
  const [placeholders] = useState(['{{landlord}}','{{tenant}}','{{address}}','{{start_date}}','{{end_date}}','{{rent_amount}}','{{caution_fee}}']);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [RichTextEditor, setRichTextEditor] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['landlord-leases'],
    queryFn: () => dashboardAPI.getLandlordLeases().then(res => res.data),
  });

  const { data: invitesData, isLoading: invitesLoading, refetch: refetchInvites } = useQuery({
    queryKey: ['landlord-invites'],
    queryFn: () => inviteAPI.list().then(res => res.data),
    enabled: activeSection === 'invites',
  });

  useEffect(() => {
    if (activeSection !== 'template') return;
    const load = async () => {
      setTemplateLoading(true);
      try {
        if (!RichTextEditor) {
          const mod = await import('../../components/common/RichTextEditor');
          setRichTextEditor(() => mod.default);
        }
        const res = await rentalAPI.getTemplate();
        setTemplateBody(res.data.body || '');
      } catch (e) {
        toast.error(e?.response?.data?.detail || 'Failed to load template');
      } finally {
        setTemplateLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  const saveTemplate = async () => {
    try {
      setSaving(true);
      await rentalAPI.saveTemplate(templateBody);
      toast.success('Template saved');
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const agreements = data?.agreements || [];
  const bookings = data?.bookings || [];
  const stats = data?.stats || {};

  let items = [];
  if (typeFilter === 'all') items = [...agreements, ...bookings];
  else if (typeFilter === 'long_term') items = agreements;
  else items = bookings;

  if (statusFilter) items = items.filter(i => i.status === statusFilter);

  items.sort((a, b) => {
    const dateA = a.start_date || a.check_in || '';
    const dateB = b.start_date || b.check_in || '';
    return dateB.localeCompare(dateA);
  });

  const invites = invitesData || [];
  const pendingInvitesCount = invites.filter(i => i.status === 'pending').length;

  const sections = [
    { key: 'leases', label: 'Leases' },
    { key: 'invites', label: 'Invites', badge: pendingInvitesCount > 0 ? pendingInvitesCount : null },
    { key: 'applications', label: 'Applications' },
    { key: 'moveouts', label: 'Move-Outs' },
    { key: 'template', label: 'Template' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Leases & Bookings</h2>
        <button
          onClick={() => navigate('/dashboard/invite-tenant')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition"
        >
          <UserPlus size={15} /> Invite Tenant
        </button>
      </div>

      {/* Section tabs — scrollable pills */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`relative flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeSection === s.key
                ? 'bg-[#0C3B2E] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.label}
            {s.badge != null && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                {s.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeSection === 'applications' && <EnhancedApplicationsInbox />}
      {activeSection === 'moveouts' && <MoveOutWorkflow />}

      {/* Invites */}
      {activeSection === 'invites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Tenant Invitations</h3>
              <p className="text-sm text-gray-500">Invitations you've sent to onboard existing tenants.</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/invite-tenant')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition"
            >
              <UserPlus size={14} /> New Invite
            </button>
          </div>

          {invitesLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="animate-spin mr-2" /> Loading...
            </div>
          ) : invites.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Mail size={28} className="text-gray-400" />
              </div>
              <p className="font-semibold text-gray-800 mb-1">No invitations sent yet</p>
              <p className="text-sm text-gray-400 mb-4">Invite an existing tenant to manage their tenancy online.</p>
              <button
                onClick={() => navigate('/dashboard/invite-tenant')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition"
              >
                <UserPlus size={14} /> Send First Invite
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map(invite => (
                <div key={invite.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <InviteStatusIcon status={invite.status} />
                        <h4 className="font-semibold text-gray-900 truncate">{invite.property_title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${inviteStatusColors[invite.status] || 'bg-gray-100 text-gray-600'}`}>
                          {invite.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {[invite.tenant_first_name, invite.tenant_last_name].filter(Boolean).join(' ') || invite.tenant_email}
                        {' · '}{invite.tenant_email}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        ₦{Number(invite.rent_amount).toLocaleString()} / {invite.rent_term} · {invite.lease_start} to {invite.lease_end}
                      </p>
                      {invite.status === 'pending' && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          Expires: {new Date(invite.expires_at).toLocaleDateString()}
                          {invite.is_expired && <span className="ml-1 font-medium">(expired)</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Template */}
      {activeSection === 'template' && (
        <div className="space-y-4">
          {templateLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="animate-spin mr-2" /> Loading template...
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Edit Template</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Use placeholders: {placeholders.join(', ')}</p>
                </div>
                <div className="p-4">
                  {RichTextEditor ? (
                    <RichTextEditor value={templateBody} onChange={(val) => setTemplateBody(val)} />
                  ) : (
                    <textarea className="input w-full min-h-[200px]" value={templateBody} onChange={(e) => setTemplateBody(e.target.value)} />
                  )}
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={saveTemplate}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-60"
                    >
                      {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Template'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Preview</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Example preview with sample values</p>
                </div>
                <div className="p-4 prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: renderPreview(templateBody) }} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Leases section */}
      {activeSection === 'leases' && (
        <>
          {/* Stats — compact 4-card row */}
          <div className="grid grid-cols-4 gap-2 md:gap-4">
            {[
              { icon: FileText, label: 'Active', value: stats.active || 0, color: 'text-[#0C3B2E]', bg: 'bg-green-50' },
              { icon: CalendarClock, label: 'Expiring', value: stats.expiring_soon || 0, color: 'text-amber-500', bg: 'bg-amber-50' },
              { icon: Users, label: 'Total', value: stats.total_agreements || 0, color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: AlertTriangle, label: 'Bookings', value: stats.total_bookings || 0, color: 'text-indigo-500', bg: 'bg-indigo-50' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center gap-1">
                <div className={`w-7 h-7 md:w-9 md:h-9 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon size={14} className={`md:w-4 md:h-4 ${color}`} />
                </div>
                <p className="text-lg md:text-xl font-bold text-gray-900 leading-tight">{value}</p>
                <p className="text-[10px] text-gray-400 font-medium text-center leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2">
            {/* Type switcher */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[['all', 'All'], ['long_term', 'Long-Term'], ['short_term', 'Short-Term']].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setTypeFilter(v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    typeFilter === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            {/* Status pills */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {['', 'active', 'expired', 'terminated', 'pending', 'confirmed'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    statusFilter === s ? 'bg-[#0C3B2E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === '' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="animate-spin mr-2" /> Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No leases or bookings found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={`${item.type}-${item.id}-${idx}`} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">{item.property_title || item.listing_title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[item.status] || 'bg-gray-100 text-gray-600'}`}>
                          {item.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.type === 'long_term' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {item.type === 'long_term' ? 'Long-Term' : 'Short-Term'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.type === 'long_term' ? (
                          <>Tenant: {item.tenant_name} &middot; ₦{Number(item.rent_amount).toLocaleString()}/yr</>
                        ) : (
                          <>Guest: {item.guest_name} &middot; ₦{Number(item.total_price).toLocaleString()}</>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.type === 'long_term' ? (
                          <>{item.start_date} to {item.end_date}</>
                        ) : (
                          <>Check-in: {item.check_in} &middot; Check-out: {item.check_out}</>
                        )}
                      </p>
                      {item.type === 'long_term' && (
                        <div className="flex gap-3 mt-1">
                          <span className={`text-xs font-medium ${item.rent_paid ? 'text-green-600' : 'text-amber-600'}`}>
                            {item.rent_paid ? 'Rent Paid' : 'Rent Unpaid'}
                          </span>
                          <span className={`text-xs font-medium ${item.caution_fee_paid ? 'text-green-600' : 'text-amber-600'}`}>
                            {item.caution_fee_paid ? 'Caution Paid' : 'Caution Unpaid'}
                          </span>
                        </div>
                      )}
                    </div>
                    {item.type === 'long_term' && (
                      <Link
                        to={`/agreements/${item.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition flex-shrink-0"
                      >
                        View <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LandlordDashboardLeases;
