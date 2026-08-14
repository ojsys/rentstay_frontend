import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import {
  Scale, Loader2, AlertTriangle, Inbox, UserCheck, CheckCircle2,
  ChevronRight, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardShell from '../components/dashboard/DashboardShell';
import useAuthStore from '../store/authStore';
import { legalServicesAPI } from '../services/api';
import { CASE_STATUS_STYLES, CASE_STATUS_FLOW } from '../utils/legal';
import { getErrorMessage } from '../utils/errors';

const Stat = ({ icon: Icon, label, value, color, active, onClick }) => (
  <button
    onClick={onClick}
    className={`card flex items-start gap-3 text-left transition ${
      active ? 'ring-2 ring-primary' : 'hover:shadow-md'
    } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
  >
    <div className={`p-2.5 rounded-xl bg-gray-100 ${color}`}>
      <Icon size={20} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-dark-500">{label}</p>
      <p className="text-2xl font-bold text-dark-900 leading-tight">{value}</p>
    </div>
  </button>
);

/** Days since a date, for a rough age indicator on the queue. */
const ageInDays = (iso) => Math.floor((Date.now() - new Date(iso)) / 86400000);

/**
 * The legal team's case queue.
 *
 * Filters map onto the query params the case endpoint already understands
 * (`open`, `mine`, `status`), so the counts on the stat cards and the list
 * below them are always derived from the same server-side rules.
 */
const LegalQueue = () => {
  const qc = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [filter, setFilter] = useState('open');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigning, setAssigning] = useState(null);

  const isLegalStaff = !!(user?.is_legal_partner || user?.is_staff || user?.user_type === 'admin');

  // Query params for the active filter. Kept in one place so the list can
  // never drift from what the stat card claims to count.
  const params = useMemo(() => {
    const p = {};
    if (statusFilter) p.status = statusFilter;
    else if (filter === 'open') p.open = 1;
    else if (filter === 'mine') { p.mine = 1; p.open = 1; }
    else if (filter === 'unassigned') { p.unassigned = 1; p.open = 1; }
    else if (filter === 'urgent') { p.priority = 'urgent'; p.open = 1; }
    return p;
  }, [filter, statusFilter]);

  const { data: summary } = useQuery({
    queryKey: ['legal-summary'],
    queryFn: () => legalServicesAPI.summary().then(r => r.data),
    enabled: isLegalStaff,
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['legal-partners'],
    queryFn: () => legalServicesAPI.partners().then(r => r.data),
    enabled: isLegalStaff,
  });

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['legal-queue', params],
    queryFn: () => legalServicesAPI.listCases(params).then(r => r.data),
    enabled: isLegalStaff,
  });

  const cases = useMemo(() => {
    const raw = caseData?.results || caseData || [];
    return Array.isArray(raw) ? raw : [];
  }, [caseData]);

  const assign = async (caseId, userId) => {
    setAssigning(caseId);
    try {
      await legalServicesAPI.assign(caseId, userId ? Number(userId) : null);
      toast.success(userId ? 'Case assigned' : 'Case unassigned');
      qc.invalidateQueries({ queryKey: ['legal-queue'] });
      qc.invalidateQueries({ queryKey: ['legal-summary'] });
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not assign'));
    } finally {
      setAssigning(null);
    }
  };

  const pick = (key) => { setFilter(key); setStatusFilter(''); };

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isLegalStaff) return <Navigate to="/legal-services" replace />;

  const s = summary || {};

  return (
    <DashboardShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
            <Scale size={22} /> Legal Queue
          </h1>
          <p className="text-sm text-dark-500 mt-1">
            Dispute cases raised by landlords and tenants.
          </p>
        </div>

        {/* Counts — each doubles as a filter */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat
            icon={Inbox} label="Open" value={s.open ?? '—'} color="text-sky-600"
            active={filter === 'open' && !statusFilter} onClick={() => pick('open')}
          />
          <Stat
            icon={AlertTriangle} label="Urgent open" value={s.urgent_open ?? '—'} color="text-red-600"
            active={filter === 'urgent' && !statusFilter} onClick={() => pick('urgent')}
          />
          <Stat
            icon={UserCheck} label="Unassigned" value={s.unassigned_open ?? '—'} color="text-amber-600"
            active={filter === 'unassigned' && !statusFilter} onClick={() => pick('unassigned')}
          />
          <Stat
            icon={CheckCircle2} label="Assigned to me" value={s.assigned_to_me ?? '—'} color="text-emerald-600"
            active={filter === 'mine' && !statusFilter} onClick={() => pick('mine')}
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => pick('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              filter === 'all' && !statusFilter
                ? 'bg-[#0C3B2E] text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
            }`}
          >
            All cases ({s.total ?? 0})
          </button>
          <select
            className="input py-1.5 text-xs w-auto"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Filter by status…</option>
            {CASE_STATUS_FLOW.map(st => (
              <option key={st} value={st}>
                {st.replace(/_/g, ' ')} ({s.by_status?.[st] ?? 0})
              </option>
            ))}
          </select>
        </div>

        {/* Queue */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-dark-400 text-sm p-4">
            <Loader2 size={15} className="animate-spin" /> Loading cases…
          </div>
        ) : cases.length === 0 ? (
          <div className="card p-8 text-center">
            <CheckCircle2 size={30} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-dark-600 font-medium">Nothing here</p>
            <p className="text-sm text-dark-400 mt-1">No cases match this filter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cases.map(c => {
              const age = ageInDays(c.created_at);
              const stale = age >= 3 && !['resolved', 'closed'].includes(c.status);
              return (
                <div key={c.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-dark-400">{c.reference}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${CASE_STATUS_STYLES[c.status]}`}>
                          {c.status_display}
                        </span>
                        {c.priority === 'urgent' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700">
                            Urgent
                          </span>
                        )}
                        <span className={`text-[11px] flex items-center gap-1 ${stale ? 'text-amber-600 font-medium' : 'text-dark-400'}`}>
                          <Clock size={10} /> {age === 0 ? 'today' : `${age}d old`}
                        </span>
                      </div>

                      <Link
                        to={`/legal-services/cases/${c.id}`}
                        className="block font-semibold text-dark-900 text-sm mt-1 hover:text-primary truncate"
                      >
                        {c.subject}
                      </Link>
                      <p className="text-xs text-dark-500 mt-0.5">
                        {c.issue_type_display} · {c.raised_by_name} ({c.raised_as})
                        {c.property_title && ` · ${c.property_title}`}
                        {c.document_count > 0 && ` · ${c.document_count} doc(s)`}
                      </p>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <select
                          className="input py-1 text-xs w-auto"
                          value={partners.find(p => p.name === c.assigned_to_name)?.id || ''}
                          disabled={assigning === c.id}
                          onChange={e => assign(c.id, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {partners.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        {assigning === c.id && <Loader2 size={12} className="animate-spin text-dark-400" />}
                      </div>
                    </div>

                    <Link
                      to={`/legal-services/cases/${c.id}`}
                      className="text-dark-300 hover:text-primary flex-shrink-0 mt-1"
                      aria-label={`Open ${c.reference}`}
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default LegalQueue;
