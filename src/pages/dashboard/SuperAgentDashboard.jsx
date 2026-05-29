import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Building2, Users, FileText, Wrench, TrendingUp, Search,
  ChevronRight, CheckCircle, XCircle, Clock, BarChart2, UserPlus,
  Home, LogOut, Bed, Calendar, ShieldCheck, ShieldOff, UserCheck,
  UserX, Plus, RefreshCw, MapPin,
} from 'lucide-react';
import { superAgentAPI, propertyAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

/* ── helpers ─────────────────────────────────────────────────── */

const StatCard = ({ icon: Icon, label, value, sub, color = 'sky' }) => {
  const bg = {
    sky: 'bg-sky-50 text-sky-600', amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600', rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600', indigo: 'bg-indigo-50 text-indigo-600',
  };
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${bg[color]}`}><Icon size={22} /></div>
      <div>
        <p className="text-2xl font-bold text-dark-900">{value ?? '—'}</p>
        <p className="text-sm font-medium text-dark-600">{label}</p>
        {sub && <p className="text-xs text-dark-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const Badge = ({ text, color = 'gray' }) => {
  const cls = {
    green: 'bg-green-100 text-green-700', amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700', sky: 'bg-sky-100 text-sky-700',
    gray: 'bg-gray-100 text-gray-600', violet: 'bg-violet-100 text-violet-700',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${cls[color]}`}>{text}</span>;
};

const TABS = ['Overview', 'Properties', 'Stays', 'Leases', 'Applications', 'Agents', 'Maintenance', 'Users'];

/* ── main component ─────────────────────────────────────────── */

