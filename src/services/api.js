import axios from 'axios';
import { isImpersonating, restoreStaffSession } from '../utils/impersonation';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  // Without a timeout a stalled request hangs until the browser gives up, and
  // surfaces as an ambiguous "no response" rather than a clear timeout.
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Endpoints that answer 401 as a normal result rather than "your session
// expired" — a wrong password on /auth/login/ must surface as a form error,
// not wipe the session and reload the page.
const CREDENTIAL_ENDPOINTS = [
  '/auth/login/',
  '/auth/register/',
  '/auth/token/refresh/',
  '/auth/password/reset/',
  '/auth/password/reset/confirm/',
];
const isCredentialEndpoint = (url = '') =>
  CREDENTIAL_ENDPOINTS.some((path) => url.includes(path));

// Pages that already are the logged-out destination. Redirecting /login to
// /login is a full page reload of the same URL, so any authenticated request
// firing there would loop the page forever.
const LOGGED_OUT_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];
const onLoggedOutPage = () =>
  LOGGED_OUT_PATHS.some((path) => window.location.pathname.startsWith(path));

const clearSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  // The persisted auth store holds isAuthenticated independently of the tokens.
  // Leaving it set means the app still believes it is logged in and keeps
  // firing authenticated calls (the notification bell polls on mount) from the
  // logged-out page — each one 401ing straight back into this handler.
  localStorage.removeItem('auth-storage');
};

const redirectToLogin = () => {
  if (onLoggedOutPage()) return;
  const { pathname, search } = window.location;
  window.location.replace(`/login?redirect=${encodeURIComponent(pathname + search)}`);
};

// A page typically has several requests in flight at once (the dashboard fires
// five), so an expired access token produces a burst of simultaneous 401s. The
// backend rotates refresh tokens and blacklists the old one on use, so letting
// each 401 refresh on its own means the first one succeeds and the rest present
// an already-blacklisted token and get logged out. One shared refresh instead.
let refreshInFlight = null;

