import type { Level } from '../content/curriculum'
import { findLesson, firstLesson, flattenLessons, lessonPath, nextLesson, prevLesson } from './curriculumNav'

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

test('prevLesson returns the preceding lesson across module/level boundaries', () => {
  expect(prevLesson(levels, 'b')?.lesson.id).toBe('a')
  expect(prevLesson(levels, 'c')?.lesson.id).toBe('b')
})

test('prevLesson returns undefined for the first lesson and unknown ids', () => {
  expect(prevLesson(levels, 'a')).toBeUndefined()
  expect(prevLesson(levels, 'nope')).toBeUndefined()
})
