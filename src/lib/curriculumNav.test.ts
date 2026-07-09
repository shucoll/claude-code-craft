import type { Level } from '../content/curriculum'
import { findByDottedId, findLesson, firstLesson, flattenLessons, lessonPath, levelIdFromPath, moduleIdFromPath, nextLesson, prevLesson } from './curriculumNav'

const noop = () => Promise.resolve({ default: () => null })
const levels: Level[] = [
  { id: 'l1', title: 'L1', modules: [
    { id: 'm1', title: 'M1', lessons: [
      { id: 'a', title: 'A', content: noop },
      { id: 'b', title: 'B', content: noop },
    ] },
  ] },
  { id: 'l2', title: 'L2', modules: [
    { id: 'm2', title: 'M2', lessons: [{ id: 'c', title: 'C', content: noop }] },
  ] },
]

test('flattenLessons returns lessons in order with their location', () => {
  expect(flattenLessons(levels).map((l) => l.lesson.id)).toEqual(['a', 'b', 'c'])
  expect(flattenLessons(levels)[0]).toMatchObject({ levelId: 'l1', moduleId: 'm1' })
})

test('firstLesson returns the first lesson location', () => {
  expect(firstLesson(levels)?.lesson.id).toBe('a')
})

test('findLesson locates a lesson by its full path', () => {
  expect(findLesson(levels, 'l1', 'm1', 'b')?.lesson.title).toBe('B')
  expect(findLesson(levels, 'l1', 'm1', 'zzz')).toBeUndefined()
})

test('nextLesson returns the following lesson across module/level boundaries', () => {
  expect(nextLesson(levels, 'b')?.lesson.id).toBe('c')
  expect(nextLesson(levels, 'c')).toBeUndefined()
})

test('lessonPath builds the /learn route for a location', () => {
  expect(lessonPath(flattenLessons(levels)[0])).toBe('/learn/l1/m1/a')
})

test('levelIdFromPath extracts the level segment of a lesson path', () => {
  expect(levelIdFromPath('/learn/intermediate/workflows/slash-commands')).toBe('intermediate')
  expect(levelIdFromPath('/learn/beginner')).toBe('beginner')
  expect(levelIdFromPath('/onboarding')).toBeNull()
  expect(levelIdFromPath('/')).toBeNull()
})

test('moduleIdFromPath extracts the module segment of a lesson path', () => {
  expect(moduleIdFromPath('/learn/intermediate/workflows/slash-commands')).toBe('workflows')
  expect(moduleIdFromPath('/learn/beginner/basics')).toBe('basics')
  // A level-only path has no module segment to read.
  expect(moduleIdFromPath('/learn/beginner')).toBeNull()
  expect(moduleIdFromPath('/onboarding')).toBeNull()
  expect(moduleIdFromPath('/')).toBeNull()
})

test('prevLesson returns the preceding lesson across module/level boundaries', () => {
  expect(prevLesson(levels, 'b')?.lesson.id).toBe('a')
  expect(prevLesson(levels, 'c')?.lesson.id).toBe('b')
})

test('prevLesson returns undefined for the first lesson and unknown ids', () => {
  expect(prevLesson(levels, 'a')).toBeUndefined()
  expect(prevLesson(levels, 'nope')).toBeUndefined()
})

test('findByDottedId locates a lesson by its dottedId and returns undefined for unknown ids', () => {
  const withDotted: Level[] = [
    { id: 'beginner', title: 'Beginner', modules: [
      { id: 'basics', title: 'Basics', lessons: [
        { id: 'what-is-cc', dottedId: 'B1.1', title: 'What is Claude Code?', content: noop },
      ] },
    ] },
  ]
  expect(findByDottedId(withDotted, 'B1.1')?.lesson.id).toBe('what-is-cc')
  expect(findByDottedId(withDotted, 'B1.1')?.moduleId).toBe('basics')
  expect(findByDottedId(withDotted, 'ZZ9.9')).toBeUndefined()
})
