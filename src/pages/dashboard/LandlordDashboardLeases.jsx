import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardAPI, rentalAPI } from '../../services/api';
import { Loader2, FileText, CalendarClock, AlertTriangle, Users, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import EnhancedApplicationsInbox from '../../components/dashboard/EnhancedApplicationsInbox';
import MoveOutWorkflow from '../../components/dashboard/MoveOutWorkflow';
import toast from 'react-hot-toast';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-dark-600',
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

const LandlordDashboardLeases = () => {
  const [activeSection, setActiveSection] = useState('leases');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');

  // Template state
  const [templateBody, setTemplateBody] = useState('');
  const [placeholders, setPlaceholders] = useState(['{{landlord}}','{{tenant}}','{{address}}','{{start_date}}','{{end_date}}','{{rent_amount}}','{{caution_fee}}']);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [RichTextEditor, setRichTextEditor] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['landlord-leases'],
    queryFn: () => dashboardAPI.getLandlordLeases().then(res => res.data),
  });

  // Lazy-load RichTextEditor and template data when template tab is active
  useEffect(() => {
    if (activeSection !== 'template') return;
    const load = async () => {
      setTemplateLoading(true);
      try {
        // Dynamic import of RichTextEditor
        if (!RichTextEditor) {
          const mod = await import('../../components/common/RichTextEditor');
          setRichTextEditor(() => mod.default);
        }
        const res = await rentalAPI.getTemplate();
        setTemplateBody(res.data.body || '');
        if (res.data.placeholders) setPlaceholders(res.data.placeholders);
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

  const sections = [
    { key: 'leases', label: 'Leases & Bookings' },
    { key: 'applications', label: 'Applications' },
    { key: 'moveouts', label: 'Move-Outs' },
    { key: 'template', label: 'Template' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark-900">Leases & Bookings</h2>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${activeSection === s.key ? 'bg-white shadow-sm text-dark-900' : 'text-dark-600 hover:text-dark-900'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'applications' && <EnhancedApplicationsInbox />}
      {activeSection === 'moveouts' && <MoveOutWorkflow />}

      {/* Template sub-tab */}
      {activeSection === 'template' && (
        <div className="space-y-6">
          {templateLoading ? (
            <div className="flex items-center justify-center py-12 text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading template...</div>
          ) : (
            <>
              <div className="card">
                <h3 className="text-lg font-semibold text-dark-900 mb-2">Edit Template</h3>
                <p className="text-sm text-dark-600 mb-3">Use placeholders: {placeholders.join(', ')}</p>
                {RichTextEditor ? (
                  <RichTextEditor value={templateBody} onChange={(val) => setTemplateBody(val)} />
                ) : (
                  <textarea className="input min-h-[200px]" value={templateBody} onChange={(e) => setTemplateBody(e.target.value)} />
                )}
                <div className="flex justify-end mt-4">
                  <button className="btn btn-primary" onClick={saveTemplate} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-dark-900 mb-2">Preview</h3>
                <p className="text-sm text-dark-600 mb-3">Example preview with sample values</p>
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: renderPreview(templateBody) }} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeSection === 'leases' && <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <FileText size={20} className="mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold text-dark-900">{stats.active || 0}</p>
          <p className="text-xs text-dark-600">Active Leases</p>
        </div>
        <div className="card text-center">
          <CalendarClock size={20} className="mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold text-dark-900">{stats.expiring_soon || 0}</p>
          <p className="text-xs text-dark-600">Expiring Soon</p>
        </div>
        <div className="card text-center">
          <Users size={20} className="mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold text-dark-900">{stats.total_agreements || 0}</p>
          <p className="text-xs text-dark-600">Total Agreements</p>
        </div>
        <div className="card text-center">
          <AlertTriangle size={20} className="mx-auto text-indigo-500 mb-1" />
          <p className="text-2xl font-bold text-dark-900">{stats.total_bookings || 0}</p>
          <p className="text-xs text-dark-600">Stay Bookings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[['all', 'All'], ['long_term', 'Long-Term'], ['short_term', 'Short-Term']].map(([v, l]) => (
            <button key={v} onClick={() => setTypeFilter(v)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${typeFilter === v ? 'bg-white shadow-sm text-dark-900' : 'text-dark-600'}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {['', 'active', 'expired', 'terminated', 'pending', 'confirmed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'}`}>
              {s === '' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12">
          <FileText size={48} className="mx-auto text-dark-300 mb-3" />
          <p className="text-dark-600">No leases or bookings found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={`${item.type}-${item.id}-${idx}`} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-dark-900 truncate">{item.property_title || item.listing_title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[item.status] || 'bg-gray-100 text-dark-600'}`}>{item.status}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.type === 'long_term' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'}`}>
                      {item.type === 'long_term' ? 'Long-Term' : 'Short-Term'}
                    </span>
                  </div>
                  <p className="text-sm text-dark-600">
                    {item.type === 'long_term' ? (
                      <>Tenant: {item.tenant_name} &middot; ₦{Number(item.rent_amount).toLocaleString()}/yr</>
                    ) : (
                      <>Guest: {item.guest_name} &middot; ₦{Number(item.total_price).toLocaleString()}</>
                    )}
                  </p>
                  <p className="text-xs text-dark-500 mt-0.5">
                    {item.type === 'long_term' ? (
                      <>{item.start_date} to {item.end_date}</>
                    ) : (
                      <>Check-in: {item.check_in} &middot; Check-out: {item.check_out}</>
                    )}
                  </p>
                  {item.type === 'long_term' && (
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className={item.rent_paid ? 'text-green-600' : 'text-amber-600'}>{item.rent_paid ? 'Rent Paid' : 'Rent Unpaid'}</span>
                      <span className={item.caution_fee_paid ? 'text-green-600' : 'text-amber-600'}>{item.caution_fee_paid ? 'Caution Paid' : 'Caution Unpaid'}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {item.type === 'long_term' && (
                    <Link to={`/agreements/${item.id}`} className="btn btn-primary btn-sm inline-flex items-center gap-1">View <ArrowRight size={14} /></Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>}
    </div>
  );
};

export default LandlordDashboardLeases;
