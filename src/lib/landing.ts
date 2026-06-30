import type { Level } from '../content/curriculum'
import { firstLesson, flattenLessons, lessonPath } from './curriculumNav'

export interface LandingInput {
  onboarded: boolean
  level: string | null
  lastLesson: string | null
}

export function resolveLandingPath(levels: Level[], input: LandingInput): string | null {
  if (!input.onboarded) return '/onboarding'
  if (input.lastLesson) {
    const stillExists = flattenLessons(levels).some((l) => lessonPath(l) === input.lastLesson)
    if (stillExists) return input.lastLesson
  }
  if (input.level) {
    const loc = flattenLessons(levels).find((l) => l.levelId === input.level)
    if (loc) return lessonPath(loc)
  }
  const first = firstLesson(levels)
  return first ? lessonPath(first) : null
}
