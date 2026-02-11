import { Outlet, Navigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import DashboardTabNav from '../../components/dashboard/DashboardTabNav';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { dashboardAPI } from '../../services/api';
import { Plus } from 'lucide-react';

const LandlordDashboardLayout = () => {
  const { isAuthenticated, user, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: metadata } = useQuery({
    queryKey: ['dashboard-metadata'],
    queryFn: () => dashboardAPI.getDashboardMetadata().then(res => res.data),
    enabled: isAuthenticated && user?.user_type === 'landlord',
    refetchInterval: 60000,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.user_type !== 'landlord') {
    return <Navigate to="/dashboard" replace />;
  }

  const badges = {
    leases: metadata?.leases_expiring || 0,
    maintenance: metadata?.maintenance || 0,
    messages: metadata?.messages || 0,
    applications: metadata?.applications || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-4 lg:py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-dark-900">Welcome, {user.first_name || user.full_name || 'Landlord'}</h1>
            <p className="text-sm text-dark-500">Landlord Dashboard</p>
          </div>
          <Link to="/properties/new" className="btn btn-primary btn-sm inline-flex items-center gap-1">
            <Plus size={16} /> Add Property
          </Link>
        </div>
        <DashboardTabNav badges={badges} />
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default LandlordDashboardLayout;
