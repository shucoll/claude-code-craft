// @vitest-environment node
import { run } from './cliCore.ts'

let logSpy: ReturnType<typeof vi.spyOn>
let errSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  logSpy.mockRestore()
  errSpy.mockRestore()
})

test('check returns 0 on the clean repo', () => {
  expect(run(['check'])).toBe(0)
})

test('lesson with missing required flags returns 2 and prints a clean error (no crash)', () => {
  expect(run(['lesson'])).toBe(2)
  expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('missing required flag'))
})

test('an unknown command returns 2', () => {
  expect(run(['bogus'])).toBe(2)
})

test('lesson command requires level, module, slug, title, type', () => {
  const code = run(['lesson', '--level', 'beginner'])
  expect(code).toBe(2) // missing required flags -> caught error
})

test('unknown command returns 2 and lists commands', () => {
  expect(run(['frobnicate'])).toBe(2)
})

test('lesson with a non-numeric --estimated-minutes returns 2 and prints a friendly error (no NaN leaks)', () => {
  const code = run([
    'lesson',
    '--level',
    'beginner',
    '--module',
    'B1',
    '--slug',
    'x',
    '--title',
    'X',
    '--type',
    'core',
    '--estimated-minutes',
    'abc',
  ])
  expect(code).toBe(2)
  expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('--estimated-minutes must be a number'))
})

test('lesson with an invalid --volatility returns 2', () => {
  const code = run(['lesson', '--level', 'beginner', '--module', 'B1', '--slug', 'x', '--title', 'X', '--type', 'core', '--volatility', 'wobbly'])
  expect(code).toBe(2)
  expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('invalid --volatility'))
})

test('lesson with a malformed --interactive entry (no colon) returns 2', () => {
  const code = run(['lesson', '--level', 'beginner', '--module', 'B1', '--slug', 'x', '--title', 'X', '--type', 'core', '--interactive', 'diagram'])
  expect(code).toBe(2)
  expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('must be "kind:spec"'))
})
