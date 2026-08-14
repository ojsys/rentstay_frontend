import DashboardShell from '../components/dashboard/DashboardShell';
import LegalServicesPanel from '../components/legal/LegalServicesPanel';

/** Standalone legal services page — used by tenants, agents and staff. */
const Legal = () => (
  <DashboardShell>
    <LegalServicesPanel />
  </DashboardShell>
);

export default Legal;
