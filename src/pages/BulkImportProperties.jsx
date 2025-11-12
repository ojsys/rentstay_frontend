import { useState } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell';
import { propertyAPI } from '../services/api';
import { Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const sample = `title,description,property_type,address,area,state_id,lga_id,rent_amount,bedrooms,bathrooms,toilets,square_feet,available_from,has_parking,has_kitchen,has_water,has_electricity,is_furnished,has_security,has_compound,status
2 Bed Apartment,Modern 2 bedroom apartment,apartment,123 Main St,Central,32,501,350000,2,2,2,900,2025-11-01,1,1,1,1,0,1,1,available`;

const BulkImportProperties = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Select a CSV file'); return; }
    setUploading(true);
    try {
      const res = await propertyAPI.bulkUpload(file);
      setResult(res.data);
      toast.success(`Created ${res.data.created} properties`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardShell>
      <h1 className="text-2xl font-display font-bold text-dark-900 mb-4">Bulk Import Properties</h1>
      <div className="card">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">CSV File</label>
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input" />
          </div>
          <div>
            <label className="label">Sample Format</label>
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">{sample}</pre>
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? (<><Loader2 size={16} className="animate-spin mr-2" /> Uploading...</>) : (<><Upload size={16} className="mr-2" /> Upload</>)}
          </button>
        </form>
        {result && (
          <div className="mt-4">
            <p className="text-sm text-dark-700">Created: {result.created}</p>
            {result.errors?.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-red-600">Errors:</p>
                <ul className="list-disc pl-6 text-sm">
                  {result.errors.map((e, idx) => (
                    <li key={idx}>Line {e.line}: {e.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default BulkImportProperties;

