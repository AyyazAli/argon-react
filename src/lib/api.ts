import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helper to get token from Zustand persisted storage
const getToken = (): string | null => {
  try {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      // Zustand persist stores data in state property
      const token = parsed?.state?.token || null
      if (!token) {
        console.warn('Token not found in auth-storage:', parsed)
      }
      return token
    }
    console.warn('No auth-storage found in localStorage')
    return null
  } catch (error) {
    console.error('Error reading token from localStorage:', error)
    return null
  }
}

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('Token added to request:', config.url, 'Token exists:', !!token)
  } else {
    console.warn('No token found for request:', config.url)
    // Try to get token directly from authStore as fallback
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const parsed = JSON.parse(authStorage)
        console.log('Auth storage contents:', parsed)
      }
    } catch (e) {
      console.error('Error reading auth storage:', e)
    }
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear the persisted auth storage
      localStorage.removeItem('auth-storage')
      window.location.href = '/#/login'
    }
    return Promise.reject(error)
  }
)

export default api
