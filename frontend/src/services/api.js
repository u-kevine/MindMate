import axios from 'axios'

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('mm_access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('mm_refresh')
        if (!refresh) throw new Error('No refresh token')
        const { data } = await axios.post('/api/v1/auth/token/refresh/', { refresh })
        localStorage.setItem('mm_access', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('mm_access')
        localStorage.removeItem('mm_refresh')
        localStorage.removeItem('mm_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    data => api.post('/auth/login/', data),
  logout:   data => api.post('/auth/logout/', data),
  register: data => api.post('/auth/register/', data),
  me:       ()   => api.get('/auth/me/'),
  updateMe: data => api.patch('/auth/me/', data),
  changePassword: data => api.post('/auth/me/password/', data),
  updatePreferences: data => api.patch('/auth/me/preferences/', data),
  dashboardStats:  () => api.get('/auth/dashboard/stats/'),
  counselors:      () => api.get('/auth/counselors/'),
  // Admin
  users:       params => api.get('/auth/users/', { params }),
  userDetail:  id     => api.get(`/auth/users/${id}/`),
  updateUser:  (id, data) => api.patch(`/auth/users/${id}/`, data),
  deleteUser:  id     => api.delete(`/auth/users/${id}/`),
}

// ─── Cases ────────────────────────────────────────────────────────────────────
export const casesApi = {
  list:       params => api.get('/cases/', { params }),
  detail:     id     => api.get(`/cases/${id}/`),
  create:     data   => api.post('/cases/', data),
  update:     (id, data) => api.patch(`/cases/${id}/update/`, data),
  addNote:    (id, data) => api.post(`/cases/${id}/notes/`, data),
  stats:      ()     => api.get('/cases/stats/'),
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messagesApi = {
  conversations:  ()      => api.get('/messages/conversations/'),
  startConversation: data => api.post('/messages/conversations/start/', data),
  messages:  convId       => api.get(`/messages/conversations/${convId}/messages/`),
  send:      data         => api.post('/messages/send/', data),
  unreadCount: ()         => api.get('/messages/unread/'),
}

// ─── Resources ────────────────────────────────────────────────────────────────
export const resourcesApi = {
  categories: ()     => api.get('/resources/categories/'),
  list:    params    => api.get('/resources/', { params }),
  detail:  id        => api.get(`/resources/${id}/`),
  create:  data      => api.post('/resources/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update:  (id, data) => api.patch(`/resources/${id}/`, data),
  delete:  id         => api.delete(`/resources/${id}/`),
}

export default api