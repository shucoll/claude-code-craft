import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { isOnboarded } from '../../lib/onboarding'

export function RequireOnboarded({ children }: { children: ReactNode }) {
  if (!isOnboarded()) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}
