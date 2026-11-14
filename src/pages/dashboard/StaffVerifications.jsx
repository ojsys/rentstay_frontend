import { useEffect, useState } from 'react';
import {
  Loader2, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle,
  Clock, Building2, User as UserIcon, FileText, ExternalLink, Banknote, Bed,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staffAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';

/**
 * Verification desk — individual KYC and company files in one queue.
 *
 * KYC used to live on its own page outside the dashboard and corporate
 * verification had no interface at all. Both arrive as the same request type,
 * so they are one queue here, with the company file and the applicant's other
 * outstanding items attached: an unverified host with a pending withdrawal is
 * one decision, not two rows in two places.
 */

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

/** A document link, or an honest gap where one should be. */
const DocLink = ({ label, href }) => (
  href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
    >
      <FileText size={12} /> {label} <ExternalLink size={10} />
    </a>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs text-dark-400">
      <FileText size={12} /> {label} — not supplied
    </span>
  )
);

const CompanyFile = ({ company, onRevoke, busy }) => {
  if (!company) return null;
  const incomplete = (company.missing_requirements || []).length > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold text-dark-900 flex items-center gap-1.5">
            <Building2 size={14} className="text-dark-400" /> {company.company_name}
          </p>
          <p className="text-xs text-dark-500 mt-0.5">{company.entity_type}</p>
        </div>
        {company.is_verified && (
          <button
            onClick={onRevoke}
            disabled={busy}
            className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
          >
            Revoke verification
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-dark-700">
        <p><span className="text-dark-500">CAC (RC/BN):</span> <strong>{company.rc_number || '—'}</strong></p>
        <p><span className="text-dark-500">TIN:</span> {company.tin || '—'}</p>
        <p><span className="text-dark-500">VAT:</span> {company.vat_number || '—'}</p>
        <p><span className="text-dark-500">Incorporated:</span> {company.date_of_incorporation || '—'}</p>
        <p className="sm:col-span-2"><span className="text-dark-500">Registered address:</span> {company.registered_address || '—'}</p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        <DocLink label="CAC certificate" href={company.documents?.cac_certificate} />
        <DocLink label="TIN certificate" href={company.documents?.tin_certificate} />
        <DocLink label="Board resolution" href={company.documents?.board_resolution} />
      </div>

      {company.representatives?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-dark-500 uppercase tracking-wider mb-1.5">
            Who acts for the company
          </p>
          <ul className="space-y-1.5">
            {company.representatives.map((rep, i) => (
              <li key={`${rep.full_name}-${i}`} className="text-xs text-dark-700 flex flex-wrap items-center gap-x-2">
                <span className="font-medium">{rep.full_name}</span>
                <span className="text-dark-500">{rep.role}</span>
                {rep.is_primary && (
                  <span className="text-[9px] uppercase tracking-wide font-semibold bg-sky-50 text-sky-700 px-1.5 rounded">
                    primary
                  </span>
                )}
                {rep.id_document
                  ? <DocLink label={rep.id_type || 'ID'} href={rep.id_document} />
                  : <span className="text-dark-400">no ID uploaded</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {incomplete && (
        <p className="text-xs text-amber-800 bg-amber-50 rounded-lg p-2.5 flex items-start gap-1.5">
          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
          <span>
            <strong>Cannot be approved yet.</strong> Still missing:{' '}
            {company.missing_requirements.join(', ')}.
          </span>
        </p>
      )}
    </div>
  );
};

/** What else is waiting on this applicant — context for one decision. */
const Outstanding = ({ outstanding }) => {
  const items = [
    { key: 'pending_payouts', icon: Banknote, label: 'withdrawal', plural: 'withdrawals' },
    { key: 'unpublished_listings', icon: Bed, label: 'stay listing', plural: 'stay listings' },
    { key: 'properties_awaiting', icon: Building2, label: 'property', plural: 'properties' },
  ].filter(i => (outstanding?.[i.key] || 0) > 0);

  if (items.length === 0) return null;

  return (
    <p className="text-xs text-sky-800 bg-sky-50 rounded-lg p-2.5 flex items-start gap-1.5">
      <Clock size={12} className="mt-0.5 flex-shrink-0" />
      <span>
        Also waiting on this decision:{' '}
        {items.map((i, idx) => (
          <span key={i.key}>
            {idx > 0 && ', '}
            {outstanding[i.key]} {outstanding[i.key] === 1 ? i.label : i.plural}
          </span>
        ))}
      </span>
    </p>
  );
};

const StaffVerifications = () => {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [failedIds, setFailedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [kind, setKind] = useState('');
  const [busy, setBusy] = useState(null);
  const [reasons, setReasons] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (kind) params.kind = kind;
      const { data } = await staffAPI.listVerifications(params);
      setRows(data.results || []);
      setSummary(data.summary || {});
      setFailedIds(data.failed_ids || []);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not load verifications'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status, kind]);

  const act = async (row, action) => {
    setBusy(row.id);
    try {
      const { data } = await staffAPI.decideVerification({
        request_id: row.id,
        action,
        reason: reasons[row.id] || '',
      });
      toast.success(data.detail);
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not record that decision'));
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (row) => {
    const reason = reasons[row.id] || '';
    setBusy(row.id);
    try {
      const { data } = await staffAPI.decideVerification({
        action: 'revoke_company',
        company_id: row.company.id,
        reason,
      });
      toast.success(data.detail);
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not revoke that verification'));
    } finally {
      setBusy(null);
    }
  };

  const STATUS_TABS = [
    { key: 'pending', label: 'Awaiting review' },
    { key: 'approved', label: 'Verified' },
    { key: 'rejected', label: 'Rejected' },
    { key: '', label: 'All' },
  ];
  const KIND_TABS = [
    { key: '', label: 'Everyone' },
    { key: 'individual', label: 'People' },
    { key: 'corporate', label: 'Companies' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
          <ShieldCheck size={22} /> Verification
        </h1>
        <p className="text-sm text-dark-500 mt-1">
          Identity checks for people and CAC files for companies. The applicant is
          emailed the outcome, so a rejection needs a reason they can act on.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-dark-500">Awaiting review</p>
          <p className="text-2xl font-bold text-amber-600">{summary.pending ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-dark-500">Companies waiting</p>
          <p className="text-2xl font-bold text-sky-600">{summary.pending_corporate ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-dark-500">Longest wait</p>
          <p className={`text-2xl font-bold ${(summary.oldest_waiting_days || 0) > 3 ? 'text-red-600' : 'text-dark-900'}`}>
            {summary.oldest_waiting_days ?? 0}<span className="text-base font-medium"> days</span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                status === t.key ? 'bg-[#0C3B2E] text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {KIND_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setKind(t.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition border ${
                kind === t.key ? 'border-[#0C3B2E] text-[#0C3B2E]' : 'border-gray-200 text-dark-500 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {failedIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            {failedIds.length} request{failedIds.length !== 1 ? 's' : ''} could not be
            displayed (ID{failedIds.length !== 1 ? 's' : ''} {failedIds.join(', ')}).
            The rest are shown below — check Error Logs in the admin.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-dark-400 text-sm p-4">
          <Loader2 size={15} className="animate-spin" /> Loading verifications…
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-8 text-center">
          <CheckCircle2 size={30} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-dark-600 font-medium">Nothing waiting</p>
          <p className="text-sm text-dark-400 mt-1">No verifications match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => {
            const isCompany = r.kind === 'corporate';
            const incomplete = (r.company?.missing_requirements || []).length > 0;
            return (
              <div key={r.id} className="card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${isCompany ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700'}`}>
                        {isCompany ? 'Company' : 'Individual'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[r.status]}`}>
                        {r.status_display}
                      </span>
                      {r.status === 'pending' && r.waiting_days > 3 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700">
                          waiting {r.waiting_days} days
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-dark-900 mt-1.5 flex items-center gap-1.5">
                      <UserIcon size={12} className="text-dark-400" />
                      {r.applicant.name}
                      {r.applicant.is_verified && <ShieldCheck size={11} className="text-emerald-600" />}
                    </p>
                    <p className="text-xs text-dark-500">
                      {r.applicant.email}
                      {r.applicant.phone && ` · ${r.applicant.phone}`}
                      {' · '}<span className="capitalize">{r.applicant.user_type}</span>
                    </p>
                  </div>
                </div>

                {/* Individual identity documents */}
                {!isCompany && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-dark-700">
                      <p><span className="text-dark-500">ID type:</span> {r.identity.id_type || '—'}</p>
                      <p><span className="text-dark-500">ID number:</span> {r.identity.id_number || '—'}</p>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      <DocLink label="ID document" href={r.identity.id_document} />
                      <DocLink label="Selfie" href={r.identity.selfie} />
                    </div>
                  </div>
                )}

                {isCompany && (
                  <CompanyFile
                    company={r.company}
                    busy={busy === r.id}
                    onRevoke={() => revoke(r)}
                  />
                )}

                <Outstanding outstanding={r.outstanding} />

                {r.reviewed_by && (
                  <p className="text-xs text-dark-500 flex items-center gap-1">
                    <Clock size={10} /> Decided by {r.reviewed_by}
                    {r.reviewed_at && ` on ${new Date(r.reviewed_at).toLocaleString()}`}
                    {r.notes && ` — ${r.notes}`}
                  </p>
                )}

                {r.status === 'pending' && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-dark-500 uppercase tracking-wider mb-1">
                        Note to the applicant
                        <span className="normal-case font-normal text-dark-400"> — required to reject, emailed either way</span>
                      </label>
                      <input
                        className="input py-2 text-sm w-full"
                        placeholder={incomplete
                          ? 'e.g. The CAC certificate is missing'
                          : 'e.g. ID photo is too blurry to read'}
                        value={reasons[r.id] || ''}
                        onChange={e => setReasons(v => ({ ...v, [r.id]: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => act(r, 'approve')}
                        disabled={busy === r.id || incomplete}
                        title={incomplete ? 'The company file is incomplete' : undefined}
                        className="px-4 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-40 flex items-center gap-1.5"
                      >
                        {busy === r.id ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                        Verify
                      </button>
                      <button
                        onClick={() => act(r, 'reject')}
                        disabled={busy === r.id}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-60 flex items-center gap-1.5"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-dark-400 flex items-center gap-1">
                  <Clock size={10} /> Submitted {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StaffVerifications;
