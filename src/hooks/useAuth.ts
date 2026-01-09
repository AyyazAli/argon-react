import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/services'
import { useAuthStore } from '@/stores'
import { toast } from 'sonner'
import type { LoginCredentials } from '@/types'

export function useLogin() {
  const navigate = useNavigate()
  const { setAuth, setBusiness } = useAuthStore()

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data, variables) => {
      setAuth({
        token: data.token,
        expiresIn: data.expiresIn,
        userId: data.userId,
        role: data.role,
      })
      setBusiness(variables.business)
      toast.success('Login successful')
      navigate('/')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed')
    },
  })
}

export function useBusinessInfo() {
  const { setBusinessInfo, isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: ['businessInfo'],
    queryFn: async () => {
      const response = await authApi.getBusinessName()
      setBusinessInfo(response.data)
      return response.data
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  return () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }
}




