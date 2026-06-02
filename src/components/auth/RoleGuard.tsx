import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const hasRole = useAuthStore((s) => s.hasRole)

  if (!hasRole(...allowedRoles)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}




