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

  // Agents get their own dashboard
  if (user?.user_type === 'agent') {
    return <Navigate to="/agent/dashboard/home" replace />;
  }

  // Super agents get the platform-wide dashboard
  if (user?.user_type === 'super_agent') {
    return <Navigate to="/super-agent/dashboard" replace />;
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
