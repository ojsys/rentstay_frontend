import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, FileText, Plus, Send, Trash2, Upload, X, Check,
  Clock, ShieldAlert, Loader2, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { noticeAPI } from '../../services/api';
import { NOTICE_TYPES } from '../../utils/notices';
import { getErrorMessage } from '../../utils/errors';

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-600',
  served: 'bg-amber-100 text-amber-700',
  acknowledged: 'bg-emerald-100 text-emerald-700',
  withdrawn: 'bg-gray-100 text-gray-400 line-through',
};

const StatusPill = ({ status, label }) => (
  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
    {label}
  </span>
);

/**
 * Landlord-side legal notices: compose from a template (or upload a signed
 * document), keep as a draft, then serve — which notifies the tenant by email
 * and in-app and freezes the wording.
 */
const NoticesPanel = ({ agreements = [] }) => {
  const [composing, setComposing] = useState(false);
  const [viewing, setViewing] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['legal-notices'],
    queryFn: () => noticeAPI.list().then(r => r.data),
  });

  const notices = useMemo(() => {
    const raw = data?.results || data || [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  // Only live tenancies can be served — a terminated lease has no tenant to notify.
  const servableAgreements = useMemo(
    () => agreements.filter(a => a.id && a.tenant_name),
    [agreements]
  );

  const act = async (fn, successMsg) => {
    try {
      await fn();
      toast.success(successMsg);
      refetch();
      setViewing(null);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Action failed'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Legal Notices</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Serve a quit, eviction or rent notice. The tenant is notified by email and in-app.
          </p>
        </div>
        <button
          onClick={() => setComposing(true)}
          disabled={servableAgreements.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Plus size={14} /> Serve notice
        </button>
      </div>

      {servableAgreements.length === 0 && (
        <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4">
          You need an active tenancy before you can serve a notice.
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm p-4">
          <Loader2 size={16} className="animate-spin" /> Loading notices…
        </div>
      ) : notices.length === 0 ? (
        <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4">
          No notices issued yet.
        </p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 overflow-hidden">
          {notices.map(n => (
            <button
              key={n.id}
              onClick={() => setViewing(n)}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <ShieldAlert size={16} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 text-sm truncate">{n.notice_type_display}</p>
                  <StatusPill status={n.status} label={n.status_display} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {n.tenant_name} · {n.property_title}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Issued {n.issued_date} · Expires {n.expiry_date}
                  {n.status === 'served' && n.days_remaining >= 0 && (
                    <span className="text-amber-600 font-medium"> · {n.days_remaining} day{n.days_remaining !== 1 ? 's' : ''} left</span>
                  )}
                  {n.status === 'served' && n.days_remaining < 0 && (
                    <span className="text-red-600 font-medium"> · expired</span>
                  )}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {composing && (
        <ComposeNoticeModal
          agreements={servableAgreements}
          onClose={() => setComposing(false)}
          onDone={() => { setComposing(false); refetch(); }}
        />
      )}

      {viewing && (
        <ViewNoticeModal
          notice={viewing}
          onClose={() => setViewing(null)}
          onServe={() => act(() => noticeAPI.serve(viewing.id), 'Notice served — tenant notified')}
          onWithdraw={(reason) => act(() => noticeAPI.withdraw(viewing.id, reason), 'Notice withdrawn')}
          onDelete={() => act(() => noticeAPI.remove(viewing.id), 'Draft deleted')}
        />
      )}
    </div>
  );
};

const ComposeNoticeModal = ({ agreements, onClose, onDone }) => {
  const [agreementId, setAgreementId] = useState(agreements[0]?.id || '');
  const [noticeType, setNoticeType] = useState('quit');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [Editor, setEditor] = useState(null);

  // CKEditor is heavy — pulled in only when the compose modal opens.
  useEffect(() => {
    let alive = true;
    import('../common/RichTextEditor')
      .then(m => { if (alive) setEditor(() => m.default); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Reload the template whenever the type or tenancy changes, so placeholders
  // resolve against the right tenant and the statutory date is recalculated.
  useEffect(() => {
    if (!agreementId) return;
    let alive = true;
    setLoading(true);
    noticeAPI.compose({ notice_type: noticeType, agreement: agreementId })
      .then(({ data }) => {
        if (!alive) return;
        setMeta(data);
        setSubject(data.subject || '');
        setBody(data.body || '');
        setIssuedDate(data.issued_date || '');
        setExpiryDate(data.suggested_expiry_date || '');
      })
      .catch(e => toast.error(getErrorMessage(e, 'Could not load template')))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [noticeType, agreementId]);

  const submit = async (serveNow) => {
    if (!agreementId) { toast.error('Select a tenancy'); return; }
    if (!body.trim() && !file) { toast.error('Add notice text or attach a document'); return; }
    setSaving(true);
    try {
      let payload;
      if (file) {
        payload = new FormData();
        payload.append('agreement', agreementId);
        payload.append('notice_type', noticeType);
        payload.append('subject', subject);
        payload.append('body', body);
        payload.append('issued_date', issuedDate);
        payload.append('expiry_date', expiryDate);
        payload.append('document', file);
      } else {
        payload = {
          agreement: Number(agreementId),
          notice_type: noticeType,
          subject, body,
          issued_date: issuedDate,
          expiry_date: expiryDate,
        };
      }
      const { data: created } = await noticeAPI.create(payload);
      if (serveNow) {
        await noticeAPI.serve(created.id);
        toast.success('Notice served — tenant notified');
      } else {
        toast.success('Draft saved');
      }
      onDone();
    } catch (e) {
      const detail = e?.response?.data;
      toast.error(detail?.detail || Object.values(detail || {})[0] || 'Could not save notice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-3xl md:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Serve a legal notice</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tenancy</label>
              <select className="input w-full" value={agreementId} onChange={e => setAgreementId(e.target.value)}>
                {agreements.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.tenant_name} — {a.property_title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notice type</label>
              <select className="input w-full" value={noticeType} onChange={e => setNoticeType(e.target.value)}>
                {NOTICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
            <input className="input w-full" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date of notice</label>
              <input type="date" className="input w-full" value={issuedDate} onChange={e => setIssuedDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tenant must comply by</label>
              <input type="date" className="input w-full" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
            </div>
          </div>

          {meta && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <p className="font-semibold mb-0.5">
                  Suggested period: {meta.suggested_period_label}
                </p>
                <p>{meta.disclaimer}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Notice wording
            </label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 p-4 border border-gray-200 rounded-xl">
                <Loader2 size={14} className="animate-spin" /> Loading template…
              </div>
            ) : Editor ? (
              <Editor value={body} onChange={setBody} />
            ) : (
              <textarea
                className="input w-full font-mono text-xs"
                rows={12}
                value={body}
                onChange={e => setBody(e.target.value)}
              />
            )}
            <p className="text-[11px] text-gray-400 mt-1.5">
              Prefilled from your template with this tenant&apos;s details already filled in. Edit freely before serving.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Attach signed notice (optional)
            </label>
            <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition text-sm text-gray-600">
              <Upload size={15} />
              {file ? file.name : 'Upload a PDF or image of the signed notice'}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </label>
            {file && (
              <button onClick={() => setFile(null)} className="text-xs text-red-500 mt-1.5 hover:underline">
                Remove attachment
              </button>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex gap-3">
          <button
            onClick={() => submit(false)}
            disabled={saving}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Save as draft
          </button>
          <button
            onClick={() => submit(true)}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Serve now
          </button>
        </div>
      </div>
    </div>
  );
};

const ViewNoticeModal = ({ notice, onClose, onServe, onWithdraw, onDelete }) => {
  const [withdrawing, setWithdrawing] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{notice.notice_type_display}</h3>
            <p className="text-xs text-gray-500 truncate">{notice.tenant_name} · {notice.property_title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 flex-shrink-0"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <StatusPill status={notice.status} label={notice.status_display} />
            <span className="text-gray-500 flex items-center gap-1"><Clock size={12} /> Issued {notice.issued_date}</span>
            <span className="text-gray-500">Expires {notice.expiry_date}</span>
          </div>

          {notice.status === 'withdrawn' && notice.withdrawn_reason && (
            <p className="text-xs bg-gray-50 rounded-xl p-3 text-gray-600">
              <strong>Withdrawn:</strong> {notice.withdrawn_reason}
            </p>
          )}

          {notice.document_url && (
            <a
              href={notice.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
            >
              <FileText size={15} /> View attached document
            </a>
          )}

          {notice.body && (
            <div
              className="prose prose-sm max-w-none border border-gray-100 rounded-xl p-4 bg-gray-50/50"
              dangerouslySetInnerHTML={{ __html: notice.body }}
            />
          )}

          {withdrawing && (
            <div className="border border-gray-200 rounded-xl p-3 space-y-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason for withdrawal</label>
              <input className="input w-full" value={reason} onChange={e => setReason(e.target.value)} placeholder="Served in error…" />
              <button
                onClick={() => onWithdraw(reason)}
                className="w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition"
              >
                Confirm withdrawal
              </button>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex gap-3">
          {notice.status === 'draft' && (
            <>
              <button
                onClick={onDelete}
                className="px-4 py-3 rounded-xl border border-gray-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Delete
              </button>
              <button
                onClick={onServe}
                className="flex-1 py-3 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition flex items-center justify-center gap-2"
              >
                <Send size={15} /> Serve to tenant
              </button>
            </>
          )}
          {(notice.status === 'served' || notice.status === 'acknowledged') && !withdrawing && (
            <button
              onClick={() => setWithdrawing(true)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> Withdraw notice
            </button>
          )}
          {notice.status === 'acknowledged' && (
            <span className="flex-1 flex items-center justify-center gap-1.5 text-sm text-emerald-600 font-medium">
              <Check size={15} /> Acknowledged {notice.acknowledged_at?.slice(0, 10)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticesPanel;
