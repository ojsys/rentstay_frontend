import { useEffect } from 'react';
import useAuthStore from '../../store/authStore';

const DashboardShell = ({ children }) => {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-4 lg:py-8">
      <div className="container-custom">{children}</div>
    </div>
  );
};

export default DashboardShell;
