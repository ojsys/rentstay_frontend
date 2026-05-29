import ListingModerationTable from '../../components/dashboard/ListingModerationTable';

const StaffRentals = () => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-dark-900">Rental properties</h2>
      <p className="text-sm text-dark-500">Verify and publish rental listings so they appear publicly.</p>
    </div>
    <ListingModerationTable type="rentals" />
  </div>
);

export default StaffRentals;
