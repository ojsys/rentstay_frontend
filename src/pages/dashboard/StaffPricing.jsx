import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Loader2, Tag, Save, Undo2, RotateCcw, ExternalLink, Eye, PencilLine, Lock,
  ChevronDown, ArrowUp, ArrowDown, Trash2, Plus, AlertTriangle, Settings2, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staffAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import PricingView from '../../components/pricing/PricingView';
import {
  PRICING_TOKENS, formatToken, typedPercentages, unknownTokens, mentionsOffer,
} from '../../utils/pricingText';

/**
 * Pricing page editor.
 *
 * Staff edit the words; the numbers come from Site Settings through
 * placeholders like {stays_rate}. That split is the point: the page once said
 * 15% while the platform charged 10%, because the rate had been typed into the
 * copy. Typed percentages are flagged as you write.
 */

const SECTIONS = [
  { key: 'hero', label: 'Hero', fields: [
    { key: 'eyebrow', label: 'Label above the title', kind: 'text' },
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'subtitle', label: 'Subtitle', kind: 'long' },
  ] },
  { key: 'free_band', label: 'Free to join', fields: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'body', label: 'Text', kind: 'long' },
  ] },
  { key: 'plans_intro', label: 'How pricing works', fields: [
    { key: 'eyebrow', label: 'Label', kind: 'text' },
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'subtitle', label: 'Subtitle', kind: 'long' },
  ] },
  { key: 'rent_plan', label: 'Long-term rentals card', rate: 'rent_rate', fields: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'rate_note', label: 'Text beside the rate', kind: 'text' },
    { key: 'summary', label: 'Summary', kind: 'long' },
    { key: 'points', label: 'Bullet points', kind: 'lines' },
  ] },
  { key: 'stays_plan', label: 'Short stays card', rate: 'stays_rate', fields: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'rate_note', label: 'Text beside the rate', kind: 'text' },
    { key: 'summary', label: 'Summary', kind: 'long' },
    { key: 'points', label: 'Bullet points', kind: 'lines' },
  ] },
  { key: 'tenants', label: 'Tenants & guests', fields: [
    { key: 'eyebrow', label: 'Label', kind: 'text' },
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'subtitle', label: 'Subtitle', kind: 'long' },
    { key: 'features', label: 'Feature list', kind: 'lines' },
  ] },
  { key: 'caution', label: 'Caution fee', fields: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'cards', label: 'Cards', kind: 'pairs', keys: ['title', 'description'], labels: ['Card title', 'Card text'], add: 'Add card' },
    { key: 'footnote', label: 'Footnote', kind: 'long' },
  ] },
  { key: 'faq', label: 'FAQ', fields: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'subtitle', label: 'Subtitle', kind: 'long' },
    { key: 'items', label: 'Questions', kind: 'pairs', keys: ['question', 'answer'], labels: ['Question', 'Answer'], add: 'Add question' },
  ] },
  { key: 'cta', label: 'Closing call to action', fields: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'subtitle', label: 'Subtitle', kind: 'long' },
    { key: 'button_label', label: 'Button text', kind: 'text' },
  ] },
];

// Shared by every input: where a placeholder chip should be inserted, the
// server's validation errors, and whether editing is allowed at all.
const EditorContext = createContext(null);

const SUGGEST = { rent_rate: 'rent', stays_rate: 'short-stay', caution_rate: 'caution fee', caution_interest: 'cashback' };

const FieldHints = ({ value, path }) => {
  const { errors, rates } = useContext(EditorContext);
  const typed = typedPercentages(value);
  const unknown = unknownTokens(value);
  const error = errors[path];
  if (!typed.length && !unknown.length && !error) {
    if (mentionsOffer(value) && !(Number(rates?.free_bookings) > 0)) {
      return <p className="mt-1 text-[11px] text-dark-400">Hidden while the free-bookings offer is off.</p>;
    }
    return null;
  }
  return (
    <div className="mt-1 space-y-0.5">
      {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}
      {typed.length > 0 && (
        <p className="text-[11px] text-amber-700 flex items-start gap-1">
          <AlertTriangle size={12} className="mt-px flex-shrink-0" />
          <span>
            Typed {typed.join(', ')} won’t follow rate changes. Use a placeholder instead —{' '}
            {Object.entries(SUGGEST).map(([k, v], i) => (
              <span key={k}>{i > 0 && ', '}<code className="font-mono">{`{${k}}`}</code> ({v})</span>
            ))}.
          </span>
        </p>
      )}
      {unknown.length > 0 && (
        <p className="text-[11px] text-red-600">
          Unknown placeholder {unknown.map((k) => `{${k}}`).join(', ')} — it will show as typed.
        </p>
      )}
    </div>
  );
};

