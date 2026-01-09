import api from '@/lib/api'
import type { AuthResponse, LoginCredentials, BusinessInfo } from '@/types'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/user/login', credentials)
    return response.data
  },

  getBusinessName: async (): Promise<{ message: string; data: BusinessInfo }> => {
    const response = await api.get<{ message: string; data: BusinessInfo }>(
      '/api/argon/get-business-name'
    )
    return response.data
  },
}




