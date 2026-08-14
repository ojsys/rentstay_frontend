import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Scale, Plus, ShieldCheck, ShieldAlert, Loader2, Upload, X, FileText,
  Clock, CheckCircle2, AlertTriangle, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { legalServicesAPI } from '../../services/api';
import { CASE_STATUS_STYLES, CASE_PRIORITY_STYLES } from '../../utils/legal';
import { getErrorMessage } from '../../utils/errors';

/**
 * Legal services for a landlord or tenant: opt in to cover, raise a case, and
 * track cases already raised.
 *
 * Rendered bare so it can sit inside either shell — the standalone /legal-services
 * page wraps it in DashboardShell, while the landlord dashboard drops it
 * straight into its tab Outlet.
 */
const LegalServicesPanel = () => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [composing, setComposing] = useState(false);

  const isLegalStaff = !!(user?.is_legal_partner || user?.is_staff || user?.user_type === 'admin');

  const { data: cover, isLoading: coverLoading } = useQuery({
    queryKey: ['legal-cover'],
    queryFn: () => legalServicesAPI.getCover().then(r => r.data),
  });

  const { data: caseData, isLoading: casesLoading } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: () => legalServicesAPI.listCases().then(r => r.data),
  });

  const cases = useMemo(() => {
    const raw = caseData?.results || caseData || [];
    return Array.isArray(raw) ? raw : [];
  }, [caseData]);

  const toggleCover = async (optIn) => {
    try {
      await (optIn ? legalServicesAPI.optIn() : legalServicesAPI.optOut());
      toast.success(optIn ? 'You are enrolled in legal cover' : 'Legal cover cancelled');
      qc.invalidateQueries({ queryKey: ['legal-cover'] });
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not update your cover'));
    }
  };

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
              <Scale size={22} /> Legal Services
            </h1>
            <p className="text-sm text-dark-500 mt-1">
              Get a review of a tenancy dispute from the legal team.
            </p>
          </div>
          {cover?.has_cover && (
            <button onClick={() => setComposing(true)} className="btn btn-primary btn-sm flex items-center gap-1.5">
              <Plus size={14} /> Request legal review
            </button>
          )}
        </div>

        {isLegalStaff && (
          <Link
            to="/legal-services/queue"
            className="card p-4 flex items-center gap-3 hover:border-primary transition"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Scale size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-dark-900 text-sm">Legal queue</p>
              <p className="text-xs text-dark-500">Review and assign cases raised by landlords and tenants.</p>
            </div>
            <ChevronRight size={16} className="text-dark-300 flex-shrink-0" />
          </Link>
        )}

        {/* Cover status */}
        {coverLoading ? (
          <div className="card p-5 flex items-center gap-2 text-dark-400 text-sm">
            <Loader2 size={15} className="animate-spin" /> Checking your cover…
          </div>
        ) : (
          <div className={`card p-5 ${cover.has_cover ? 'border-emerald-200' : ''}`}>
            <div className="flex items-start gap-3">
              {cover.has_cover
                ? <ShieldCheck size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                : <ShieldAlert size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-dark-900">
                    {cover.has_cover ? 'Legal cover active' : 'Legal cover not active'}
                  </p>
                  {cover.cover_source === 'landlord' && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-700">
                      via your landlord
                    </span>
                  )}
                  {cover.cover_source === 'own' && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                      your own cover
                    </span>
                  )}
                </div>
                <p className="text-sm text-dark-500 mt-0.5">{cover.reason}</p>

                {cover.can_opt_in && (
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    {cover.enrollment_status === 'active' ? (
                      <button onClick={() => toggleCover(false)} className="btn btn-secondary btn-sm">
                        Cancel my cover
                      </button>
                    ) : (
                      <button onClick={() => toggleCover(true)} className="btn btn-primary btn-sm">
                        {cover.cover_source === 'landlord'
                          ? 'Take out my own cover'
                          : 'Opt in to legal cover'}
                      </button>
                    )}
                    <span className="text-xs text-dark-400">
                      {cover.covers_my_tenants
                        ? 'Covers you and the tenants in your properties.'
                        : 'Covers you for disputes about your tenancy.'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cases */}
        <div>
          <h2 className="text-sm font-semibold text-dark-700 mb-2">Your cases</h2>
          {casesLoading ? (
            <div className="flex items-center gap-2 text-dark-400 text-sm p-4">
              <Loader2 size={15} className="animate-spin" /> Loading…
            </div>
          ) : cases.length === 0 ? (
            <div className="card p-8 text-center">
              <Scale size={30} className="text-dark-300 mx-auto mb-3" />
              <p className="text-dark-600 font-medium">No cases yet</p>
              <p className="text-sm text-dark-400 mt-1">
                {cover?.has_cover
                  ? 'Raise a case and the legal team will review it.'
                  : 'Legal cover is needed before you can raise a case.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {cases.map(c => (
                <Link
                  key={c.id}
                  to={`/legal-services/cases/${c.id}`}
                  className="card p-4 flex items-start gap-3 hover:border-primary transition"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-dark-400">{c.reference}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${CASE_STATUS_STYLES[c.status]}`}>
                        {c.status_display}
                      </span>
                      {c.priority === 'urgent' && (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${CASE_PRIORITY_STYLES.urgent}`}>
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-dark-900 text-sm mt-0.5 truncate">{c.subject}</p>
                    <p className="text-xs text-dark-500 mt-0.5">
                      {c.issue_type_display}
                      {c.property_title && ` · ${c.property_title}`}
                      {c.document_count > 0 && ` · ${c.document_count} document(s)`}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-dark-300 flex-shrink-0 mt-2" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-dark-400">
          RentStay coordinates legal support and records your case. Advice is given by the
          legal team or a partner firm and does not create a solicitor–client relationship
          with RentStay itself.
        </p>
      </div>

      {composing && (
        <RequestReviewModal
          cover={cover}
          onClose={() => setComposing(false)}
          onDone={() => {
            setComposing(false);
            qc.invalidateQueries({ queryKey: ['legal-cases'] });
          }}
        />
      )}
    </>
  );
};

const RequestReviewModal = ({ cover, onClose, onDone }) => {
  const [issueType, setIssueType] = useState('rent_arrears');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [agreement, setAgreement] = useState('');
  const [priority, setPriority] = useState('normal');
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) { toast.error('Give the case a short subject'); return; }
    if (description.trim().length < 20) {
      toast.error('Please describe the issue in a little more detail');
      return;
    }
    setSaving(true);
    try {
      let payload;
      if (files.length) {
        payload = new FormData();
        payload.append('issue_type', issueType);
        payload.append('subject', subject);
        payload.append('description', description);
        payload.append('priority', priority);
        if (agreement) payload.append('agreement', agreement);
        files.forEach(f => payload.append('documents', f));
      } else {
        payload = {
          issue_type: issueType, subject, description, priority,
          ...(agreement ? { agreement: Number(agreement) } : {}),
        };
      }
      const { data } = await legalServicesAPI.createCase(payload);
      toast.success(`Case ${data.reference} sent to the legal team`);
      onDone();
    } catch (err) {
      const d = err?.response?.data;
      toast.error(d?.detail || Object.values(d || {})[0] || 'Could not submit your case');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-dark-900">Request legal review</h3>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-700"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="label">What is the issue?</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {(cover?.issue_types || []).map(t => (
                <label
                  key={t.value}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition text-sm ${
                    issueType === t.value
                      ? 'border-primary bg-primary/5 text-dark-900 font-medium'
                      : 'border-gray-200 text-dark-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="issue_type"
                    value={t.value}
                    checked={issueType === t.value}
                    onChange={() => setIssueType(t.value)}
                    className="accent-primary"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Subject</label>
            <input
              className="input w-full"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Short summary, e.g. Tenant three months in arrears"
            />
          </div>

          <div>
            <label className="label">Describe the issue</label>
            <textarea
              className="input w-full min-h-[140px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What happened, when, and what you have already tried. Include dates and amounts where relevant."
            />
            <p className="text-xs text-dark-400 mt-1">{description.trim().length} characters</p>
          </div>

          {(cover?.tenancies || []).length > 0 && (
            <div>
              <label className="label">Related tenancy (optional)</label>
              <select className="input w-full" value={agreement} onChange={e => setAgreement(e.target.value)}>
                <option value="">Not tied to a specific tenancy</option>
                {cover.tenancies.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <p className="text-xs text-dark-400 mt-1">
                Attaching the tenancy lets the legal team see the agreement without asking.
              </p>
            </div>
          )}

          <div>
            <label className="label">How urgent is this?</label>
            <select className="input w-full" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent — court date or eviction under way</option>
              <option value="low">Low — general question</option>
            </select>
          </div>

          <div>
            <label className="label">Upload supporting documents</label>
            <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition text-sm text-dark-600">
              <Upload size={15} />
              {files.length ? `${files.length} file(s) selected` : 'Agreements, receipts, notices, photos…'}
              <input
                type="file"
                multiple
                className="hidden"
                onChange={e => setFiles(Array.from(e.target.files || []))}
              />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="text-xs text-dark-500 flex items-center gap-1.5">
                    <FileText size={11} /> {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
              {saving && <Loader2 size={15} className="animate-spin" />} Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LegalServicesPanel;
