import { act, render, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { LevelProvider, useLevel } from './LevelContext'

const wrapper = ({ children }: { children: ReactNode }) => <LevelProvider>{children}</LevelProvider>

test('defaults to null when nothing is stored', () => {
  const { result } = renderHook(() => useLevel(), { wrapper })
  expect(result.current.level).toBeNull()
})

test('reads a persisted level from localStorage', () => {
  localStorage.setItem('ccd:level', JSON.stringify('intermediate'))
  const { result } = renderHook(() => useLevel(), { wrapper })
  expect(result.current.level).toBe('intermediate')
})

test('setLevel updates and persists', () => {
  const { result } = renderHook(() => useLevel(), { wrapper })
  act(() => result.current.setLevel('advanced'))
  expect(result.current.level).toBe('advanced')
  expect(JSON.parse(localStorage.getItem('ccd:level')!)).toBe('advanced')
})

test('useLevel throws when used outside a provider', () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => render(<BareConsumer />)).toThrow(/LevelProvider/)
  errorSpy.mockRestore()
})

function BareConsumer() {
  useLevel()
  return <div>x</div>
}
