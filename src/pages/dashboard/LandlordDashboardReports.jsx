import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../../services/api';
import { Loader2, Home, Wrench, TrendingUp, CreditCard } from 'lucide-react';
import { useState } from 'react';
import VacancyReport from '../../components/dashboard/VacancyReport';
import RepairsReport from '../../components/dashboard/RepairsReport';
import InterestReport from '../../components/dashboard/InterestReport';
import RentPerformanceReport from '../../components/dashboard/RentPerformanceReport';

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