const TextInput = ({ value, onChange, path, multiline, placeholder }) => {
  const { setActive, readOnly, errors } = useContext(EditorContext);
  const common = {
    value: value ?? '',
    placeholder,
    disabled: readOnly,
    onChange: (e) => onChange(e.target.value),
    onFocus: (e) => setActive({ el: e.target, onChange }),
    className: `w-full rounded-xl border bg-white px-3 py-2 text-sm text-dark-900 outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-50 disabled:text-dark-500 ${
      errors[path] ? 'border-red-300' : 'border-gray-200'
    }`,
  };
  return (
    <div>
      {multiline ? <textarea rows={3} {...common} /> : <input type="text" {...common} />}
      <FieldHints value={value} path={path} />
    </div>
  );
};

const RowTools = ({ index, count, onMove, onRemove }) => {
  const { readOnly } = useContext(EditorContext);
  if (readOnly) return null;
  const btn = 'p-1.5 rounded-lg text-dark-400 hover:bg-gray-100 hover:text-dark-700 disabled:opacity-30 disabled:hover:bg-transparent';
  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      <button type="button" className={btn} disabled={index === 0} onClick={() => onMove(index, -1)} aria-label="Move up"><ArrowUp size={14} /></button>
      <button type="button" className={btn} disabled={index === count - 1} onClick={() => onMove(index, 1)} aria-label="Move down"><ArrowDown size={14} /></button>
      <button type="button" className={`${btn} hover:!text-red-600`} onClick={() => onRemove(index)} aria-label="Remove"><Trash2 size={14} /></button>
    </div>
  );
};

const move = (list, index, delta) => {
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(index + delta, 0, item);
  return next;
};

const AddButton = ({ onClick, children }) => {
  const { readOnly } = useContext(EditorContext);
  if (readOnly) return null;
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary-50">
      <Plus size={14} /> {children}
    </button>
  );
};

const LinesEditor = ({ value = [], onChange, path }) => (
  <div className="space-y-2">
    {value.map((line, i) => (
      <div key={i} className="flex items-start gap-1">
        <div className="flex-1 min-w-0">
          <TextInput value={line} path={`${path}.${i}`} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
        </div>
        <RowTools index={i} count={value.length} onMove={(idx, d) => onChange(move(value, idx, d))} onRemove={(idx) => onChange(value.filter((_, j) => j !== idx))} />
      </div>
    ))}
    <AddButton onClick={() => onChange([...value, ''])}>Add line</AddButton>
  </div>
);

