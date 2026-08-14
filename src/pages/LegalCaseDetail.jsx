import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Loader2, Send, Upload, Scale, Home, Lock, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardShell from '../components/dashboard/DashboardShell';
import useAuthStore from '../store/authStore';
import { legalServicesAPI } from '../services/api';
import { CASE_STATUS_STYLES, CASE_STATUS_FLOW } from '../utils/legal';
import { getErrorMessage } from '../utils/errors';

/**
 * One case: the original report, its documents, the correspondence thread and
 * the audit trail. The same page serves the requester and the legal team —
 * the API decides what each may see, and staff-only controls are gated on the
 * viewer's legal-partner flag.
 */
const LegalCaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [internal, setInternal] = useState(false);

  const isLegalStaff = !!(user?.is_legal_partner || user?.is_staff || user?.user_type === 'admin');

  const { data: c, isLoading, error } = useQuery({
    queryKey: ['legal-case', id],
    queryFn: () => legalServicesAPI.getCase(id).then(r => r.data),
    retry: false,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['legal-case', id] });

  const notes = useMemo(() => c?.notes || [], [c]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      await legalServicesAPI.addNote(id, body.trim(), internal);
      setBody('');
      setInternal(false);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send'));
    } finally {
      setSending(false);
    }
  };

  const upload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('documents', f));
      await legalServicesAPI.addDocuments(id, fd);
      toast.success('Document added');
      refresh();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const changeStatus = async (status) => {
    try {
      await legalServicesAPI.setStatus(id, { status });
      toast.success('Case updated');
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update'));
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center gap-2 text-dark-400 p-8">
          <Loader2 className="animate-spin" size={18} /> Loading case…
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="card p-8 text-center max-w-md mx-auto">
          <Lock size={30} className="text-dark-300 mx-auto mb-3" />
          <p className="font-semibold text-dark-900">Case not available</p>
          <p className="text-sm text-dark-500 mt-1">
            This case does not exist, or it was raised by someone else.
          </p>
          <button onClick={() => navigate('/legal-services')} className="btn btn-secondary btn-sm mt-4">
            Back to legal
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-5 max-w-3xl">
        <button
          onClick={() => navigate('/legal-services')}
          className="flex items-center gap-1.5 text-sm text-dark-600 hover:text-dark-900"
        >
          <ArrowLeft size={16} /> All cases
        </button>

        {/* Header */}
        <div className="card p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Scale size={18} className="text-primary" />
            </div>
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
              </div>
              <h1 className="text-xl font-display font-bold text-dark-900 mt-1">{c.subject}</h1>
              <p className="text-sm text-dark-500 mt-0.5">
                {c.issue_type_display} · raised by {c.raised_by_name} ({c.raised_as})
              </p>
              {c.assigned_to_name && (
                <p className="text-xs text-dark-400 mt-1">Handled by {c.assigned_to_name}</p>
              )}
            </div>
          </div>

          {/* Legal team controls */}
          {isLegalStaff && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="block text-xs font-semibold text-dark-500 uppercase tracking-wider mb-1.5">
                Update status
              </label>
              <select
                className="input w-full md:max-w-xs"
                value={c.status}
                onChange={e => changeStatus(e.target.value)}
              >
                {CASE_STATUS_FLOW.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tenancy context */}
        {c.tenancy && (
          <div className="card p-4 flex items-start gap-3">
            <Home size={16} className="text-dark-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm min-w-0">
              <p className="font-semibold text-dark-900">{c.tenancy.property_title}</p>
              <p className="text-dark-500 text-xs">{c.tenancy.property_address}</p>
              <p className="text-dark-500 text-xs mt-1">
                {c.tenancy.landlord_name} → {c.tenancy.tenant_name} ·
                ₦{Number(c.tenancy.rent_amount).toLocaleString()} ·
                {' '}{c.tenancy.start_date} to {c.tenancy.end_date}
              </p>
            </div>
          </div>
        )}

        {/* The report */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-dark-700 mb-2">The issue</h2>
          <p className="text-sm text-dark-700 whitespace-pre-line leading-relaxed">{c.description}</p>
        </div>

        {/* Outcome */}
        {c.outcome_summary && (
          <div className="card p-5 border-indigo-200 bg-indigo-50/40">
            <h2 className="text-sm font-semibold text-indigo-900 mb-2">From the legal team</h2>
            <p className="text-sm text-dark-800 whitespace-pre-line leading-relaxed">{c.outcome_summary}</p>
          </div>
        )}

        {/* Documents */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-dark-700">
              Documents ({c.documents?.length || 0})
            </h2>
            <label className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1">
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Add
              <input type="file" multiple className="hidden" onChange={e => upload(e.target.files)} />
            </label>
          </div>
          {(c.documents || []).length === 0 ? (
            <p className="text-sm text-dark-400">No documents attached.</p>
          ) : (
            <ul className="space-y-1.5">
              {c.documents.map(d => (
                <li key={d.id}>
                  <a
                    href={d.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText size={14} /> {d.name || 'Document'}
                    <span className="text-xs text-dark-400">· {d.uploaded_by_name}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Correspondence */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-dark-700 mb-3">Correspondence</h2>
          {notes.length === 0 ? (
            <p className="text-sm text-dark-400 mb-3">No messages yet.</p>
          ) : (
            <div className="space-y-3 mb-4">
              {notes.map(n => (
                <div
                  key={n.id}
                  className={`rounded-xl p-3 ${
                    n.is_internal
                      ? 'bg-amber-50 border border-amber-200'
                      : n.author_is_legal ? 'bg-indigo-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold text-dark-800">{n.author_name}</span>
                    {n.author_is_legal && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                        Legal team
                      </span>
                    )}
                    {n.is_internal && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        Internal — not visible to the client
                      </span>
                    )}
                    <span className="text-[11px] text-dark-400 flex items-center gap-1">
                      <Clock size={10} /> {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-dark-700 whitespace-pre-line">{n.body}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={send} className="space-y-2">
            <textarea
              className="input w-full min-h-[80px]"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Add a message…"
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {isLegalStaff ? (
                <label className="flex items-center gap-1.5 text-xs text-dark-600">
                  <input
                    type="checkbox"
                    checked={internal}
                    onChange={e => setInternal(e.target.checked)}
                    className="accent-amber-500"
                  />
                  Internal note (legal team only)
                </label>
              ) : <span />}
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Send
              </button>
            </div>
          </form>
        </div>

        {/* Audit trail */}
        {(c.events || []).length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-dark-700 mb-3">History</h2>
            <ul className="space-y-2">
              {c.events.map(ev => (
                <li key={ev.id} className="text-xs text-dark-500 flex items-start gap-2">
                  <Clock size={11} className="mt-0.5 flex-shrink-0" />
                  <span>
                    {new Date(ev.created_at).toLocaleString()} —{' '}
                    {ev.note || `${ev.from_status || 'created'} → ${ev.to_status}`}
                    {ev.actor_name && ` (${ev.actor_name})`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default LegalCaseDetail;
