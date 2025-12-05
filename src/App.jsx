import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import useSiteSettings from './hooks/useSiteSettings';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PaymentCallback from './pages/PaymentCallback';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Applications from './pages/Applications';
import Profile from './pages/Profile';
import ProfileView from './pages/ProfileView';
import Maintenance from './pages/Maintenance';
import Payments from './pages/Payments';
import AgreementDetail from './pages/AgreementDetail';
import Agreements from './pages/Agreements';
import AgreementTemplate from './pages/AgreementTemplate';
import AddProperty from './pages/AddProperty';
import MyProperties from './pages/MyProperties';
import EditProperty from './pages/EditProperty';
import BulkImportProperties from './pages/BulkImportProperties';
import HostNewListing from './pages/stays/HostNewListing';
import ListingDetail from './pages/stays/ListingDetail';
import GuestBookings from './pages/stays/GuestBookings';
import HostBookings from './pages/stays/HostBookings';
import HostListingAvailability from './pages/stays/HostListingAvailability';
import StaysExplore from './pages/stays/StaysExplore';
import HostMyListings from './pages/stays/HostMyListings';
import HostEditListing from './pages/stays/HostEditListing';
import AdminKYC from './pages/admin/AdminKYC';
import Verify from './pages/Verify';
import Visits from './pages/Visits';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  // Load site settings globally (updates favicon, title, etc.)
  useSiteSettings();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/payment/callback" element={<PaymentCallback />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/view" element={<ProfileView />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/agreements/:id" element={<AgreementDetail />} />
            <Route path="/agreements" element={<Agreements />} />
            <Route path="/agreements/template" element={<AgreementTemplate />} />
            <Route path="/properties/new" element={<AddProperty />} />
            <Route path="/my-properties" element={<MyProperties />} />
            <Route path="/properties/:id/edit" element={<EditProperty />} />
            <Route path="/properties/bulk-import" element={<BulkImportProperties />} />
            <Route path="/verify" element={<Verify />} />
            {/* Stays */}
            <Route path="/stays" element={<StaysExplore />} />
            <Route path="/stays/listings/new" element={<HostNewListing />} />
            <Route path="/stays/host/listings" element={<HostMyListings />} />
            <Route path="/stays/listings/:id/edit" element={<HostEditListing />} />
            <Route path="/stays/listings/:id" element={<ListingDetail />} />
            <Route path="/stays/listings/:id/availability" element={<HostListingAvailability />} />
            <Route path="/stays/bookings" element={<GuestBookings />} />
            <Route path="/stays/host/bookings" element={<HostBookings />} />
            <Route path="/admin/kyc" element={<AdminKYC />} />
            <Route path="/visits" element={<Visits />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