const PairsEditor = ({ value = [], onChange, path, keys, labels, add }) => (
  <div className="space-y-3">
    {value.map((item, i) => {
      const set = (k, v) => onChange(value.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
      return (
        <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-dark-400">#{i + 1}</span>
            <RowTools index={i} count={value.length} onMove={(idx, d) => onChange(move(value, idx, d))} onRemove={(idx) => onChange(value.filter((_, j) => j !== idx))} />
          </div>
          <div className="space-y-2">
            <TextInput value={item[keys[0]]} placeholder={labels[0]} path={`${path}.${i}.${keys[0]}`} onChange={(v) => set(keys[0], v)} />
            <TextInput value={item[keys[1]]} placeholder={labels[1]} path={`${path}.${i}.${keys[1]}`} onChange={(v) => set(keys[1], v)} multiline />
          </div>
        </div>
      );
    })}
    <AddButton onClick={() => onChange([...value, { [keys[0]]: '', [keys[1]]: '' }])}>{add}</AddButton>
  </div>
);

const SectionCard = ({ section, data, onField, open, onToggle, hasError }) => {
  const { rates } = useContext(EditorContext);
  return (
    <div className={`rounded-2xl border bg-white ${hasError ? 'border-red-200' : 'border-gray-200'}`}>
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="font-semibold text-dark-900 text-sm flex items-center gap-2">
          {section.label}
          {hasError && <span className="h-2 w-2 rounded-full bg-red-500" />}
        </span>
        <ChevronDown size={16} className={`text-dark-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {section.rate && (
            <p className="rounded-xl bg-primary-50 px-3 py-2 text-xs text-primary-800">
              The large rate on this card is <strong>{formatToken(section.rate, rates)}</strong>, taken from Site Settings.
            </p>
          )}
          {section.fields.map((f) => {
            const path = `${section.key}.${f.key}`;
            const value = data?.[f.key];
            const set = (v) => onField(section.key, f.key, v);
            return (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-dark-600 mb-1.5">{f.label}</label>
                {f.kind === 'lines' && <LinesEditor value={value} onChange={set} path={path} />}
                {f.kind === 'pairs' && <PairsEditor value={value} onChange={set} path={path} keys={f.keys} labels={f.labels} add={f.add} />}
                {(f.kind === 'text' || f.kind === 'long') && (
                  <TextInput value={value} onChange={set} path={path} multiline={f.kind === 'long'} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const RatesPanel = ({ rates }) => {
  const { active, readOnly } = useContext(EditorContext);

  // Inserting at the caret of whichever field was last focused. mousedown is
  // cancelled so clicking a chip does not steal focus from that field.
  const insert = (key) => {
    const token = `{${key}}`;
    const el = active?.el;
    if (!el || readOnly || !document.body.contains(el)) {
      navigator.clipboard?.writeText(token);
      toast.success(`Copied ${token}`);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    active.onChange(el.value.slice(0, start) + token + el.value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-dark-900 flex items-center gap-1.5"><Tag size={14} /> Live rates</h2>
          <p className="text-xs text-dark-500 mt-0.5">
            Click one to insert it into the field you’re editing. The page always shows the current value.
          </p>
        </div>
        <a
          href="/admin/core/sitesettings/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <Settings2 size={13} /> Change rates
        </a>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(PRICING_TOKENS).map(([key, meta]) => (
          <button
            key={key}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insert(key)}
            title={meta.label}
            className="group inline-flex items-center gap-2 rounded-xl border border-gray-200 px-2.5 py-1.5 text-left hover:border-primary hover:bg-primary-50"
          >
            <span className="text-sm font-bold text-dark-900 tabular-nums">{formatToken(key, rates)}</span>
            <span className="flex flex-col leading-tight">
              <span className="text-[11px] text-dark-500">{meta.label}</span>
              <code className="text-[10px] font-mono text-primary-700">{`{${key}}`}</code>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// The real page, laid out at desktop width and scaled to fit the column, so
// staff judge the actual design rather than a squeezed one.
const PAGE_WIDTH = 1280;
const ScaledPreview = ({ children }) => {
  const ref = useRef(null);
  const [scale, setScale] = useState(0.5);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / PAGE_WIDTH));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="public-theme h-full overflow-y-auto overflow-x-hidden rounded-2xl border border-gray-200 bg-white">
      <div style={{ width: PAGE_WIDTH, zoom: scale }}>{children}</div>
    </div>
  );
};

const flagSections = (errors) => new Set(Object.keys(errors).map((p) => p.split('.')[0]));

const StaffPricing = () => {
  const queryClient = useQueryClient();
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [open, setOpen] = useState(() => new Set(['hero', 'stays_plan']));
  const [active, setActive] = useState(null);
  const [mobileTab, setMobileTab] = useState('edit');
  const [confirmReset, setConfirmReset] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await staffAPI.pricingPage();
      setData(res.data);
      setDraft(res.data.content);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not load the pricing page'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const dirty = useMemo(
    () => !!data && JSON.stringify(draft) !== JSON.stringify(data.content),
    [draft, data],
  );

  // Losing an afternoon of copy edits to a stray tab close is the failure
  // this guards against.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (!confirmReset) return undefined;
    const t = setTimeout(() => setConfirmReset(false), 4000);
    return () => clearTimeout(t);
  }, [confirmReset]);

  const onField = (section, field, value) => {
    setDraft((d) => ({ ...d, [section]: { ...d[section], [field]: value } }));
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const res = await staffAPI.savePricingPage(draft);
      setData((d) => ({ ...d, ...res.data }));
      setDraft(res.data.content);
      queryClient.invalidateQueries({ queryKey: ['pricing-page'] });
      toast.success('Pricing page published');
    } catch (e) {
      const fieldErrors = e?.response?.data?.errors;
      if (fieldErrors) {
        setErrors(fieldErrors);
        setOpen((o) => new Set([...o, ...flagSections(fieldErrors)]));
        setMobileTab('edit');
      }
      toast.error(getErrorMessage(e, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    setDraft(data.defaults);
    setErrors({});
    setConfirmReset(false);
    toast('Default copy loaded — save to publish it.', { icon: '↺' });
  };

  if (loading || !draft) {
    return (
      <div className="flex items-center justify-center py-24 text-dark-500">
        {loading ? <Loader2 className="animate-spin" /> : 'Could not load the pricing page.'}
      </div>
    );
  }

  const readOnly = !data.can_edit;
  const errorSections = flagSections(errors);
  const updated = data.updated_at ? new Date(data.updated_at) : null;
  const ctx = { active, setActive, readOnly, errors, rates: data.rates };

  return (
    <EditorContext.Provider value={ctx}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
              <Tag size={22} /> Pricing page
            </h1>
            <p className="text-sm text-dark-500 mt-1">
              {updated
                ? <>Last published {updated.toLocaleString()}{data.updated_by ? ` by ${data.updated_by}` : ''}.</>
                : 'Showing the default copy — nothing has been published from here yet.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href="/pricing" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-dark-700 hover:bg-gray-50">
              <ExternalLink size={15} /> View live
            </a>
            {!readOnly && (
              <>
                <button
                  type="button"
                  onClick={resetToDefaults}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${
                    confirmReset ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-gray-200 bg-white text-dark-700 hover:bg-gray-50'
                  }`}
                >
                  <RotateCcw size={15} /> {confirmReset ? 'Click again to confirm' : 'Reset to defaults'}
                </button>
                <button
                  type="button"
                  disabled={!dirty || saving}
                  onClick={() => { setDraft(data.content); setErrors({}); }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-dark-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  <Undo2 size={15} /> Discard
                </button>
                <button
                  type="button"
                  disabled={!dirty || saving}
                  onClick={save}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0C3B2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a3226] disabled:opacity-40"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Publish
                </button>
              </>
            )}
          </div>
        </div>

        {readOnly ? (
          <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <Lock size={15} className="mt-0.5 flex-shrink-0" />
            You can view this editor, but publishing needs the “Can change pricing page” permission. A superuser can grant it in Django admin.
          </p>
        ) : (
          <p className={`flex items-center gap-2 text-xs ${dirty ? 'text-amber-700' : 'text-green-700'}`}>
            {dirty ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
            {dirty ? 'Unpublished changes — visitors still see the live version.' : 'Everything here is live.'}
          </p>
        )}

        {/* Mobile: edit / preview toggle */}
        <div className="xl:hidden grid grid-cols-2 rounded-xl bg-gray-100 p-1">
          {[['edit', PencilLine, 'Edit'], ['preview', Eye, 'Preview']].map(([key, icon, label]) => {
            const Icon = icon;
            return (
            <button
              key={key}
              type="button"
              onClick={() => setMobileTab(key)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold ${
                mobileTab === key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          <div className={`space-y-3 ${mobileTab === 'edit' ? '' : 'hidden xl:block'}`}>
            <RatesPanel rates={data.rates} />
            {SECTIONS.map((section) => (
              <SectionCard
                key={section.key}
                section={section}
                data={draft[section.key]}
                onField={onField}
                hasError={errorSections.has(section.key)}
                open={open.has(section.key)}
                onToggle={() => setOpen((o) => {
                  const next = new Set(o);
                  if (next.has(section.key)) next.delete(section.key); else next.add(section.key);
                  return next;
                })}
              />
            ))}
          </div>

          {/* Links in the preview would navigate away from unsaved edits. */}
          <div
            // Stretched to the row so the sticky preview has room to travel.
            className={`xl:self-stretch ${mobileTab === 'preview' ? '' : 'hidden xl:block'}`}
            onClickCapture={(e) => { if (e.target.closest('a')) e.preventDefault(); }}
          >
            {/* Phones get the page at their own width; desktop gets a scaled full-width render. */}
            <div className="public-theme xl:hidden overflow-hidden rounded-2xl border border-gray-200">
              <PricingView content={draft} rates={data.rates} />
            </div>
            <div className="hidden xl:block sticky top-4 h-[calc(100vh-2rem)]">
              <ScaledPreview>
                <PricingView content={draft} rates={data.rates} />
              </ScaledPreview>
            </div>
          </div>
        </div>
      </div>
    </EditorContext.Provider>
  );
};

export default StaffPricing;
