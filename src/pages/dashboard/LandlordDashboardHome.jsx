import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardAPI, maintenanceAPI, applicationAPI, propertyAPI } from '../../services/api';
import { Loader2, Home, Users, Briefcase, Wrench, TrendingUp, AlertTriangle, CheckCircle, Play, XCircle, Send, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import LegalDocumentsCard from '../../components/dashboard/LegalDocumentsCard';

const gradients = [
  'from-primary-50 to-primary-100',
  'from-amber-50 to-amber-100',
  'from-green-50 to-green-100',
  'from-rose-50 to-rose-100',
  'from-indigo-50 to-indigo-100',
  'from-sky-50 to-sky-100',
  'from-emerald-50 to-emerald-100',
  'from-violet-50 to-violet-100',
];

const Sparkline = ({ data = [] }) => {
  if (!data || data.length < 2) return null;
  const values = data.map((v) => Number(v || 0));
  const max = Math.max(...values, 1);
  const height = 28;
  const width = (values.length - 1) * 14 + 1;
  const points = values.map((v, i) => `${i * 14},${Math.round(height - (v / max) * height)}`);
  const d = points.reduce((acc, p, i) => (i === 0 ? `M ${p}` : acc + ` L ${p}`), '');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="mt-2">
      <path d={d} stroke="currentColor" className="text-primary" strokeWidth="2" fill="none" />
    </svg>
  );
};

