import { act, renderHook } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

test('returns initial value when key is absent', () => {
  const { result } = renderHook(() => useLocalStorage('ccd:test', 'fallback'))
  expect(result.current[0]).toBe('fallback')
})

test('reads an existing value from localStorage', () => {
  localStorage.setItem('ccd:test', JSON.stringify('stored'))
  const { result } = renderHook(() => useLocalStorage('ccd:test', 'fallback'))
  expect(result.current[0]).toBe('stored')
})

test('persists updates to localStorage', () => {
  const { result } = renderHook(() => useLocalStorage('ccd:test', 'a'))
  act(() => result.current[1]('b'))
  expect(result.current[0]).toBe('b')
  expect(JSON.parse(localStorage.getItem('ccd:test')!)).toBe('b')
})

test('supports functional updates', () => {
  const { result } = renderHook(() => useLocalStorage('ccd:count', 1))
  act(() => result.current[1]((prev) => prev + 1))
  expect(result.current[0]).toBe(2)
})

test('falls back to initial value on unparseable data', () => {
  localStorage.setItem('ccd:test', '{not json')
  const { result } = renderHook(() => useLocalStorage('ccd:test', 'safe'))
  expect(result.current[0]).toBe('safe')
})
