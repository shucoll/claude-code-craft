import { act, render, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ThemeProvider, useTheme } from './ThemeContext'

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

test('defaults to light when nothing stored and prefers-color-scheme is light', () => {
  const { result } = renderHook(() => useTheme(), { wrapper })
  expect(result.current.theme).toBe('light')
  expect(document.documentElement.classList.contains('dark')).toBe(false)
})

test('reads persisted theme from localStorage', () => {
  localStorage.setItem('ccd:theme', JSON.stringify('dark'))
  const { result } = renderHook(() => useTheme(), { wrapper })
  expect(result.current.theme).toBe('dark')
  expect(document.documentElement.classList.contains('dark')).toBe(true)
})

test('toggleTheme flips theme and html class and persists', () => {
  const { result } = renderHook(() => useTheme(), { wrapper })
  act(() => result.current.toggleTheme())
  expect(result.current.theme).toBe('dark')
  expect(document.documentElement.classList.contains('dark')).toBe(true)
  expect(JSON.parse(localStorage.getItem('ccd:theme')!)).toBe('dark')
})

test('useTheme throws when used outside provider', () => {
  // React logs the thrown render error to console.error; silence it for this
  // assertion so suite output stays pristine. The throw itself is still asserted.
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => render(<BareConsumer />)).toThrow(/ThemeProvider/)
  errorSpy.mockRestore()
})

function BareConsumer() {
  useTheme()
  return <div>x</div>
}