const KPI = ({ icon: Icon, label, value, sub, gradient = gradients[0], trend, to }) => {
  const content = (
    <div className={`rounded-xl p-4 shadow-card ring-1 ring-gray-100 bg-gradient-to-br ${gradient} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/70 text-primary rounded-lg flex items-center justify-center shadow-sm">
            <Icon size={20} />
          </div>
          <div>
            <p className="text-dark-700 text-sm">{label}</p>
            <p className="text-2xl font-semibold text-dark-900 leading-tight">{value}</p>
            {sub && <p className="text-xs text-dark-600 mt-0.5">{sub}</p>}
          </div>
        </div>
      </div>
      {trend && trend.length > 1 && <Sparkline data={trend} />}
    </div>
  );
  if (to) return <Link to={to}>{content}</Link>;
  return content;
};

const LandlordDashboardHome = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['landlord-dashboard'],
    queryFn: () => dashboardAPI.getLandlord().then(res => res.data),
  });
  const [topAnalytics, setTopAnalytics] = useState({});
  const [broadcastAllOpen, setBroadcastAllOpen] = useState(false);
  const [myProps, setMyProps] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bcForm, setBcForm] = useState({ title: '', message: '' });
  const [sending, setSending] = useState(false);
  const [selectedMaint, setSelectedMaint] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const m = data?.metrics || {};
  const topProps = data?.properties_top || [];
  const recent = data?.payments_recent || [];
  const maintenance = data?.maintenance_open_list || [];
  const maintenancePreview = (maintenance || []).slice(0, 3);
  const hasMoreMaintenance = (maintenance || []).length > maintenancePreview.length;
  const appsPending = data?.applications_pending_list || [];
  const rev6 = data?.revenue_last_6 || [];
  const arrears = data?.arrears_list || [];
  const upcoming = data?.upcoming_due_list || [];
  const tenants = data?.tenants_list || [];
  const statusCounts = m.properties_status_counts || {};

  useEffect(() => {
    const loadTopAnalytics = async () => {
      const entries = await Promise.all(
        (topProps || []).map(async (p) => {
          try {
            const res = await propertyAPI.analytics(p.id, { period: 7 });
            return [p.id, res.data];
          } catch {
            return [p.id, null];
          }
        })
      );
      const map = {};
      entries.forEach(([k, v]) => { map[k] = v; });
      setTopAnalytics(map);
    };
    if (topProps?.length) loadTopAnalytics();
  }, [topProps.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-dark-500">
        <Loader2 className="animate-spin mr-2" /> Loading your dashboard...
      </div>
    );
  }

  if (error) {
    return <div className="card text-red-600">Failed to load dashboard. Please refresh.</div>;
  }

  const setStatus = async (id, newStatus) => {
    try {
      await maintenanceAPI.setStatus(id, newStatus);
      toast.success(`Marked as ${newStatus.replace('_', ' ')}`);
      queryClient.invalidateQueries({ queryKey: ['landlord-dashboard'] });
    } catch {
      toast.error('Failed to update status');
    }
  };

  const toggleMaint = (id) => setSelectedMaint((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const clearMaintSelection = () => setSelectedMaint([]);

  const updateSelectedMaint = async (newStatus) => {
    if (!selectedMaint.length) return;
    setBulkUpdating(true);
    try {
      for (const id of selectedMaint) {
        await maintenanceAPI.setStatus(id, newStatus);
      }
      toast.success(`Updated ${selectedMaint.length} request(s)`);
      setSelectedMaint([]);
      queryClient.invalidateQueries({ queryKey: ['landlord-dashboard'] });
    } catch {
      toast.error('Failed to update some requests');
    } finally {
      setBulkUpdating(false);
    }
  };

  const openBroadcastAll = async () => {
    try {
      const res = await propertyAPI.getAll({ mine: 1, ordering: '-created_at' });
      setMyProps(res.data.results || res.data || []);
    } catch {
      setMyProps([]);
    }
    setSelectedIds([]);
    setBcForm({ title: '', message: '' });
    setBroadcastAllOpen(true);
  };

  const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const sendBroadcastAll = async () => {
    if (!bcForm.message.trim()) { toast.error('Message is required'); return; }
    if (!selectedIds.length) { toast.error('Select at least one property'); return; }
    setSending(true);
    try {
      let sent = 0;
      for (const id of selectedIds) {
        try { await propertyAPI.broadcast(id, bcForm); sent++; } catch {}
      }
      toast.success(`Broadcast sent to ${sent} properties`);
      setBroadcastAllOpen(false);
    } catch {
      toast.error('Failed to send broadcasts');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Alerts / Tasks */}
        {(Number(m.applications_pending || 0) > 0 || arrears.length > 0 || Number(m.maintenance_open || 0) > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">Pending Tasks</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              {Number(m.applications_pending || 0) > 0 && (
                <li><Link to="/dashboard/leases" className="underline">{m.applications_pending} pending application(s)</Link> need review</li>
              )}
              {arrears.length > 0 && (
                <li><Link to="/dashboard/payments" className="underline">{arrears.length} rent arrear(s)</Link> outstanding</li>
              )}
              {Number(m.maintenance_open || 0) > 0 && (
                <li><Link to="/dashboard/maintenance" className="underline">{m.maintenance_open} maintenance request(s)</Link> open</li>
              )}
            </ul>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <KPI icon={Home} label="Active Listings" value={m.properties || 0} gradient={gradients[0]} to="/dashboard/properties" />
          <KPI icon={Users} label="Occupied Units" value={statusCounts.rented || 0} gradient={gradients[2]} to="/dashboard/leases" />
          <KPI icon={AlertTriangle} label="Vacant Units" value={m.vacancies || 0} gradient={gradients[1]} to="/dashboard/properties" />
          <KPI icon={Briefcase} label="Rent Due" value={`₦${Number(m.rent_due_total || 0).toLocaleString()}`} gradient={gradients[3]} to="/dashboard/payments" />
          <KPI icon={TrendingUp} label="Rent Received (MTD)" value={`₦${Number(m.revenue_mtd || 0).toLocaleString()}`} gradient={gradients[4]} trend={(rev6 || []).map(r => Number(r.total || 0))} to="/dashboard/payments" />
          <KPI icon={Wrench} label="Open Maintenance" value={m.maintenance_open || 0} gradient={gradients[5]} to="/dashboard/maintenance" />
          <KPI icon={Users} label="Active Tenants" value={m.tenants || 0} gradient={gradients[6]} to="/dashboard/leases" />
          <KPI icon={AlertTriangle} label="Arrears" value={`₦${Number(m.arrears_total || 0).toLocaleString()}`} gradient={gradients[7]} to="/dashboard/payments" />
        </div>

        {/* Revenue Trend + Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">Properties by Status</h3>
            <ul className="text-sm space-y-2">
              {['available', 'rented', 'pending', 'maintenance'].map(s => (
                <li key={s} className="flex items-center justify-between">
                  <span className="text-dark-700 capitalize">{s}</span>
                  <span className="font-semibold">{statusCounts[s] || 0}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-dark-900">Revenue (Last 6 months)</h3>
              <span className="text-sm text-dark-600">₦{Number(m.revenue_mtd || 0).toLocaleString()} MTD</span>
            </div>
            {rev6.length === 0 ? (
              <p className="text-dark-600 text-sm">No revenue yet.</p>
            ) : (
              <div className="flex items-end gap-3 h-36">
                {(() => {
                  const max = Math.max(...rev6.map(r => Number(r.total || 0)), 1);
                  return rev6.map((r, idx) => {
                    const h = Math.max(8, Math.round((Number(r.total || 0) / max) * 140));
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1">
                        <div className="w-full max-w-[32px] bg-primary rounded-t mx-auto" style={{ height: `${h}px` }} title={`₦${Number(r.total || 0).toLocaleString()}`} />
                        <span className="text-xs text-dark-600 mt-1">{r.month.split(' ')[0]}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-dark-900">Announcements</h3>
            <button className="btn btn-primary inline-flex items-center" onClick={openBroadcastAll}>
              <Send size={16} className="mr-2" /> Send Broadcast
            </button>
          </div>
          <p className="text-sm text-dark-600">Send an update to tenants of one or more of your properties.</p>
        </div>

        {/* Top Properties */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-900">Top Properties</h3>
            <Link to="/dashboard/properties" className="text-primary text-sm font-medium inline-flex items-center gap-1">View All <ArrowRight size={14} /></Link>
          </div>
          {topProps.length === 0 ? (
            <p className="text-dark-600 text-sm">No properties yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topProps.map((p) => {
                const a = topAnalytics[p.id];
                const views = a?.views || [];
                const inquiries = a?.inquiries || [];
                const maxV = Math.max(...views, 1);
                const maxI = Math.max(...inquiries, 1);
                return (
                  <div key={p.id} className="rounded-xl p-4 border shadow-sm bg-white">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-dark-900 truncate" title={p.title}>{p.title}</p>
                        <p className="text-xs text-dark-500">{p.occupancy}</p>
                      </div>
                      {p.primary_image ? (
                        <img src={p.primary_image} alt="" className="w-20 h-14 object-cover rounded-md border flex-shrink-0" />
                      ) : (
                        <div className="w-20 h-14 rounded-md border bg-gray-100 flex items-center justify-center text-dark-400 flex-shrink-0"><Home size={16} /></div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-dark-600 mb-1">Views (7d)</p>
                        <div className="flex items-end gap-0.5 h-12">
                          {views.map((v, i) => (
                            <div key={i} className="w-1.5 bg-primary rounded-t flex-1" style={{ height: `${Math.max(4, Math.round((v / maxV) * 48))}px` }} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-dark-600 mb-1">Inquiries (7d)</p>
                        <div className="flex items-end gap-0.5 h-12">
                          {inquiries.map((v, i) => (
                            <div key={i} className="w-1.5 bg-amber-500 rounded-t flex-1" style={{ height: `${Math.max(4, Math.round((v / maxI) * 48))}px` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-dark-700">
                      <span className="mr-4">Views: {p.views_count}</span>
                      <span>Inquiries: {p.inquiries_count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Payments + Maintenance + Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-900">Recent Rent Payments</h3>
              <Link to="/dashboard/payments" className="text-primary text-xs font-medium">View all</Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-dark-600 text-sm">No rent payments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead><tr className="text-left text-dark-600"><th className="py-2 pr-3">Due</th><th className="py-2 pr-3">Amount</th><th className="py-2">Status</th></tr></thead>
                  <tbody>
                    {recent.map((r) => (
                      <tr key={r.id} className="border-t border-gray-100">
                        <td className="py-2 pr-3">{new Date(r.due_date).toLocaleDateString()}</td>
                        <td className="py-2 pr-3">₦{Number(r.amount).toLocaleString()}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.is_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {r.is_paid ? 'paid' : 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-900">Open Maintenance</h3>
              <Link to="/dashboard/maintenance" className="text-primary text-xs font-medium">View all</Link>
            </div>
            {maintenance.length === 0 ? (
              <p className="text-dark-600 text-sm">No open requests.</p>
            ) : (
              <>
                <ul className="space-y-3 text-sm">
                  {maintenancePreview.map((mt) => (
                    <li key={mt.id} className="rounded-lg border bg-white p-3">
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={selectedMaint.includes(mt.id)} onChange={() => toggleMaint(mt.id)} className="mt-1" />
                        <div className="min-w-0">
                          <p className="font-medium text-dark-900 break-words">{mt.title}</p>
                          <p className="text-dark-600 text-xs">{mt.property__title}</p>
                          <span className={`mt-1 inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${mt.priority === 'urgent' ? 'bg-red-100 text-red-700' : mt.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {mt.priority}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  {selectedMaint.length > 0 && (
                    <>
                      <span className="text-dark-600">{selectedMaint.length} selected</span>
                      <button className="text-primary underline" onClick={clearMaintSelection}>Clear</button>
                    </>
                  )}
                  <button onClick={() => updateSelectedMaint('in_progress')} className="btn btn-secondary btn-sm inline-flex items-center" disabled={bulkUpdating || !selectedMaint.length}><Play size={14} className="mr-1" /> Start</button>
                  <button onClick={() => updateSelectedMaint('completed')} className="btn btn-primary btn-sm inline-flex items-center" disabled={bulkUpdating || !selectedMaint.length}><CheckCircle size={14} className="mr-1" /> Done</button>
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-900">Pending Applications</h3>
              <Link to="/applications" className="text-primary text-xs font-medium">View all</Link>
            </div>
            {appsPending.length === 0 ? (
              <p className="text-dark-600 text-sm">No pending applications.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {appsPending.map((a) => (
                  <li key={a.id} className="border rounded-lg p-3">
                    <p className="font-medium text-dark-900">{a.tenant__first_name} {a.tenant__last_name}</p>
                    <p className="text-dark-600 text-xs">{a.property__title}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={async () => { try { await applicationAPI.approve(a.id, 'Approved'); toast.success('Approved'); queryClient.invalidateQueries({ queryKey: ['landlord-dashboard'] }); } catch { toast.error('Failed'); } }} className="btn btn-primary btn-sm inline-flex items-center"><CheckCircle size={14} className="mr-1" /> Approve</button>
                      <button onClick={async () => { try { await applicationAPI.reject(a.id, 'Rejected'); toast.success('Rejected'); queryClient.invalidateQueries({ queryKey: ['landlord-dashboard'] }); } catch { toast.error('Failed'); } }} className="btn btn-secondary btn-sm inline-flex items-center"><XCircle size={14} className="mr-1" /> Reject</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Upcoming dues */}
        {upcoming.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-dark-900">Upcoming Dues</h3>
              <Link to="/dashboard/payments" className="text-primary text-sm font-medium">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left text-dark-600"><th className="py-2 pr-4">Tenant</th><th className="py-2 pr-4">Property</th><th className="py-2 pr-4">Due</th><th className="py-2">Amount</th></tr></thead>
                <tbody>
                  {upcoming.map((u, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="py-2 pr-4">{u.rental_agreement__tenant__first_name} {u.rental_agreement__tenant__last_name}</td>
                      <td className="py-2 pr-4">{u.rental_agreement__property__title}</td>
                      <td className="py-2 pr-4">{new Date(u.due_date).toLocaleDateString()}</td>
                      <td className="py-2">₦{Number(u.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tenants */}
        {tenants.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-dark-900">Tenants</h3>
              <Link to="/dashboard/leases" className="text-primary text-sm font-medium">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left text-dark-600"><th className="py-2 pr-4">Tenant</th><th className="py-2 pr-4">Property</th><th className="py-2 pr-4">Start</th><th className="py-2 pr-4">End</th><th className="py-2">Status</th></tr></thead>
                <tbody>
                  {tenants.map((t, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="py-2 pr-4">{t.tenant__first_name} {t.tenant__last_name}</td>
                      <td className="py-2 pr-4">{t.property__title}</td>
                      <td className="py-2 pr-4">{new Date(t.start_date).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">{new Date(t.end_date).toLocaleDateString()}</td>
                      <td className="py-2 capitalize">{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <LegalDocumentsCard title="Agreements & Legal Documents" />
      </div>

      {/* Broadcast Modal */}
      {broadcastAllOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-dark-900">Send Broadcast</h3>
              <button className="text-dark-500" onClick={() => setBroadcastAllOpen(false)}>&#10005;</button>
            </div>
            <div className="space-y-4 mb-4 max-h-64 overflow-auto">
              <div>
                <p className="text-sm text-dark-600 mb-2">Select properties</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {myProps.map((p) => (
                    <label key={p.id} className="inline-flex items-center gap-2 text-sm text-dark-700">
                      <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} /> {p.title}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Title (optional)</label>
                <input className="input" value={bcForm.title} onChange={(e) => setBcForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Update" />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea className="input min-h-[120px]" value={bcForm.message} onChange={(e) => setBcForm(prev => ({ ...prev, message: e.target.value }))} placeholder="Your announcement to tenants" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={() => setBroadcastAllOpen(false)}>Cancel</button>
              <button className="btn btn-primary inline-flex items-center" onClick={sendBroadcastAll} disabled={sending}>
                {sending ? (<><Loader2 size={16} className="animate-spin mr-2" /> Sending...</>) : (<><Send size={16} className="mr-2" /> Send</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LandlordDashboardHome;
