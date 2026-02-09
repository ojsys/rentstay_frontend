import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../../services/api';
import { Loader2, BarChart3, Home, Wrench, TrendingUp, CreditCard } from 'lucide-react';
import { useState } from 'react';

const reportTypes = [
  { key: 'vacancy', label: 'Vacancy', icon: Home },
  { key: 'repairs', label: 'Repairs', icon: Wrench },
  { key: 'interest', label: 'Caution Interest', icon: TrendingUp },
  { key: 'rent_performance', label: 'Rent Performance', icon: CreditCard },
];

const LandlordDashboardReports = () => {
  const [activeReport, setActiveReport] = useState('vacancy');

  const { data, isLoading } = useQuery({
    queryKey: ['landlord-reports', activeReport],
    queryFn: () => dashboardAPI.getLandlordReports(activeReport).then(res => res.data),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-dark-900">Reports</h2>

      {/* Report type selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {reportTypes.map(r => (
          <button
            key={r.key}
            onClick={() => setActiveReport(r.key)}
            className={`card p-4 text-center transition-all ${activeReport === r.key ? 'ring-2 ring-primary bg-primary-50/30' : 'hover:bg-gray-50'}`}
          >
            <r.icon size={24} className={`mx-auto mb-2 ${activeReport === r.key ? 'text-primary' : 'text-dark-400'}`} />
            <p className={`text-sm font-medium ${activeReport === r.key ? 'text-primary' : 'text-dark-700'}`}>{r.label}</p>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading report...</div>
      ) : !data ? (
        <div className="card text-center py-8"><p className="text-dark-600">No data available.</p></div>
      ) : (
        <>
          {/* Vacancy Report */}
          {activeReport === 'vacancy' && data.summary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center"><p className="text-2xl font-bold">{data.summary.total}</p><p className="text-xs text-dark-600">Total Properties</p></div>
                <div className="card text-center"><p className="text-2xl font-bold text-green-600">{data.summary.rented}</p><p className="text-xs text-dark-600">Rented</p></div>
                <div className="card text-center"><p className="text-2xl font-bold text-amber-600">{data.summary.available}</p><p className="text-xs text-dark-600">Available</p></div>
                <div className="card text-center"><p className="text-2xl font-bold text-primary">{data.summary.vacancy_rate}%</p><p className="text-xs text-dark-600">Vacancy Rate</p></div>
              </div>
              {data.properties?.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-dark-900 mb-3">By Property</h3>
                  <div className="space-y-2">
                    {data.properties.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded border">
                        <span className="text-sm text-dark-900">{p.title}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${p.is_vacant ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Repairs Report */}
          {activeReport === 'repairs' && data.summary && (
            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-dark-900 mb-3">Total: {data.summary.total} requests</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-dark-700 mb-2">By Priority</h4>
                    {Object.entries(data.summary.by_priority || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-1">
                        <span className="text-sm capitalize text-dark-600">{k}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(8, (v / Math.max(data.summary.total, 1)) * 100)}px` }} />
                          <span className="text-sm font-medium">{v}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-dark-700 mb-2">By Status</h4>
                    {Object.entries(data.summary.by_status || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-1">
                        <span className="text-sm capitalize text-dark-600">{k.replace('_', ' ')}</span>
                        <span className="text-sm font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interest Report */}
          {activeReport === 'interest' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="card text-center"><p className="text-2xl font-bold text-indigo-600">₦{Number(data.summary?.total_held || 0).toLocaleString()}</p><p className="text-xs text-dark-600">Total Held</p></div>
                <div className="card text-center"><p className="text-2xl font-bold text-emerald-600">₦{Number(data.summary?.total_interest || 0).toLocaleString()}</p><p className="text-xs text-dark-600">Total Interest</p></div>
              </div>
              {data.pools?.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-dark-900 mb-3">Caution Fee Pools</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead><tr className="text-left text-dark-600"><th className="py-2 pr-3">Tenant</th><th className="py-2 pr-3">Property</th><th className="py-2 pr-3">Deposited</th><th className="py-2 pr-3">Interest</th><th className="py-2">Status</th></tr></thead>
                      <tbody>
                        {data.pools.map((p, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="py-2 pr-3">{p.tenant}</td>
                            <td className="py-2 pr-3">{p.property}</td>
                            <td className="py-2 pr-3">₦{Number(p.deposited).toLocaleString()}</td>
                            <td className="py-2 pr-3 text-emerald-600">₦{Number(p.interest).toLocaleString()}</td>
                            <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-dark-600'}`}>{p.is_active ? 'Active' : 'Closed'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rent Performance */}
          {activeReport === 'rent_performance' && data.summary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center"><p className="text-2xl font-bold">{data.summary.total_expected}</p><p className="text-xs text-dark-600">Total Expected</p></div>
                <div className="card text-center"><p className="text-2xl font-bold text-green-600">{data.summary.on_time_rate}%</p><p className="text-xs text-dark-600">On-Time Rate</p></div>
                <div className="card text-center"><p className="text-2xl font-bold text-primary">{data.summary.collection_rate}%</p><p className="text-xs text-dark-600">Collection Rate</p></div>
                <div className="card text-center"><p className="text-2xl font-bold text-red-600">{data.summary.unpaid}</p><p className="text-xs text-dark-600">Unpaid</p></div>
              </div>
              <div className="card">
                <h3 className="font-semibold text-dark-900 mb-3">Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div><p className="text-lg font-bold text-green-600">{data.summary.paid_on_time}</p><p className="text-xs text-dark-600">Paid On Time</p></div>
                  <div><p className="text-lg font-bold text-amber-600">{data.summary.paid_late}</p><p className="text-xs text-dark-600">Paid Late</p></div>
                  <div><p className="text-lg font-bold">₦{Number(data.summary.collected).toLocaleString()}</p><p className="text-xs text-dark-600">Collected</p></div>
                  <div><p className="text-lg font-bold">₦{Number(data.summary.total_amount).toLocaleString()}</p><p className="text-xs text-dark-600">Total Amount</p></div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LandlordDashboardReports;
