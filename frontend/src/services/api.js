import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Auth interceptor ─────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dermai_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response error handler ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dermai_token')
      localStorage.removeItem('dermai_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ─────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
}

// ── Predictions ──────────────────────────────────────────
export const predictAPI = {
  predict: (formData) =>
    api.post('/api/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getHistory: (page = 1, perPage = 10) =>
    api.get(`/api/history?page=${page}&per_page=${perPage}`),
  getHistoryDetail: (id) => api.get(`/api/history/${id}`),
}

// ── Reports ──────────────────────────────────────────────
export const reportAPI = {
  generate: (predictionId) =>
    api.post(`/api/report/generate/${predictionId}`),
  download: (reportId) =>
    api.get(`/api/report/${reportId}`, { responseType: 'blob' }),
}

// ── Admin ─────────────────────────────────────────────────
export const adminAPI = {
  getUsers: (params) => api.get('/api/admin/users', { params }),
  getAnalytics: () => api.get('/api/admin/analytics'),
  updateModel: (data) => api.post('/api/admin/model-update', data),
}

// ── Chat ─────────────────────────────────────────────────
export const chatAPI = {
  send: (message, messages) => api.post('/api/chat', { message, messages }),
}

export default api
