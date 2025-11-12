import { useEffect, useState } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell';
import useAuthStore from '../store/authStore';
import { rentalAPI } from '../services/api';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import RichTextEditor from '../components/common/RichTextEditor';

const sampleData = {
  landlord: 'John Landlord',
  tenant: 'Jane Tenant',
  address: '123 Example Street, Lagos',
  start_date: '2025-01-01',
  end_date: '2025-12-31',
  rent_amount: '₦1,200,000.00',
  caution_fee: '₦120,000.00',
};

function renderPreview(template) {
  let text = template || '';
  Object.entries(sampleData).forEach(([k, v]) => {
    text = text.replaceAll(`{{${k}}}`, String(v));
  });
  return text;
}

const AgreementTemplate = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [placeholders, setPlaceholders] = useState(['{{landlord}}','{{tenant}}','{{address}}','{{start_date}}','{{end_date}}','{{rent_amount}}','{{caution_fee}}']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Only fetch when a landlord is logged in
      if (!user || user.user_type !== 'landlord') {
        setLoading(false);
        return;
      }
      try {
        const res = await rentalAPI.getTemplate();
        setBody(res.data.body || '');
        if (res.data.placeholders) setPlaceholders(res.data.placeholders);
      } catch (e) {
        const msg = e?.response?.data?.detail || 'Failed to load template';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const save = async () => {
    try {
      setSaving(true);
      await rentalAPI.saveTemplate(body);
      toast.success('Template saved');
    } catch (e) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.user_type !== 'landlord') return <Navigate to="/dashboard" replace />;

  return (
    <DashboardShell>
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-display font-bold text-dark-900">Agreement Template</h1>
      </div>

      {/* Editor */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-900 mb-2">Edit Template</h3>
        <p className="text-sm text-dark-600 mb-3">Use placeholders: {placeholders.join(', ')}</p>
        <RichTextEditor value={body} onChange={(val) => setBody(val)} />
        <div className="flex justify-end mt-4">
          <button className="btn btn-primary" onClick={save} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Preview below editor for more space */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-dark-900 mb-2">Preview</h3>
        <p className="text-sm text-dark-600 mb-3">Example preview with sample values</p>
        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: renderPreview(body) }} />
        </div>
      </div>
    </DashboardShell>
  );
};

export default AgreementTemplate;
