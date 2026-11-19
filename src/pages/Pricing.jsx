import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, PencilLine, RefreshCw } from 'lucide-react';
import { pagesAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import PricingView from '../components/pricing/PricingView';

const Pricing = () => {
  const { user } = useAuthStore();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pricing-page'],
    queryFn: () => pagesAPI.getPricing().then((r) => r.data),
  });

  useEffect(() => {
    document.title = 'Pricing | RentStay';
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-gray-600">We couldn’t load our pricing just now.</p>
        <button onClick={() => refetch()} className="btn btn-primary inline-flex items-center gap-2">
          <RefreshCw size={16} /> Try again
        </button>
      </div>
    );
  }

  const isStaff = user?.is_staff || user?.user_type === 'admin';

  return (
    <div className="min-h-screen">
      <PricingView content={data.content} rates={data.rates} />
      {isStaff && (
        <Link
          to="/staff/dashboard/pricing"
          className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-40 inline-flex items-center gap-2 rounded-full bg-dark-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-dark-800"
        >
          <PencilLine size={16} /> Edit this page
        </Link>
      )}
    </div>
  );
};

export default Pricing;
