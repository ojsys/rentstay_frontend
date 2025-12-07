import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Upload, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const UpgradeToLandlord = () => {
  const { user, upgradeToLandlord } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [propertyDocs, setPropertyDocs] = useState(null);

  // Don't show if already a landlord
  if (user?.user_type === 'landlord') {
    return (
      <div className="card bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-dark-900">Landlord Account</h3>
            <p className="text-sm text-dark-600">You're already a landlord and can list properties.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show verification requirement if not verified
  if (!user?.is_verified) {
    return (
      <div className="card bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle size={24} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-dark-900 mb-1">Verification Required</h3>
            <p className="text-sm text-dark-600 mb-3">
              You must complete KYC verification before upgrading to a landlord account.
            </p>
            <a
              href="/verification"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Complete Verification
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setPropertyDocs(file);
    }
  };

  const handleUpgrade = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await upgradeToLandlord(propertyDocs);
      if (result.success) {
        toast.success(result.message || 'Successfully upgraded to landlord!');
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        toast.error(result.error || 'Upgrade failed. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show upgrade form for verified tenants
  return (
    <div className="card">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Building2 size={28} className="text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-display font-bold text-dark-900 mb-2">
            Upgrade to Landlord Account
          </h2>
          <p className="text-dark-600">
            As a landlord, you can list and manage your properties, receive applications from tenants,
            and access powerful property management tools.
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-dark-900 mb-3">Landlord Benefits:</h3>
        <ul className="space-y-2 text-sm text-dark-600">
          <li className="flex items-start gap-2">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <span>List unlimited properties for rent</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <span>Manage rental agreements and collect payments</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <span>Track maintenance requests and property analytics</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <span>Receive applications from verified tenants</span>
          </li>
        </ul>
      </div>

      {/* Upgrade Form */}
      <form onSubmit={handleUpgrade} className="space-y-4">
        {/* Property Documents Upload (Optional) */}
        <div>
          <label className="label">Property Ownership Documents (Optional)</label>
          <div className="mt-1">
            <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-dark-300 rounded-lg cursor-pointer hover:border-primary transition-colors bg-white">
              <div className="text-center">
                <Upload size={32} className="mx-auto text-dark-400 mb-2" />
                <p className="text-sm font-medium text-dark-700 mb-1">
                  {propertyDocs ? propertyDocs.name : 'Click to upload property documents'}
                </p>
                <p className="text-xs text-dark-500">
                  PDF, JPG, PNG up to 5MB (optional but recommended)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </label>
          </div>
          <p className="text-xs text-dark-500 mt-2">
            Upload proof of property ownership for admin review (optional)
          </p>
        </div>

        {/* Upgrade Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary btn-lg w-full"
        >
          {isLoading ? (
            <span>Upgrading...</span>
          ) : (
            <>
              <Building2 size={20} />
              <span>Upgrade to Landlord</span>
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-dark-600">
          <strong>Note:</strong> Your account will be upgraded immediately. Property ownership documents
          may be reviewed by our team for compliance purposes.
        </p>
      </div>
    </div>
  );
};

export default UpgradeToLandlord;
