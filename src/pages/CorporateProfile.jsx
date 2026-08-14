import { useEffect, useState } from 'react';
import {
  Building2, ShieldCheck, ShieldAlert, Loader2, Plus, Trash2, Send,
  CheckCircle2, AlertTriangle, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardShell from '../components/dashboard/DashboardShell';
import DocumentUpload from '../components/verification/DocumentUpload';
import { corporateAPI } from '../services/api';
import { getErrorMessage } from '../utils/errors';

const ENTITY_TYPES = [
  { value: 'limited', label: 'Limited Liability Company (Ltd)' },
  { value: 'plc', label: 'Public Limited Company (PLC)' },
  { value: 'business_name', label: 'Registered Business Name' },
  { value: 'ngo', label: 'NGO / Incorporated Trustees' },
  { value: 'government', label: 'Government / Public Body' },
  { value: 'other', label: 'Other' },
];

const ROLES = [
  { value: 'ceo', label: 'CEO / Managing Director' },
  { value: 'director', label: 'Director' },
  { value: 'board_member', label: 'Board Member' },
  { value: 'company_secretary', label: 'Company Secretary' },
  { value: 'signatory', label: 'Authorised Signatory' },
  { value: 'other', label: 'Other Officer' },
];

const Field = ({ label, hint, children, required }) => (
  <div>
    <label className="label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-dark-400 mt-1">{hint}</p>}
  </div>
);

/**
 * Company registration and verification.
 *
 * A company proves itself with CAC registration and tax identifiers rather
 * than a passport and a selfie, and must name a real person who can act for
 * it — a company cannot sign an agreement by itself.
 */
const CorporateProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    company_name: '', entity_type: 'limited', rc_number: '', tin: '',
    vat_number: '', date_of_incorporation: '', registered_address: '',
    industry: '', company_email: '', company_phone: '', website: '',
  });
  const [cacFile, setCacFile] = useState(null);
  const [tinFile, setTinFile] = useState(null);
  const [resolutionFile, setResolutionFile] = useState(null);

  const [reps, setReps] = useState([]);
  const [showRepForm, setShowRepForm] = useState(false);
  const [rep, setRep] = useState({ full_name: '', role: 'ceo', email: '', phone: '', id_type: '', id_number: '' });
  const [repIdFile, setRepIdFile] = useState(null);
  const [addingRep, setAddingRep] = useState(false);

  const load = async () => {
    try {
      const { data } = await corporateAPI.getProfile();
      setProfile(data);
      if (data.has_profile) {
        setForm(f => ({
          ...f,
          ...Object.fromEntries(
            Object.keys(f).map(k => [k, data[k] ?? ''])
          ),
        }));
        setReps(data.representatives || []);
      }
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not load your company details'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.rc_number.trim()) {
      toast.error('Company name and CAC registration number are required');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v != null) fd.append(k, v); });
      if (cacFile) fd.append('cac_certificate', cacFile);
      if (tinFile) fd.append('tin_certificate', tinFile);
      if (resolutionFile) fd.append('board_resolution', resolutionFile);
      await corporateAPI.saveProfile(fd);
      toast.success('Company details saved');
      setCacFile(null); setTinFile(null); setResolutionFile(null);
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not save your company details'));
    } finally {
      setSaving(false);
    }
  };

  const addRep = async () => {
    if (!rep.full_name.trim()) { toast.error('Enter the person’s full name'); return; }
    setAddingRep(true);
    try {
      const fd = new FormData();
      Object.entries(rep).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (repIdFile) fd.append('id_document', repIdFile);
      await corporateAPI.addRepresentative(fd);
      toast.success('Representative added');
      setRep({ full_name: '', role: 'ceo', email: '', phone: '', id_type: '', id_number: '' });
      setRepIdFile(null);
      setShowRepForm(false);
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not add this representative'));
    } finally {
      setAddingRep(false);
    }
  };

  const removeRep = async (id) => {
    try {
      await corporateAPI.removeRepresentative(id);
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not remove this representative'));
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await corporateAPI.submitForVerification();
      toast.success(data.detail);
      await load();
    } catch (e) {
      const missing = e?.response?.data?.missing;
      toast.error(missing?.length
        ? `Still missing: ${missing.join(', ')}`
        : getErrorMessage(e, 'Could not submit for verification'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center gap-2 text-dark-400 p-8">
          <Loader2 className="animate-spin" size={18} /> Loading…
        </div>
      </DashboardShell>
    );
  }

  const missing = profile?.missing_requirements || [];
  const hasProfile = profile?.has_profile;

  return (
    <DashboardShell>
      <div className="space-y-5 max-w-3xl">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
            <Building2 size={22} /> Company Account
          </h1>
          <p className="text-sm text-dark-500 mt-1">
            Renting or listing as a business? Verify your company once and act on its behalf.
          </p>
        </div>

        {/* Status */}
        <div className={`card p-5 ${profile?.is_verified ? 'border-emerald-200' : ''}`}>
          <div className="flex items-start gap-3">
            {profile?.is_verified
              ? <ShieldCheck size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              : <ShieldAlert size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-dark-900">
                {profile?.is_verified ? 'Company verified' : 'Company not yet verified'}
              </p>
              {!hasProfile && (
                <p className="text-sm text-dark-500 mt-0.5">
                  Add your company details below to get started.
                </p>
              )}
              {hasProfile && missing.length > 0 && (
                <>
                  <p className="text-sm text-dark-500 mt-0.5">Still needed before review:</p>
                  <ul className="mt-2 space-y-1">
                    {missing.map(m => (
                      <li key={m} className="text-sm text-amber-700 flex items-center gap-1.5">
                        <AlertTriangle size={12} /> {m}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {hasProfile && missing.length === 0 && !profile?.is_verified && (
                <div className="mt-3">
                  <p className="text-sm text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Everything we need is here.
                  </p>
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="btn btn-primary btn-sm mt-3 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Submit for verification
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Company details */}
        <form onSubmit={save} className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-dark-700">Company details</h2>

          <Field label="Registered company name" required>
            <input className="input w-full" value={form.company_name}
                   onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                   placeholder="As it appears on your CAC certificate" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Entity type">
              <select className="input w-full" value={form.entity_type}
                      onChange={e => setForm(f => ({ ...f, entity_type: e.target.value }))}>
                {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="CAC registration number" required hint="e.g. RC 1234567 or BN 1234567">
              <input className="input w-full" value={form.rc_number}
                     onChange={e => setForm(f => ({ ...f, rc_number: e.target.value }))} />
            </Field>
            <Field label="Tax Identification Number (TIN)" required>
              <input className="input w-full" value={form.tin}
                     onChange={e => setForm(f => ({ ...f, tin: e.target.value }))} />
            </Field>
            <Field label="VAT number" hint="If registered for VAT">
              <input className="input w-full" value={form.vat_number}
                     onChange={e => setForm(f => ({ ...f, vat_number: e.target.value }))} />
            </Field>
            <Field label="Date of incorporation">
              <input type="date" className="input w-full" value={form.date_of_incorporation || ''}
                     onChange={e => setForm(f => ({ ...f, date_of_incorporation: e.target.value }))} />
            </Field>
            <Field label="Industry">
              <input className="input w-full" value={form.industry}
                     onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
            </Field>
            <Field label="Company email">
              <input type="email" className="input w-full" value={form.company_email}
                     onChange={e => setForm(f => ({ ...f, company_email: e.target.value }))} />
            </Field>
            <Field label="Company phone">
              <input className="input w-full" value={form.company_phone}
                     onChange={e => setForm(f => ({ ...f, company_phone: e.target.value }))} />
            </Field>
          </div>

          <Field label="Registered address">
            <textarea className="input w-full min-h-[80px]" value={form.registered_address}
                      onChange={e => setForm(f => ({ ...f, registered_address: e.target.value }))} />
          </Field>

          <div className="space-y-4 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-dark-700 pt-2">Documents</h3>
            <DocumentUpload
              label="Certificate of incorporation (CAC)" required icon={FileText}
              value={cacFile} onChange={setCacFile}
              hint={profile?.cac_certificate_url ? 'A certificate is already on file — upload to replace it.' : 'Your CAC certificate as issued'}
            />
            <DocumentUpload
              label="TIN certificate" icon={FileText}
              value={tinFile} onChange={setTinFile}
              hint="Optional, but speeds up review"
            />
            <DocumentUpload
              label="Board resolution / authority letter" icon={FileText}
              value={resolutionFile} onChange={setResolutionFile}
              hint="Naming the person authorised to transact for the company"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving}
                    className="btn btn-primary flex items-center gap-1.5 disabled:opacity-50">
              {saving && <Loader2 size={14} className="animate-spin" />} Save company details
            </button>
          </div>
        </form>

        {/* Representatives */}
        {hasProfile && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-dark-700">Directors &amp; officers</h2>
              <button onClick={() => setShowRepForm(v => !v)}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                <Plus size={12} /> Add person
              </button>
            </div>
            <p className="text-xs text-dark-400 mb-3">
              A company cannot sign for itself — name at least one person authorised to act for it.
            </p>

            {reps.length === 0 ? (
              <p className="text-sm text-dark-400">No one added yet.</p>
            ) : (
              <div className="space-y-2">
                {reps.map(r => (
                  <div key={r.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-dark-900 flex items-center gap-2 flex-wrap">
                        {r.full_name}
                        {r.is_primary && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                            Primary contact
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-dark-500">
                        {r.role_display}{r.email && ` · ${r.email}`}{r.phone && ` · ${r.phone}`}
                      </p>
                    </div>
                    <button onClick={() => removeRep(r.id)}
                            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showRepForm && (
              <div className="border border-gray-200 rounded-xl p-4 mt-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Full name" required>
                    <input className="input w-full" value={rep.full_name}
                           onChange={e => setRep(r => ({ ...r, full_name: e.target.value }))} />
                  </Field>
                  <Field label="Role">
                    <select className="input w-full" value={rep.role}
                            onChange={e => setRep(r => ({ ...r, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Email">
                    <input type="email" className="input w-full" value={rep.email}
                           onChange={e => setRep(r => ({ ...r, email: e.target.value }))} />
                  </Field>
                  <Field label="Phone">
                    <input className="input w-full" value={rep.phone}
                           onChange={e => setRep(r => ({ ...r, phone: e.target.value }))} />
                  </Field>
                  <Field label="ID type" hint="NIN, Driver's Licence, Passport">
                    <input className="input w-full" value={rep.id_type}
                           onChange={e => setRep(r => ({ ...r, id_type: e.target.value }))} />
                  </Field>
                  <Field label="ID number">
                    <input className="input w-full" value={rep.id_number}
                           onChange={e => setRep(r => ({ ...r, id_number: e.target.value }))} />
                  </Field>
                </div>
                <DocumentUpload label="ID document" icon={FileText} capture="environment"
                                value={repIdFile} onChange={setRepIdFile} />
                <div className="flex gap-3">
                  <button onClick={() => setShowRepForm(false)} className="flex-1 btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button onClick={addRep} disabled={addingRep}
                          className="flex-1 btn btn-primary btn-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
                    {addingRep && <Loader2 size={13} className="animate-spin" />} Add person
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default CorporateProfile;