const refreshAccessToken = () => {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(`${API_BASE_URL}/auth/token/refresh/`, {
        refresh: localStorage.getItem('refresh_token'),
      })
      .then(({ data }) => {
        localStorage.setItem('access_token', data.access);
        // Rotation is on, so the refresh token just used is now blacklisted —
        // keeping it would break the next refresh and end the session early.
        if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
        return data.access;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isCredentialEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      // A support session has no refresh token and dies after 30 minutes.
      // Ending it must put the staff member back in their own session rather
      // than log them out of the platform — they were never signed out.
      if (isImpersonating()) {
        restoreStaffSession();
        window.location.replace('/staff/dashboard/users?session=expired');
        return Promise.reject(error);
      }

      if (!localStorage.getItem('refresh_token')) {
        // Nothing to refresh with: posting `refresh: null` only produces a 400
        // and lands in the same place.
        clearSession();
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        const access = await refreshAccessToken();
        originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${access}` };
        return api(originalRequest);
      } catch (refreshError) {
        clearSession();
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API Endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/user/'),
  updateProfile: (data, isForm = false) => isForm
    ? api.patch('/auth/user/', data, { headers: { 'Content-Type': 'multipart/form-data' } })
    : api.patch('/auth/user/', data),
  upgradeToLandlord: (formData) => api.post('/auth/upgrade-to-landlord/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getVerificationStatus: () => api.get('/auth/verify/status/'),
  submitVerification: (formData) => api.post('/auth/verify/submit/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  listVerificationRequests: (status) => api.get('/auth/verify/requests/', { params: { status } }),
  decideVerification: (requestId, status, notes) => api.post(`/auth/verify/requests/${requestId}/decision/`, { status, notes }),
  requestPasswordReset: (email) => api.post('/auth/password/reset/', { email }),
  confirmPasswordReset: (data) => api.post('/auth/password/reset/confirm/', data),
  changePassword: (data) => api.post('/auth/password/change/', data),
};

export const staffAPI = {
  overview: () => api.get('/staff/overview/'),
  listProperties: (params) => api.get('/staff/properties/', { params }),
  moderateProperty: (id, action) => api.post(`/staff/properties/${id}/moderate/`, { action }),
  listListings: (params) => api.get('/staff/listings/', { params }),
  moderateListing: (id, action) => api.post(`/staff/listings/${id}/moderate/`, { action }),
  // Guest refunds: review, approve/decline, and pay out
  listRefunds: (params) => api.get('/staff/refunds/', { params }),
  decideRefund: (payload) => api.post('/staff/refunds/', payload),
  // Landlord, host and agent withdrawals in one queue.
  listPayouts: (params) => api.get('/staff/payouts/', { params }),
  actOnPayout: (payload) => api.post('/staff/payouts/', payload),
  // Individual KYC and company files in one queue.
  listVerifications: (params) => api.get('/staff/verifications/', { params }),
  decideVerification: (payload) => api.post('/staff/verifications/', payload),
  // Payment lookup, reconciliation and revenue.
  listPayments: (params) => api.get('/staff/payments/', { params }),
  actOnPayment: (payload) => api.post('/staff/payments/', payload),
  // Support desk: search, or pass user_id for the full profile.
  searchUsers: (params) => api.get('/staff/users/', { params }),
  actOnUser: (payload) => api.post('/staff/users/', payload),
  // Support sessions. `stop` is sent with the impersonation token still in
  // place — that token is what identifies the session being closed.
  impersonate: (user_id, reason) =>
    api.post('/staff/impersonate/', { user_id, reason }),
  stopImpersonating: () => api.post('/staff/impersonate/stop/'),
  // Scheduled-job health and the server error queue.
  health: (params) => api.get('/staff/health/', { params }),
  actOnError: (payload) => api.post('/staff/health/', payload),
  // Tenant caution deposits, and the account they are swept to.
  listCautionFees: (params) => api.get('/staff/caution-fees/', { params }),
  actOnCautionFees: (payload) => api.post('/staff/caution-fees/', payload),
  cautionAccount: () => api.get('/staff/caution-account/'),
  setCautionAccount: (payload) => api.post('/staff/caution-account/', payload),
  // Pricing page copy. Rates are read-only here — they live in Site Settings.
  pricingPage: () => api.get('/staff/pricing/'),
  savePricingPage: (content) => api.put('/staff/pricing/', { content }),
};

export const propertyAPI = {
  list: (params) => api.get('/properties/', { params }),
  getAll: (params) => api.get('/properties/', { params }),
  get: (id) => api.get(`/properties/${id}/`),
  create: (data) => api.post('/properties/', data),
  update: (id, data) => api.patch(`/properties/${id}/`, data),
  delete: (id) => api.delete(`/properties/${id}/`),
  uploadImage: (propertyId, formData, config = {}) =>
    api.post(
      `/properties/${propertyId}/images/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, ...config }
    ),
  reorderImages: (propertyId, order) => api.post(`/properties/${propertyId}/images/reorder/`, { order }),
  setPrimaryImage: (propertyId, imageId) => api.post(`/properties/${propertyId}/images/${imageId}/set_primary/`),
  deleteImage: (propertyId, imageId) => api.delete(`/properties/${propertyId}/images/${imageId}/`),
  bulkUpload: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/properties/bulk_upload/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  analytics: (propertyId, params) => api.get(`/properties/${propertyId}/analytics/`, { params }),
  broadcast: (propertyId, data) => api.post(`/properties/${propertyId}/broadcast/`, data),
};

export const paymentAPI = {
  initializePayment: (data) => api.post('/payments/initialize/', data),
  preparePayment: (data) => api.post('/payments/prepare/', data),
  verifyPayment: (reference) => api.get(`/payments/verify/${reference}/`),
  getPaymentHistory: () => api.get('/payments/history/'),
  getCautionFeeStatus: (agreementId) => api.get(`/payments/caution-fee/${agreementId}/`),
};

export const rentalAPI = {
  createAgreement: (data) => api.post('/agreements/', data),
  getAgreements: () => api.get('/agreements/'),
  getAgreement: (id) => api.get(`/agreements/${id}/`),
  getRentPayments: (agreementId) => api.get(`/rentals/payments/${agreementId}/`),
  uploadDocument: (agreementId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/agreements/${agreementId}/upload_document/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  downloadDefault: (agreementId) => api.get(`/agreements/${agreementId}/default_document/`, { responseType: 'blob' }),
  getTemplate: () => api.get('/agreements/template/'),
  saveTemplate: (body) => api.put('/agreements/template/', { body }),
  setDocumentSource: (agreementId, source) => api.post(`/agreements/${agreementId}/use_document/`, { source }),
  setAgreementStatus: (agreementId, status) => api.post(`/agreements/${agreementId}/set_status/`, { status }),
  adjustStartDate: (agreementId, startDate) => api.post(`/agreements/${agreementId}/adjust_start_date/`, { start_date: startDate }),
  getDealSummary: (agreementId) => api.get(`/agreements/${agreementId}/deal-summary/`),
  confirmDeal: (agreementId) => api.post(`/agreements/${agreementId}/deal-summary/`),
};

export const visitAPI = {
  create: (propertyId, scheduledAt, note) => api.post('/visits/', {
    property_id: propertyId,
    scheduled_at: scheduledAt,
    note,
  }),
  list: () => api.get('/visits/'),
  setStatus: (id, status) => api.post(`/visits/${id}/set_status/`, { status }),
  reschedule: (id, scheduledAt) => api.post(`/visits/${id}/reschedule/`, { scheduled_at: scheduledAt }),
};

export const maintenanceAPI = {
  create: (data) => api.post('/maintenance/', data),
  list: () => api.get('/maintenance/'),
  update: (id, data) => api.patch(`/maintenance/${id}/`, data),
  setStatus: (id, status) => api.post(`/maintenance/${id}/set_status/`, { status }),
};

export const messagingAPI = {
  getConversations: () => api.get('/messaging/conversations/'),
  startConversation: (propertyId) => api.post('/messaging/conversations/start/', { property_id: propertyId }),
  // Landlord ↔ tenant chat. Requires an existing tenancy between the two users.
  // Stays guest <-> host. Scoped to the listing, so it works for standalone
  // listings that have no linked property.
  startConversationForBooking: (bookingId) =>
    api.post('/messaging/conversations/start/', { booking_id: bookingId }),
  // Pre-booking enquiry from a stay listing page. Shares the thread with the
  // post-booking conversation, so the host sees one continuous history.
  startConversationForListing: (listingId) =>
    api.post('/messaging/conversations/start/', { listing_id: listingId }),
  startConversationWithUser: (userId, propertyId) =>
    api.post('/messaging/conversations/start/', { user_id: userId, property_id: propertyId }),
  getMessages: (conversationId) => api.get(`/messaging/conversations/${conversationId}/messages/`),
  sendMessage: (conversationId, message) =>
    api.post(`/messaging/conversations/${conversationId}/messages/`, { content: message }),
  getNotifications: () => api.get('/messaging/notifications/'),
  // What the bell polls: the newest few plus the badge number, in one request.
  getNotificationSummary: (limit = 12) =>
    api.get('/messaging/notifications/', { params: { envelope: 1, limit } }),
  markAsRead: (notificationId) => api.patch(`/messaging/notifications/${notificationId}/`, { is_read: true }),
  markAllNotificationsRead: () => api.post('/messaging/notifications/read-all/'),
};

export const applicationAPI = {
  apply: (propertyId, message, extraData = {}) => api.post('/applications/', { property_id: propertyId, message, ...extraData }),
  listTenant: () => api.get('/applications/'),
  listLandlord: () => api.get('/applications/'),
  approve: (id, response_message) => api.post(`/applications/${id}/approve/`, { response_message }),
  reject: (id, response_message) => api.post(`/applications/${id}/reject/`, { response_message }),
  getDetail: (id) => api.get(`/applications/${id}/detail/`),
  updateNotes: (id, data) => api.patch(`/applications/${id}/detail/`, data),
  requestMoreInfo: (id, message) => api.post(`/applications/${id}/request-info/`, { message }),
};

export const moveOutAPI = {
  list: (params) => api.get('/move-outs/', { params }),
  create: (data) => api.post('/move-outs/', data),
  getInspection: (moveOutId) => api.get(`/move-outs/${moveOutId}/inspection/`),
  submitInspection: (moveOutId, data) => api.post(`/move-outs/${moveOutId}/inspection/`, data),
  getDeductions: (moveOutId) => api.get(`/move-outs/${moveOutId}/deductions/`),
  addDeduction: (moveOutId, data) => api.post(`/move-outs/${moveOutId}/deductions/`, data),
  removeDeduction: (moveOutId, deductionId) => api.delete(`/move-outs/${moveOutId}/deductions/${deductionId}/`),
  processRefund: (moveOutId) => api.post(`/move-outs/${moveOutId}/process-refund/`),
};

export const dashboardAPI = {
  getTenant: () => api.get('/tenants/dashboard/'),
  getLandlord: () => api.get('/landlords/dashboard/'),
  getGuestDashboard: () => api.get('/guests/dashboard/'),
  getDashboardMetadata: () => api.get('/landlords/dashboard-metadata/'),
  getLandlordLeases: (params) => api.get('/landlords/leases/', { params }),
  getLandlordPaymentsDashboard: () => api.get('/landlords/payments-dashboard/'),
  requestPayout: (data) => api.post('/landlords/request-payout/', data),
  getCautionWallet: () => api.get('/landlords/caution-wallet/'),
  getLandlordReports: (type) => api.get('/landlords/reports/', { params: { type } }),
  submitOnboarding: (data) => api.post('/landlords/onboarding/', data),
  // Bank accounts
  getBankAccounts: () => api.get('/bank-accounts/'),
  createBankAccount: (data) => api.post('/bank-accounts/', data),
  updateBankAccount: (id, data) => api.patch(`/bank-accounts/${id}/`, data),
  deleteBankAccount: (id) => api.delete(`/bank-accounts/${id}/`),
  // Bank list + account verification for selector
  getBanksList: () => api.get('/payments/banks/'),
  verifyBankAccount: (data) => api.post('/payments/verify-account/', data),
};

// Stays (short-term rentals)
export const staysAPI = {
  listListings: (params) => api.get('/stays/listings/', { params }),
  getListing: (id) => api.get(`/stays/listings/${id}/`),
  createListing: (data) => api.post('/stays/listings/', data),
  updateListing: (id, data) => api.patch(`/stays/listings/${id}/`, data),
  publish: (id) => api.post(`/stays/listings/${id}/publish/`),
  unpublish: (id) => api.post(`/stays/listings/${id}/unpublish/`),
  availability: (id, params) => api.get(`/stays/listings/${id}/availability/`, { params }),
  quote: (id, params) => api.get(`/stays/listings/${id}/quote/`, { params }),
  listBlocked: (id) => api.get(`/stays/listings/${id}/blocked/`),
  addBlocked: (id, start_date, end_date, note) => api.post(`/stays/listings/${id}/blocked/`, { start_date, end_date, note }),
  removeBlocked: (id, blockId) => api.delete(`/stays/listings/${id}/blocked/`, { data: { id: blockId } }),
  // iCal calendar sync with Airbnb / Booking.com / Google Calendar
  getCalendars: (id) => api.get(`/stays/listings/${id}/calendars/`),
  addCalendar: (id, name, url) => api.post(`/stays/listings/${id}/calendars/`, { name, url }),
  removeCalendar: (id, connectionId) =>
    api.delete(`/stays/listings/${id}/calendars/`, { data: { id: connectionId } }),
  syncCalendars: (id, connectionId) =>
    api.post(`/stays/listings/${id}/calendars/sync/`, connectionId ? { id: connectionId } : {}),
  // Address search for the host's map picker. Proxied through our backend so
  // the geocoder can be cached and swapped without a frontend release.
  geocode: (q) => api.get('/stays/geocode/', { params: { q } }),
  reverseGeocode: (lat, lng) => api.get('/stays/geocode/reverse/', { params: { lat, lng } }),
  // A pasted Google Maps link resolves to a pin on the server: short links
  // (maps.app.goo.gl) have to be followed, and the browser cannot read a
  // cross-origin redirect.
  resolveMapLink: (url) => api.post('/stays/geocode/map-link/', { url }),
  createBooking: (payload) => api.post('/stays/bookings/', payload),
  getBookingsGuest: () => api.get('/stays/bookings/'),
  getBookingsHost: () => api.get('/stays/bookings/', { params: { role: 'host' } }),
  listImages: (id) => api.get(`/stays/listings/${id}/images/`),
  uploadImage: (id, formData, config = {}) =>
    api.post(
      `/stays/listings/${id}/images/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, ...config }
    ),
  deleteImage: (id, imageId) => api.delete(`/stays/listings/${id}/images/${imageId}/`),
  setPrimary: (id, imageId) => api.post(`/stays/listings/${id}/images/${imageId}/set_primary/`),
  reorderImages: (id, order) => api.post(`/stays/listings/${id}/images/reorder/`, { order }),
  approveBooking: (id) => api.post(`/stays/bookings/${id}/set_status/`, { status: 'approved' }),
  declineBooking: (id, reason) => api.post(`/stays/bookings/${id}/decline/`, { reason }),
  cancelBooking: (id, reason) => api.post(`/stays/bookings/${id}/cancel/`, { reason }),
  // Date changes: the guest asks to move, the host decides. A move keeps the
  // same number of nights, so nothing is re-priced or re-paid.
  requestBookingMove: (id, { check_in, check_out, reason }) =>
    api.post(`/stays/bookings/${id}/move/`, { check_in, check_out, reason }),
  decideBookingMove: (id, decision, note) =>
    api.post(`/stays/bookings/${id}/move/decide/`, { decision, note }),
  withdrawBookingMove: (id) => api.post(`/stays/bookings/${id}/move/withdraw/`),
  // What the guest would get back if they cancelled now
  // Re-query Paystack when a payment went through but the booking still
  // shows pending (missed callback or webhook).
  refreshPayment: (id) => api.post(`/stays/bookings/${id}/refresh-payment/`),
  refundQuote: (id) => api.get(`/stays/bookings/${id}/refund-quote/`),
  // Host decides a refund request: decision is 'approve' | 'decline'
  decideRefund: (id, decision, amount, note) =>
    api.post(`/stays/bookings/${id}/refund/decide/`, { decision, amount, note }),
  completeBooking: (id) => api.post(`/stays/bookings/${id}/set_status/`, { status: 'completed' }),
  getBooking: (id) => api.get(`/stays/bookings/${id}/`),
  // Receipt download. `type` (not `format`) — DRF reserves ?format= for
  // content negotiation and would 404 before the view runs.
  downloadReceipt: (id, type = 'pdf') =>
    api.get(`/stays/bookings/${id}/receipt/`, { params: { type }, responseType: 'blob' }),
  initBookingPayment: (id) => api.post(`/stays/bookings/${id}/init_payment/`),
  getReviews: (listingId) => api.get('/stays/reviews/', { params: { listing: listingId } }),
  submitReview: (data) => api.post('/stays/reviews/', data),
  deleteReview: (id) => api.delete(`/stays/reviews/${id}/`),
  // Bidirectional stay reviews (v2)
  getStayReviews: (params) => api.get('/stays/stay-reviews/', { params }),
  submitStayReview: (data) => api.post('/stays/stay-reviews/', data),
  deleteStayReview: (id) => api.delete(`/stays/stay-reviews/${id}/`),
  // Host earnings & withdrawals
  getHostEarnings: () => api.get('/stays/host/earnings/'),
  requestHostPayout: (data) => api.post('/stays/host/request-payout/', data),
};

// Location API
export const locationAPI = {
  getStates: () => api.get('/states/'),  // Get all 37 states (pagination disabled on backend)
  getState: (id) => api.get(`/states/${id}/`),
  getLGAs: (stateId) => api.get(`/states/${stateId}/lgas/`),
  getAllLGAs: (params) => api.get('/lgas/', { params }),
  reverseGeocode: (lat, lon) => api.get('/geocode/reverse/', { params: { lat, lon } }),
};

// Static Pages API
export const pagesAPI = {
  getPage: (slug) => api.get(`/pages/${slug}/`),
  // Structured pricing copy plus the live rates its placeholders refer to.
  getPricing: () => api.get('/pricing/'),
  listPages: () => api.get('/pages/'),
};

// About page (structured, admin-editable)
export const aboutAPI = {
  get: () => api.get('/about/'),
};

// Legal Documents API
export const legalAPI = {
  getDocument: (slug) => api.get(`/legal/${slug}/`),
  listDocuments: (category) => api.get('/legal/', { params: category ? { category } : {} }),
  getFooterDocuments: () => api.get('/legal/footer/'),
  getRequiredDocuments: () => api.get('/legal/required/'),
};

// Site Settings API
export const siteSettingsAPI = {
  get: () => api.get('/site-settings/'),
};

// Legal services — dispute cases raised by landlords and tenants.
// Named legalServicesAPI because legalAPI above serves the static legal *documents*.
export const legalServicesAPI = {
  // Entitlement + form metadata (issue types, the user's tenancies)
  getCover: () => api.get('/legal-services/cover/'),
  optIn: () => api.post('/legal-services/cover/'),
  optOut: () => api.delete('/legal-services/cover/'),
  listCases: (params) => api.get('/legal-services/cases/', { params }),
  getCase: (id) => api.get(`/legal-services/cases/${id}/`),
  // FormData when documents are attached, plain JSON otherwise
  createCase: (data) => api.post('/legal-services/cases/', data, data instanceof FormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  addDocuments: (id, formData) => api.post(`/legal-services/cases/${id}/documents/`, formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }),
  addNote: (id, body, isInternal = false) =>
    api.post(`/legal-services/cases/${id}/notes/`, { body, is_internal: isInternal }),
  // Legal team only
  setStatus: (id, payload) => api.post(`/legal-services/cases/${id}/status/`, payload),
  assign: (id, userId) => api.post(`/legal-services/cases/${id}/assign/`, { user_id: userId }),
  summary: () => api.get('/legal-services/cases/summary/'),
  partners: () => api.get('/legal-services/cases/partners/'),
};

// Corporate entities — companies renting, booking or listing
export const corporateAPI = {
  getProfile: () => api.get('/corporate/profile/'),
  // FormData when documents are attached (CAC certificate, TIN, resolution)
  saveProfile: (data) => api.post('/corporate/profile/', data, data instanceof FormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  listRepresentatives: () => api.get('/corporate/representatives/'),
  addRepresentative: (data) => api.post('/corporate/representatives/', data,
    data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  removeRepresentative: (id) => api.delete('/corporate/representatives/', { data: { id } }),
  submitForVerification: () => api.post('/corporate/verify/'),
};

// Shared user profile — self, or a landlord viewing a tenant they have a tenancy with
export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}/profile/`),
};

// Legal notices (quit / eviction / rent demand) served by a landlord on a tenant
export const noticeAPI = {
  // Both roles: landlords see their own (incl. drafts), tenants see served ones
  list: () => api.get('/notices/'),
  get: (id) => api.get(`/notices/${id}/`),
  // Landlord: prefilled template + suggested statutory dates for a new notice
  compose: (params) => api.get('/notices/compose/', { params }),
  // Landlord: create/update a draft. Accepts FormData when a document is attached.
  create: (data) => api.post('/notices/', data, data instanceof FormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  update: (id, data) => api.patch(`/notices/${id}/`, data, data instanceof FormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  remove: (id) => api.delete(`/notices/${id}/`),
  // Lifecycle
  serve: (id) => api.post(`/notices/${id}/serve/`),
  acknowledge: (id) => api.post(`/notices/${id}/acknowledge/`),
  withdraw: (id, reason) => api.post(`/notices/${id}/withdraw/`, { reason }),
  // Landlord: reusable per-type wording
  getTemplate: (noticeType) => api.get('/notices/template/', { params: { notice_type: noticeType } }),
  saveTemplate: (noticeType, body) => api.put('/notices/template/', { notice_type: noticeType, body }),
  resetTemplate: (noticeType) => api.delete('/notices/template/', { params: { notice_type: noticeType } }),
};

// Tenant Invite API
export const inviteAPI = {
  // Landlord: list sent invites
  list: () => api.get('/invites/'),
  // Landlord: send a new invite
  send: (data) => api.post('/invites/', data),
  // Public: get invite details by token (no auth needed)
  getByToken: (token) => api.get(`/invites/${token}/`),
  // Tenant: accept an invite
  accept: (token) => api.post(`/invites/${token}/accept/`),
  // Tenant: decline an invite
  decline: (token) => api.post(`/invites/${token}/decline/`),
  // Landlord: generate rent schedule for an existing agreement
  generateSchedule: (agreementId, data) => api.post(`/agreements/${agreementId}/generate-schedule/`, data),
};

export const agentAPI = {
  getDashboard: () => api.get('/agents/dashboard/'),
  getProperties: (params) => api.get('/agents/properties/', { params }),
  getCommissions: (params) => api.get('/agents/commissions/', { params }),
  getPayouts: () => api.get('/agents/payouts/'),
  requestPayout: (data) => api.post('/agents/payouts/', data),
};

export const superAgentAPI = {
  getDashboard: () => api.get('/super-agents/dashboard/'),
  getUsers: (params) => api.get('/super-agents/users/', { params }),
  getUserProperties: (userId) => api.get(`/super-agents/users/${userId}/properties/`),
  actionApplication: (applicationId, status) =>
    api.post(`/super-agents/applications/${applicationId}/action/`, { status }),

  // Properties
  getAllProperties: (params) => api.get('/super-agents/properties/', { params }),
  assignAgentToProperty: (propertyId, agentId) =>
    api.post(`/super-agents/properties/${propertyId}/assign-agent/`, { agent_id: agentId }),
  removeAgentFromProperty: (propertyId) =>
    api.post(`/super-agents/properties/${propertyId}/assign-agent/`, { agent_id: null }),

  // Stays
  getAllListings: (params) => api.get('/super-agents/listings/', { params }),
  getAllBookings: (params) => api.get('/super-agents/bookings/', { params }),

  // Agreements
  getAllAgreements: (params) => api.get('/super-agents/agreements/', { params }),

  // Agent management
  getAgents: (params) => api.get('/super-agents/agents/', { params }),
  superviseAgent: (agentId) => api.post('/super-agents/agents/', { agent_id: agentId, action: 'assign' }),
  unsuperviseAgent: (agentId) => api.post('/super-agents/agents/', { agent_id: agentId, action: 'remove' }),
};
