import apiClient from './apiClient'

export const authApi = {
  login: (email, password) =>
    apiClient.post('/api/login', { email, password }),

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    } catch {
      return null
    }
  },
}

export const documentApi = {
  upload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  chat: (documentId, question, sessionId) =>
    apiClient.post('/api/chat', {
      document_id: documentId,
      question,
      session_id: sessionId,
    }),
}

export const dashboardApi = {
  getStats: () => apiClient.get('/api/stats'),
  getMatters: () => apiClient.get('/api/matters'),
  getParalegalTasks: () => apiClient.get('/api/paralegal-tasks'),
  getHealth: () => apiClient.get('/api/health'),
}
