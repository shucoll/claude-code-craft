import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { LanguageProvider } from '../../context/LanguageContext'
import { TryPrompt } from './TryPrompt'

function renderWithLang(lang: string, ui: ReactNode) {
  localStorage.setItem('ccc:lang', JSON.stringify(lang))
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

test('renders the prompt text for the active language', () => {
  renderWithLang('python', <TryPrompt id="first-edit" />)
  expect(screen.getByText(/is_even/)).toBeInTheDocument()
})

test('shows a fallback note for an unknown language', () => {
  renderWithLang('ruby', <TryPrompt id="first-edit" />)
  expect(screen.getByText(/prompt shown for javascript/i)).toBeInTheDocument()
})

test('renders an alert for a missing prompt', () => {
  renderWithLang('javascript', <TryPrompt id="nope" />)
  expect(screen.getByRole('alert')).toHaveTextContent(/missing prompt/i)
})
