import { Navigate } from 'react-router-dom'
import { curriculum } from '../../content/curriculum'
import { useLevel } from '../../context/LevelContext'
import { resolveLandingPath } from '../../lib/landing'
import { getLastLesson, isOnboarded } from '../../lib/onboarding'

export function RootRedirect() {
  const { level } = useLevel()
  const path = resolveLandingPath(curriculum, {
    onboarded: isOnboarded(),
    level,
    lastLesson: getLastLesson(),
  })
  if (!path) return <p className="p-8 text-muted-foreground">No lessons yet.</p>
  return <Navigate to={path} replace />
}
