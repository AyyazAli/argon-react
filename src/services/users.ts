import api from '@/lib/api'
import type { ApiResponse } from '@/types'

export interface User {
  _id: string
  email: string
  name?: string
  businessAccess: Array<{
    name: string
    role: string
  }>
}

export interface UserInput {
  email: string
  password: string
  name?: string
  businessAccess: Array<{
    name: string
    role: string
  }>
}

export interface UserUpdateInput {
  name?: string
  businessAccess?: Array<{
    name: string
    role: string
  }>
}

export const usersApi = {
  // Get all users
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get<ApiResponse<User[]>>('/api/user')
    return response.data
  },

  // Get single user
  getUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>(`/api/user/${id}`)
    return response.data
  },

  // Create user
  createUser: async (data: UserInput): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/api/user/create', data)
    return response.data
  },

  // Update user
  updateUser: async (id: string, data: UserUpdateInput): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>(`/api/user/${id}`, data)
    return response.data
  },

  // Delete user
  deleteUser: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/api/user/${id}`)
    return response.data
  },
}

