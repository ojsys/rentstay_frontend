import { useEffect, useState } from 'react';
import { Loader2, RotateCcw, Check, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { noticeAPI } from '../../services/api';
import { renderNoticePreview, noticeTypeLabel } from '../../utils/notices';
import { getErrorMessage } from '../../utils/errors';

/**
 * Editor for a landlord's reusable wording for one notice type.
 *
 * Until the landlord saves something, the server returns the built-in default,
 * so the editor always opens on usable text rather than a blank box. Saving
 * creates the custom template; resetting deletes it and falls back to the
 * default again.
 */
const NoticeTemplateEditor = ({ noticeType }) => {
  const [body, setBody] = useState('');
  const [placeholders, setPlaceholders] = useState([]);
  const [hasCustom, setHasCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [Editor, setEditor] = useState(null);

  // CKEditor is heavy — same lazy-import pattern as the rest of the dashboard.
  useEffect(() => {
    let alive = true;
    import('../common/RichTextEditor')
      .then(m => { if (alive) setEditor(() => m.default); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    noticeAPI.getTemplate(noticeType)
      .then(({ data }) => {
        if (!alive) return;
        setBody(data.body || '');
        setPlaceholders(data.placeholders || []);
        setHasCustom(!!data.has_template);
      })
      .catch(e => toast.error(getErrorMessage(e, 'Could not load template')))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [noticeType]);

  const save = async () => {
    if (!body.trim()) { toast.error('Template body is required'); return; }
    setSaving(true);
    try {
      await noticeAPI.saveTemplate(noticeType, body);
      setHasCustom(true);
      toast.success('Template saved');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not save template'));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setResetting(true);
    try {
      const { data } = await noticeAPI.resetTemplate(noticeType);
      setBody(data.body || '');
      setHasCustom(false);
      toast.success('Reverted to the built-in template');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not reset template'));
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading template…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              {noticeTypeLabel(noticeType)}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Use placeholders: {placeholders.join(', ')}
            </p>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${
              hasCustom ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {hasCustom ? 'Your template' : 'Built-in default'}
          </span>
        </div>

        <div className="p-4">
          {Editor ? (
            <Editor value={body} onChange={setBody} />
          ) : (
            <textarea
              className="input w-full min-h-[240px] font-mono text-xs"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          )}

          <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
            <button
              onClick={reset}
              disabled={resetting || !hasCustom}
              title={hasCustom ? 'Delete your wording and use the built-in template'
                : 'You are already using the built-in template'}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resetting
                ? <Loader2 size={14} className="animate-spin" />
                : <RotateCcw size={14} />}
              Reset to default
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-60"
            >
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : <><Check size={14} /> Save Template</>}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2.5">
        <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900 leading-relaxed">
          This wording is loaded whenever you serve a <strong>{noticeTypeLabel(noticeType)}</strong>,
          with the placeholders already filled in for that tenant. You can still edit
          any individual notice before serving it.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">Preview</h3>
          <p className="text-xs text-gray-400 mt-0.5">Example preview with sample values</p>
        </div>
        <div className="p-4 prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: renderNoticePreview(body) }} />
        </div>
      </div>
    </div>
  );
};

export default NoticeTemplateEditor;
