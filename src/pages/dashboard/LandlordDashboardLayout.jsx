import { Outlet, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import DashboardShell from '../../components/dashboard/DashboardShell';
import DashboardTabNav from '../../components/dashboard/DashboardTabNav';
import QuickActionBar from '../../components/dashboard/QuickActionBar';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { dashboardAPI } from '../../services/api';

const LandlordDashboardLayout = () => {
  const { isAuthenticated, user } = useAuthStore();

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
    <DashboardShell>
      <QuickActionBar />
      <DashboardTabNav badges={badges} />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </DashboardShell>
  );
};

export default LandlordDashboardLayout;
