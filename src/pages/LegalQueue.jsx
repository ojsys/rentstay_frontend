import { Navigate } from 'react-router-dom';
import DashboardShell from '../components/dashboard/DashboardShell';
import LegalQueueBoard from '../components/legal/LegalQueueBoard';
import useAuthStore from '../store/authStore';
import { isLegalStaff } from '../utils/legal';

/**
 * The legal team's case queue, for a partner who is not platform staff.
 *
 * Legal partners are given case access without the run of the admin, so they
 * have no staff dashboard to open — this is their way in. Staff who are also
 * legal team see the same board at /staff/dashboard/legal, rendered by
 * `StaffLegal`; both mount `LegalQueueBoard` so there is one implementation.
 */
const LegalQueue = () => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isLegalStaff(user)) return <Navigate to="/legal-services" replace />;

  return (
    <DashboardShell>
      <LegalQueueBoard />
    </DashboardShell>
  );
};

export default LegalQueue;
