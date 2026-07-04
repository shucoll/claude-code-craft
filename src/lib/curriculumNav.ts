import type { Lesson, Level } from '../content/curriculum'

export interface LessonLocation {
  levelId: string
  moduleId: string
  lesson: Lesson
}

export function flattenLessons(levels: Level[]): LessonLocation[] {
  const out: LessonLocation[] = []
  for (const level of levels) {
    for (const mod of level.modules) {
      for (const lesson of mod.lessons) {
        out.push({ levelId: level.id, moduleId: mod.id, lesson })
      }
    }
  }
  return out
}

export function lessonPath(loc: LessonLocation): string {
  return `/learn/${loc.levelId}/${loc.moduleId}/${loc.lesson.id}`
}

export function firstLesson(levels: Level[]): LessonLocation | undefined {
  return flattenLessons(levels)[0]
}

export function findLesson(
  levels: Level[],
  levelId: string,
  moduleId: string,
  lessonId: string,
): LessonLocation | undefined {
  return flattenLessons(levels).find(
    (l) => l.levelId === levelId && l.moduleId === moduleId && l.lesson.id === lessonId,
  )
}

export function nextLesson(levels: Level[], lessonId: string): LessonLocation | undefined {
  const all = flattenLessons(levels)
  const idx = all.findIndex((l) => l.lesson.id === lessonId)
  return idx >= 0 ? all[idx + 1] : undefined
}

export function prevLesson(levels: Level[], lessonId: string): LessonLocation | undefined {
  const all = flattenLessons(levels)
  const idx = all.findIndex((l) => l.lesson.id === lessonId)
  return idx > 0 ? all[idx - 1] : undefined
}

export function findByDottedId(levels: Level[], dottedId: string): LessonLocation | undefined {
  return flattenLessons(levels).find((l) => l.lesson.dottedId === dottedId)
}
