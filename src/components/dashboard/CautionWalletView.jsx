import { Wallet, TrendingUp, ShieldCheck } from 'lucide-react';

const CautionWalletView = ({ pools = [] }) => {
  const activePools = pools.filter(p => p.is_active);
  const refundedPools = pools.filter(p => p.is_refunded);
  const totalHeld = activePools.reduce((s, p) => s + Number(p.amount_deposited || 0), 0);
  const totalInterest = activePools.reduce((s, p) => s + Number(p.interest_earned || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <Wallet size={20} className="mx-auto text-indigo-500 mb-1" />
          <p className="text-2xl font-bold text-dark-900">₦{totalHeld.toLocaleString()}</p>
          <p className="text-xs text-dark-600">Total Caution Held</p>
        </div>
        <div className="card text-center">
          <TrendingUp size={20} className="mx-auto text-emerald-500 mb-1" />
          <p className="text-2xl font-bold text-dark-900">₦{totalInterest.toLocaleString()}</p>
          <p className="text-xs text-dark-600">Total Interest Earned</p>
        </div>
        <div className="card text-center">
          <ShieldCheck size={20} className="mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold text-dark-900">{activePools.length}</p>
          <p className="text-xs text-dark-600">Active Pools</p>
        </div>
      </div>

      {/* Pool cards */}
      {pools.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-dark-600">No caution fee pools yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pools.map((pool) => (
            <div key={pool.id} className={`card border-l-4 ${pool.is_active ? 'border-l-indigo-500' : pool.is_refunded ? 'border-l-green-500' : 'border-l-gray-300'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-dark-900">{pool.property_title}</h4>
                  <p className="text-sm text-dark-600">{pool.tenant_name}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  pool.is_active ? 'bg-indigo-100 text-indigo-700' : pool.is_refunded ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-dark-600'
                }`}>
                  {pool.is_active ? 'Active' : pool.is_refunded ? 'Refunded' : 'Closed'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3 text-center">
                <div>
                  <p className="text-lg font-bold text-dark-900">₦{Number(pool.amount_deposited).toLocaleString()}</p>
                  <p className="text-xs text-dark-500">Deposited</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-600">₦{Number(pool.interest_earned).toLocaleString()}</p>
                  <p className="text-xs text-dark-500">Interest</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary">₦{Number(pool.total_amount).toLocaleString()}</p>
                  <p className="text-xs text-dark-500">Total</p>
                </div>
              </div>
              {Number(pool.deductions) > 0 && (
                <p className="text-xs text-red-600 mt-2">Deductions: ₦{Number(pool.deductions).toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CautionWalletView;