export default function SuperAgentDashboard() {
  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState('Overview');
  const qc = useQueryClient();

  // Overview
  const { data: dash, isLoading: dashLoading } = useQuery({
    queryKey: ['sa-dashboard'],
    queryFn: () => superAgentAPI.getDashboard().then(r => r.data),
  });

  // Properties tab
  const [propSearch, setPropSearch] = useState('');
  const [propStatus, setPropStatus] = useState('');
  const { data: allProps, isLoading: propsLoading } = useQuery({
    queryKey: ['sa-properties', propSearch, propStatus],
    queryFn: () => superAgentAPI.getAllProperties({ search: propSearch, status: propStatus }).then(r => r.data),
    enabled: tab === 'Properties',
  });

  // Stays tab
  const [listingSearch, setListingSearch] = useState('');
  const [listingStatus, setListingStatus] = useState('');
  const { data: allListings, isLoading: listingsLoading } = useQuery({
    queryKey: ['sa-listings', listingSearch, listingStatus],
    queryFn: () => superAgentAPI.getAllListings({ search: listingSearch, status: listingStatus }).then(r => r.data),
    enabled: tab === 'Stays',
  });

  // Bookings (inside Stays tab)
  const { data: allBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['sa-bookings'],
    queryFn: () => superAgentAPI.getAllBookings().then(r => r.data),
    enabled: tab === 'Stays',
  });

  // Leases tab
  const [leaseSearch, setLeaseSearch] = useState('');
  const [leaseStatus, setLeaseStatus] = useState('');
  const { data: allLeases, isLoading: leasesLoading } = useQuery({
    queryKey: ['sa-leases', leaseSearch, leaseStatus],
    queryFn: () => superAgentAPI.getAllAgreements({ search: leaseSearch, status: leaseStatus }).then(r => r.data),
    enabled: tab === 'Leases',
  });

  // Agents tab
  const [agentSearch, setAgentSearch] = useState('');
  const [supervisedOnly, setSupervisedOnly] = useState(false);
  const [assignAgentModal, setAssignAgentModal] = useState(null); // { propertyId, propertyTitle }
  const [agentToAssign, setAgentToAssign] = useState('');
  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['sa-agents', agentSearch, supervisedOnly],
    queryFn: () => superAgentAPI.getAgents({ search: agentSearch, supervised: supervisedOnly ? '1' : '' }).then(r => r.data),
    enabled: tab === 'Agents',
  });

  // Users tab
  const [userSearch, setUserSearch] = useState('');
  const [userType, setUserType] = useState('');
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['sa-users', userSearch, userType],
    queryFn: () => superAgentAPI.getUsers({ search: userSearch, user_type: userType }).then(r => r.data),
    enabled: tab === 'Users',
  });

  // Mutations
  const appMut = useMutation({
    mutationFn: ({ id, status }) => superAgentAPI.actionApplication(id, status),
    onSuccess: (_, { status }) => { toast.success(`Application ${status}`); qc.invalidateQueries(['sa-dashboard']); },
    onError: () => toast.error('Action failed'),
  });

  const superviseMut = useMutation({
    mutationFn: ({ agentId, action }) =>
      action === 'assign' ? superAgentAPI.superviseAgent(agentId) : superAgentAPI.unsuperviseAgent(agentId),
    onSuccess: (r) => { toast.success(r.data.detail); qc.invalidateQueries(['sa-agents']); },
    onError: () => toast.error('Failed'),
  });

  const assignAgentMut = useMutation({
    mutationFn: ({ propertyId, agentId }) =>
      agentId ? superAgentAPI.assignAgentToProperty(propertyId, agentId)
               : superAgentAPI.removeAgentFromProperty(propertyId),
    onSuccess: (r) => { toast.success(r.data.detail); setAssignAgentModal(null); qc.invalidateQueries(['sa-properties']); },
    onError: (e) => toast.error(e?.response?.data?.detail || 'Failed'),
  });

  const m = dash?.metrics;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container-custom flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-dark-900 leading-none">Super Agent Portal</p>
              <p className="text-xs text-primary font-medium">{user?.full_name || user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/properties/new/wizard" className="btn btn-primary btn-sm hidden sm:flex items-center gap-1">
              <Plus size={14} /> Add Property
            </Link>
            <Link to="/stays/listings/new" className="btn btn-sm border border-primary text-primary hidden sm:flex items-center gap-1 hover:bg-primary/5">
              <Bed size={14} /> Host Stay
            </Link>
            <button onClick={logout} className="flex items-center gap-1 text-sm text-dark-500 hover:text-rose-600">
              <LogOut size={16} />
            </button>
          </div>
        </div>
        {/* Tab nav */}
        <div className="container-custom flex gap-0 overflow-x-auto pb-0 scrollbar-none">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-dark-500 hover:text-dark-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="container-custom py-6 space-y-6">

        {/* ── OVERVIEW ────────────────────────────────────────── */}
        {tab === 'Overview' && (
          <>
            {dashLoading ? <Loading /> : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <StatCard icon={Building2} label="Properties" value={m?.total_properties} color="sky" />
                  <StatCard icon={Users} label="Landlords" value={m?.total_landlords} sub={`+${m?.new_landlords_30d} this month`} color="violet" />
                  <StatCard icon={Home} label="Tenants" value={m?.total_tenants} sub={`+${m?.new_tenants_30d} this month`} color="green" />
                  <StatCard icon={FileText} label="Active Leases" value={m?.active_agreements} color="amber" />
                  <StatCard icon={Clock} label="Pending Apps" value={m?.pending_applications} color="amber" />
                  <StatCard icon={Wrench} label="Open Maintenance" value={m?.open_maintenance} color="rose" />
                  <StatCard icon={Bed} label="Stay Listings" value={m?.total_listings} color="sky" />
                  <StatCard icon={Calendar} label="Pending Bookings" value={m?.pending_bookings} color="indigo" />
                  <StatCard icon={TrendingUp} label="Revenue MTD" value={`₦${Number(m?.revenue_mtd || 0).toLocaleString()}`} color="green" />
                  <StatCard icon={UserCheck} label="My Agents" value={m?.supervised_agents} color="violet" />
                </div>

                {/* Revenue chart */}
                <div className="card p-5">
                  <h3 className="font-semibold text-dark-800 mb-4 flex items-center gap-2">
                    <BarChart2 size={18} className="text-primary" /> Revenue – Last 6 Months
                  </h3>
                  <div className="flex items-end gap-2 h-28">
                    {dash?.revenue_last_6?.map(r => {
                      const max = Math.max(...dash.revenue_last_6.map(x => Number(x.total)), 1);
                      const pct = Math.round((Number(r.total) / max) * 100);
                      return (
                        <div key={r.month} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-primary/80 rounded-t" style={{ height: `${Math.max(pct, 4)}%` }} title={`₦${Number(r.total).toLocaleString()}`} />
                          <p className="text-[10px] text-dark-400">{r.month.split(' ')[0]}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent sign-ups */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card p-5">
                    <h3 className="font-semibold text-dark-800 mb-3 flex items-center gap-2"><UserPlus size={16} className="text-violet-500" /> Recent Landlords</h3>
                    <UserList items={dash?.recent_landlords} />
                  </div>
                  <div className="card p-5">
                    <h3 className="font-semibold text-dark-800 mb-3 flex items-center gap-2"><UserPlus size={16} className="text-green-500" /> Recent Tenants</h3>
                    <UserList items={dash?.recent_tenants} />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── PROPERTIES ──────────────────────────────────────── */}
        {tab === 'Properties' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input className="input pl-9 w-full" placeholder="Search title, address, email…" value={propSearch} onChange={e => setPropSearch(e.target.value)} />
                </div>
                <select className="input w-auto" value={propStatus} onChange={e => setPropStatus(e.target.value)}>
                  <option value="">All statuses</option>
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Link to="/agent/add-property" className="btn btn-primary btn-sm flex items-center gap-1"><Plus size={14} /> Add Property</Link>
              </div>
            </div>

            <div className="card overflow-hidden">
              {propsLoading ? <Loading /> : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-dark-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Property</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Landlord</th>
                      <th className="px-4 py-3 text-left hidden lg:table-cell">Agent</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(allProps || []).length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-dark-400">No properties found</td></tr>
                    )}
                    {(allProps || []).map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-dark-800 truncate max-w-[180px]">{p.title}</p>
                          <p className="text-xs text-dark-400 flex items-center gap-1"><MapPin size={10} /> {p.address?.slice(0, 40)}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-dark-600">{p.landlord?.email || '—'}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {p.agent ? (
                            <span className="text-xs text-dark-600">{p.agent?.email || 'Assigned'}</span>
                          ) : (
                            <span className="text-xs text-dark-400">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge text={p.status} color={p.status === 'available' ? 'green' : p.status === 'rented' ? 'sky' : 'amber'} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link to={`/properties/${p.id}/edit`} className="text-xs text-primary hover:underline">Edit</Link>
                            <button
                              onClick={() => setAssignAgentModal({ propertyId: p.id, propertyTitle: p.title, currentAgent: p.agent })}
                              className="text-xs text-violet-600 hover:underline"
                            >
                              {p.agent ? 'Reassign' : 'Assign'} Agent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── STAYS ───────────────────────────────────────────── */}
        {tab === 'Stays' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input className="input pl-9 w-full" placeholder="Title or owner email…" value={listingSearch} onChange={e => setListingSearch(e.target.value)} />
                </div>
                <select className="input w-auto" value={listingStatus} onChange={e => setListingStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <Link to="/stays/listings/new" className="btn btn-primary btn-sm flex items-center gap-1"><Plus size={14} /> Host for Owner</Link>
            </div>

            {/* Listings */}
            <div>
              <h3 className="font-semibold text-dark-800 mb-3">All Listings</h3>
              <div className="card overflow-hidden">
                {listingsLoading ? <Loading /> : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-dark-500 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Listing</th>
                        <th className="px-4 py-3 text-left hidden md:table-cell">Owner</th>
                        <th className="px-4 py-3 text-left">Rate</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(allListings || []).length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-6 text-center text-dark-400">No listings found</td></tr>
                      )}
                      {(allListings || []).map(l => (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-dark-800 truncate max-w-[180px]">{l.title}</p>
                            <p className="text-xs text-dark-400 capitalize">{l.listing_type}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-dark-600 text-xs">{l.owner?.email || '—'}</td>
                          <td className="px-4 py-3 font-medium">₦{Number(l.nightly_rate).toLocaleString()}/night</td>
                          <td className="px-4 py-3">
                            <Badge text={l.status} color={l.status === 'published' ? 'green' : l.status === 'draft' ? 'amber' : 'rose'} />
                          </td>
                          <td className="px-4 py-3">
                            <Link to={`/stays/listings/${l.id}/edit`} className="text-xs text-primary hover:underline">Manage</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Bookings */}
            <div>
              <h3 className="font-semibold text-dark-800 mb-3">All Bookings</h3>
              <div className="card overflow-hidden">
                {bookingsLoading ? <Loading /> : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-dark-500 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Listing</th>
                        <th className="px-4 py-3 text-left hidden md:table-cell">Guest</th>
                        <th className="px-4 py-3 text-left hidden lg:table-cell">Dates</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(allBookings || []).length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-6 text-center text-dark-400">No bookings found</td></tr>
                      )}
                      {(allBookings || []).map(b => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium truncate max-w-[150px]">{b.listing?.title || `Listing #${b.listing}`}</td>
                          <td className="px-4 py-3 hidden md:table-cell text-dark-600 text-xs">{b.guest?.email || '—'}</td>
                          <td className="px-4 py-3 hidden lg:table-cell text-xs text-dark-500">{b.check_in} → {b.check_out}</td>
                          <td className="px-4 py-3 font-medium">₦{Number(b.amount_total).toLocaleString()}</td>
                          <td className="px-4 py-3"><BookingBadge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── LEASES ──────────────────────────────────────────── */}
        {tab === 'Leases' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input className="input pl-9 w-full" placeholder="Search tenant, landlord, property…" value={leaseSearch} onChange={e => setLeaseSearch(e.target.value)} />
              </div>
              <select className="input w-auto" value={leaseStatus} onChange={e => setLeaseStatus(e.target.value)}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="card overflow-hidden">
              {leasesLoading ? <Loading /> : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-dark-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Property</th>
                      <th className="px-4 py-3 text-left">Tenant</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Landlord</th>
                      <th className="px-4 py-3 text-left hidden lg:table-cell">Rent</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(allLeases || []).length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-dark-400">No agreements found</td></tr>
                    )}
                    {(allLeases || []).map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium truncate max-w-[160px]">{a.property?.title}</td>
                        <td className="px-4 py-3 text-xs text-dark-600">{a.tenant?.email}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-dark-600">{a.landlord?.email}</td>
                        <td className="px-4 py-3 hidden lg:table-cell font-medium">₦{Number(a.rent_amount).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Badge text={a.status} color={a.status === 'active' ? 'green' : a.status === 'expired' ? 'gray' : a.status === 'terminated' ? 'rose' : 'amber'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── APPLICATIONS ────────────────────────────────────── */}
        {tab === 'Applications' && (
          <div className="card p-5">
            <h3 className="font-semibold text-dark-800 mb-4">All Pending Rental Applications</h3>
            {dashLoading ? <Loading /> : (dash?.pending_applications_list || []).length === 0 ? (
              <p className="text-sm text-dark-400">No pending applications.</p>
            ) : (
              <div className="divide-y">
                {(dash?.pending_applications_list || []).map(app => (
                  <div key={app.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-dark-800">
                        {app.tenant__first_name} {app.tenant__last_name}
                        <span className="text-dark-400 font-normal"> applied for </span>
                        {app.property__title}
                      </p>
                      <p className="text-xs text-dark-400">
                        Landlord: {app.landlord__first_name} {app.landlord__last_name} · {new Date(app.created_at).toLocaleDateString()}
                      </p>
                      {app.message && <p className="text-xs text-dark-500 mt-1 italic">"{app.message}"</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => appMut.mutate({ id: app.id, status: 'approved' })} disabled={appMut.isPending}
                        className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-60">
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button onClick={() => appMut.mutate({ id: app.id, status: 'rejected' })} disabled={appMut.isPending}
                        className="flex items-center gap-1 text-xs bg-rose-600 text-white px-3 py-1.5 rounded hover:bg-rose-700 disabled:opacity-60">
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── AGENTS ──────────────────────────────────────────── */}
        {tab === 'Agents' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center justify-between">
              <div className="flex gap-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input className="input pl-9 w-64" placeholder="Search agents…" value={agentSearch} onChange={e => setAgentSearch(e.target.value)} />
                </div>
                <button
                  onClick={() => setSupervisedOnly(v => !v)}
                  className={`btn btn-sm flex items-center gap-1 ${supervisedOnly ? 'bg-violet-100 text-violet-700 border-violet-300' : 'border text-dark-600'}`}
                >
                  <UserCheck size={14} /> {supervisedOnly ? 'Supervised' : 'All Agents'}
                </button>
              </div>
              <p className="text-sm text-dark-500">Supervise agents to track their performance and assign them to properties.</p>
            </div>

            <div className="card overflow-hidden">
              {agentsLoading ? <Loading /> : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-dark-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Agent</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Properties</th>
                      <th className="px-4 py-3 text-left hidden lg:table-cell">Earned</th>
                      <th className="px-4 py-3 text-left hidden lg:table-cell">Balance</th>
                      <th className="px-4 py-3 text-left">Supervised</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(agentsData?.agents || []).length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-dark-400">No agents found</td></tr>
                    )}
                    {(agentsData?.agents || []).map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-dark-800">{a.first_name} {a.last_name}</p>
                          <p className="text-xs text-dark-400">{a.email}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-center">{a.property_count}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">₦{Number(a.total_earned).toLocaleString()}</td>
                        <td className="px-4 py-3 hidden lg:table-cell font-medium text-green-600">₦{Number(a.available_balance).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {a.is_supervised
                            ? <Badge text="Supervised" color="violet" />
                            : <Badge text="Independent" color="gray" />}
                        </td>
                        <td className="px-4 py-3">
                          {a.is_supervised ? (
                            <button onClick={() => superviseMut.mutate({ agentId: a.id, action: 'remove' })} disabled={superviseMut.isPending}
                              className="flex items-center gap-1 text-xs text-rose-600 hover:underline">
                              <UserX size={12} /> Remove
                            </button>
                          ) : (
                            <button onClick={() => superviseMut.mutate({ agentId: a.id, action: 'assign' })} disabled={superviseMut.isPending}
                              className="flex items-center gap-1 text-xs text-violet-600 hover:underline">
                              <UserCheck size={12} /> Supervise
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── MAINTENANCE ─────────────────────────────────────── */}
        {tab === 'Maintenance' && (
          <div className="card p-5">
            <h3 className="font-semibold text-dark-800 mb-4">Open Maintenance Requests</h3>
            {dashLoading ? <Loading /> : (dash?.open_maintenance_list || []).length === 0 ? (
              <p className="text-sm text-dark-400">No open maintenance requests.</p>
            ) : (
              <div className="divide-y">
                {(dash?.open_maintenance_list || []).map(req => (
                  <div key={req.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-dark-800">{req.title}</p>
                      <p className="text-xs text-dark-400">{req.property__title} · {req.tenant__first_name} {req.tenant__last_name}</p>
                      <p className="text-xs text-dark-400">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge text={req.priority} color={{ urgent: 'rose', high: 'amber', medium: 'sky', low: 'gray' }[req.priority] || 'gray'} />
                      <span className="text-xs text-dark-400 capitalize">{req.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USERS ───────────────────────────────────────────── */}
        {tab === 'Users' && (
          <div className="space-y-4">
            <div className="card p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input className="input pl-9 w-full" placeholder="Name, email, or phone…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
              <select className="input w-auto" value={userType} onChange={e => setUserType(e.target.value)}>
                <option value="">All types</option>
                <option value="landlord">Landlords</option>
                <option value="tenant">Tenants</option>
                <option value="agent">Agents</option>
              </select>
            </div>
            <div className="card p-5">
              {usersLoading ? <Loading /> : (usersData?.users || []).length === 0 ? (
                <p className="text-sm text-dark-400">No users found.</p>
              ) : (
                <div className="divide-y">
                  {(usersData?.users || []).map(u => (
                    <div key={u.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-dark-800">
                          {u.first_name} {u.last_name}
                          <span className="ml-2"><Badge text={u.user_type} color="sky" /></span>
                        </p>
                        <p className="text-xs text-dark-400">{u.email}{u.phone_number ? ` · ${u.phone_number}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {u.is_verified ? <Badge text="Verified" color="green" /> : <Badge text="Unverified" color="gray" />}
                        {u.user_type === 'landlord' && (
                          <Link to={`/properties?landlord=${u.id}`} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                            Properties <ChevronRight size={12} />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                  {usersData?.count > 0 && <p className="text-xs text-dark-400 mt-3">Showing {usersData.count} result(s)</p>}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Assign Agent Modal */}
      {assignAgentModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-dark-900 mb-1">Assign Agent</h3>
            <p className="text-sm text-dark-500 mb-4">{assignAgentModal.propertyTitle}</p>
            {assignAgentModal.currentAgent && (
              <p className="text-xs text-dark-400 mb-3">Current: {assignAgentModal.currentAgent?.email || 'Unknown'}</p>
            )}
            <AgentSelector
              value={agentToAssign}
              onChange={setAgentToAssign}
            />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAssignAgentModal(null)} className="btn flex-1 border text-dark-600">Cancel</button>
              {assignAgentModal.currentAgent && (
                <button
                  onClick={() => assignAgentMut.mutate({ propertyId: assignAgentModal.propertyId, agentId: null })}
                  disabled={assignAgentMut.isPending}
                  className="btn flex-1 border border-rose-300 text-rose-600 hover:bg-rose-50"
                >
                  Remove Agent
                </button>
              )}
              <button
                onClick={() => agentToAssign && assignAgentMut.mutate({ propertyId: assignAgentModal.propertyId, agentId: agentToAssign })}
                disabled={!agentToAssign || assignAgentMut.isPending}
                className="btn btn-primary flex-1 disabled:opacity-60"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── sub-components ─────────────────────────────────────────── */

function Loading() {
  return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
}

function UserList({ items = [] }) {
  if (!items.length) return <p className="text-sm text-dark-400">None yet.</p>;
  return (
    <div className="divide-y">
      {items.map(u => (
        <div key={u.id} className="py-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-dark-800">{u.first_name} {u.last_name}</p>
            <p className="text-xs text-dark-400">{u.email}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {u.is_verified ? <Badge text="Verified" color="green" /> : <Badge text="Unverified" color="amber" />}
            <span className="text-xs text-dark-400">{new Date(u.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingBadge({ status }) {
  const map = {
    pending: ['amber', 'Pending'], confirmed: ['green', 'Confirmed'], approved: ['sky', 'Approved'],
    completed: ['gray', 'Completed'], cancelled_guest: ['rose', 'Cancelled'], cancelled_host: ['rose', 'Cancelled'],
  };
  const [color, label] = map[status] || ['gray', status];
  return <Badge text={label} color={color} />;
}

function AgentSelector({ value, onChange }) {
  const { data } = useQuery({
    queryKey: ['sa-agents-picker'],
    queryFn: () => superAgentAPI.getAgents({}).then(r => r.data.agents || []),
  });

  return (
    <div>
      <label className="label">Select Agent</label>
      <select className="input w-full" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— Choose an agent —</option>
        {(data || []).map(a => (
          <option key={a.id} value={a.id}>{a.first_name} {a.last_name} ({a.email})</option>
        ))}
      </select>
    </div>
  );
}
