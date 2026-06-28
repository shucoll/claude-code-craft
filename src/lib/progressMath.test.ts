import type { Level } from '../content/curriculum'
import { completedCount, lessonIds, levelPercent, percentComplete } from './progressMath'

const noop = () => Promise.resolve({ default: () => null })
const level: Level = {
  id: 'l1', title: 'L1', modules: [
    { id: 'm1', title: 'M1', lessons: [
      { id: 'a', title: 'A', content: noop },
      { id: 'b', title: 'B', content: noop },
      { id: 'c', title: 'C', content: noop },
      { id: 'd', title: 'D', content: noop },
    ] },
  ],
}

test('lessonIds collects every lesson id', () => {
  expect(lessonIds([level])).toEqual(['a', 'b', 'c', 'd'])
})

test('completedCount counts only completed lessons', () => {
  expect(completedCount(['a', 'b', 'c'], { a: 'completed', b: 'visited', c: 'completed' })).toBe(2)
})

test('percentComplete rounds completed/total to a percentage', () => {
  expect(percentComplete(['a', 'b', 'c', 'd'], { a: 'completed' })).toBe(25)
  expect(percentComplete([], {})).toBe(0)
})

test('levelPercent computes completion for a level', () => {
  expect(levelPercent(level, { a: 'completed', b: 'completed' })).toBe(50)
})
