import { getLastLesson, isOnboarded, setLastLesson, setOnboarded } from './onboarding'

test('isOnboarded is false when nothing is stored', () => {
  expect(isOnboarded()).toBe(false)
})

test('setOnboarded persists true and isOnboarded reads it', () => {
  setOnboarded()
  expect(isOnboarded()).toBe(true)
  expect(JSON.parse(localStorage.getItem('ccc:onboarded')!)).toBe(true)
})

test('lastLesson round-trips through storage', () => {
  expect(getLastLesson()).toBeNull()
  setLastLesson('/learn/beginner/basics/what-is-cc')
  expect(getLastLesson()).toBe('/learn/beginner/basics/what-is-cc')
})
