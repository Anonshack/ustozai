import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
  children: React.ReactNode
  roles?: string[]
  requireSuperuser?: boolean
}

export default function ProtectedRoute({ children, roles, requireSuperuser }: Props) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requireSuperuser && !user?.is_superuser) return <Navigate to="/" replace />
  if (roles && user && !roles.includes(user.role) && !user.is_superuser) return <Navigate to="/" replace />

  return <>{children}</>
}
