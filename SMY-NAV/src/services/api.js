import axios from 'axios'

// Create axios instance with base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
}

// Agency API endpoints
export const agencyAPI = {
  getAll: () => api.get('/agencies'),
  getById: (id) => api.get(`/agencies/${id}`),
  create: (data) => api.post('/agencies', data),
  update: (id, data) => api.put(`/agencies/${id}`, data),
  delete: (id) => api.delete(`/agencies/${id}`),
  getStats: (id) => api.get(`/agencies/${id}/stats`),
}

// User API endpoints
export const userAPI = {
  getAll: (agencyId) => api.get(`/users?agencyId=${agencyId}`),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
}

// Participant API endpoints
export const participantAPI = {
  getAll: (agencyId) => api.get(`/participants?agencyId=${agencyId}`),
  getById: (id) => api.get(`/participants/${id}`),
  create: (data) => api.post('/participants', data),
  update: (id, data) => api.put(`/participants/${id}`, data),
  delete: (id) => api.delete(`/participants/${id}`),
  search: (query, agencyId) => api.get(`/participants/search?q=${query}&agencyId=${agencyId}`),
}

// Document API endpoints
export const documentAPI = {
  getAll: (agencyId) => api.get(`/documents?agencyId=${agencyId}`),
  getById: (id) => api.get(`/documents/${id}`),
  create: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
}

// Progress API endpoints
export const progressAPI = {
  getAll: (participantId) => api.get(`/progress?participantId=${participantId}`),
  getById: (id) => api.get(`/progress/${id}`),
  create: (data) => api.post('/progress', data),
  update: (id, data) => api.put(`/progress/${id}`, data),
  delete: (id) => api.delete(`/progress/${id}`),
  getStats: (participantId) => api.get(`/progress/${participantId}/stats`),
}

// Training Program API endpoints
export const trainingProgramAPI = {
  getAll: (agencyId) => api.get(`/training-programs?agencyId=${agencyId}`),
  getById: (id) => api.get(`/training-programs/${id}`),
  create: (data) => api.post('/training-programs', data),
  update: (id, data) => api.put(`/training-programs/${id}`, data),
  delete: (id) => api.delete(`/training-programs/${id}`),
}

// System API endpoints
export const systemAPI = {
  health: () => api.get('/health'),
  getDashboardStats: (agencyId) => api.get(`/dashboard/stats?agencyId=${agencyId}`),
}

export default api