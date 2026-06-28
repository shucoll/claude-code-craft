import type { Level } from '../content/curriculum'

export type ProgressMap = Record<string, 'visited' | 'completed'>

export function lessonIds(levels: Level[]): string[] {
  return levels.flatMap((level) => level.modules.flatMap((mod) => mod.lessons.map((l) => l.id)))
}

export function completedCount(ids: string[], progress: ProgressMap): number {
  return ids.filter((id) => progress[id] === 'completed').length
}

export function percentComplete(ids: string[], progress: ProgressMap): number {
  if (ids.length === 0) return 0
  return Math.round((completedCount(ids, progress) / ids.length) * 100)
}

export function levelPercent(level: Level, progress: ProgressMap): number {
  return percentComplete(lessonIds([level]), progress)
}
