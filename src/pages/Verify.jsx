import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../components/dashboard/DashboardShell';
import { authAPI } from '../services/api';
import { ShieldCheck, Loader2, AlertCircle, FileText, Camera, Home } from 'lucide-react';
import toast from 'react-hot-toast';

const Verify = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({ id_type: '', id_number: '' });
  const [files, setFiles] = useState({ id_document: null, selfie: null, address_document: null });
  const [submitting, setSubmitting] = useState(false);

  // Helper to get document type guidance based on ID type
  const getDocumentGuidance = () => {
    const idType = form.id_type.toLowerCase();
    if (idType.includes('nin') || idType.includes('national')) {
      return 'Upload a clear photo or scan of your National Identity Number (NIN) slip';
    }
    if (idType.includes('driver') || idType.includes('license')) {
      return 'Upload a clear photo of both sides of your Driver\'s License';
    }
    if (idType.includes('passport')) {
      return 'Upload a clear photo of your International Passport data page';
    }
    if (idType.includes('voter')) {
      return 'Upload a clear photo of your Voter\'s Card';
    }
    return 'Upload a clear photo or PDF of your ID document';
  };

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
      toast.success('Verification submitted successfully! We\'ll review it shortly.');
      await load();
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
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
      <div className="flex items-center mb-4">
        <ShieldCheck className="text-primary mr-2"/>
        <h1 className="text-2xl font-display font-bold text-dark-900">Identity Verification</h1>
      </div>

      {/* Status Banner */}
      <div className={`mb-6 p-4 rounded-lg border ${
        status?.is_verified
          ? 'bg-green-50 border-green-200'
          : status?.request?.status === 'pending'
          ? 'bg-blue-50 border-blue-200'
          : status?.request?.status === 'rejected'
          ? 'bg-red-50 border-red-200'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <p className="text-sm font-medium">
          Verification Status: <span className="capitalize">
            {status?.is_verified ? '✓ Verified' : (status?.request?.status || 'Not Started')}
          </span>
        </p>
        {status?.request?.notes && (
          <p className="text-xs mt-2 text-dark-600">Note: {status.request.notes}</p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Why verify your identity?</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Build trust with landlords and tenants</li>
            <li>Access premium features and faster approvals</li>
            <li>Secure your account and transactions</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-dark-900 mb-4">Submit Your Documents</h2>
        <form onSubmit={submit} className="space-y-6">
          {/* ID Type and Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">ID Type *</label>
              <select
                className="input"
                value={form.id_type}
                onChange={(e) => setForm(f => ({ ...f, id_type: e.target.value }))}
                required
              >
                <option value="">Select ID Type</option>
                <option value="NIN">National Identity Number (NIN)</option>
                <option value="Driver's License">Driver's License</option>
                <option value="International Passport">International Passport</option>
                <option value="Voter's Card">Voter's Card</option>
              </select>
              <p className="text-xs text-dark-500 mt-1">Choose the type of ID you'll upload</p>
            </div>
            <div>
              <label className="label">ID Number *</label>
              <input
                className="input"
                value={form.id_number}
                onChange={(e) => setForm(f => ({ ...f, id_number: e.target.value }))}
                placeholder="Enter your ID number"
                required
              />
              <p className="text-xs text-dark-500 mt-1">Must match the number on your ID document</p>
            </div>
          </div>

          {/* ID Document Upload */}
          <div>
            <label className="label flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              ID Document * <span className="text-xs text-dark-500 font-normal">(JPEG, PNG, or PDF - Max 5MB)</span>
            </label>
            <input
              className="input"
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={(e) => setFiles(f => ({ ...f, id_document: e.target.files?.[0] || null }))}
              required
            />
            {form.id_type && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-900">
                  <strong>Required:</strong> {getDocumentGuidance()}
                </p>
              </div>
            )}
            <p className="text-xs text-dark-500 mt-1">
              Ensure all text is clearly readable and the document is not expired
            </p>
          </div>

          {/* Selfie Upload */}
          <div>
            <label className="label flex items-center gap-2">
              <Camera size={16} className="text-primary" />
              Selfie with ID * <span className="text-xs text-dark-500 font-normal">(JPEG or PNG - Max 5MB)</span>
            </label>
            <input
              className="input"
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={(e) => setFiles(f => ({ ...f, selfie: e.target.files?.[0] || null }))}
              required
            />
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-900">
                <strong>Required:</strong> Take a clear selfie holding your ID document next to your face. Both your face and the ID should be clearly visible.
              </p>
            </div>
          </div>

          {/* Address Document Upload */}
          <div>
            <label className="label flex items-center gap-2">
              <Home size={16} className="text-primary" />
              Proof of Address (Optional) <span className="text-xs text-dark-500 font-normal">(JPEG, PNG, or PDF - Max 5MB)</span>
            </label>
            <input
              className="input"
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={(e) => setFiles(f => ({ ...f, address_document: e.target.files?.[0] || null }))}
            />
            <p className="text-xs text-dark-500 mt-1">
              Upload a recent utility bill, bank statement, or government document showing your current address (not older than 3 months)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !form.id_type || !form.id_number}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16}/>
                  Submitting for Review…
                </>
              ) : (
                'Submit for Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
};

export default Verify;

