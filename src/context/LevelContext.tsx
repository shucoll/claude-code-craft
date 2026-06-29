import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../lib/storageKeys'

export type LevelId = 'beginner' | 'intermediate' | 'advanced'

interface LevelContextValue {
  level: LevelId | null
  setLevel: (id: LevelId) => void
}

const LevelContext = createContext<LevelContextValue | null>(null)

export function LevelProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useLocalStorage<LevelId | null>(STORAGE_KEYS.level, null)
  const value = useMemo<LevelContextValue>(() => ({ level, setLevel }), [level, setLevel])
  return <LevelContext.Provider value={value}>{children}</LevelContext.Provider>
}

export function useLevel(): LevelContextValue {
  const ctx = useContext(LevelContext)
  if (!ctx) throw new Error('useLevel must be used within a LevelProvider')
  return ctx
}
