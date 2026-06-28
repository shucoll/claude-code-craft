import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { LanguageProvider } from '../../context/LanguageContext'
import { WhenLang } from './WhenLang'

function renderWithLang(lang: string, ui: ReactNode) {
  localStorage.setItem('ccc:lang', JSON.stringify(lang))
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

test('renders children when the language matches', () => {
  renderWithLang('python', <WhenLang is="python">py-only</WhenLang>)
  expect(screen.getByText('py-only')).toBeInTheDocument()
})

test('renders nothing when the language does not match', () => {
  renderWithLang('javascript', <WhenLang is="python">py-only</WhenLang>)
  expect(screen.queryByText('py-only')).not.toBeInTheDocument()
})

test('matches any language listed in an array', () => {
  renderWithLang('go', <WhenLang is={['python', 'go']}>multi</WhenLang>)
  expect(screen.getByText('multi')).toBeInTheDocument()
})
