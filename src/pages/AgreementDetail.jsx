import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardShell from '../components/dashboard/DashboardShell';
import { rentalAPI, paymentAPI } from '../services/api';
import { FileText, Loader2, CalendarClock, CreditCard, Upload, Download, Eye, FileDown, Calendar, CalendarDays } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import PaystackPop from '@paystack/inline-js';

const AgreementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agreement, setAgreement] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [statusVal, setStatusVal] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [paymentFrequency, setPaymentFrequency] = useState('annual');
  const { user } = useAuthStore();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const agRes = await rentalAPI.getAgreement(id);
        setAgreement(agRes.data);
        try {
          const scRes = await rentalAPI.getRentPayments(id);
          setSchedule(scRes.data || []);
        } catch {
          setSchedule([]);
        }
      } catch {
        toast.error('Agreement not found');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  useEffect(() => {
    if (agreement?.status) setStatusVal(agreement.status);
  }, [agreement]);

  // Compute rent amounts based on frequency
  const rentTerm = agreement?.property?.rent_term || 'annual';
  const baseRent = Number(agreement?.rent_amount || 0);
  let annualRent, monthlyRent;
  if (rentTerm === 'monthly') {
    monthlyRent = baseRent;
    annualRent = baseRent * 12;
  } else if (rentTerm === 'biannual') {
    annualRent = baseRent * 2;
    monthlyRent = Math.round((baseRent / 6) * 100) / 100;
  } else {
    annualRent = baseRent;
    monthlyRent = Math.round((baseRent / 12) * 100) / 100;
  }
  const selectedAmount = paymentFrequency === 'annual' ? annualRent : monthlyRent;
  const frequencyLabel = paymentFrequency === 'annual' ? 'Yearly' : 'Monthly';

  const payNext = async () => {
    try {
      const res = await paymentAPI.preparePayment({
        payment_type: 'rent',
        agreement_id: agreement.id,
        amount: selectedAmount,
        description: `Rent payment (${frequencyLabel.toLowerCase()})`,
      });
      const { reference, amount, email, publicKey } = res.data || {};
      if (!reference || !amount || !publicKey) {
        toast.error('Failed to prepare payment.');
        return;
      }
      const popup = new PaystackPop();
      popup.newTransaction({
        key: publicKey,
        email,
        amount,
        reference,
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        onSuccess: async (transaction) => {
          try {
            await paymentAPI.verifyPayment(transaction.reference || reference);
            toast.success('Payment successful!');
            const agRes = await rentalAPI.getAgreement(id);
            setAgreement(agRes.data);
            try {
              const scRes = await rentalAPI.getRentPayments(id);
              setSchedule(scRes.data || []);
            } catch {}
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        onCancel: () => {
          toast('Payment cancelled.');
        },
      });
    } catch (e) {
      toast.error('Failed to initialize payment');
    }
  };

  const uploadDoc = async () => {
    if (!file) return;
    const type = (file.type || '').toLowerCase();
    if (!(type.includes('pdf') || (file.name || '').toLowerCase().endsWith('.pdf'))){
      toast.error('Please select a PDF file');
      return;
    }
    setUploading(true);
    try {
      await rentalAPI.uploadDocument(agreement.id, file);
      const agRes = await rentalAPI.getAgreement(id);
      setAgreement(agRes.data);
    } catch {}
    setUploading(false);
    setFile(null);
  };

  const updateStatus = async () => {
    if (!statusVal || !agreement) return;
    try {
      setSavingStatus(true);
      const res = await rentalAPI.setAgreementStatus(agreement.id, statusVal);
      setAgreement(res.data);
      toast.success('Agreement status updated');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  const downloadDefault = async () => {
    try {
      const res = await rentalAPI.downloadDefault(agreement.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `agreement_${agreement.id}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  const openPrintable = () => {
    const text = agreement?.default_text || '';
    const safe = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Agreement ${agreement?.id}</title>
      <style>body{font-family: Arial, sans-serif; padding: 24px; white-space: pre-wrap; color:#111}
      .meta{margin-bottom:16px; color:#555; font-size:12px}
      h2{margin:0 0 12px 0;}
      </style></head><body>
      <div class="meta">Agreement ID: ${safe(agreement?.id)} • Generated: ${safe(new Date().toLocaleString())}</div>
      <h2>Rental Agreement</h2>
      <div>${safe(text)}</div>
      <script>window.onload=()=>{window.print(); setTimeout(()=>window.close(),300);}</script>
    </body></html>`;
    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  const setSource = async (source) => {
    try {
      const res = await rentalAPI.setDocumentSource(agreement.id, source);
      setAgreement(res.data);
      toast.success(source === 'custom' ? 'Using custom document' : 'Using default template');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to update');
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center text-dark-600"><Loader2 className="animate-spin mr-2" /> Loading agreement...</div>
      </DashboardShell>
    );
  }

  if (!agreement) {
    return (
      <DashboardShell>
        <div className="card">Agreement not found.</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="flex items-center mb-4">
        <FileText className="text-primary mr-2" />
        <h1 className="text-2xl font-display font-bold text-dark-900">Agreement</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-dark-900 mb-3">Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p><span className="text-dark-600">Property:</span> <span className="font-medium text-dark-900">{agreement.property?.title}</span></p>
            <p><span className="text-dark-600">Address:</span> <span className="font-medium text-dark-900">{agreement.property?.address}</span></p>
            <p><span className="text-dark-600">Rent:</span> <span className="font-medium text-dark-900">₦{Number(agreement.rent_amount).toLocaleString()}</span></p>
            <p><span className="text-dark-600">Caution Fee:</span> <span className="font-medium text-dark-900">₦{Number(agreement.caution_fee).toLocaleString()}</span></p>
            <p><span className="text-dark-600">Start:</span> <span className="font-medium text-dark-900">{agreement.start_date}</span></p>
            <p><span className="text-dark-600">End:</span> <span className="font-medium text-dark-900">{agreement.end_date}</span></p>
            <p><span className="text-dark-600">Status:</span> <span className="font-medium text-dark-900 capitalize">{agreement.status}</span></p>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-900 mb-3">Pay Rent</h3>
          {/* Payment Frequency Toggle */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => setPaymentFrequency('annual')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border-2 text-xs transition-all ${
                paymentFrequency === 'annual'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 hover:border-gray-300 text-dark-600'
              }`}
            >
              <Calendar size={14} />
              <span className="font-semibold">Yearly</span>
            </button>
            <button
              onClick={() => setPaymentFrequency('monthly')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border-2 text-xs transition-all ${
                paymentFrequency === 'monthly'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 hover:border-gray-300 text-dark-600'
              }`}
            >
              <CalendarDays size={14} />
              <span className="font-semibold">Monthly</span>
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 mb-3 text-center">
            <p className="text-xs text-dark-500">{frequencyLabel} Amount</p>
            <p className="text-lg font-bold text-primary">₦{selectedAmount.toLocaleString()}</p>
          </div>
          <button onClick={payNext} className="btn btn-primary w-full mb-2 inline-flex items-center justify-center">
            <CreditCard size={16} className="mr-2" /> Pay ₦{selectedAmount.toLocaleString()} ({frequencyLabel})
          </button>
          {agreement?.custom_document && agreement?.use_custom_document ? (
            <a className="btn btn-secondary w-full inline-flex items-center" href={agreement.custom_document} target="_blank" rel="noreferrer">
              <FileText size={16} className="mr-2" /> View Agreement (Custom PDF)
            </a>
          ) : (
            <div className="flex gap-2">
              <button className="btn btn-secondary w-full inline-flex items-center" onClick={downloadDefault}><Download size={16} className="mr-2" /> Download Default (.txt)</button>
              <button className="btn btn-secondary w-full inline-flex items-center" onClick={() => setShowPreview(true)}><Eye size={16} className="mr-2" /> Preview</button>
            </div>
          )}
          {!(agreement?.custom_document && agreement?.use_custom_document) && (
            <button className="btn btn-light w-full mt-2 inline-flex items-center" onClick={openPrintable}><FileDown size={16} className="mr-2"/> Generate PDF (Print)</button>
          )}
          {user?.user_type === 'landlord' && (
            <div className="mt-3">
              <label className="label">Upload Custom Agreement (PDF)</label>
              <div className="flex items-center gap-2">
                <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input" />
                <button className="btn btn-primary inline-flex items-center" onClick={uploadDoc} disabled={uploading || !file}>
                  <Upload size={16} className="mr-2" /> {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              {agreement?.custom_document && (
                <div className="flex gap-2 mt-2">
                  {agreement?.use_custom_document ? (
                    <button className="btn btn-light" onClick={() => setSource('default')}>Use Default Template</button>
                  ) : (
                    <button className="btn btn-light" onClick={() => setSource('custom')}>Use Uploaded Custom PDF</button>
                  )}
                </div>
              )}

              <div className="mt-4">
                <label className="label">Agreement Status</label>
                <div className="flex items-center gap-2">
                  <select className="input" value={statusVal} onChange={(e) => setStatusVal(e.target.value)}>
                    <option value="active">active</option>
                    <option value="expired">expired</option>
                    <option value="terminated">terminated</option>
                  </select>
                  <button className="btn btn-primary" onClick={updateStatus} disabled={savingStatus || statusVal === agreement.status}>
                    {savingStatus ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="text-primary" size={18} />
          <h3 className="text-lg font-semibold text-dark-900">Rent Schedule</h3>
        </div>
        {schedule.length === 0 ? (
          <p className="text-dark-600 text-sm">No schedule available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-dark-600">
                  <th className="py-2 pr-4">Due Date</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Paid Date</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="py-2 pr-4">{new Date(r.due_date).toLocaleDateString()}</td>
                    <td className="py-2 pr-4">₦{Number(r.amount).toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${r.is_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.is_paid ? 'paid' : 'pending'}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{r.paid_date ? new Date(r.paid_date).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-[92vw] p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-dark-900">Default Agreement Preview</h3>
              <button className="text-dark-600 hover:text-dark-900" onClick={() => setShowPreview(false)}>Close</button>
            </div>
            <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-auto whitespace-pre-wrap max-h-[60vh]">
              {agreement?.default_text || '—'}
            </pre>
          </div>
        </div>
      )}

    </DashboardShell>
  );
};

export default AgreementDetail;
