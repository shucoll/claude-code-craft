import { act, render, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { LanguageProvider, useLanguage } from './LanguageContext'

const wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
)

test('defaults to javascript when nothing is stored', () => {
  const { result } = renderHook(() => useLanguage(), { wrapper })
  expect(result.current.language).toBe('javascript')
})

test('reads a persisted language from localStorage', () => {
  localStorage.setItem('ccc:lang', JSON.stringify('python'))
  const { result } = renderHook(() => useLanguage(), { wrapper })
  expect(result.current.language).toBe('python')
})

test('setLanguage updates and persists', () => {
  const { result } = renderHook(() => useLanguage(), { wrapper })
  act(() => result.current.setLanguage('python'))
  expect(result.current.language).toBe('python')
  expect(JSON.parse(localStorage.getItem('ccc:lang')!)).toBe('python')
})

test('useLanguage throws when used outside a provider', () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => render(<BareConsumer />)).toThrow(/LanguageProvider/)
  errorSpy.mockRestore()
})

function BareConsumer() {
  useLanguage()
  return <div>x</div>
}
