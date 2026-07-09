import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Loader2, Home, Wrench, TrendingUp, CreditCard, Lock, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import VacancyReport from '../../components/dashboard/VacancyReport';
import RepairsReport from '../../components/dashboard/RepairsReport';
import InterestReport from '../../components/dashboard/InterestReport';
import RentPerformanceReport from '../../components/dashboard/RentPerformanceReport';

const reportTypes = [
  { key: 'vacancy', label: 'Vacancy', icon: Home },
  { key: 'repairs', label: 'Repairs', icon: Wrench },
  { key: 'interest', label: 'Caution Cashback', icon: TrendingUp },
  { key: 'rent_performance', label: 'Rent Performance', icon: CreditCard },
];

const LandlordDashboardReports = () => {
  const user = useAuthStore((s) => s.user);
  const hasReporting = !!user?.plan_features?.reporting;
  const [activeReport, setActiveReport] = useState('vacancy');

  const { data, isLoading } = useQuery({
    queryKey: ['landlord-reports', activeReport],
    queryFn: () => dashboardAPI.getLandlordReports(activeReport).then(res => res.data),
    enabled: hasReporting,
  });

  if (!hasReporting) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Reports</h2>
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 text-center max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary flex items-center justify-center mx-auto mb-4">
            <Lock size={26} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Reporting is a paid feature</h3>
          <p className="text-gray-600 mb-6">
            Unlock vacancy, repairs, cashback and rent-performance reports on the
            Professional plan and above.
          </p>
          <Link to="/pricing" className="btn btn-primary inline-flex items-center gap-1.5">
            View plans <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-lg md:text-xl font-bold text-gray-900">Reports</h2>

      {/* Report type selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {reportTypes.map(r => (
          <button
            key={r.key}
            onClick={() => setActiveReport(r.key)}
            className={`bg-white rounded-2xl p-4 text-center shadow-sm border-2 transition-all ${
              activeReport === r.key
                ? 'border-[#0C3B2E] bg-green-50/30'
                : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${
              activeReport === r.key ? 'bg-[#0C3B2E]' : 'bg-gray-100'
            }`}>
              <r.icon size={18} className={activeReport === r.key ? 'text-white' : 'text-gray-500'} />
            </div>
            <p className={`text-sm font-semibold ${activeReport === r.key ? 'text-[#0C3B2E]' : 'text-gray-700'}`}>
              {r.label}
            </p>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="animate-spin mr-2" /> Loading report...
        </div>
      ) : !data ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <p className="text-gray-500">No data available.</p>
        </div>
      ) : (
        <>
          {activeReport === 'vacancy' && <VacancyReport data={data} />}
          {activeReport === 'repairs' && <RepairsReport data={data} />}
          {activeReport === 'interest' && <InterestReport data={data} />}
          {activeReport === 'rent_performance' && <RentPerformanceReport data={data} />}
        </>
      )}
    </div>
  );
};

export default LandlordDashboardReports;
