import type { Level } from '../content/curriculum'
import { resolveLandingPath } from './landing'

const noop = () => Promise.resolve({ default: () => null })
const levels: Level[] = [
  { id: 'beginner', title: 'Beginner', modules: [
    { id: 'basics', title: 'Basics', lessons: [{ id: 'what-is-cc', title: 'W', content: noop }] },
  ] },
  { id: 'intermediate', title: 'Intermediate', modules: [
    { id: 'workflows', title: 'Workflows', lessons: [{ id: 'slash-commands', title: 'S', content: noop }] },
  ] },
]

test('not onboarded → /onboarding', () => {
  expect(resolveLandingPath(levels, { onboarded: false, level: null, lastLesson: null })).toBe('/onboarding')
})

test('onboarded with a lastLesson → that path', () => {
  expect(
    resolveLandingPath(levels, { onboarded: true, level: 'beginner', lastLesson: '/learn/intermediate/workflows/slash-commands' }),
  ).toBe('/learn/intermediate/workflows/slash-commands')
})

test('onboarded, no lastLesson, with level → first lesson of that level', () => {
  expect(resolveLandingPath(levels, { onboarded: true, level: 'intermediate', lastLesson: null })).toBe(
    '/learn/intermediate/workflows/slash-commands',
  )
})

test('onboarded, no lastLesson, no level → global first lesson', () => {
  expect(resolveLandingPath(levels, { onboarded: true, level: null, lastLesson: null })).toBe(
    '/learn/beginner/basics/what-is-cc',
  )
})

test('onboarded but no lessons exist → null', () => {
  expect(resolveLandingPath([], { onboarded: true, level: null, lastLesson: null })).toBeNull()
})

test('onboarded with a stale lastLesson (not in curriculum) falls through to the level first lesson', () => {
  expect(
    resolveLandingPath(levels, { onboarded: true, level: 'intermediate', lastLesson: '/learn/gone/x/y' }),
  ).toBe('/learn/intermediate/workflows/slash-commands')
})

test('onboarded with a stale lastLesson and no level falls through to the global first lesson', () => {
  expect(
    resolveLandingPath(levels, { onboarded: true, level: null, lastLesson: '/learn/gone/x/y' }),
  ).toBe('/learn/beginner/basics/what-is-cc')
})
