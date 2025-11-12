import { useEffect, useState } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell';
import { authAPI } from '../services/api';
import { ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Verify = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({ id_type: '', id_number: '' });
  const [files, setFiles] = useState({ id_document: null, selfie: null, address_document: null });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try { const res = await authAPI.getVerificationStatus(); setStatus(res.data); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (form.id_type) fd.append('id_type', form.id_type);
      if (form.id_number) fd.append('id_number', form.id_number);
      if (files.id_document) fd.append('id_document', files.id_document);
      if (files.selfie) fd.append('selfie', files.selfie);
      if (files.address_document) fd.append('address_document', files.address_document);
      await authAPI.submitVerification(fd);
      toast.success('Submitted for review');
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to submit'); }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center text-dark-600"><Loader2 className="animate-spin mr-2"/> Loading…</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="flex items-center mb-4"><ShieldCheck className="text-primary mr-2"/><h1 className="text-2xl font-display font-bold text-dark-900">Verification</h1></div>
      <div className="card">
        <p className="text-sm mb-3">Status: <span className="font-medium capitalize">{status?.is_verified ? 'verified' : (status?.request?.status || 'not started')}</span></p>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">ID Type</label>
            <input className="input" value={form.id_type} onChange={(e) => setForm(f => ({ ...f, id_type: e.target.value }))} placeholder="NIN, Driver's License, etc." />
          </div>
          <div>
            <label className="label">ID Number</label>
            <input className="input" value={form.id_number} onChange={(e) => setForm(f => ({ ...f, id_number: e.target.value }))} placeholder="1234567890" />
          </div>
          <div>
            <label className="label">ID Document (PDF/Image)</label>
            <input className="input" type="file" accept="image/*,application/pdf" onChange={(e) => setFiles(f => ({ ...f, id_document: e.target.files?.[0] || null }))} />
          </div>
          <div>
            <label className="label">Selfie (Image)</label>
            <input className="input" type="file" accept="image/*" onChange={(e) => setFiles(f => ({ ...f, selfie: e.target.files?.[0] || null }))} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Address Document (e.g., Utility Bill)</label>
            <input className="input" type="file" accept="image/*,application/pdf" onChange={(e) => setFiles(f => ({ ...f, address_document: e.target.files?.[0] || null }))} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button className="btn btn-primary" disabled={submitting}>{submitting ? (<><Loader2 className="animate-spin mr-2" size={16}/> Submitting…</>) : 'Submit for Review'}</button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
};

export default Verify;

