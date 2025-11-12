import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import { dashboardAPI } from '../../services/api';
import DashboardSidebar from './DashboardSidebar';

const DashboardShell = ({ children }) => {
  const { user, fetchUser } = useAuthStore();

  // Refresh user profile to reflect role changes made in admin
  useEffect(() => {
    fetchUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: dashData } = useQuery({
    queryKey: ['dashboard-counts', user?.user_type],
    queryFn: async () => {
      try {
        const res = user?.user_type === 'landlord' ? await dashboardAPI.getLandlord() : await dashboardAPI.getTenant();
        return res.data;
      } catch (e) {
        return {};
      }
    }
  });

  const counts = user?.user_type === 'landlord'
    ? {
        unread_messages: dashData?.unread_messages || 0,
        unread_notifications: dashData?.unread_notifications || 0,
        applications_pending: dashData?.metrics?.applications_pending || 0,
      }
    : {
        unread_messages: dashData?.unread_messages || 0,
        unread_notifications: dashData?.unread_notifications || 0,
        applications_pending: dashData?.applications_counts?.pending || 0,
      };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {children}
          </div>
          <DashboardSidebar counts={counts} />
        </div>
      </div>
    </div>
  );
};

export default DashboardShell;
