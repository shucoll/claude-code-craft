import { act, render, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ProgressProvider, useProgress } from './ProgressContext'

const wrapper = ({ children }: { children: ReactNode }) => <ProgressProvider>{children}</ProgressProvider>

test('getStatus reports unvisited for unknown lessons', () => {
  const { result } = renderHook(() => useProgress(), { wrapper })
  expect(result.current.getStatus('x')).toBe('unvisited')
})

test('markVisited then markCompleted updates status and persists', () => {
  const { result } = renderHook(() => useProgress(), { wrapper })
  act(() => result.current.markVisited('x'))
  expect(result.current.getStatus('x')).toBe('visited')
  act(() => result.current.markCompleted('x'))
  expect(result.current.getStatus('x')).toBe('completed')
  expect(JSON.parse(localStorage.getItem('ccc:progress')!).x).toBe('completed')
})

test('markVisited does not downgrade a completed lesson', () => {
  const { result } = renderHook(() => useProgress(), { wrapper })
  act(() => result.current.markCompleted('x'))
  act(() => result.current.markVisited('x'))
  expect(result.current.getStatus('x')).toBe('completed')
})

test('useProgress throws outside a provider', () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => render(<BareConsumer />)).toThrow(/ProgressProvider/)
  errorSpy.mockRestore()
})

function BareConsumer() {
  useProgress()
  return <div>x</div>
}
