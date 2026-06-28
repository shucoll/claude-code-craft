import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../lib/storageKeys'
import type { ProgressMap } from '../lib/progressMath'

export type LessonStatus = 'unvisited' | 'visited' | 'completed'

interface ProgressContextValue {
  progress: ProgressMap
  getStatus: (lessonId: string) => LessonStatus
  markVisited: (lessonId: string) => void
  markCompleted: (lessonId: string) => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useLocalStorage<ProgressMap>(STORAGE_KEYS.progress, {})

  const getStatus = useCallback(
    (lessonId: string): LessonStatus => progress[lessonId] ?? 'unvisited',
    [progress],
  )

  const markVisited = useCallback(
    (lessonId: string) =>
      setProgress((prev) => (prev[lessonId] ? prev : { ...prev, [lessonId]: 'visited' })),
    [setProgress],
  )

  const markCompleted = useCallback(
    (lessonId: string) => setProgress((prev) => ({ ...prev, [lessonId]: 'completed' })),
    [setProgress],
  )

  const value = useMemo<ProgressContextValue>(
    () => ({ progress, getStatus, markVisited, markCompleted }),
    [progress, getStatus, markVisited, markCompleted],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider')
  return ctx
}
