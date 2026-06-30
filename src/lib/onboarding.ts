import { STORAGE_KEYS } from './storageKeys'

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.onboarded) === JSON.stringify(true)
  } catch {
    return false
  }
}

export function setOnboarded(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.onboarded, JSON.stringify(true))
  } catch {
    /* ignore write failures (e.g. private mode quota) */
  }
}

export function getLastLesson(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.lastLesson)
    return raw === null ? null : (JSON.parse(raw) as string)
  } catch {
    return null
  }
}

export function setLastLesson(path: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.lastLesson, JSON.stringify(path))
  } catch {
    /* ignore write failures */
  }
}
