import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
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
  getMessages: (conversationId) => api.get(`/messaging/conversations/${conversationId}/messages/`),
  sendMessage: (conversationId, message) =>
    api.post(`/messaging/conversations/${conversationId}/messages/`, { content: message }),
  getNotifications: () => api.get('/messaging/notifications/'),
  markAsRead: (notificationId) => api.patch(`/messaging/notifications/${notificationId}/`, { is_read: true }),
};

export const applicationAPI = {
  apply: (propertyId, message) => api.post('/applications/', { property_id: propertyId, message }),
  listTenant: () => api.get('/applications/'),
  listLandlord: () => api.get('/applications/'),
  approve: (id, response_message) => api.post(`/applications/${id}/approve/`, { response_message }),
  reject: (id, response_message) => api.post(`/applications/${id}/reject/`, { response_message }),
};

export const dashboardAPI = {
  getTenant: () => api.get('/tenants/dashboard/'),
  getLandlord: () => api.get('/landlords/dashboard/'),
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
  initBookingPayment: (id) => api.post(`/stays/bookings/${id}/init_payment/`),
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
  listPages: () => api.get('/pages/'),
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
