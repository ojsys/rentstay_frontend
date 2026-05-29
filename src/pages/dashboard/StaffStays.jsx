import ListingModerationTable from '../../components/dashboard/ListingModerationTable';

const StaffStays = () => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-dark-900">Short-stay listings</h2>
      <p className="text-sm text-dark-500">Publishing also verifies the host's account so they can self-manage.</p>
    </div>
    <ListingModerationTable type="stays" />
  </div>
);

export default StaffStays;
