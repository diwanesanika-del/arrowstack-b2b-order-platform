import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('b2b_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for uniform error parsing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected server error occurred';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  register: (data: any) => api.post('/auth/register', data).then((res) => res.data),
  login: (data: any) => api.post('/auth/login', data).then((res) => res.data),
  getMe: () => api.get('/auth/me').then((res) => res.data)
};

export const productApi = {
  getProducts: (params?: any) => api.get('/products', { params }).then((res) => res.data),
  getProductById: (id: string) => api.get(`/products/${id}`).then((res) => res.data),
  createProduct: (data: any) => api.post('/products', data).then((res) => res.data),
  updateProduct: (id: string, data: any) => api.put(`/products/${id}`, data).then((res) => res.data),
  adjustInventory: (id: string, data: { stockAdjustment: number; reason: string }) =>
    api.patch(`/products/${id}/inventory`, data).then((res) => res.data)
};

export const orderApi = {
  createOrder: (data: any) => api.post('/orders', data).then((res) => res.data),
  getOrders: (params?: any) => api.get('/orders', { params }).then((res) => res.data),
  getOrderById: (id: string) => api.get(`/orders/${id}`).then((res) => res.data),
  updateOrderStatus: (id: string, data: { status: string; reason?: string }) =>
    api.patch(`/orders/${id}/status`, data).then((res) => res.data)
};

export const invoiceApi = {
  getInvoices: () => api.get('/invoices').then((res) => res.data),
  getInvoiceById: (id: string) => api.get(`/invoices/${id}`).then((res) => res.data)
};

export const adminApi = {
  getMetrics: () => api.get('/admin/metrics').then((res) => res.data),
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }).then((res) => res.data)
};

export default api;
