import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import TenantDashboard from './dashboard/TenantDashboard';
import ErrorBoundary from '../components/common/ErrorBoundary';
import DashboardShell from '../components/dashboard/DashboardShell';

const Dashboard = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Landlords get redirected to the new tabbed dashboard
  if (user?.user_type === 'landlord') {
    return <Navigate to="/dashboard/home" replace />;
  }

  return (
    <DashboardShell>
      <ErrorBoundary>
        <TenantDashboard />
      </ErrorBoundary>
    </DashboardShell>
  );
};

export default Dashboard;
