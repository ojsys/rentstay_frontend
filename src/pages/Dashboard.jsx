import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import TenantDashboard from './dashboard/TenantDashboard';
import LandlordDashboard from './dashboard/LandlordDashboard';
import ErrorBoundary from '../components/common/ErrorBoundary';
import DashboardShell from '../components/dashboard/DashboardShell';

const Dashboard = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardShell>
      <ErrorBoundary>
        {user?.user_type === 'landlord' ? <LandlordDashboard /> : <TenantDashboard />}
      </ErrorBoundary>
    </DashboardShell>
  );
};

export default Dashboard;
