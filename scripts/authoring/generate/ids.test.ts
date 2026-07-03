// @vitest-environment node
import { levelOf, moduleCodeOf } from './ids.ts'

test('levelOf maps the leading letter to a level id', () => {
  expect(levelOf('B1.1')).toBe('beginner')
  expect(levelOf('I4.2')).toBe('intermediate')
  expect(levelOf('A7.6')).toBe('advanced')
  expect(levelOf('Z9.9')).toBeUndefined()
})

test('moduleCodeOf returns the dotted-id prefix', () => {
  expect(moduleCodeOf('B1.1')).toBe('B1')
  expect(moduleCodeOf('I10.3')).toBe('I10')
})
